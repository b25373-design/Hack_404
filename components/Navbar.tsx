
import React, { useRef } from 'react';
import { User } from '../types';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  onAdminTrigger: () => void;
  onToggleTerminal: () => void;
  unreadCount?: number;
  isSyncing?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onAdminTrigger, onToggleTerminal, unreadCount = 0, isSyncing = false }) => {
  const clickCount = useRef(0);
  const clickTimer = useRef<number | null>(null);

  const handleLogoClick = () => {
    clickCount.current++;
    if (clickTimer.current) window.clearTimeout(clickTimer.current);

    if (clickCount.current === 3) {
      onAdminTrigger();
      clickCount.current = 0;
    } else {
      clickTimer.current = window.setTimeout(() => {
        clickCount.current = 0;
      }, 500);
    }
  };

  return (
    <nav className="h-16 border-b border-cyan-500/30 glass-card flex items-center justify-between px-6 z-50">
      <div className="flex items-center gap-3">
        <div 
          onClick={handleLogoClick}
          className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center text-white font-sci-fi text-xl shadow-[0_0_15px_rgba(6,182,212,0.6)] cursor-pointer active:scale-90 transition-transform select-none relative group"
        >
          ONE
          {isSyncing && (
            <span className="absolute inset-0 rounded-lg border-2 border-cyan-400 animate-ping opacity-50"></span>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-sci-fi text-xl tracking-tighter text-slate-100 neon-text-cyan leading-none">IIT MANDI ONE</h1>
            {isSyncing && (
              <span className="flex items-center gap-1">
                <span className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></span>
                <span className="text-[7px] text-cyan-500 font-bold uppercase tracking-widest">Live Sync</span>
              </span>
            )}
          </div>
          <span className="text-[10px] text-cyan-500 font-bold tracking-[0.2em]">INTEGRATED CAMPUS HUB</span>
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <div className="hidden lg:flex flex-col items-end">
          <span className="text-xs font-bold text-cyan-400">{user.name}</span>
          <span className="text-[10px] text-slate-500 uppercase">{user.role} | {user.email}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Comm-Hub Toggle (Updates & Messages) */}
          <button 
            onClick={onToggleTerminal}
            className={`relative w-10 h-10 flex items-center justify-center bg-cyan-950/30 border rounded-lg transition-all active:scale-95 group ${isSyncing ? 'border-cyan-400 text-cyan-300' : 'border-cyan-500/20 text-cyan-500'}`}
            title="Communication Hub (Updates & Logs)"
          >
            <i className={`fas fa-satellite-dish ${isSyncing ? 'animate-bounce' : 'group-hover:animate-pulse'}`}></i>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-[8px] text-white flex items-center justify-center rounded-full animate-bounce shadow-[0_0_10px_rgba(220,38,38,0.5)]">
                {unreadCount}
              </span>
            )}
          </button>
          
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 bg-red-950/20 border border-red-500/40 rounded hover:bg-red-500/30 transition-all text-red-400 text-xs font-bold uppercase"
          >
            <i className="fas fa-power-off"></i>
            <span className="hidden sm:inline">Terminate</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
