import React, { useState, CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaSave,
  FaUserCircle,
  FaHistory,
  FaStethoscope,
} from 'react-icons/fa';

// --- INTERFACES ---
interface Patient {
  id: number;
  nom: string;
  prenoms: string;
  age: number;
  sexe: string;
  telephone: string;
}

interface ConsultationRecord {
  date_consultation: string;
  motif: string;
  diagnostic: string;
}

interface ConsultationFormData {
  motif: string;
  constantes: string;
  observations: string;
  diagnostic: string;
  traitement: string;
}

interface Status {
  message: string;
  type: 'success' | 'error' | '';
}

export default function PatientConsultations(): React.ReactElement {
  const navigate = useNavigate();

  // --- DONNÉES FICTIVES (MOCK DATA) ---
  const [patient] = useState<Patient>({
    id: 1,
    nom: "KOUAMÉ",
    prenoms: "Jean-Luc",
    age: 34,
    sexe: "Masculin",
    telephone: "+228 90 00 00 00",
  });

  const [history] = useState<ConsultationRecord[]>([
    {
      date_consultation: "2026-02-15",
      motif: "Fièvre persistante",
      diagnostic: "Paludisme simple",
    },
    {
      date_consultation: "2025-11-10",
      motif: "Contrôle annuel",
      diagnostic: "RAS - Patient en bonne santé",
    },
  ]);

  const [consultationData, setConsultationData] = useState<ConsultationFormData>({
    motif: '',
    constantes: '',
    observations: '',
    diagnostic: '',
    traitement: '',
  });

  const [status, setStatus] = useState<Status>({ message: '', type: '' });

  // --- HANDLERS ---
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setConsultationData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    
    // Simulation d'enregistrement
    setStatus({ message: 'Consultation enregistrée avec succès (Simulation) !', type: 'success' });
    
    // Réinitialisation après 2 secondes
    setTimeout(() => {
        setStatus({ message: '', type: '' });
        navigate('/old-consultation');
    }, 2000);
  };

  const styles: Record<string, CSSProperties> = {
    main: {
      minHeight: '100vh',
      backgroundColor: '#D6EFFF',
      padding: '30px 20px',
      fontFamily: "'Inter', sans-serif",
    },
    wrapper: { maxWidth: '1200px', margin: '0 auto' },
    backBtn: {
      background: 'white',
      border: '1px solid #cbd5e1',
      padding: '10px 15px',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontWeight: 'bold',
      marginBottom: '20px',
    },
    patientHeader: {
      backgroundColor: '#ffffff',
      borderRadius: '15px',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      border: '2px solid #1e40af',
      marginBottom: '20px',
    },
    contentGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 350px',
      gap: '20px',
    },
    card: {
      backgroundColor: '#ffffff',
      borderRadius: '15px',
      padding: '25px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
    },
    title: {
      color: '#16a34a',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginTop: 0,
    },
    label: {
      display: 'block',
      fontWeight: '700',
      margin: '15px 0 8px 0',
      color: '#000',
    },
    input: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid #cbd5e1',
    },
    textarea: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid #cbd5e1',
      minHeight: '80px',
      fontFamily: 'inherit',
    },
    saveBtn: {
      backgroundColor: '#16a34a',
      color: 'white',
      border: 'none',
      padding: '15px',
      borderRadius: '10px',
      fontWeight: 'bold',
      cursor: 'pointer',
      width: '100%',
      marginTop: '20px',
      fontSize: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px'
    },
    historyBox: { maxHeight: '600px', overflowY: 'auto' },
    historyCard: { padding: '12px', borderBottom: '1px solid #eee', fontSize: '14px' },
  };

  return (
    <main style={styles.main}>
      <div style={styles.wrapper}>
        <button style={styles.backBtn} onClick={() => navigate('/old-consultation')}>
          <FaArrowLeft /> Retour aux archives
        </button>

        <div style={styles.patientHeader}>
          <FaUserCircle size={50} color="#1e40af" />
          <div>
            <h2 style={{ margin: 0, textTransform: 'uppercase' }}>
              {patient.nom} {patient.prenoms}
            </h2>
            <p style={{ margin: 0, color: '#475569' }}>
              Âge: <strong>{patient.age} ans</strong> | Sexe:{' '}
              <strong>{patient.sexe}</strong> | Tel:{' '}
              <strong>{patient.telephone}</strong>
            </p>
          </div>
        </div>

        <div style={styles.contentGrid}>
          {/* COLONNE GAUCHE : SAISIE MÉDICALE */}
          <div style={styles.card}>
            <h3 style={styles.title}>
              <FaStethoscope /> Examen du jour
            </h3>

            {status.message && (
              <div
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  marginBottom: '15px',
                  backgroundColor: status.type === 'success' ? '#dcfce7' : '#fee2e2',
                  color: status.type === 'success' ? '#166534' : '#991b1b',
                  fontWeight: 'bold',
                }}
              >
                {status.message}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={styles.label}>Motif *</label>
                  <input
                    style={styles.input}
                    name="motif"
                    value={consultationData.motif}
                    onChange={handleChange}
                    required
                    placeholder="Ex: Douleurs..."
                  />
                </div>
                <div>
                  <label style={styles.label}>Constantes</label>
                  <input
                    style={styles.input}
                    name="constantes"
                    value={consultationData.constantes}
                    onChange={handleChange}
                    placeholder="TA: 12/8, Temp: 37°C..."
                  />
                </div>
              </div>

              <label style={styles.label}>Observations Cliniques</label>
              <textarea
                style={styles.textarea}
                name="observations"
                value={consultationData.observations}
                onChange={handleChange}
                placeholder="Détails de l'examen physique..."
              />

              <label style={styles.label}>Diagnostic final</label>
              <textarea
                style={{ ...styles.textarea, borderColor: '#16a34a' }}
                name="diagnostic"
                value={consultationData.diagnostic}
                onChange={handleChange}
                placeholder="Conclusion médicale..."
              />

              <label style={styles.label}>Traitement / Ordonnance</label>
              <textarea
                style={styles.textarea}
                name="traitement"
                value={consultationData.traitement}
                onChange={handleChange}
                placeholder="Liste des médicaments..."
              />

              <button type="submit" style={styles.saveBtn}>
                <FaSave /> Enregistrer la consultation
              </button>
            </form>
          </div>

          {/* COLONNE DROITE : HISTORIQUE */}
          <div style={{ ...styles.card, backgroundColor: '#f8fafc' }}>
            <h3 style={{ ...styles.title, color: '#1e40af' }}>
              <FaHistory /> Historique
            </h3>
            <div style={styles.historyBox}>
              {history.map((h, i) => (
                <div key={i} style={styles.historyCard}>
                  <div style={{ fontWeight: 'bold', color: '#1e40af' }}>
                    {new Date(h.date_consultation).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: '13px', marginTop: '5px' }}>
                    <strong>Motif:</strong> {h.motif}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                    <strong>Diag:</strong> {h.diagnostic}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}