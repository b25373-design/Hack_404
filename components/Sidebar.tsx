
import React from 'react';
import { Shop, ShopCategory } from '../types';

interface SidebarProps {
  shops: Shop[];
  selectedShopId: string | null;
  onSelectShop: (id: string | null) => void;
  hasAppointments?: boolean;
  view?: 'shops' | 'appointments';
  onSetView?: (view: 'shops' | 'appointments') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  shops, 
  selectedShopId, 
  onSelectShop, 
  hasAppointments, 
  view, 
  onSetView 
}) => {
  const getIcon = (category: ShopCategory) => {
    switch (category) {
      case ShopCategory.STATIONARY: return 'fa-book-open';
      case ShopCategory.ELECTRONICS: return 'fa-microchip';
      case ShopCategory.SALON: return 'fa-scissors';
      case ShopCategory.LAUNDRY: return 'fa-tshirt';
      default: return 'fa-store';
    }
  };

  return (
    <aside className="w-20 md:w-64 border-r border-cyan-500/20 glass-card flex flex-col overflow-hidden relative">
      <div className="p-4 border-b border-cyan-500/10 bg-cyan-900/10">
        <h2 className="hidden md:block font-sci-fi text-xs tracking-widest text-cyan-500 uppercase">Sectors</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto py-2 custom-scrollbar scroll-smooth">
        {hasAppointments && onSetView && (
          <button
            onClick={() => {
              onSetView('appointments');
              onSelectShop(null);
            }}
            className={`w-full p-4 flex items-center gap-4 transition-all duration-300 relative group mb-2 border-b border-cyan-500/10 ${
              view === 'appointments' 
                ? 'bg-orange-500/20 text-orange-300' 
                : 'text-slate-500 hover:bg-slate-800/50 hover:text-orange-400'
            }`}
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1 bg-orange-400 shadow-[0_0_8px_#fb923c] transition-all duration-300 ${
              view === 'appointments' ? 'opacity-100' : 'opacity-0'
            }`}></div>
            
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg border transition-all duration-300 ${
              view === 'appointments' ? 'border-orange-400/50 bg-orange-900/30' : 'border-slate-800 bg-slate-900'
            }`}>
              <i className="fas fa-calendar-check"></i>
            </div>
            <div className="hidden md:block text-left transition-opacity duration-300">
              <p className="font-bold text-sm">Appointments</p>
              <p className="text-[10px] uppercase opacity-60">My Portal</p>
            </div>
          </button>
        )}

        {shops.map(shop => (
          <button
            key={shop.id}
            onClick={() => {
              onSelectShop(shop.id);
              if (onSetView) onSetView('shops');
            }}
            className={`w-full p-4 flex items-center gap-4 transition-all duration-300 relative group ${
              selectedShopId === shop.id && view === 'shops'
                ? 'bg-cyan-500/20 text-cyan-300' 
                : 'text-slate-500 hover:bg-slate-800/50 hover:text-cyan-400'
            }`}
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_8px_#22d3ee] transition-all duration-300 ${
              selectedShopId === shop.id && view === 'shops' ? 'opacity-100' : 'opacity-0'
            }`}></div>

            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg border transition-all duration-300 ${
              selectedShopId === shop.id && view === 'shops' ? 'border-cyan-400/50 bg-cyan-900/30' : 'border-slate-800 bg-slate-900'
            }`}>
              <i className={`fas ${getIcon(shop.category)}`}></i>
            </div>
            <div className="hidden md:block text-left transition-opacity duration-300">
              <p className="font-bold text-sm truncate w-36">{shop.name}</p>
              <p className="text-[10px] uppercase opacity-60">{shop.category}</p>
            </div>
          </button>
        ))}
      </div>
      
      {/* Decorative HUD element */}
      <div className="p-4 border-t border-cyan-500/10 bg-cyan-900/5">
        <div className="hidden md:flex flex-col gap-1">
          <div className="flex justify-between items-center text-[8px] text-cyan-700 font-bold uppercase">
            <span>Link Strength</span>
            <span>94%</span>
          </div>
          <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-500/50 w-[94%] shadow-[0_0_5px_rgba(34,211,238,0.5)]"></div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
