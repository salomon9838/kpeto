import React, { useState } from 'react';
import { FaXRay, FaCheckCircle, FaClock, FaFileImage } from 'react-icons/fa';

interface RadioRequest { id: number; patient: string; type: string; bodyPart: string; status: 'pending' | 'in-progress' | 'validated'; requestedAt: string; imageUrl?: string; }

export default function RadioWorkflow() {
  const [requests, setRequests] = useState<RadioRequest[]>([
    { id: 1, patient: 'M. Koffi', type: 'Radio', bodyPart: 'Thorax', status: 'in-progress', requestedAt: '2025-01-20 09:30' },
    { id: 2, patient: 'Mme. Adjoua', type: 'Échographie', bodyPart: 'Abdomen', status: 'pending', requestedAt: '2025-01-20 10:15' },
  ]);

  const updateStatus = (id: number, status: RadioRequest['status']) => setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));

  return (
    <div style={{ padding: '30px', background: '#f4f7f6', minHeight: '100vh' }}>
      <h2 style={{ marginBottom: '25px', color: '#1e293b' }}>📷 Workflow Imagerie</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {['pending', 'in-progress', 'validated'].map(status => (
          <div key={status} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', color: status === 'pending' ? '#f97316' : status === 'in-progress' ? '#3b82f6' : '#22c55e' }}>
              {status === 'pending' && <FaClock />} {status === 'in-progress' && <FaXRay />} {status === 'validated' && <FaCheckCircle />} {status === 'pending' ? 'En attente' : status === 'in-progress' ? 'En cours' : 'Validé'} ({requests.filter(r => r.status === status).length})
            </h3>
            {requests.filter(r => r.status === status).map(req => (
              <div key={req.id} style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', marginBottom: '10px' }}>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>{req.patient}</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>{req.type} - {req.bodyPart}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>{req.requestedAt}</div>
                {status === 'in-progress' && <button onClick={() => updateStatus(req.id, 'validated')} style={{ marginTop: '10px', padding: '6px 12px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Valider</button>}
                {status === 'validated' && req.imageUrl && <a href={req.imageUrl} target="_blank" style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#3b82f6', color: 'white', borderRadius: '4px', textDecoration: 'none', fontSize: '12px' }}><FaFileImage /> Voir image</a>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}