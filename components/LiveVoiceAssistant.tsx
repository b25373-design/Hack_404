
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality, Type, LiveServerMessage } from '@google/genai';
import { Shop, Appointment, User } from '../types';

interface LiveVoiceAssistantProps {
  user: User;
  shops: Shop[];
  onBookAppointment: (apt: Appointment) => void;
  onNavigate: (shopId: string | null) => void;
}

const LiveVoiceAssistant: React.FC<LiveVoiceAssistantProps> = ({ user, shops, onBookAppointment, onNavigate }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);

  // Audio Processing Helpers
  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const createBlob = (data: Float32Array) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const handleToolCall = useCallback((fc: any) => {
    if (fc.name === 'check_item_availability') {
      const shop = shops.find(s => s.name.toLowerCase().includes(fc.args.shopName.toLowerCase()));
      if (!shop) return { error: `Shop "${fc.args.shopName}" not found.` };
      const item = shop.items?.find(i => i.name.toLowerCase().includes(fc.args.itemName.toLowerCase()));
      if (!item) return { error: `Item "${fc.args.itemName}" not found in ${shop.name}.` };
      return { 
        result: `${item.name} is ${item.available ? 'available' : 'out of stock'} in ${shop.name}. Price is ₹${item.price}. Stock: ${item.stock || 0}.`
      };
    }

    if (fc.name === 'navigate_to_shop') {
      if (fc.args.shopName.toLowerCase() === 'home' || fc.args.shopName.toLowerCase() === 'dashboard') {
        onNavigate(null);
        return { result: 'Navigated to the main dashboard.' };
      }
      const shop = shops.find(s => s.name.toLowerCase().includes(fc.args.shopName.toLowerCase()));
      if (!shop) return { error: `I couldn't find a shop named "${fc.args.shopName}".` };
      onNavigate(shop.id);
      return { result: `Success. Opened ${shop.name} view on your display.` };
    }

    if (fc.name === 'go_to_sleep') {
      setTimeout(() => stopLive(), 2000); 
      return { result: 'Core shutting down. Moving to standby.' };
    }

    if (fc.name === 'book_appointment') {
      const today = new Date().toISOString().split('T')[0];
      if (fc.args.date < today) {
        return { error: `Rejected. The date ${fc.args.date} is in the past. Please select today or a future date.` };
      }

      const shop = shops.find(s => s.name.toLowerCase().includes(fc.args.shopName.toLowerCase()));
      if (!shop) return { error: `Shop "${fc.args.shopName}" not found.` };
      const service = shop.services?.find(s => s.name.toLowerCase().includes(fc.args.serviceName.toLowerCase()));
      if (!service) return { error: `Service "${fc.args.serviceName}" not found in ${shop.name}.` };

      const newApt: Appointment = {
        id: Math.random().toString(36).substr(2, 9),
        shopId: shop.id,
        studentId: user.id,
        studentName: user.name,
        studentPhone: fc.args.phone,
        serviceId: service.id,
        serviceName: service.name,
        date: fc.args.date,
        timeSlot: fc.args.time,
        status: 'requested',
      };

      onBookAppointment(newApt);
      return { result: `Success. Booked ${service.name} at ${shop.name} for ${fc.args.date} at ${fc.args.time}. Notification synced.` };
    }
  }, [shops, user, onBookAppointment, onNavigate]);

  const stopLive = () => {
    if (sessionRef.current) {
      sessionRef.current.then((s: any) => {
        try { s.close(); } catch(e) {}
      }).catch(() => {});
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextInRef.current) {
      audioContextInRef.current.close().catch(() => {});
      audioContextInRef.current = null;
    }
    if (audioContextOutRef.current) {
      audioContextOutRef.current.close().catch(() => {});
      audioContextOutRef.current = null;
    }
    sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    sourcesRef.current.clear();
    
    setIsInitialized(false);
    setIsConnecting(false);
    setIsSpeaking(false);
    sessionRef.current = null;
    nextStartTimeRef.current = 0;
  };

  const initializePrime = async () => {
    if (isConnecting || isInitialized) return;
    
    // Safety check for API Key
    if (!process.env.API_KEY) {
      console.error('Core Logic Fault: Neural key missing from environment.');
      setHasError(true);
      return;
    }

    setIsConnecting(true);
    setHasError(false);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Initialize Audio Contexts
      audioContextInRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextOutRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      // Resume contexts immediately to satisfy browser requirements
      await audioContextInRef.current.resume();
      await audioContextOutRef.current.resume();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: `You are PRIME, the always-listening AI core of the IIT Mandi ONE ecosystem.
          WAKE WORD PROTOCOL: You MUST remain absolutely silent and not respond unless you hear the wake word "PRIME".
          When you hear "PRIME", activate your persona. If the user asks to check items, book services, or navigate the dashboard, use your tools immediately.
          Current shops: ${shops.map(s => s.name).join(', ')}.
          Today is ${new Date().toISOString().split('T')[0]}. 
          Be highly efficient, futuristic, and brief. Once a task is done, return to passive listening mode.`,
          tools: [{
            functionDeclarations: [
              {
                name: 'check_item_availability',
                description: 'Check stock status of a campus shop item.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    shopName: { type: Type.STRING },
                    itemName: { type: Type.STRING },
                  },
                  required: ['shopName', 'itemName'],
                },
              },
              {
                name: 'navigate_to_shop',
                description: 'Open a specific shop view or dashboard on the screen.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    shopName: { type: Type.STRING },
                  },
                  required: ['shopName'],
                },
              },
              {
                name: 'go_to_sleep',
                description: 'Shut down the neural link.',
                parameters: { type: Type.OBJECT, properties: {} },
              },
              {
                name: 'book_appointment',
                description: 'Record a service booking.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    shopName: { type: Type.STRING },
                    serviceName: { type: Type.STRING },
                    date: { type: Type.STRING },
                    time: { type: Type.STRING },
                    phone: { type: Type.STRING },
                  },
                  required: ['shopName', 'serviceName', 'date', 'time', 'phone'],
                },
              },
            ],
          }],
        },
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsInitialized(true);
            if (!audioContextInRef.current) return;
            const source = audioContextInRef.current.createMediaStreamSource(stream);
            const scriptProcessor = audioContextInRef.current.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                try {
                  session.sendRealtimeInput({ media: pcmBlob });
                } catch (err) { }
              }).catch(() => {});
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextInRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
              setIsSpeaking(true);
              const base64Data = message.serverContent.modelTurn.parts[0].inlineData.data;
              const ctx = audioContextOutRef.current;
              if (!ctx) return;
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(base64Data), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setIsSpeaking(false);
              });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                const result = handleToolCall(fc);
                sessionPromise.then((session) => session.sendToolResponse({
                  functionResponses: { id: fc.id, name: fc.name, response: result }
                })).catch(() => {});
              }
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsSpeaking(false);
            }
          },
          onerror: (e) => {
            console.error('PRIME Neural Error:', e);
            setHasError(true);
            stopLive();
          },
          onclose: () => {
            setIsInitialized(false);
            setIsConnecting(false);
          }
        }
      });

      sessionRef.current = sessionPromise;
    } catch (err) {
      console.error('Handshake Rejected:', err);
      setHasError(true);
      setIsConnecting(false);
      stopLive();
    }
  };

  const togglePrime = () => {
    if (isInitialized) {
      stopLive();
    } else {
      initializePrime();
    }
  };

  return (
    <div className="fixed bottom-28 right-4 z-[120] flex flex-col items-center">
      <style>{`
        @keyframes orb-pulse {
          0% { box-shadow: 0 0 5px rgba(6, 182, 212, 0.4); }
          50% { box-shadow: 0 0 20px rgba(6, 182, 212, 0.7); }
          100% { box-shadow: 0 0 5px rgba(6, 182, 212, 0.4); }
        }
        @keyframes neural-waves {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .prime-orb-small {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #22d3ee, #0891b2, #0e7490);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          cursor: pointer;
          transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          border: 2px solid rgba(34, 211, 238, 0.4);
        }
        .prime-orb-small.active {
          animation: orb-pulse 2s infinite ease-in-out;
        }
        .prime-orb-small.off {
          background: radial-gradient(circle at 30% 30%, #334155, #1e293b, #0f172a);
          border-color: rgba(71, 85, 105, 0.5);
        }
        .prime-orb-small.error {
          background: radial-gradient(circle at 30% 30%, #ef4444, #b91c1c, #7f1d1d);
          border-color: rgba(239, 68, 68, 0.5);
          box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);
        }
        .wave-small {
          position: absolute;
          inset: -2px;
          border: 2px solid #22d3ee;
          border-radius: 50%;
          animation: neural-waves 2s infinite linear;
          pointer-events: none;
        }
        .wave-2-small { animation-delay: 0.7s; }
        .sync-rotate {
          animation: spin 1.2s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="flex flex-col items-center gap-2">
        {isInitialized ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 flex flex-col items-center">
            <button 
              onClick={togglePrime}
              className={`prime-orb-small active group ${isSpeaking ? 'scale-110' : ''}`}
            >
               <div className="wave-small"></div>
               {isSpeaking && <div className="wave-small wave-2-small"></div>}
               <div className="relative z-10">
                  <i className={`fas ${isSpeaking ? 'fa-volume-up' : 'fa-microphone'} text-white text-sm ${!isSpeaking ? 'animate-pulse' : ''}`}></i>
               </div>
            </button>
            <span className="text-[8px] font-bold text-cyan-500 uppercase tracking-[0.3em] mt-2 opacity-80">Link Active</span>
          </div>
        ) : (
          <div className="flex flex-col items-center opacity-70 hover:opacity-100 transition-opacity">
            <button 
              onClick={togglePrime}
              className={`prime-orb-small ${isConnecting ? 'active' : 'off'} ${hasError ? 'error' : ''} group`}
            >
               {isConnecting ? (
                  <i className="fas fa-sync-alt sync-rotate text-cyan-400 text-sm"></i>
               ) : hasError ? (
                  <i className="fas fa-bolt text-white text-sm"></i>
               ) : (
                  <i className="fas fa-power-off text-slate-500 text-sm group-hover:text-cyan-400"></i>
               )}
            </button>
            <span className={`text-[8px] font-bold uppercase tracking-[0.3em] mt-2 ${hasError ? 'text-red-500' : 'text-slate-600'}`}>
              {isConnecting ? 'Syncing...' : hasError ? 'Reconnect' : 'Standby'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveVoiceAssistant;
