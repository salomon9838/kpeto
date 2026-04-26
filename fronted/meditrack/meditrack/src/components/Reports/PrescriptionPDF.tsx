import React, { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaPrint, FaArrowLeft, FaPills, FaCalendar, FaUserMd, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

export default function PrescriptionPDF() {
  const { ordonnanceId } = useParams();
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);

  // Données simulées (à remplacer par fetch API)
  const prescription = {
    id: 'ORD-2025-045',
    date: '20/01/2025',
    patient: { 
      name: 'M. Koffi Kouassi', 
      id: 'PAT-2025-001', 
      age: '39 ans',
      phone: '+228 90 00 00 00'
    },
    doctor: { 
      name: 'Dr. Mensah Amévi', 
      specialty: 'Médecine Générale', 
      matricule: 'DOC-1234',
      phone: '+228 22 00 00 00',
      address: 'CHU Campus, Lomé'
    },
    diagnostic: 'Hypertension artérielle essentielle',
    medications: [
      { 
        id: 1, 
        name: 'Losartan Potassique', 
        dosage: '50mg', 
        form: 'Comprimé pelliculé',
        posology: '1 comprimé le matin au petit-déjeuner',
        duration: '30 jours',
        quantity: '30 comprimés',
        instructions: 'À prendre avec un verre d\'eau. Ne pas arrêter brutalement.'
      },
      { 
        id: 2, 
        name: 'Paracétamol', 
        dosage: '500mg', 
        form: 'Comprimé',
        posology: '1 comprimé en cas de douleur, espacé de 6h minimum',
        duration: '5 jours maximum',
        quantity: '10 comprimés',
        instructions: 'Ne pas dépasser 3g/jour. Éviter l\'alcool.'
      },
      { 
        id: 3, 
        name: 'Oméprazole', 
        dosage: '20mg', 
        form: 'Gélule gastro-résistante',
        posology: '1 gélule le matin à jeun',
        duration: '15 jours',
        quantity: '15 gélules',
        instructions: 'À prendre 30 min avant le petit-déjeuner.'
      }
    ],
    notes: 'Patient à revoir dans 1 mois pour contrôle tensionnel. Surveillance de la fonction rénale recommandée.',
    validity: 'Cette ordonnance est valable 3 mois à compter de la date d\'émission.'
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ padding: '30px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      {/* Boutons d'action */}
      <div className="no-print" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <FaArrowLeft /> Retour
        </button>
        <button 
          onClick={handlePrint} 
          style={{ padding: '10px 20px', background: '#0d9488', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <FaPrint /> Imprimer / PDF
        </button>
      </div>

      {/* Zone imprimable */}
      <div ref={reportRef} className="print-area" style={{
        background: 'white', maxWidth: '800px', margin: '0 auto',
        padding: '40px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        {/* En-tête */}
        <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '3px solid #0d9488', paddingBottom: '20px' }}>
          <h1 style={{ margin: '0 0 5px 0', color: '#0d9488', fontSize: '26px' }}>🏥 MediTrack-Pro</h1>
          <h2 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '20px' }}>Ordonnance Médicale</h2>
          <p style={{ margin: '5px 0', fontSize: '12px', color: '#64748b' }}>
            N° {prescription.id} • Délivrée le {prescription.date}
          </p>
        </div>

        {/* Info Médecin */}
        <div style={{ marginBottom: '25px', padding: '15px', background: '#f0fdf4', borderRadius: '8px', borderLeft: '4px solid #0d9488' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
            <div style={{ flex: '1', minWidth: '250px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#1e293b' }}>Médecin Prescripteur</h3>
              <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>{prescription.doctor.name}</strong></p>
              <p style={{ margin: '4px 0', fontSize: '14px' }}>{prescription.doctor.specialty}</p>
              <p style={{ margin: '4px 0', fontSize: '14px' }}>Matricule: {prescription.doctor.matricule}</p>
            </div>
            <div style={{ flex: '1', minWidth: '200px', fontSize: '14px' }}>
              <p style={{ margin: '4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaMapMarkerAlt color="#0d9488" /> {prescription.doctor.address}
              </p>
              <p style={{ margin: '4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaPhone color="#0d9488" /> {prescription.doctor.phone}
              </p>
            </div>
          </div>
        </div>

        {/* Info Patient */}
        <div style={{ marginBottom: '25px', padding: '15px', background: '#eff6ff', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#1e293b' }}>Patient</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
            <div><strong>Nom:</strong> {prescription.patient.name}</div>
            <div><strong>ID:</strong> {prescription.patient.id}</div>
            <div><strong>Âge:</strong> {prescription.patient.age}</div>
            <div><strong>Tél:</strong> {prescription.patient.phone}</div>
          </div>
        </div>

        {/* Diagnostic */}
        <div style={{ marginBottom: '25px', padding: '15px', background: '#fef3c7', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#92400e' }}>Diagnostic</h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#78350f' }}>{prescription.diagnostic}</p>
        </div>

        {/* Médicaments */}
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaPills color="#0d9488" /> Prescriptions
          </h3>
          
          {prescription.medications.map((med, index) => (
            <div key={med.id} style={{
              marginBottom: '20px',
              padding: '20px',
              background: index % 2 === 0 ? '#f8fafc' : 'white',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', fontSize: '15px', color: '#1e293b' }}>{med.name} {med.dosage}</h4>
                  <p style={{ margin: '0', fontSize: '13px', color: '#64748b' }}>{med.form}</p>
                </div>
                <div style={{ 
                  background: '#0d9488', 
                  color: 'white', 
                  padding: '4px 12px', 
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {med.quantity}
                </div>
              </div>
              
              <div style={{ fontSize: '14px', marginTop: '10px' }}>
                <p style={{ margin: '5px 0' }}><strong>Posologie:</strong> {med.posology}</p>
                <p style={{ margin: '5px 0' }}><strong>Durée:</strong> {med.duration}</p>
                {med.instructions && (
                  <p style={{ margin: '10px 0 0 0', padding: '10px', background: '#fef3c7', borderRadius: '6px', fontSize: '13px', color: '#92400e' }}>
                    <strong>⚠️ {med.instructions}</strong>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        {prescription.notes && (
          <div style={{ marginBottom: '25px', padding: '15px', background: '#f1f5f9', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#1e293b' }}>Notes du médecin</h4>
            <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}>{prescription.notes}</p>
          </div>
        )}

        {/* Validité */}
        <div style={{ marginBottom: '25px', padding: '12px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#991b1b', textAlign: 'center' }}>
            <strong>ℹ️ {prescription.validity}</strong>
          </p>
        </div>

        {/* Signature */}
        <div style={{ 
          marginTop: '40px', 
          paddingTop: '20px', 
          borderTop: '2px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end'
        }}>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            <p style={{ margin: '5px 0' }}>Date: {prescription.date}</p>
            <p style={{ margin: '5px 0' }}>Ordonnance N° {prescription.id}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              padding: '20px 40px', 
              border: '1px dashed #cbd5e1', 
              borderRadius: '8px',
              marginBottom: '10px'
            }}>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{prescription.doctor.name}</p>
            </div>
            <p style={{ margin: '5px 0', fontSize: '12px', color: '#64748b' }}>Signature et cachet</p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          marginTop: '30px', 
          paddingTop: '15px', 
          borderTop: '1px solid #e2e8f0', 
          textAlign: 'center', 
          fontSize: '11px', 
          color: '#94a3b8' 
        }}>
          <p style={{ margin: '5px 0' }}>MediTrack-Pro • Système de Gestion Médicale</p>
          <p style={{ margin: '5px 0' }}>© 2025 • Document officiel • Conservez ce document</p>
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