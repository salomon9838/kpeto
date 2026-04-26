import React, { useState } from 'react';
import { FaCalendarPlus, FaCalendarCheck, FaClock, FaMapMarkerAlt } from 'react-icons/fa';

interface Appointment {
  id: number; date: string; time: string; doctor: string; specialty: string; location: string; status: 'upcoming' | 'completed' | 'cancelled';
}

export default function AppointmentsView() {
  const [appointments, setAppointments] = useState<Appointment[]>([
    { id: 1, date: '2025-02-01', time: '10:00', doctor: 'Dr. Kouassi', specialty: 'Cardiologie', location: 'CHU - Salle 301', status: 'upcoming' },
    { id: 2, date: '2025-01-15', time: '14:30', doctor: 'Dr. Mensah', specialty: 'Ophtalmologie', location: 'Clinique Vision', status: 'completed' }
  ]);

  return (
    <div style={{ padding: '30px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ margin: 0, color: '#1e293b' }}>📅 Mes Rendez-vous</h2>
        <button style={{ padding: '10px 20px', background: '#0d9488', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><FaCalendarPlus /> Nouveau RDV</button>
      </div>
      
      {appointments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Aucun rendez-vous programmé</div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {appointments.map(apt => (
            <div key={apt.id} style={{
              background: 'white', padding: '20px', borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: `4px solid ${apt.status === 'upcoming' ? '#22c55e' : apt.status === 'completed' ? '#64748b' : '#ef4444'}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '1.1rem', color: '#1e293b' }}>{apt.doctor}</div>
                  <div style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>{apt.specialty}</div>
                </div>
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: apt.status === 'upcoming' ? '#dcfce7' : apt.status === 'completed' ? '#e2e8f0' : '#fef2f2', color: apt.status === 'upcoming' ? '#166534' : apt.status === 'completed' ? '#475569' : '#991b1b' }}>{apt.status === 'upcoming' ? '✓ À venir' : apt.status === 'completed' ? '✓ Terminé' : '✗ Annulé'}</span>
              </div>
              <div style={{ marginTop: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px', color: '#475569' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCalendarCheck size={14} /> {new Date(apt.date).toLocaleDateString('fr-FR')}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaClock size={14} /> {apt.time}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', gridColumn: '1 / -1' }}><FaMapMarkerAlt size={14} /> {apt.location}</div>
              </div>
              {apt.status === 'upcoming' && (
                <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                  <button style={{ padding: '8px 16px', background: '#0d9488', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Confirmer</button>
                  <button style={{ padding: '8px 16px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Reporter</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}