import React, { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaPrint, FaArrowLeft, FaFlask, FaCalendar, FaUserMd, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

export default function LabResultsPDF() {
  const { labId } = useParams();
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);

  // Données simulées
  const labResults = {
    id: 'LAB-2025-128',
    date: '20/01/2025',
    patient: { name: 'M. Koffi Kouassi', id: 'PAT-2025-001', dob: '15/03/1985', age: '39 ans' },
    doctor: { name: 'Dr. Mensah Amévi', specialty: 'Médecine Générale' },
    lab: { name: 'Laboratoire Biomédical', address: 'CHU Campus, Lomé', phone: '+228 22 00 00 00', biologist: 'Dr. Akakpo' },
    tests: [
      {
        category: 'Hématologie',
        results: [
          { name: 'Numération Formule Sanguine (NFS)', parameter: 'Globules Rouges', value: '4.8', unit: 'T/L', refMin: '4.0', refMax: '5.5', status: 'normal' },
          { name: '', parameter: 'Hémoglobine', value: '13.5', unit: 'g/dL', refMin: '12.0', refMax: '16.0', status: 'normal' },
          { name: '', parameter: 'Hématocrite', value: '42', unit: '%', refMin: '36', refMax: '46', status: 'normal' },
          { name: '', parameter: 'Globules Blancs', value: '6.8', unit: 'G/L', refMin: '4.0', refMax: '10.0', status: 'normal' },
          { name: '', parameter: 'Plaquettes', value: '245', unit: 'G/L', refMin: '150', refMax: '400', status: 'normal' },
        ]
      },
      {
        category: 'Biochimie',
        results: [
          { name: 'Glycémie', parameter: 'Glycémie à jeun', value: '1.15', unit: 'g/L', refMin: '0.70', refMax: '1.10', status: 'high', flag: '⚠️' },
          { name: 'Fonction Rénale', parameter: 'Créatinine', value: '9.5', unit: 'mg/L', refMin: '6.0', refMax: '11.0', status: 'normal' },
          { name: '', parameter: 'Urée', value: '0.32', unit: 'g/L', refMin: '0.15', refMax: '0.40', status: 'normal' },
          { name: 'Bilan Lipidique', parameter: 'Cholestérol Total', value: '2.10', unit: 'g/L', refMin: '1.50', refMax: '2.00', status: 'high', flag: '⚠️' },
          { name: '', parameter: 'HDL Cholestérol', value: '0.45', unit: 'g/L', refMin: '0.40', refMax: '0.60', status: 'normal' },
          { name: '', parameter: 'LDL Cholestérol', value: '1.35', unit: 'g/L', refMin: '0.70', refMax: '1.30', status: 'high', flag: '⚠️' },
          { name: '', parameter: 'Triglycérides', value: '1.50', unit: 'g/L', refMin: '0.50', refMax: '1.50', status: 'normal' },
        ]
      }
    ],
    conclusion: 'Hyperglycémie modérée à jeun suggestive d\'un prédiabète. Dyslipidémie mixte (hypercholestérolémie et hypertriglycéridémie). Bilan rénal normal. Recommandations: régime hyposodé et hypolipidémiant, activité physique régulière, contrôle glycémique dans 3 mois.'
  };

  const handlePrint = () => window.print();

  const getStatusIcon = (status: string) => {
    if (status === 'high') return <FaExclamationTriangle color="#ef4444" size={14} />;
    if (status === 'low') return <FaExclamationTriangle color="#f59e0b" size={14} />;
    return <FaCheckCircle color="#22c55e" size={14} />;
  };

  return (
    <div style={{ padding: '30px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <div className="no-print" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={() => navigate(-1)} style={{ padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FaArrowLeft /> Retour
        </button>
        <button onClick={handlePrint} style={{ padding: '10px 20px', background: '#0d9488', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FaPrint /> Imprimer / PDF
        </button>
      </div>

      <div ref={reportRef} className="print-area" style={{
        background: 'white', maxWidth: '800px', margin: '0 auto',
        padding: '40px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '3px solid #0d9488', paddingBottom: '20px' }}>
          <h1 style={{ margin: '0 0 5px 0', color: '#0d9488', fontSize: '26px' }}>🔬 {labResults.lab.name}</h1>
          <h2 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '18px' }}>Rapport de Résultats d'Analyses</h2>
          <p style={{ margin: '5px 0', fontSize: '12px', color: '#64748b' }}>N° {labResults.id} • {labResults.date}</p>
        </div>

        {/* Lab & Patient Info */}
        <div style={{ marginBottom: '25px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ padding: '15px', background: '#f0fdf4', borderRadius: '8px', borderLeft: '4px solid #0d9488' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#1e293b' }}>Laboratoire</h3>
            <p style={{ margin: '4px 0', fontSize: '13px' }}><strong>{labResults.lab.name}</strong></p>
            <p style={{ margin: '4px 0', fontSize: '13px' }}>{labResults.lab.address}</p>
            <p style={{ margin: '4px 0', fontSize: '13px' }}>Tél: {labResults.lab.phone}</p>
            <p style={{ margin: '4px 0', fontSize: '13px' }}>Biologiste: {labResults.lab.biologist}</p>
          </div>
          <div style={{ padding: '15px', background: '#eff6ff', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#1e293b' }}>Patient</h3>
            <p style={{ margin: '4px 0', fontSize: '13px' }}><strong>{labResults.patient.name}</strong></p>
            <p style={{ margin: '4px 0', fontSize: '13px' }}>ID: {labResults.patient.id}</p>
            <p style={{ margin: '4px 0', fontSize: '13px' }}>Âge: {labResults.patient.age}</p>
            <p style={{ margin: '4px 0', fontSize: '13px' }}>Médecin: {labResults.doctor.name}</p>
          </div>
        </div>

        {/* Results */}
        {labResults.tests.map((category, catIndex) => (
          <div key={catIndex} style={{ marginBottom: '25px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#1e293b', borderBottom: '2px solid #0d9488', paddingBottom: '8px' }}>
              <FaFlask style={{ marginRight: '8px', color: '#0d9488' }} /> {category.category}
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Paramètre</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Résultat</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Unité</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Valeurs de référence</th>
                  <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {category.results.map((result, idx) => (
                  <tr key={idx} style={{ background: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
                    <td style={{ padding: '10px', border: '1px solid #e2e8f0' }}>
                      {result.name && <div style={{ fontWeight: '600', marginBottom: '4px' }}>{result.name}</div>}
                      <div style={{ marginLeft: result.name ? '15px' : '0' }}>{result.parameter}</div>
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #e2e8f0', fontWeight: result.status !== 'normal' ? '600' : '400', color: result.status !== 'normal' ? '#dc2626' : 'inherit' }}>
                      {result.flag && <span style={{ marginRight: '6px' }}>{result.flag}</span>}
                      {result.value}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #e2e8f0', color: '#64748b' }}>{result.unit}</td>
                    <td style={{ padding: '10px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b' }}>
                      {result.refMin} - {result.refMax}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      {getStatusIcon(result.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {/* Conclusion */}
        <div style={{ marginBottom: '25px', padding: '20px', background: '#fef3c7', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#92400e' }}>Conclusion et Interprétation</h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#78350f', lineHeight: '1.6' }}>{labResults.conclusion}</p>
        </div>

        {/* Signature */}
        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '2px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            <p style={{ margin: '5px 0' }}>Date: {labResults.date}</p>
            <p style={{ margin: '5px 0' }}>Rapport N° {labResults.id}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ padding: '20px 40px', border: '1px dashed #cbd5e1', borderRadius: '8px', marginBottom: '10px' }}>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{labResults.lab.biologist}</p>
              <p style={{ margin: '5px 0', fontSize: '12px', color: '#64748b' }}>Biologiste Médical</p>
            </div>
            <p style={{ margin: '5px 0', fontSize: '12px', color: '#64748b' }}>Signature et cachet</p>
          </div>
        </div>

        <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '11px', color: '#94a3b8' }}>
          <p style={{ margin: '5px 0' }}>MediTrack-Pro • Laboratoire Biomédical</p>
          <p style={{ margin: '5px 0' }}>© 2025 • Document confidentiel</p>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-area { box-shadow: none !important; margin: 0 !important; padding: 20px !important; max-width: 100% !important; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 1.5cm; size: A4; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
        }
      `}</style>
    </div>
  );
}