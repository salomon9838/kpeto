import React, { useState, useEffect } from 'react';
import { FaPills, FaFilePdf, FaDownload, FaCalendar, FaCheckCircle } from 'react-icons/fa';

interface Prescription {
  id: number; date: string; doctor: string; medications: { name: string; dosage: string; duration: string }[];
  status: 'active' | 'completed' | 'expired'; pdfUrl?: string;
}

export default function PrescriptionsView() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  useEffect(() => {
    // Fetch from API
    const mock: Prescription[] = [
      {
        id: 1, date: '2025-01-15', doctor: 'Dr. Kouassi',
        medications: [{ name: 'Paracétamol', dosage: '500mg', duration: '5 jours' }, { name: 'Amoxicilline', dosage: '1g', duration: '7 jours' }],
        status: 'active', pdfUrl: '/prescriptions/1.pdf'
      }
    ];
    setPrescriptions(mock);
  }, []);

  return (
    <div style={{ padding: '30px', background: '#f8fafc', minHeight: '100vh' }}>
      <h2 style={{ marginBottom: '30px', color: '#1e293b' }}>💊 Mes Ordonnances</h2>
      
      {prescriptions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Aucune ordonnance</div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {prescriptions.map(p => (
            <div key={p.id} style={{
              background: 'white', padding: '25px', borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '45px', height: '45px', borderRadius: '10px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaPills size={22} /></div>
                  <div><div style={{ fontWeight: '600', color: '#1e293b' }}>Ordonnance du {new Date(p.date).toLocaleDateString('fr-FR')}</div><div style={{ fontSize: '14px', color: '#64748b' }}>{p.doctor}</div></div>
                </div>
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: p.status === 'active' ? '#dcfce7' : p.status === 'completed' ? '#dbeafe' : '#fef3c7', color: p.status === 'active' ? '#166534' : p.status === 'completed' ? '#1e40af' : '#92400e' }}>{p.status === 'active' ? '✓ Active' : p.status === 'completed' ? '✓ Terminée' : '⚠ Expired'}</span>
              </div>
              <div style={{ marginBottom: '15px' }}><strong>Médicaments:</strong><ul style={{ margin: '10px 0 0 20px', color: '#475569' }}>{p.medications.map((m, i) => <li key={i}>{m.name} {m.dosage} - {m.duration}</li>)}</ul></div>
              {p.pdfUrl && <a href={p.pdfUrl} download style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#0d9488', color: 'white', borderRadius: '6px', textDecoration: 'none', fontSize: '13px' }}><FaFilePdf /> Télécharger PDF</a>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}