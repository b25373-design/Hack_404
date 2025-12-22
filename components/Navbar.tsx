
import React from 'react';
import { User, UserRole } from '../types';

interface NavbarProps {
  user: User;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  return (
    <nav className="h-16 border-b border-cyan-500/30 glass-card flex items-center justify-between px-6 z-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center text-white font-sci-fi text-xl shadow-[0_0_10px_rgba(6,182,212,0.6)]">
          ONE
        </div>
        <div>
          <h1 className="font-sci-fi text-xl tracking-tighter text-slate-100 neon-text-cyan leading-none">IIT MANDI ONE</h1>
          <span className="text-[10px] text-cyan-500 font-bold tracking-[0.2em]">INTEGRATED CAMPUS HUB</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex flex-col items-end">
          <span className="text-xs font-bold text-cyan-400">{user.name}</span>
          <span className="text-[10px] text-slate-500 uppercase">{user.role} | {user.email}</span>
        </div>
        
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-950/30 border border-red-500/50 rounded hover:bg-red-500/20 transition-all text-red-400 text-sm font-bold uppercase tracking-wider"
        >
          <i className="fas fa-power-off"></i>
          <span className="hidden sm:inline">Terminate Session</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
