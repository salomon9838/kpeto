import React, { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaPrint, FaArrowLeft, FaUserMd, FaCalendar, FaStethoscope, FaHeartbeat } from 'react-icons/fa';

export default function MedicalReport() {
  const { consultationId } = useParams();
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);

  // Données simulées (à remplacer par un fetch API réel)
  const report = {
    id: 'RPT-2025-001',
    patient: { 
      name: 'M. Koffi Kouassi', 
      id: 'PAT-2025-001', 
      dob: '15/03/1985',
      phone: '+228 90 00 00 00',
      address: 'Lomé, Togo'
    },
    doctor: { 
      name: 'Dr. Mensah Amévi', 
      specialty: 'Médecine Générale', 
      matricule: 'DOC-1234',
      phone: '+228 22 00 00 00'
    },
    consultation: { 
      date: '20/01/2025', 
      time: '10:30',
      motif: 'Consultation de routine pour hypertension', 
      diagnosis: 'Hypertension artérielle essentielle stade 1',
      history: 'Patient connu hypertendu depuis 2 ans, suivi irrégulier',
      symptoms: 'Céphalées intermittentes, acouphènes'
    },
    vitals: { 
      weight: '72 kg', 
      height: '170 cm', 
      bmi: '24.9',
      temperature: '37.2°C', 
      bp: '145/95 mmHg', 
      pulse: '78 bpm',
      respiratoryRate: '16/min'
    },
    physicalExam: {
      general: 'Patient conscient, orienté, bon état général',
      cardiovascular: 'Bruits du coeur réguliers, pas de souffle',
      respiratory: 'Murmure vésiculaire présent bilatéralement',
      abdominal: 'Abdomen souple, non douloureux'
    },
    prescriptions: [
      { name: 'Losartan', dosage: '50mg', frequency: '1 comprimé le matin', duration: '30 jours', quantity: '30' },
      { name: 'Paracétamol', dosage: '500mg', frequency: '1 comprimé si douleur', duration: '5 jours', quantity: '10' }
    ],
    recommendations: [
      'Surveillance tensionnelle à domicile 2x/semaine',
      'Régime hyposodé (moins de 6g de sel/jour)',
      'Activité physique régulière (30 min marche/jour)',
      'Éviter alcool et tabac',
      'Consultation de contrôle dans 1 mois'
    ]
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ padding: '30px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      {/* Boutons d'action - masqués à l'impression */}
      <div className="no-print" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ 
            padding: '10px 20px', 
            background: '#f1f5f9', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          <FaArrowLeft /> Retour
        </button>
        <button 
          onClick={handlePrint} 
          style={{ 
            padding: '10px 20px', 
            background: '#0d9488', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          <FaPrint /> Imprimer / Télécharger PDF
        </button>
      </div>

      {/* Zone imprimable */}
      <div 
        ref={reportRef} 
        className="print-area" 
        style={{
          background: 'white', 
          maxWidth: '800px', 
          margin: '0 auto',
          padding: '40px', 
          borderRadius: '12px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          lineHeight: '1.6'
        }}
      >
        {/* En-tête */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '30px', 
          borderBottom: '3px solid #0d9488', 
          paddingBottom: '20px' 
        }}>
          <h1 style={{ margin: '0 0 10px 0', color: '#0d9488', fontSize: '28px' }}>
            🏥 MediTrack-Pro
          </h1>
          <h2 style={{ margin: '0 0 5px 0', color: '#1e293b', fontSize: '18px', fontWeight: '600' }}>
            Rapport Médical Officiel
          </h2>
          <p style={{ margin: '5px 0', fontSize: '13px', color: '#64748b' }}>
            Document confidentiel - Usage médical uniquement
          </p>
          <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
            Généré le {new Date().toLocaleDateString('fr-FR', { 
              day: '2-digit', 
              month: 'long', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>

        {/* Informations Patient */}
        <div style={{ 
          marginBottom: '25px', 
          padding: '20px', 
          background: '#f8fafc', 
          borderRadius: '8px',
          borderLeft: '4px solid #0d9488'
        }}>
          <h3 style={{ 
            margin: '0 0 15px 0', 
            fontSize: '16px', 
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FaUserMd color="#0d9488" /> Informations du Patient
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
            <div><strong>Nom complet:</strong> {report.patient.name}</div>
            <div><strong>ID Patient:</strong> {report.patient.id}</div>
            <div><strong>Date de naissance:</strong> {report.patient.dob}</div>
            <div><strong>Téléphone:</strong> {report.patient.phone}</div>
            <div style={{ gridColumn: '1 / -1' }}><strong>Adresse:</strong> {report.patient.address}</div>
          </div>
        </div>

        {/* Informations Consultation */}
        <div style={{ 
          marginBottom: '25px', 
          padding: '20px', 
          background: '#f8fafc', 
          borderRadius: '8px',
          borderLeft: '4px solid #3b82f6'
        }}>
          <h3 style={{ 
            margin: '0 0 15px 0', 
            fontSize: '16px', 
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FaCalendar color="#3b82f6" /> Détails de la Consultation
          </h3>
          <div style={{ fontSize: '14px' }}>
            <p style={{ margin: '5px 0' }}><strong>Date:</strong> {report.consultation.date} à {report.consultation.time}</p>
            <p style={{ margin: '5px 0' }}><strong>Motif:</strong> {report.consultation.motif}</p>
            <p style={{ margin: '5px 0' }}><strong>Histoire de la maladie:</strong> {report.consultation.history}</p>
            <p style={{ margin: '5px 0' }}><strong>Symptômes:</strong> {report.consultation.symptoms}</p>
            <p style={{ margin: '5px 0' }}><strong>Diagnostic:</strong> <span style={{ color: '#dc2626', fontWeight: '600' }}>{report.consultation.diagnosis}</span></p>
            <p style={{ margin: '10px 0 5px 0' }}><strong>Médecin traitant:</strong> {report.doctor.name} ({report.doctor.specialty})</p>
            <p style={{ margin: '5px 0' }}><strong>Matricule:</strong> {report.doctor.matricule}</p>
          </div>
        </div>

        {/* Constantes Vitales */}
        <div style={{ 
          marginBottom: '25px', 
          padding: '20px', 
          background: '#f8fafc', 
          borderRadius: '8px',
          borderLeft: '4px solid #22c55e'
        }}>
          <h3 style={{ 
            margin: '0 0 15px 0', 
            fontSize: '16px', 
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FaHeartbeat color="#22c55e" /> Constantes Vitales
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '15px', 
            fontSize: '14px' 
          }}>
            <div style={{ padding: '10px', background: 'white', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Poids</div>
              <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '16px' }}>{report.vitals.weight}</div>
            </div>
            <div style={{ padding: '10px', background: 'white', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Taille</div>
              <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '16px' }}>{report.vitals.height}</div>
            </div>
            <div style={{ padding: '10px', background: 'white', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>IMC</div>
              <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '16px' }}>{report.vitals.bmi}</div>
            </div>
            <div style={{ padding: '10px', background: 'white', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Température</div>
              <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '16px' }}>{report.vitals.temperature}</div>
            </div>
            <div style={{ padding: '10px', background: 'white', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Tension Artérielle</div>
              <div style={{ fontWeight: '600', color: '#dc2626', fontSize: '16px' }}>{report.vitals.bp}</div>
            </div>
            <div style={{ padding: '10px', background: 'white', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Pouls</div>
              <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '16px' }}>{report.vitals.pulse}</div>
            </div>
          </div>
          {report.vitals.respiratoryRate && (
            <div style={{ marginTop: '10px', fontSize: '14px' }}>
              <strong>Fréquence respiratoire:</strong> {report.vitals.respiratoryRate}
            </div>
          )}
        </div>

        {/* Examen Physique */}
        <div style={{ marginBottom: '25px', padding: '20px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaStethoscope color="#f59e0b" /> Examen Physique
          </h3>
          <div style={{ fontSize: '14px' }}>
            <p style={{ margin: '5px 0' }}><strong>État général:</strong> {report.physicalExam.general}</p>
            <p style={{ margin: '5px 0' }}><strong>Cardiovasculaire:</strong> {report.physicalExam.cardiovascular}</p>
            <p style={{ margin: '5px 0' }}><strong>Respiratoire:</strong> {report.physicalExam.respiratory}</p>
            <p style={{ margin: '5px 0' }}><strong>Abdominal:</strong> {report.physicalExam.abdominal}</p>
          </div>
        </div>

        {/* Prescriptions */}
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#1e293b' }}>💊 Prescriptions Médicamenteuses</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', background: 'white' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Médicament</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Dosage</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Posologie</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Quantité</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Durée</th>
              </tr>
            </thead>
            <tbody>
              {report.prescriptions.map((med, i) => (
                <tr key={i}>
                  <td style={{ padding: '10px', border: '1px solid #e2e8f0', fontWeight: '600' }}>{med.name}</td>
                  <td style={{ padding: '10px', border: '1px solid #e2e8f0' }}>{med.dosage}</td>
                  <td style={{ padding: '10px', border: '1px solid #e2e8f0' }}>{med.frequency}</td>
                  <td style={{ padding: '10px', border: '1px solid #e2e8f0' }}>{med.quantity}</td>
                  <td style={{ padding: '10px', border: '1px solid #e2e8f0' }}>{med.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recommandations */}
        <div style={{ marginBottom: '25px', padding: '20px', background: '#fef3c7', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#92400e' }}>📋 Recommandations et Conseils</h3>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#78350f' }}>
            {report.recommendations.map((rec, i) => (
              <li key={i} style={{ marginBottom: '8px' }}>{rec}</li>
            ))}
          </ul>
        </div>

        {/* Pied de page */}
        <div style={{ 
          marginTop: '40px', 
          paddingTop: '20px', 
          borderTop: '2px solid #e2e8f0', 
          textAlign: 'center', 
          fontSize: '12px', 
          color: '#64748b' 
        }}>
          <p style={{ margin: '5px 0', fontWeight: '600', color: '#1e293b' }}>
            Signature électronique du médecin
          </p>
          <div style={{ 
            marginTop: '30px', 
            padding: '20px', 
            border: '1px dashed #cbd5e1', 
            borderRadius: '8px',
            display: 'inline-block',
            minWidth: '200px'
          }}>
            <p style={{ margin: '0 0 10px 0', fontWeight: '600', fontSize: '14px' }}>{report.doctor.name}</p>
            <p style={{ margin: '5px 0', fontSize: '12px' }}>Matricule: {report.doctor.matricule}</p>
            <p style={{ margin: '5px 0', fontSize: '12px' }}>{report.doctor.specialty}</p>
          </div>
          <p style={{ margin: '30px 0 5px 0', fontSize: '10px', color: '#94a3b8' }}>
            Document généré électroniquement par MediTrack-Pro • Système de Gestion Médicale Intégré
          </p>
          <p style={{ margin: '5px 0', fontSize: '10px', color: '#94a3b8' }}>
            © 2025 MediTrack-Pro • Tous droits réservés • Rapport ID: {report.id}
          </p>
          <p style={{ margin: '10px 0 0 0', fontSize: '10px', color: '#ef4444', fontWeight: '600' }}>
            ⚠️ Ce document est confidentiel et destiné uniquement au patient concerné
          </p>
        </div>
      </div>

      {/* Styles d'impression */}
      <style>{`
        @media print {
          .no-print { 
            display: none !important; 
          }
          .print-area { 
            box-shadow: none !important; 
            margin: 0 !important; 
            padding: 20px !important; 
            max-width: 100% !important;
            border: none !important;
            background: white !important;
          }
          body { 
            background: white !important; 
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page { 
            margin: 1.5cm;
            size: A4;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>
    </div>
  );
}