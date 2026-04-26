import React, { useState, useEffect } from 'react';
import { FaFlask, FaXRay, FaFilePdf, FaDownload, FaCalendar } from 'react-icons/fa';

interface Result {
  id: number; type: 'labo' | 'radio'; date: string; testName: string; status: 'pending' | 'ready'; fileUrl?: string;
}

export default function ResultsView() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch patient results from API
    const mockResults: Result[] = [
      { id: 1, type: 'labo', date: '2025-01-15', testName: 'Numération Formule Sanguine', status: 'ready', fileUrl: '/results/lab-1.pdf' },
      { id: 2, type: 'radio', date: '2025-01-14', testName: 'Radio Thorax', status: 'ready', fileUrl: '/results/radio-1.pdf' },
      { id: 3, type: 'labo', date: '2025-01-10', testName: 'Glycémie à jeun', status: 'pending' },
    ];
    setResults(mockResults);
    setLoading(false);
  }, []);

  return (
    <div style={{ padding: '30px', background: '#f8fafc', minHeight: '100vh' }}>
      <h2 style={{ marginBottom: '30px', color: '#1e293b' }}>📋 Mes Résultats d'Analyses</h2>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Chargement...</div>
      ) : results.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Aucun résultat disponible</div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {results.map(result => (
            <div key={result.id} style={{
              background: 'white', padding: '20px', borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '15px'
            }}>
              <div style={{
                width: '50px', height: '50px', borderRadius: '10px',
                background: result.type === 'labo' ? '#dbeafe' : '#ede9fe',
                color: result.type === 'labo' ? '#3b82f6' : '#8b5cf6',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {result.type === 'labo' ? <FaFlask size={24} /> : <FaXRay size={24} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: '#1e293b' }}>{result.testName}</div>
                <div style={{ fontSize: '14px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <FaCalendar size={12} /> {new Date(result.date).toLocaleDateString('fr-FR')}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                  background: result.status === 'ready' ? '#dcfce7' : '#fef3c7',
                  color: result.status === 'ready' ? '#166534' : '#92400e'
                }}>
                  {result.status === 'ready' ? '✓ Prêt' : '⏳ En cours'}
                </span>
                {result.status === 'ready' && result.fileUrl && (
                  <a href={result.fileUrl} download style={{
                    padding: '8px 16px', background: '#0d9488', color: 'white',
                    borderRadius: '6px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '13px', fontWeight: '500'
                  }}>
                    <FaDownload size={14} /> PDF
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}