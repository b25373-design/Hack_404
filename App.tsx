
import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, Shop, Appointment, AppView, ActivityLog } from './types';
import { INITIAL_SHOPS } from './constants';
import AuthForm from './components/AuthForm';
import Sidebar from './components/Sidebar';
import ShopDashboard from './components/ShopDashboard';
import SellerDashboard from './components/SellerDashboard';
import Navbar from './components/Navbar';
import AppointmentsList from './components/AppointmentsList';
import LiveVoiceAssistant from './components/LiveVoiceAssistant';

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
  const [view, setView] = useState<AppView>('shops');
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showTerminal, setShowTerminal] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminTab, setAdminTab] = useState<'system' | 'registry' | 'activity' | 'replication'>('system');
  const [replicationInput, setReplicationInput] = useState('');
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
    if (allUsers.length > 0) {
      localStorage.setItem('IITM_ONE_USER_REGISTRY', JSON.stringify(allUsers));
    }
  }, [allUsers]);

  const addLog = (type: LogEntry['type'], target: string, content: string, subject?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newLog: LogEntry = {
      id, timestamp: new Date().toLocaleTimeString(), type, target, subject, content, status: 'processing'
    };
    setLogs(prev => [newLog, ...prev].slice(0, 30));
    setTimeout(() => {
      setLogs(prev => prev.map(log => log.id === id ? { ...log, status: 'success' } : log));
    }, 1200);
  };

  const sendEmailViaResend = (to: string, subject: string, message: string) => {
    addLog('email', to, message, subject);
    console.log(`%c[SYSTEM HANDSHAKE] to: ${to} | ${subject}`, 'color: #0ea5e9; font-weight: bold;');
  };

  const logToSQL = (action: string, metadata: string = "N/A", targetUser?: User) => {
    const activeUser = targetUser || user;
    if (!activeUser) return;
    const tableName = 'IITM_CORE_SQL_GLOBAL_ACTIVITY';
    const stored = localStorage.getItem(tableName);
    const activityList: ActivityLog[] = stored ? JSON.parse(stored) : [];
    const newRow: ActivityLog = {
      id: `CORE_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userEmail: activeUser.email,
      action: action,
      metadata: metadata
    };
    localStorage.setItem(tableName, JSON.stringify([newRow, ...activityList].slice(0, 100)));
  };

  const handleLogin = (userData: User) => {
    const existingUser = allUsers.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (existingUser && userData.password && existingUser.password !== userData.password) return;

    let finalUser = userData;
    if (existingUser) {
      finalUser = { ...existingUser, name: userData.name || existingUser.name };
      setAllUsers(prev => prev.map(u => u.email.toLowerCase() === finalUser.email.toLowerCase() ? finalUser : u));
    } else {
      setAllUsers(prev => [...prev, userData]);
    }
    
    setUser(finalUser);
    localStorage.setItem('iit_mandi_active_session', JSON.stringify(finalUser));
    logToSQL('AUTH_SUCCESS', `Role: ${finalUser.role}`, finalUser);
    sendEmailViaResend(finalUser.email, "Identity Handshake - IIT Mandi ONE", `Connection established for ${finalUser.name}. Persistent session active.`);

    if (finalUser.role === UserRole.SELLER && finalUser.shopId) {
      setSelectedShopId(finalUser.shopId);
    }
  };

  const handleLogout = () => {
    logToSQL('AUTH_TERMINATE', 'User disconnected.');
    setUser(null);
    setSelectedShopId(null);
    localStorage.removeItem('iit_mandi_active_session');
  };

  const handleAdminActivation = () => {
    setIsAdminMode(true);
    setShowTerminal(true);
    addLog('system', 'MASTER_CORE', 'Handshake Successful. Diagnostic Registry Unlocked.');
  };

  const handleInboundInjection = () => {
    try {
      if (!replicationInput) return;
      const decodedData = JSON.parse(atob(replicationInput));
      
      if (decodedData.users) {
        // Merge users based on email uniqueness
        setAllUsers(prev => {
          const combined = [...prev, ...decodedData.users];
          const unique = Array.from(new Map(combined.map(u => [u.email.toLowerCase(), u])).values());
          return unique;
        });
        
        addLog('system', 'CORE_REPLICATION', `Injected ${decodedData.users.length} unique identity signatures.`);
        setReplicationInput('');
        alert('NEURAL LINK ESTABLISHED: Remote identity data merged into registry.');
      }
    } catch (e) {
      addLog('system', 'REPLICATION_ERROR', 'Failed to parse inbound hash. Data corruption suspected.');
      alert('INJECTION FAILED: Invalid or corrupt hash code.');
    }
  };

  const getGlobalActivity = () => {
    return JSON.parse(localStorage.getItem('IITM_CORE_SQL_GLOBAL_ACTIVITY') || '[]');
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center sci-fi-grid">
        <div className="w-16 h-16 border-t-4 border-cyan-500 rounded-full animate-spin"></div>
        <p className="mt-8 font-sci-fi text-cyan-400 animate-pulse uppercase tracking-[0.2em] text-sm">Syncing Core Neural Link...</p>
      </div>
    );
  }

  if (!user) return <AuthForm onLogin={handleLogin} />;

  const userApts = appointments.filter(a => a.studentId === user.id);

  return (
    <div className="h-screen bg-slate-950 sci-fi-grid flex flex-col relative overflow-hidden">
      {/* COMMUNICATION & MASTER HUB */}
      <div className={`fixed inset-y-0 right-0 z-[100] w-full md:w-[480px] bg-slate-950 border-l border-cyan-500/30 transform transition-transform duration-500 ${showTerminal ? 'translate-x-0 shadow-[0_0_100px_rgba(0,0,0,0.9)]' : 'translate-x-full shadow-none'}`}>
        <div className="h-full flex flex-col font-mono text-[10px] p-6 pt-12 md:pt-6">
          <div className="flex justify-between items-center mb-6 border-b border-cyan-500/20 pb-4">
            <span className="text-cyan-400 font-sci-fi text-sm uppercase tracking-widest neon-text-cyan">
              {isAdminMode ? 'Master_Database_Explorer' : 'Comm_Hub_Link'}
            </span>
            <button onClick={() => setShowTerminal(false)} className="text-cyan-500 hover:text-white transition-colors">
              <i className="fas fa-times text-lg"></i>
            </button>
          </div>

          <div className="flex flex-wrap gap-1 mb-6">
             <button onClick={() => setAdminTab('system')} className={`flex-1 py-2 border rounded uppercase text-[8px] transition-all ${adminTab === 'system' ? 'bg-cyan-900 text-white border-cyan-400' : 'border-cyan-900 text-cyan-700 hover:text-cyan-400'}`}>Messages</button>
             {isAdminMode && (
               <>
                 <button onClick={() => setAdminTab('registry')} className={`flex-1 py-2 border rounded uppercase text-[8px] transition-all ${adminTab === 'registry' ? 'bg-cyan-900 text-white border-cyan-400' : 'border-cyan-900 text-cyan-700 hover:text-cyan-400'}`}>Registry</button>
                 <button onClick={() => setAdminTab('activity')} className={`flex-1 py-2 border rounded uppercase text-[8px] transition-all ${adminTab === 'activity' ? 'bg-cyan-900 text-white border-cyan-400' : 'border-cyan-900 text-cyan-700 hover:text-cyan-400'}`}>Activity</button>
                 <button onClick={() => setAdminTab('replication')} className={`flex-1 py-2 border rounded uppercase text-[8px] transition-all ${adminTab === 'replication' ? 'bg-cyan-900 text-white border-cyan-400' : 'border-cyan-900 text-cyan-700 hover:text-cyan-400'}`}>Replication</button>
               </>
             )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
            {adminTab === 'system' ? (
              logs.length > 0 ? (
                logs.map(log => (
                  <div key={log.id} className="p-3 rounded-lg border border-cyan-900 bg-cyan-950/5 mb-2 relative group overflow-hidden">
                    <div className="scanner-line !h-[1px] opacity-20 group-hover:opacity-60"></div>
                    <div className="flex justify-between mb-1 text-slate-500 text-[8px]"><span>[{log.type}]</span><span>{log.timestamp}</span></div>
                    <p className="text-cyan-300 font-bold uppercase truncate">TARGET: {log.target}</p>
                    <p className="text-slate-400 uppercase leading-tight">{log.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-600 italic text-center py-10">No active transmissions detected.</p>
              )
            ) : adminTab === 'registry' ? (
              <div className="space-y-2">
                 <div className="p-2 mb-2 bg-cyan-950/20 text-cyan-500 font-bold uppercase border-b border-cyan-500/30">CORE_IDENTITY_SQL (REAL-TIME)</div>
                 {allUsers.length === 0 ? (
                   <p className="text-slate-600 text-center py-10 uppercase tracking-widest text-[8px]">Registry Empty</p>
                 ) : (
                   allUsers.map((u) => (
                     <div key={u.id} className="p-3 bg-slate-900 border border-cyan-900/40 rounded-xl hover:border-cyan-500 transition-colors group">
                        <div className="flex justify-between font-bold text-cyan-500 mb-1">
                          <span>{u.name}</span>
                          <span className="text-[8px] opacity-60">ID: {u.id}</span>
                        </div>
                        <div className="text-slate-300 font-bold truncate">EMAIL: {u.email}</div>
                        <div className="text-cyan-400/80 font-mono mt-1 flex justify-between items-center">
                           <span>PWD: <span className="text-white group-hover:blur-none blur-[2px] transition-all">{u.password || '••••••••'}</span></span>
                           <span className="bg-cyan-950 px-1.5 py-0.5 rounded text-[7px] border border-cyan-800">{u.role}</span>
                        </div>
                     </div>
                   ))
                 )}
              </div>
            ) : adminTab === 'activity' ? (
              <div className="space-y-2">
                <div className="p-2 mb-2 bg-cyan-950/20 text-cyan-500 font-bold uppercase border-b border-cyan-500/30">GLOBAL_ACTIVITY_LOG</div>
                {getGlobalActivity().map((row: any) => (
                  <div key={row.id} className="p-3 bg-slate-900 border border-cyan-900/20 rounded text-[9px]">
                    <div className="flex justify-between font-bold text-cyan-600 mb-1"><span>{row.userEmail}</span><span>{new Date(row.timestamp).toLocaleTimeString()}</span></div>
                    <div className="text-cyan-400 uppercase font-bold">{row.action}</div>
                    <div className="text-slate-500 italic uppercase truncate">{row.metadata}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6 p-4 border border-cyan-900 bg-cyan-950/10 rounded-xl relative overflow-hidden">
                 <div className="scanner-line !h-[1px] !opacity-10"></div>
                 
                 <div>
                    <h4 className="text-cyan-400 font-bold uppercase text-xs mb-1">Outbound Transmission</h4>
                    <p className="text-slate-500 uppercase text-[8px] mb-3">Snapshot your local registry for other nodes.</p>
                    <button onClick={() => {
                      const db = { users: allUsers, activity: getGlobalActivity() };
                      const str = btoa(JSON.stringify(db));
                      navigator.clipboard.writeText(str);
                      addLog('system', 'CORE', 'Local registry snapshot hashed and copied.');
                      alert('OUTBOUND SYNC: Hash code copied to clipboard.');
                    }} className="w-full py-2.5 bg-cyan-600 text-white font-bold uppercase rounded text-[9px] hover:bg-cyan-500 transition-colors shadow-[0_0_15px_rgba(8,145,178,0.3)]">Generate Local Hash</button>
                 </div>

                 <div className="pt-6 border-t border-cyan-900/50">
                    <h4 className="text-purple-400 font-bold uppercase text-xs mb-1">Inbound Neural Injection</h4>
                    <p className="text-slate-500 uppercase text-[8px] mb-3">Paste a remote hash to merge external identities.</p>
                    <textarea 
                      value={replicationInput}
                      onChange={(e) => setReplicationInput(e.target.value)}
                      placeholder="PASTE REMOTE HASH CODE HERE..."
                      className="w-full h-24 bg-slate-900/80 border border-purple-900/50 rounded p-2 text-purple-300 text-[8px] focus:border-purple-500 outline-none transition-colors custom-scrollbar"
                    />
                    <button 
                      onClick={handleInboundInjection}
                      className="w-full mt-3 py-2.5 bg-purple-700 text-white font-bold uppercase rounded text-[9px] hover:bg-purple-600 transition-colors shadow-[0_0_15px_rgba(126,34,206,0.3)]"
                    >
                      Inject Remote State
                    </button>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        onAdminTrigger={handleAdminActivation}
        onToggleTerminal={() => setShowTerminal(!showTerminal)}
        unreadCount={logs.length}
      />
      
      <div className="flex flex-1 overflow-hidden relative">
        <div className="scanner-line"></div>
        
        {user.role === UserRole.USER ? (
          <>
            <Sidebar shops={shops} selectedShopId={selectedShopId} onSelectShop={(id) => { setSelectedShopId(id); setView('shops'); }} hasAppointments={userApts.length > 0} view={view} onSetView={(v) => setView(v as AppView)} />
            <main ref={mainContentRef} className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
              <div key={view + (selectedShopId || 'root')} className="view-enter h-full">
                {view === 'appointments' ? <AppointmentsList appointments={userApts} shops={shops} /> : selectedShopId ? <ShopDashboard shop={shops.find(s => s.id === selectedShopId)!} user={user} onBookAppointment={(apt) => { setAppointments(prev => [...prev, apt]); setView('appointments'); setSelectedShopId(null); logToSQL('SERVICE_INITIATED', apt.serviceName); }} /> : (
                  <div className="h-full flex items-center justify-center">
                    <div className="glass-card p-12 rounded-3xl max-w-2xl border-cyan-500/30 w-full text-center relative">
                      <h2 className="text-4xl font-sci-fi text-cyan-400 mb-4 neon-text-cyan uppercase">Welcome, {user.name}</h2>
                      <p className="text-lg text-slate-400 mb-8 uppercase tracking-widest opacity-80">Link status: Persistent and Secure.</p>
                      <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setSelectedShopId('shop-1')} className="p-6 border border-cyan-900/50 rounded-2xl bg-cyan-950/20 group hover:border-cyan-500 transition-all">
                          <i className="fas fa-microchip text-cyan-500 text-3xl mb-3"></i>
                          <h3 className="font-bold text-slate-200 uppercase text-sm">Sector Directory</h3>
                        </button>
                        <button onClick={() => setView('appointments')} className="p-6 border border-cyan-900/50 rounded-2xl bg-cyan-950/20 group hover:border-cyan-500 transition-all">
                          <i className="fas fa-calendar-check text-cyan-500 text-3xl mb-3"></i>
                          <h3 className="font-bold text-slate-200 uppercase text-sm">Active Portal</h3>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </main>
            <LiveVoiceAssistant user={user} shops={shops} onBookAppointment={(apt) => { setAppointments(prev => [...prev, apt]); setView('appointments'); setSelectedShopId(null); }} onNavigate={(id) => { setSelectedShopId(id); setView('shops'); }} />
          </>
        ) : (
          <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
            <SellerDashboard user={user} shops={shops} appointments={appointments} onUpdateShops={setShops} onUpdateAppointments={setAppointments} />
          </main>
        )}
      </div>
    </div>
  );
};

export default App;
