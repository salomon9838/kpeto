import React, { useState } from 'react';
import { FaPills, FaCheckCircle, FaSearch, FaUser } from 'react-icons/fa';

interface PrescriptionItem { id: number; name: string; dosage: string; quantity: number; stock: number; dispensed: boolean; }

export default function PharmaDispensation() {
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<PrescriptionItem[]>([
    { id: 1, name: 'Paracétamol 500mg', dosage: '1cp x3/jour', quantity: 15, stock: 150, dispensed: false },
    { id: 2, name: 'Amoxicilline 1g', dosage: '1cp x2/jour', quantity: 14, stock: 45, dispensed: false },
  ]);

  const handleDispense = (id: number) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, dispensed: true, stock: item.stock - item.quantity } : item));
  };

  const filtered = items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ padding: '30px', background: '#f4f7f6', minHeight: '100vh' }}>
      <h2 style={{ marginBottom: '25px', color: '#1e293b' }}>💊 Dispensation des Médicaments</h2>
      
      <div style={{ marginBottom: '25px', display: 'flex', gap: '15px' }}>
        <div style={{ position: 'relative', flex: 1 }}><FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} /><input type="text" placeholder="Rechercher un médicament..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '2px solid #e2e8f0', fontSize: '14px' }} /></div>
        <button style={{ padding: '12px 24px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><FaUser /> Patient: M. Koffi</button>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8fafc' }}><tr><th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Médicament</th><th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Posologie</th><th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Quantité</th><th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Stock</th><th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>Action</th></tr></thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '15px', fontWeight: '500' }}>{item.name}</td>
                <td style={{ padding: '15px', color: '#64748b' }}>{item.dosage}</td>
                <td style={{ padding: '15px' }}>{item.quantity}</td>
                <td style={{ padding: '15px' }}><span style={{ color: item.stock < 20 ? '#ef4444' : '#22c55e', fontWeight: '600' }}>{item.stock}</span></td>
                <td style={{ padding: '15px', textAlign: 'center' }}>
                  {item.dispensed ? (<span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><FaCheckCircle /> Dispensé</span>) : (<button onClick={() => handleDispense(item.id)} disabled={item.stock < item.quantity} style={{ padding: '8px 16px', background: item.stock >= item.quantity ? '#27ae60' : '#94a3b8', color: 'white', border: 'none', borderRadius: '6px', cursor: item.stock >= item.quantity ? 'pointer' : 'not-allowed' }}>{item.stock < item.quantity ? 'Stock faible' : 'Dispenser'}</button>)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}