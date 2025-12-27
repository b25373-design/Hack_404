
import React from 'react';

const CampusMap: React.FC = () => {
  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-cyan-900 pb-4">
        <h2 className="text-3xl font-sci-fi text-cyan-400 uppercase tracking-tighter neon-text-cyan">Campus Navigation Core</h2>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase">
          <i className="fas fa-satellite text-cyan-500"></i>
          Neural Satellite Link: Active
        </div>
      </div>

      <div className="flex-1 glass-card rounded-3xl p-1 relative overflow-hidden border-cyan-500/30 group">
        <div className="scanner-line !opacity-20 pointer-events-none"></div>
        
        {/* Interactive Map Embed */}
        <div className="w-full h-full rounded-2xl overflow-hidden bg-slate-950 relative">
          <iframe 
            src="https://maps.iitmandi.co.in" 
            title="IIT Mandi Interactive Map"
            className="w-full h-full border-none opacity-90 hover:opacity-100 transition-opacity duration-700"
            allow="geolocation"
          ></iframe>
          
          {/* Sci-fi Overlay Elements (Minimal to not block the map) */}
          <div className="absolute inset-0 pointer-events-none border-[1px] border-cyan-500/10 rounded-2xl"></div>
          
          {/* Coordination Hub Label */}
          <div className="absolute top-4 left-4 p-3 bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 rounded-lg pointer-events-none z-10">
            <h4 className="text-[8px] text-cyan-400 font-bold uppercase tracking-widest mb-1">Global Positioning</h4>
            <div className="text-[10px] text-slate-400 font-mono leading-none">
              31.7754° N | 76.9861° E
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center gap-4 pb-2">
        <div className="px-6 py-2 border border-cyan-900/50 rounded-full bg-cyan-950/10 text-[10px] text-cyan-500 font-bold uppercase tracking-[0.2em]">
           Interactive Terminal: Use mouse or touch to navigate the terrain
        </div>
      </div>
    </div>
  );
};

export default CampusMap;
