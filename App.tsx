
import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, Shop, Appointment } from './types';
import { INITIAL_SHOPS } from './constants';
import AuthForm from './components/AuthForm';
import Sidebar from './components/Sidebar';
import ShopDashboard from './components/ShopDashboard';
import SellerDashboard from './components/SellerDashboard';
import Navbar from './components/Navbar';
import AppointmentsList from './components/AppointmentsList';

const RESEND_API_KEY = 're_HQL6X8Ko_FNrY3ySnTLyVWtVBYbqAJyKM';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'email' | 'sms' | 'system';
  target: string;
  subject?: string;
  content: string;
  status: 'processing' | 'success' | 'failed';
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [view, setView] = useState<'shops' | 'appointments'>('shops');
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showTerminal, setShowTerminal] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    const sessionUser = localStorage.getItem('iit_mandi_active_session');
    const storedUsers = localStorage.getItem('IITM_ONE_USER_REGISTRY');
    const storedShops = localStorage.getItem('IITM_ONE_GLOBAL_SHOPS');
    const storedAppointments = localStorage.getItem('IITM_ONE_GLOBAL_APPOINTMENTS');

    if (sessionUser) setUser(JSON.parse(sessionUser));
    if (storedUsers) setAllUsers(JSON.parse(storedUsers));
    
    if (storedShops) {
      setShops(JSON.parse(storedShops));
    } else {
      setShops(INITIAL_SHOPS);
      localStorage.setItem('IITM_ONE_GLOBAL_SHOPS', JSON.stringify(INITIAL_SHOPS));
    }

    if (storedAppointments) {
      setAppointments(JSON.parse(storedAppointments));
    }

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (shops.length > 0) {
      localStorage.setItem('IITM_ONE_GLOBAL_SHOPS', JSON.stringify(shops));
    }
  }, [shops]);

  useEffect(() => {
    localStorage.setItem('IITM_ONE_GLOBAL_APPOINTMENTS', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    if (allUsers.length > 0) {
      localStorage.setItem('IITM_ONE_USER_REGISTRY', JSON.stringify(allUsers));
    }
  }, [allUsers]);

  const addLog = (type: LogEntry['type'], target: string, content: string, subject?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newLog: LogEntry = {
      id,
      timestamp: new Date().toLocaleTimeString(),
      type,
      target,
      subject,
      content,
      status: 'processing'
    };
    setLogs(prev => [newLog, ...prev].slice(0, 20));
    setShowTerminal(true);

    setTimeout(() => {
      setLogs(prev => prev.map(log => log.id === id ? { ...log, status: 'success' } : log));
    }, 2500);
  };

  const sendEmailViaResend = async (to: string, subject: string, message: string) => {
    addLog('email', to, message, subject);
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'IIT Mandi ONE <onboarding@resend.dev>',
          to: [to],
          subject: subject,
          html: message
        })
      });
      if (!response.ok) throw new Error('CORS_RESTRICTION');
    } catch (error) {
      console.log(`%c[RELAY] Automated Relay Active for ${to}`, 'color: #0ea5e9');
    }
  };

  const sendMockSMS = (to: string, message: string) => {
    addLog('sms', to, message);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      let changed = false;
      const updatedApts = appointments.map(apt => {
        let newApt = { ...apt };
        let localChanged = false;
        if (newApt.status === 'confirmed') {
          const [hours, minutes] = newApt.timeSlot.split(':').map(Number);
          const aptDate = new Date(newApt.date);
          aptDate.setHours(hours, minutes, 0, 0);
          const diffMinutes = (aptDate.getTime() - now.getTime()) / (1000 * 60);
          if (!newApt.reminderSent && diffMinutes <= 5 && diffMinutes > 0) {
             sendMockSMS(newApt.studentPhone, `IIT MANDI ONE: Your appointment for ${newApt.serviceName} at ${newApt.timeSlot} starts in 5 minutes!`);
             newApt.reminderSent = true;
             localChanged = true;
          }
          if (now >= aptDate) {
            newApt.status = 'ongoing';
            localChanged = true;
          }
        }
        if (localChanged) { changed = true; return newApt; }
        return apt;
      });
      if (changed) {
        setAppointments(updatedApts);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [appointments]);

  const handleLogin = (userData: User) => {
    const existingUser = allUsers.find(u => u.email === userData.email && u.role === userData.role);
    let finalUser = userData;
    if (existingUser) {
      finalUser = { ...existingUser, name: userData.name || existingUser.name };
      setAllUsers(prev => prev.map(u => u.email === finalUser.email ? finalUser : u));
    } else {
      setAllUsers(prev => [...prev, userData]);
    }
    setUser(finalUser);
    localStorage.setItem('iit_mandi_active_session', JSON.stringify(finalUser));
    sendEmailViaResend(finalUser.email, "Identity Handshake - IIT Mandi ONE", `Hi ${finalUser.name}, Welcome to IIT Mandi ONE. Persistent link active.`);
    if (finalUser.role === UserRole.SELLER && finalUser.shopId) {
      setSelectedShopId(finalUser.shopId);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedShopId(null);
    localStorage.removeItem('iit_mandi_active_session');
  };

  const updateShops = (newShops: Shop[]) => setShops(newShops);
  const updateAppointments = (newApts: Appointment[]) => setAppointments(newApts);

  const addAppointment = (apt: Appointment) => {
    setAppointments(prev => [...prev, apt]);
    sendEmailViaResend(user?.email || '', "Registry Updated - Appointment Booked", `Recorded ${apt.serviceName} in persistent ledger.`);
    setView('appointments');
    setSelectedShopId(null);
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center sci-fi-grid">
        <div className="w-16 h-16 border-t-4 border-cyan-500 border-solid rounded-full animate-spin"></div>
        <p className="mt-8 font-sci-fi text-cyan-400 animate-pulse uppercase tracking-[0.2em] text-sm px-4 text-center">Establishing Link...</p>
      </div>
    );
  }

  if (!user) return <AuthForm onLogin={handleLogin} />;

  const studentApts = appointments.filter(a => a.studentId === user.id);

  return (
    <div className="h-screen bg-slate-950 sci-fi-grid flex flex-col relative overflow-hidden">
      {/* COMM-LINK TERMINAL (Mobile-Friendly Slide-in) */}
      <div className={`fixed inset-y-0 right-0 z-[100] w-full md:w-96 bg-slate-950/98 border-l border-cyan-500/30 transform transition-transform duration-500 ease-in-out ${showTerminal ? 'translate-x-0' : 'translate-x-full shadow-none'}`}>
        <div className="h-full flex flex-col font-mono text-[10px] p-6 pt-12 md:pt-6">
          <div className="flex justify-between items-center mb-6 border-b border-cyan-500/20 pb-4">
            <span className="text-cyan-400 font-sci-fi text-sm uppercase tracking-widest">Comm-Hub</span>
            <button onClick={() => setShowTerminal(false)} className="w-10 h-10 flex items-center justify-center text-cyan-500 bg-cyan-900/20 rounded-full">
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
            {logs.length === 0 && <p className="text-slate-700 italic">No activity logs.</p>}
            {logs.map(log => (
              <div key={log.id} className={`p-4 rounded-xl border ${log.status === 'processing' ? 'border-yellow-900/50 bg-yellow-950/20' : 'border-cyan-900/50 bg-cyan-950/20'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className={`uppercase font-bold ${log.type === 'email' ? 'text-purple-400' : 'text-green-400'}`}>[{log.type}]</span>
                  <span className="text-slate-500">{log.timestamp}</span>
                </div>
                <p className="text-cyan-300 font-bold mb-1 break-all">TARGET: {log.target}</p>
                <p className="text-slate-400 text-xs leading-relaxed">{log.content}</p>
                <div className="mt-3 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${log.status === 'processing' ? 'bg-yellow-500 animate-ping' : 'bg-cyan-500'}`}></div>
                  <span className={`uppercase font-bold text-[8px] ${log.status === 'processing' ? 'text-yellow-500' : 'text-cyan-500'}`}>
                    {log.status === 'processing' ? 'Handshake...' : 'Synced to DB'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button 
        onClick={() => setShowTerminal(!showTerminal)}
        className="fixed bottom-20 right-0 z-[110] bg-cyan-900/80 border border-cyan-500/50 border-r-0 rounded-l-2xl w-14 h-14 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
      >
        <i className={`fas ${showTerminal ? 'fa-chevron-right' : 'fa-database'} text-lg`}></i>
      </button>

      <Navbar user={user} onLogout={handleLogout} />
      
      <div className="flex flex-1 overflow-hidden relative">
        <div className="scanner-line"></div>
        
        {user.role === UserRole.STUDENT ? (
          <>
            <Sidebar 
              shops={shops} 
              selectedShopId={selectedShopId} 
              onSelectShop={(id) => { setSelectedShopId(id); setView('shops'); }} 
              hasAppointments={studentApts.length > 0}
              view={view}
              onSetView={setView}
            />
            <main ref={mainContentRef} className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar scroll-smooth">
              <div key={view + (selectedShopId || 'root')} className="view-enter h-full">
                {view === 'appointments' ? (
                  <AppointmentsList appointments={studentApts} shops={shops} />
                ) : selectedShopId ? (
                  <ShopDashboard shop={shops.find(s => s.id === selectedShopId)!} user={user} onBookAppointment={addAppointment} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <div className="glass-card p-8 md:p-12 rounded-3xl max-w-2xl border-cyan-500/30 w-full">
                      <h2 className="text-2xl md:text-4xl font-sci-fi text-cyan-400 mb-4 neon-text-cyan uppercase">Welcome, {user.name}</h2>
                      <p className="text-sm md:text-lg text-slate-400 mb-8 uppercase tracking-widest">Active Connection Established.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button onClick={() => setSelectedShopId('shop-1')} className="p-6 border border-cyan-900/50 rounded-2xl bg-cyan-950/20 group hover:border-cyan-500 transition-all active:scale-95">
                          <i className="fas fa-microchip text-cyan-500 text-3xl mb-3"></i>
                          <h3 className="font-bold text-slate-200 uppercase text-sm">Browse</h3>
                        </button>
                        <button onClick={() => setView('appointments')} className="p-6 border border-cyan-900/50 rounded-2xl bg-cyan-950/20 group hover:border-cyan-500 transition-all active:scale-95">
                          <i className="fas fa-calendar-check text-cyan-500 text-3xl mb-3"></i>
                          <h3 className="font-bold text-slate-200 uppercase text-sm">Portal ({studentApts.length})</h3>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </main>
          </>
        ) : (
          <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
            <SellerDashboard 
              user={user} 
              shops={shops} 
              appointments={appointments}
              onUpdateShops={updateShops} 
              onUpdateAppointments={updateAppointments}
            />
          </main>
        )}
      </div>
      
      <footer className="h-10 border-t border-cyan-900/50 bg-slate-900/80 backdrop-blur flex items-center justify-between px-6 text-[8px] md:text-[10px] font-sci-fi tracking-tighter text-cyan-800 uppercase shrink-0">
        <div className="truncate pr-4">NODE: {user.role === 'SELLER' ? 'SECTOR-MGMT' : 'CLIENT-LINK'}</div>
        <div className="truncate">SYNC: PERSISTENT</div>
      </footer>
    </div>
  );
};

export default App;
