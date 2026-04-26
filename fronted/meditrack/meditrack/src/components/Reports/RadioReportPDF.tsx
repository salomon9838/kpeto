import React, { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaPrint, FaArrowLeft, FaXRay, FaCalendar, FaUserMd, FaMapMarkerAlt, FaPhone } from 'react-icons/fa';

export default function RadioReportPDF() {
  const { radioId } = useParams();
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);

  // Données simulées
  const radioReport = {
    id: 'RAD-2025-089',
    date: '20/01/2025',
    patient: { name: 'M. Koffi Kouassi', id: 'PAT-2025-001', dob: '15/03/1985', age: '39 ans' },
    doctor: { name: 'Dr. Mensah Amévi', specialty: 'Médecine Générale' },
    radiologist: { name: 'Dr. Agbétou', specialty: 'Radiologie et Imagerie Médicale', phone: '+228 22 00 00 00' },
    center: { name: 'Centre d\'Imagerie Médicale', address: 'CHU Campus, Lomé' },
    examType: 'Radiographie Thoracique',
    bodyPart: 'Thorax (Face et Profil)',
    indication: 'Bilan pré-opératoire. Patient hypertendu.',
    technique: 'Clichés thoraciques de face et de profil en inspiration maximale. Incidence postéro-antérieure.',
    findings: [
      'Parenchyme pulmonaire: Absence d\'opacité focale suspecte. Champs pulmonaires clairs bilatéralement.',
      'Plèvre: Absence d\'épanchement pleural. Culots de sac costo-diaphragmatiques libres.',
      'Médiastin: Cardiomégalie modérée (ICT à 0.54). Hile pulmonaire droit et gauche de densité normale.',
      'Paroi thoracique: Sans particularité.',
      'Os: Absence de lésion osseuse décelable sur les clichés.'
    ],
    conclusion: 'Thorax sans particularité en dehors d\'une cardiomégalie modérée à préciser cliniquement. Absence de signe d\'insuffisance cardiaque gauche. Absence de lésion pulmonaire aiguë.',
    images: [
      { view: 'Face', description: 'Thorax de face' },
      { view: 'Profil', description: 'Thorax de profil' }
    ]
  };

  const handlePrint = () => window.print();

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
          <h1 style={{ margin: '0 0 5px 0', color: '#0d9488', fontSize: '26px' }}>📷 {radioReport.center.name}</h1>
          <h2 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '18px' }}>Compte-Rendu d'Imagerie Médicale</h2>
          <p style={{ margin: '5px 0', fontSize: '12px', color: '#64748b' }}>N° {radioReport.id} • {radioReport.date}</p>
        </div>

        {/* Info */}
        <div style={{ marginBottom: '25px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ padding: '15px', background: '#f0fdf4', borderRadius: '8px', borderLeft: '4px solid #0d9488' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#1e293b' }}>Centre d'Imagerie</h3>
            <p style={{ margin: '4px 0', fontSize: '13px' }}><strong>{radioReport.center.name}</strong></p>
            <p style={{ margin: '4px 0', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaMapMarkerAlt color="#0d9488" size={12} /> {radioReport.center.address}
            </p>
            <p style={{ margin: '4px 0', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaPhone color="#0d9488" size={12} /> {radioReport.radiologist.phone}
            </p>
          </div>
          <div style={{ padding: '15px', background: '#eff6ff', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#1e293b' }}>Patient</h3>
            <p style={{ margin: '4px 0', fontSize: '13px' }}><strong>{radioReport.patient.name}</strong></p>
            <p style={{ margin: '4px 0', fontSize: '13px' }}>ID: {radioReport.patient.id} • {radioReport.patient.age}</p>
            <p style={{ margin: '4px 0', fontSize: '13px' }}>Médecin prescripteur: {radioReport.doctor.name}</p>
          </div>
        </div>

        {/* Exam Info */}
        <div style={{ marginBottom: '25px', padding: '15px', background: '#fef3c7', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaXRay /> Examen Réalisé
          </h3>
          <div style={{ fontSize: '14px', color: '#78350f' }}>
            <p style={{ margin: '5px 0' }}><strong>Type:</strong> {radioReport.examType}</p>
            <p style={{ margin: '5px 0' }}><strong>Région explorée:</strong> {radioReport.bodyPart}</p>
            <p style={{ margin: '5px 0' }}><strong>Indication:</strong> {radioReport.indication}</p>
            <p style={{ margin: '5px 0' }}><strong>Technique:</strong> {radioReport.technique}</p>
          </div>
        </div>

        {/* Findings */}
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#1e293b' }}>🔍 Résultats et Observations</h3>
          <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
            {radioReport.findings.map((finding, idx) => (
              <p key={idx} style={{ margin: '8px 0', paddingLeft: '20px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0', color: '#0d9488' }}>•</span>
                {finding}
              </p>
            ))}
          </div>
        </div>

        {/* Images */}
        <div style={{ marginBottom: '25px', padding: '15px', background: '#f8fafc', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#1e293b' }}>📸 Images Acquises</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
            {radioReport.images.map((img, idx) => (
              <div key={idx} style={{ padding: '10px', background: 'white', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <strong>{img.view}</strong>: {img.description}
              </div>
            ))}
          </div>
        </div>

        {/* Conclusion */}
        <div style={{ marginBottom: '25px', padding: '20px', background: '#dcfce7', borderRadius: '8px', borderLeft: '4px solid #22c55e' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#166534' }}>Conclusion</h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#14532d', lineHeight: '1.6', fontWeight: '500' }}>
            {radioReport.conclusion}
          </p>
        </div>

        {/* Signature */}
        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '2px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            <p style={{ margin: '5px 0' }}>Date: {radioReport.date}</p>
            <p style={{ margin: '5px 0' }}>Rapport N° {radioReport.id}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ padding: '20px 40px', border: '1px dashed #cbd5e1', borderRadius: '8px', marginBottom: '10px' }}>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{radioReport.radiologist.name}</p>
              <p style={{ margin: '5px 0', fontSize: '12px', color: '#64748b' }}>{radioReport.radiologist.specialty}</p>
            </div>
            <p style={{ margin: '5px 0', fontSize: '12px', color: '#64748b' }}>Signature et cachet</p>
          </div>
        </div>

        <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '11px', color: '#94a3b8' }}>
          <p style={{ margin: '5px 0' }}>MediTrack-Pro • Centre d'Imagerie Médicale</p>
          <p style={{ margin: '5px 0' }}>© 2025 • Document confidentiel • Conservez ce rapport</p>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-area { box-shadow: none !important; margin: 0 !important; padding: 20px !important; max-width: 100% !important; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 1.5cm; size: A4; }
        }
      `}</style>
    </div>
  );
}