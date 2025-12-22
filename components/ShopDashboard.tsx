
import React, { useState } from 'react';
import { Shop, ShopCategory, User, InventoryItem, ServiceItem, Appointment } from '../types';

interface ShopDashboardProps {
  shop: Shop;
  user: User;
  onBookAppointment: (apt: Appointment) => void;
}

const ShopDashboard: React.FC<ShopDashboardProps> = ({ shop, user, onBookAppointment }) => {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [phone, setPhone] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isRetail = [ShopCategory.STATIONARY, ShopCategory.ELECTRONICS].includes(shop.category);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleBook = () => {
    if (!selectedService || !bookingDate || !bookingTime || !phone) {
      alert("Please fill all fields including phone number.");
      return;
    }
    
    const newApt: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      shopId: shop.id,
      studentId: user.id,
      studentName: user.name,
      studentPhone: phone,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      date: bookingDate,
      timeSlot: bookingTime,
      status: 'requested'
    };
    
    onBookAppointment(newApt);
    setShowBookingModal(false);
    setPhone('');
    alert('Appointment requested successfully! Check console for mock email.');
  };

  return (
    <div className={`space-y-6 transition-opacity duration-300 ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}>
      <div className="glass-card rounded-2xl overflow-hidden border-cyan-500/30">
        <div className="h-48 relative overflow-hidden">
          <img src={shop.imageUrl} alt={shop.name} className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent"></div>
          <div className="absolute bottom-6 left-8">
            <h2 className="text-4xl font-sci-fi text-white neon-text-cyan uppercase">{shop.name}</h2>
            <p className="text-cyan-400 font-bold uppercase tracking-widest text-sm">{shop.category}</p>
          </div>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900/50">
          <div className="flex items-center gap-4">
             <i className="fas fa-map-marker-alt text-cyan-400"></i>
             <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Location</p>
              <p className="text-slate-200">{shop.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <i className="fas fa-clock text-cyan-400"></i>
             <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Timings</p>
              <p className="text-slate-200">{shop.timing}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <i className="fas fa-phone text-cyan-400"></i>
             <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Contact Number</p>
              <p className="text-slate-200">+91 {shop.contact}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl border-cyan-500/20">
        <div className="flex items-center justify-between mb-8 border-b border-cyan-900 pb-4">
          <h3 className="font-sci-fi text-xl text-cyan-400 uppercase">{isRetail ? 'Inventory' : 'Services'}</h3>
          <button onClick={handleRefresh} className="text-[10px] px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/50 rounded text-cyan-400 font-bold uppercase hover:bg-cyan-500/20 transition-all">
            <i className={`fas fa-sync-alt mr-2 ${isRefreshing ? 'animate-spin' : ''}`}></i> Refresh
          </button>
        </div>

        {isRetail ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {shop.items?.map(item => (
              <div key={item.id} className={`p-4 rounded-xl border ${item.available ? 'border-cyan-900 bg-slate-900/50' : 'border-red-900/30 bg-red-950/10 opacity-70'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.available ? 'bg-cyan-500/20 text-cyan-400' : 'bg-red-500/20 text-red-400'}`}>
                    {item.available ? 'AVAILABLE' : 'OUT OF STOCK'}
                  </span>
                  <span className="font-sci-fi text-cyan-100">₹{item.price}</span>
                </div>
                <h4 className="font-bold text-slate-200">{item.name}</h4>
                <p className="text-xs text-slate-500 mt-2">In-Shop: {item.stock || 0}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shop.services?.map(service => (
              <div key={service.id} className="p-6 rounded-xl border border-cyan-900 bg-slate-900/50 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <i className="fas fa-cut text-cyan-500 text-xl"></i>
                  <div>
                    <h4 className="font-bold text-lg text-slate-200">{service.name}</h4>
                    <p className="text-xs text-slate-500">{service.duration}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-sci-fi text-xl text-cyan-400 mb-2">₹{service.price}</div>
                  <button onClick={() => { setSelectedService(service); setShowBookingModal(true); }} className="px-4 py-1.5 bg-cyan-600 text-white text-xs font-bold uppercase rounded hover:bg-cyan-500 transition-all">Book Now</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showBookingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowBookingModal(false)}></div>
          <div className="glass-card w-full max-w-md rounded-2xl p-8 relative border-cyan-400">
            <h3 className="font-sci-fi text-2xl text-cyan-400 mb-6 uppercase">New Appointment</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">Mobile Number (for reminders)</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-slate-900 border border-cyan-900 rounded-lg p-3 text-slate-200 focus:border-cyan-500 outline-none" placeholder="e.g. 9876543210" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">Select Date</label>
                <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} className="w-full bg-slate-900 border border-cyan-900 rounded-lg p-3 text-slate-200" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">Select Time</label>
                <input type="time" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} className="w-full bg-slate-900 border border-cyan-900 rounded-lg p-3 text-slate-200" />
              </div>
              <div className="flex gap-4 mt-8">
                <button onClick={() => setShowBookingModal(false)} className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold uppercase rounded-lg">Cancel</button>
                <button onClick={handleBook} className="flex-1 py-3 bg-cyan-600 text-white font-bold uppercase rounded-lg">Confirm Request</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopDashboard;
