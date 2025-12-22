
import React from 'react';
import { Appointment, Shop } from '../types';

interface AppointmentsListProps {
  appointments: Appointment[];
  shops: Shop[];
}

const AppointmentsList: React.FC<AppointmentsListProps> = ({ appointments, shops }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-cyan-900 pb-4 mb-8">
        <h2 className="text-3xl font-sci-fi text-cyan-400 uppercase tracking-tighter neon-text-cyan">My Portal</h2>
        <p className="text-slate-500 text-xs uppercase font-bold">Active Mission Tracking</p>
      </div>

      {appointments.length === 0 ? (
        <div className="glass-card p-20 text-center rounded-3xl border-dashed">
          <i className="fas fa-calendar-times text-5xl text-slate-700 mb-4"></i>
          <h3 className="text-xl font-bold text-slate-400 uppercase">No active appointments</h3>
          <p className="text-slate-500 text-sm mt-2">Browse shops to initiate a service request.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {appointments.sort((a,b) => b.date.localeCompare(a.date)).map(apt => {
            const shop = shops.find(s => s.id === apt.shopId);
            return (
              <div key={apt.id} className="glass-card p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-1 h-full ${
                  apt.status === 'requested' ? 'bg-yellow-500' :
                  apt.status === 'confirmed' ? 'bg-cyan-500' :
                  apt.status === 'ongoing' ? 'bg-green-500' :
                  apt.status === 'completed' ? 'bg-slate-500' : 'bg-red-500'
                }`}></div>
                
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-xl bg-slate-900 flex items-center justify-center text-cyan-400 border border-cyan-900">
                    <i className="fas fa-clock"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-100 uppercase tracking-tight">{apt.serviceName}</h4>
                    <p className="text-xs text-cyan-600 font-bold uppercase">{shop?.name || 'IITM Shop'}</p>
                    <p className="text-xs text-slate-500 mt-1">{apt.date} @ <span className="text-slate-200">{apt.timeSlot}</span></p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-widest ${
                    apt.status === 'requested' ? 'border-yellow-500/30 text-yellow-500 bg-yellow-500/5' :
                    apt.status === 'confirmed' ? 'border-cyan-500/30 text-cyan-500 bg-cyan-500/5' :
                    apt.status === 'ongoing' ? 'border-green-500/50 text-green-400 bg-green-500/10 animate-pulse' :
                    apt.status === 'completed' ? 'border-slate-500/30 text-slate-500 bg-slate-500/5' :
                    'border-red-500/30 text-red-500 bg-red-500/5'
                  }`}>
                    {apt.status === 'ongoing' ? 'Ongoing Session' : apt.status}
                  </span>
                  
                  {apt.status === 'ongoing' && (
                    <p className="text-[10px] text-green-500 font-bold flex items-center gap-2">
                      <i className="fas fa-circle text-[6px] animate-ping"></i> LIVE NOW
                    </p>
                  )}
                  {apt.status === 'confirmed' && (
                    <p className="text-[10px] text-slate-500">SMS reminder will be sent 5m before.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AppointmentsList;
