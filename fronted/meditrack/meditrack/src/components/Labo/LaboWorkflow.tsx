import React, { useState } from 'react';
import { FaFlask, FaCheckCircle, FaClock, FaUser } from 'react-icons/fa';

interface LabRequest { id: number; patient: string; tests: string[]; priority: 'normal' | 'urgent'; status: 'pending' | 'in-progress' | 'completed'; requestedAt: string; }

export default function LaboWorkflow() {
  const [requests, setRequests] = useState<LabRequest[]>([
    { id: 1, patient: 'M. Koffi', tests: ['NFS', 'Glycémie'], priority: 'urgent', status: 'in-progress', requestedAt: '2025-01-20 09:30' },
    { id: 2, patient: 'Mme. Adjoua', tests: ['Créatinine', 'Urée'], priority: 'normal', status: 'pending', requestedAt: '2025-01-20 10:15' },
  ]);

  const updateStatus = (id: number, status: LabRequest['status']) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  return (
    <div style={{ padding: '30px', background: '#f4f7f6', minHeight: '100vh' }}>
      <h2 style={{ marginBottom: '25px', color: '#1e293b' }}>🔬 Workflow Laboratoire</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {['pending', 'in-progress', 'completed'].map(status => (
          <div key={status} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', color: status === 'pending' ? '#f97316' : status === 'in-progress' ? '#3b82f6' : '#22c55e' }}>
              {status === 'pending' && <FaClock />} {status === 'in-progress' && <FaFlask />} {status === 'completed' && <FaCheckCircle />} {status === 'pending' ? 'En attente' : status === 'in-progress' ? 'En cours' : 'Terminé'} ({requests.filter(r => r.status === status).length})
            </h3>
            {requests.filter(r => r.status === status).map(req => (
              <div key={req.id} style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', marginBottom: '10px' }}>
                <div style={{ fontWeight: '600', marginBottom: '8px' }}>{req.patient}</div>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>{req.tests.join(', ')}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>Demandé: {req.requestedAt}</div>
                {req.priority === 'urgent' && <span style={{ padding: '2px 8px', background: '#fef2f2', color: '#ef4444', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>URGENT</span>}
                {status === 'pending' && <button onClick={() => updateStatus(req.id, 'in-progress')} style={{ marginTop: '10px', padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Commencer</button>}
                {status === 'in-progress' && <button onClick={() => updateStatus(req.id, 'completed')} style={{ marginTop: '10px', padding: '6px 12px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Terminer</button>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}