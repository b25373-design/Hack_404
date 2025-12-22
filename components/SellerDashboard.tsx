
import React, { useState } from 'react';
import { User, Shop, InventoryItem, ServiceItem, Appointment, ShopCategory } from '../types';

interface SellerDashboardProps {
  user: User;
  shops: Shop[];
  appointments: Appointment[];
  onUpdateShops: (shops: Shop[]) => void;
  onUpdateAppointments: (apts: Appointment[]) => void;
}

const SellerDashboard: React.FC<SellerDashboardProps> = ({ user, shops, appointments, onUpdateShops, onUpdateAppointments }) => {
  const shop = shops.find(s => s.id === user.shopId);
  const [activeTab, setActiveTab] = useState<'inventory' | 'appointments'>('inventory');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemStock, setItemStock] = useState('');

  if (!shop) return <div className="text-center p-20 text-red-400">Shop ID Error.</div>;

  const isRetail = [ShopCategory.STATIONARY, ShopCategory.ELECTRONICS].includes(shop.category);

  const addItem = () => {
    if (!itemName || !itemPrice) return;
    const newItem: any = isRetail 
      ? { id: Date.now().toString(), name: itemName, price: Number(itemPrice), available: Number(itemStock) > 0, stock: Number(itemStock) }
      : { id: Date.now().toString(), name: itemName, price: Number(itemPrice), duration: '30 mins' };

    const updatedShops = shops.map(s => s.id === shop.id 
      ? { ...s, items: isRetail ? [...(s.items || []), newItem] : s.items, services: !isRetail ? [...(s.services || []), newItem] : s.services } 
      : s
    );
    onUpdateShops(updatedShops);
    setItemName(''); setItemPrice(''); setItemStock('');
  };

  const updateItemField = (itemId: string, field: string, value: any) => {
    const updatedShops = shops.map(s => {
      if (s.id === shop.id) {
        const key = isRetail ? 'items' : 'services';
        const updatedList = (s as any)[key]?.map((i: any) => i.id === itemId ? { ...i, [field]: value } : i);
        return { ...s, [key]: updatedList };
      }
      return s;
    });
    onUpdateShops(updatedShops);
  };

  const updateAppointment = (aptId: string, updates: Partial<Appointment>) => {
    const updated = appointments.map(a => a.id === aptId ? { ...a, ...updates } : a);
    onUpdateAppointments(updated);
  };

  const shopAppointments = appointments.filter(a => a.shopId === shop.id);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="p-8 glass-card rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-cyan-900/30 border border-cyan-500/30 rounded-xl flex items-center justify-center text-cyan-400 text-2xl">
            <i className={`fas ${isRetail ? 'fa-boxes' : 'fa-calendar-alt'}`}></i>
          </div>
          <div>
            <h2 className="text-3xl font-sci-fi text-slate-100 uppercase tracking-tighter">{shop.name}</h2>
            <p className="text-xs text-cyan-500 font-bold uppercase">Store Control Dashboard</p>
          </div>
        </div>
        <div className="flex bg-slate-900 p-1 rounded-lg border border-cyan-900/50">
          <button onClick={() => setActiveTab('inventory')} className={`px-6 py-2 rounded font-bold text-xs uppercase ${activeTab === 'inventory' ? 'bg-cyan-600 text-white' : 'text-slate-500'}`}>{isRetail ? 'Inventory' : 'Services'}</button>
          <button onClick={() => setActiveTab('appointments')} className={`px-6 py-2 rounded font-bold text-xs uppercase ${activeTab === 'appointments' ? 'bg-cyan-600 text-white' : 'text-slate-500'}`}>Portal ({shopAppointments.length})</button>
        </div>
      </div>

      {activeTab === 'inventory' ? (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="glass-card p-6 rounded-2xl h-fit">
            <h3 className="font-sci-fi text-cyan-400 mb-6 uppercase text-sm">Add New Resource</h3>
            <div className="space-y-4">
              <input type="text" value={itemName} onChange={e => setItemName(e.target.value)} className="w-full bg-slate-900 border border-cyan-900 rounded p-2.5 text-slate-200" placeholder="Name" />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" value={itemPrice} onChange={e => setItemPrice(e.target.value)} className="w-full bg-slate-900 border border-cyan-900 rounded p-2.5 text-slate-200" placeholder="Price" />
                {isRetail && <input type="number" value={itemStock} onChange={e => setItemStock(e.target.value)} className="w-full bg-slate-900 border border-cyan-900 rounded p-2.5 text-slate-200" placeholder="Stock" />}
              </div>
              <button onClick={addItem} className="w-full py-3 bg-cyan-600 text-white font-bold uppercase rounded">Update Database</button>
            </div>
          </div>

          <div className="lg:col-span-2 glass-card rounded-2xl overflow-hidden">
             <table className="w-full text-left">
                <thead className="text-[10px] text-slate-500 uppercase border-b border-cyan-900/30 font-bold">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4">Price (₹)</th>
                    {isRetail && <th className="px-6 py-4">Stock</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-950">
                  {(isRetail ? shop.items : shop.services)?.map((i: any) => (
                    <tr key={i.id} className="hover:bg-cyan-500/5 transition-colors">
                      <td className="px-6 py-4 text-slate-200 font-bold">{i.name}</td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => isRetail && updateItemField(i.id, 'available', !i.available)} className={`text-[10px] font-bold px-2 py-1 border rounded transition-all ${i.available || !isRetail ? 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10' : 'border-red-500/30 text-red-400 hover:bg-red-500/10'}`}>
                          {isRetail ? (i.available ? 'ONLINE' : 'OFFLINE') : 'ACTIVE'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <input type="number" value={i.price} onChange={e => updateItemField(i.id, 'price', Number(e.target.value))} className="bg-transparent border-b border-cyan-900/50 text-cyan-400 font-sci-fi w-16 focus:border-cyan-500 outline-none" />
                      </td>
                      {isRetail && (
                        <td className="px-6 py-4">
                          <input type="number" value={i.stock} onChange={e => updateItemField(i.id, 'stock', Number(e.target.value))} className="bg-transparent border-b border-cyan-900/50 text-slate-300 w-16 focus:border-cyan-500 outline-none" />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="text-[10px] text-slate-500 uppercase border-b border-cyan-900/30 font-bold">
              <tr>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Service</th>
                <th className="px-6 py-4">Slot</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Directives</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-950">
              {shopAppointments.map(apt => (
                <tr key={apt.id} className="hover:bg-cyan-500/5 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-200">{apt.studentName}</p>
                    <p className="text-[10px] text-slate-500">PH: {apt.studentPhone}</p>
                  </td>
                  <td className="px-6 py-4 text-cyan-400 uppercase font-bold text-sm">{apt.serviceName}</td>
                  <td className="px-6 py-4 text-slate-400 font-sci-fi">{apt.date} @ {apt.timeSlot}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${
                      apt.status === 'requested' ? 'border-yellow-500/30 text-yellow-500' : 
                      apt.status === 'confirmed' ? 'border-cyan-500/30 text-cyan-500' :
                      apt.status === 'ongoing' ? 'border-green-500/50 text-green-400 animate-pulse' :
                      apt.status === 'completed' ? 'border-slate-500/30 text-slate-500' :
                      'border-red-500/30 text-red-500'
                    }`}>
                      {apt.status} {apt.paymentSettled && '(Paid)'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {apt.status === 'requested' && (
                      <>
                        <button onClick={() => updateAppointment(apt.id, { status: 'confirmed' })} className="px-3 py-1 bg-cyan-600 text-[10px] font-bold uppercase rounded shadow-lg hover:bg-cyan-500 transition-all">Accept</button>
                        <button onClick={() => updateAppointment(apt.id, { status: 'declined' })} className="px-3 py-1 bg-red-600/20 text-red-400 text-[10px] font-bold uppercase border border-red-500/50 rounded hover:bg-red-600/30 transition-all">Decline</button>
                      </>
                    )}
                    {apt.status === 'ongoing' && (
                      <div className="flex items-center justify-end gap-3">
                        {!apt.paymentSettled ? (
                          <button onClick={() => updateAppointment(apt.id, { paymentSettled: true })} className="px-3 py-1 bg-orange-600/20 text-orange-400 text-[10px] font-bold uppercase border border-orange-500/50 rounded hover:bg-orange-600/40 transition-all">
                            Settle Payment
                          </button>
                        ) : (
                          <button onClick={() => updateAppointment(apt.id, { status: 'completed' })} className="px-4 py-1.5 bg-green-600 text-white text-[10px] font-bold uppercase rounded shadow-lg hover:bg-green-500 transition-all">
                            Close Appointment
                          </button>
                        )}
                      </div>
                    )}
                    {apt.status === 'confirmed' && (
                      <p className="text-[10px] text-slate-500 italic uppercase">System Pending Time Signature...</p>
                    )}
                    {apt.status === 'completed' && (
                      <div className="flex items-center justify-end gap-2 text-green-500 text-[10px] font-bold uppercase">
                        <i className="fas fa-check-circle"></i> Records Archived
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {shopAppointments.length === 0 && <div className="p-12 text-center text-slate-500 uppercase font-sci-fi text-sm">No operational logs found for appointments.</div>}
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
