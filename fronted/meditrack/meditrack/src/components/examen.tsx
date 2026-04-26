import React, { useState, useEffect, CSSProperties } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/api';
import { 
  User, 
  Activity, 
  Weight, 
  Ruler, 
  Thermometer, 
  Heart, 
  Phone, 
  Building,
  FileText,
  CheckCircle,
  AlertTriangle,
  Info,
  ArrowLeft,
  Redo,
  Users
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================
type NotificationType = 'success' | 'error' | 'info';

interface NotificationState {
  show: boolean;
  type: NotificationType;
  title: string;
  message: string;
  details?: string[];
}

interface ExamFormData {
  centre: string;
  doc: string;
  tel: string;
  poids: string;
  taille: string;
  temperature: string;
  ta_gauche: string;
  ta_droit: string;
  pouls: string;
  observations: string;
}

// =============================================================================
// MAPPING DES SPÉCIALITÉS (Frontend → Backend)
// =============================================================================
const SPECIALTY_MAPPING: Record<string, string> = {
  'ophtalmologie': 'ophtalmo',
  'ophtalmo': 'ophtalmo',
  'chirurgie': 'chirurgie',
  'urologie': 'urologie',
  'cardiologie': 'cardio',
  'cardio': 'cardiologie',
  'médecine générale': 'general',
  'general': 'general',
  '': 'cardiologie',
};

// =============================================================================
// COMPOSANT PRINCIPAL — EXAM CARDIOLOGIE
// =============================================================================
function Exam({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const getIds = () => {
    const cIdState = location.state?.consultationId;
    const pIdState = location.state?.patientId;
    const cIdStore = localStorage.getItem('current_consultation_id');
    const pIdStore = localStorage.getItem('current_patient_id');
    
    const cId = cIdState || (cIdStore && cIdStore !== 'undefined' ? Number(cIdStore) : null);
    const pId = pIdState || (pIdStore && pIdStore !== 'undefined' ? Number(pIdStore) : null);
    
    console.log('🔍 ExamCardio - Debug IDs:', { 
      fromState: { cIdState, pIdState }, 
      fromStorage: { cIdStore, pIdStore }, 
      resolved: { cId, pId } 
    });
    
    return { cId, pId };
  };

  const [consultationId, setConsultationId] = useState<number | null>(null);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [idsReady, setIdsReady] = useState(false);
  const [userSpecialty, setUserSpecialty] = useState<string>('cardiologie');

  const [form, setForm] = useState<ExamFormData>({
    centre: "", doc: "", tel: "",
    poids: "", taille: "", temperature: "",
    ta_gauche: "", ta_droit: "", pouls: "",
    observations: "",
  });

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    show: false, type: 'info', title: '', message: '', details: []
  });

  useEffect(() => {
    const { cId, pId } = getIds();
    const storedSpecialty = localStorage.getItem('user_specialty') || 'cardiologie';
    setUserSpecialty(storedSpecialty);
    
    if (pId) {
      setPatientId(pId);
      if (cId) setConsultationId(cId);
      setIdsReady(true);
      localStorage.setItem('current_patient_id', String(pId));
      if (cId) localStorage.setItem('current_consultation_id', String(cId));
      console.log('✅ ExamCardio - IDs chargés:', { cId, pId, specialty: storedSpecialty });
    } else {
      console.error('❌ ExamCardio - PatientId MANQUANT');
      showNotification('error', 'Patient non sélectionné', 'Vous devez sélectionner un patient.', ['Redirection...']);
      setTimeout(() => navigate('/old-consultation', { state: { from: 'cardiologie' } }), 3000);
    }
  }, []);

  const showNotification = (type: NotificationType, title: string, message: string, details?: string[]) => {
    setNotification({ show: true, type, title, message, details });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 6000);
  };

  const getNotificationStyles = (): CSSProperties => {
    const colors: Record<NotificationType, { bg: string; border: string; text: string }> = {
      success: { bg: '#f0fdf4', border: '#22c55e', text: '#166534' },
      error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
      info: { bg: '#eff6ff', border: '#0d9488', text: '#1e40af' },
    };
    const c = colors[notification.type];
    return {
      position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
      padding: '16px 20px', borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
      borderLeft: `5px solid ${c.border}`,
      backgroundColor: c.bg, color: c.text,
      maxWidth: '450px', minWidth: '350px',
      display: 'flex', alignItems: 'flex-start', gap: '12px',
      animation: 'slideIn 0.3s ease-out',
    };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const saveExam = async () => {
    if (!patientId) {
      showNotification('error', 'Erreur critique', 'Patient non sélectionné.');
      return;
    }
    if (!form.centre.trim() || !form.doc.trim() || !form.tel.trim()) {
      showNotification('error', 'Champs obligatoires', 'Veuillez remplir le centre, le médecin et le téléphone.');
      return;
    }

    // Validations médicales
    if (form.temperature) {
      const temp = parseFloat(form.temperature);
      if (isNaN(temp) || temp < 35 || temp > 42) {
        showNotification('error', 'Température invalide', 'La température doit être entre 35°C et 42°C.');
        return;
      }
    }
    if (form.poids) {
      const poids = parseFloat(form.poids);
      if (isNaN(poids) || poids < 0.5 || poids > 300) {
        showNotification('error', 'Poids invalide', 'Le poids doit être entre 0.5 kg et 300 kg.');
        return;
      }
    }
    if (form.taille) {
      const taille = parseFloat(form.taille);
      if (isNaN(taille) || taille < 20 || taille > 250) {
        showNotification('error', 'Taille invalide', 'La taille doit être entre 20 cm et 250 cm.');
        return;
      }
    }
    if (form.pouls) {
      const pouls = parseInt(form.pouls, 10);
      if (isNaN(pouls) || pouls < 30 || pouls > 220) {
        showNotification('error', 'Pouls invalide', 'Le pouls doit être entre 30 et 220 bpm.');
        return;
      }
    }

    const validateTA = (ta: string, label: string): boolean => {
      if (!ta) return true;
      const parts = ta.split('/');
      if (parts.length !== 2) {
        showNotification('error', `${label} invalide`, 'Format attendu: "120/80"');
        return false;
      }
      const sys = parseInt(parts[0], 10);
      const dia = parseInt(parts[1], 10);
      if (isNaN(sys) || isNaN(dia) || sys < 60 || sys > 250 || dia < 40 || dia > 150) {
        showNotification('error', `${label} invalide`, 'TA: 60-250/40-150 mmHg');
        return false;
      }
      return true;
    };

    if (!validateTA(form.ta_gauche, 'TA bras gauche') || !validateTA(form.ta_droit, 'TA bras droit')) {
      return;
    }

    setLoading(true);
    
    try {
      const serviceValue = SPECIALTY_MAPPING[userSpecialty] || userSpecialty || 'cardiologie';
      
      const payload = {
        patient: patientId,
        service: serviceValue,
        centre_medical: form.centre.trim(),
        nom_soignant: form.doc.trim(),
        tel_soignant: form.tel.trim(),
        motif_consultation: `Consultation ${userSpecialty || 'cardiologique'}`,
        poids: form.poids ? parseFloat(form.poids) : null,
        taille: form.taille ? parseFloat(form.taille) : null,
        temperature: form.temperature ? parseFloat(form.temperature) : null,
        ta_bras_gauche: form.ta_gauche.trim() || null,
        ta_bras_droit: form.ta_droit.trim() || null,
        pouls: form.pouls ? parseInt(form.pouls, 10) : null,
        observations_cliniques: form.observations.trim() || null,
      };

      console.log('📤 Payload cardiologie:', payload);

      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/consultations/', {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('📥 Status HTTP:', response.status);
      const responseText = await response.text();
      console.log('📥 Response body:', responseText);

      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseText);
          console.error('❌ Erreurs Django:', errorData);
          const fieldLabels: Record<string, string> = {
            patient: 'Patient', service: 'Service', centre_medical: 'Centre',
            nom_soignant: 'Médecin', tel_soignant: 'Téléphone', poids: 'Poids',
            taille: 'Taille', temperature: 'Température', ta_bras_gauche: 'TA gauche',
            ta_bras_droit: 'TA droite', pouls: 'Pouls',
          };
          const errorMessages = Object.entries(errorData).map(([field, msgs]) => {
            const label = fieldLabels[field] || field;
            const messages = Array.isArray(msgs) ? msgs.join(', ') : msgs;
            return `🔴 ${label}: ${messages}`;
          });
          throw new Error(`Validation échouée:\n${errorMessages.join('\n')}`);
        } catch {
          throw new Error(`Erreur ${response.status}: ${responseText.substring(0, 200)}`);
        }
      }

      const newConsultation = JSON.parse(responseText);
      const newConsultationId = newConsultation?.id;
      
      if (!newConsultationId) throw new Error('Pas d\'ID retourné');
      
      console.log('✅ Consultation créée:', newConsultationId);

      localStorage.setItem('current_consultation_id', String(newConsultationId));
      localStorage.setItem('current_patient_id', String(patientId));
      localStorage.setItem('current_workflow_step', 'ordonnance');

      showNotification('success', 'Examen enregistré', 'Données sauvegardées.', [`👨‍⚕️ ${form.doc}`]);

      setForm({ centre: "", doc: "", tel: "", poids: "", taille: "", temperature: "", ta_gauche: "", ta_droit: "", pouls: "", observations: "" });

      // ✅ REDIRECTION FORCÉE VERS ORDONNANCE
      setTimeout(() => {
        console.log('🚀 Navigation vers /cardiologie/ordonnance...');
        navigate('/cardiologie/ordonnance', {
          state: { 
            consultationId: newConsultationId,
            patientId,
            step: 'ordonnance',
            from: 'examen',
            timestamp: Date.now()
          }
        });
      }, 1000);

    } catch (err: any) {
      console.error('❌ Erreur API:', err);
      
      if (err.message?.includes('401') || err.message === 'Authentification requise') {
        showNotification('info', 'Session expirée', 'Veuillez vous reconnecter.');
        localStorage.removeItem('access_token');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      
      let errorDetails: string[] = [];
      if (err.validationErrors) {
        errorDetails = Object.entries(err.validationErrors).map(([field, msgs]: [string, any]) => 
          `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`
        );
      } else if (err.message) {
        const lines = err.message.split('\n');
        errorDetails = lines.filter((l: string) => l.startsWith('🔴'));
        if (errorDetails.length === 0) errorDetails = [err.message.split('\n')[0]];
      } else {
        errorDetails = ['Erreur inconnue'];
      }
      
      console.error('🚨 Erreurs:', errorDetails);
      showNotification('error', 'Échec', errorDetails[0], errorDetails.slice(1));
      
    } finally {
      setLoading(false);
    }
  };

  const cancelExam = () => {
    if (window.confirm("Annuler ?")) {
      setForm({ centre: "", doc: "", tel: "", poids: "", taille: "", temperature: "", ta_gauche: "", ta_droit: "", pouls: "", observations: "" });
      showNotification('info', 'Annulé', 'Formulaire réinitialisé.');
    }
  };

  // =============================================================================
  // STYLES
  // =============================================================================
  const styles: Record<string, CSSProperties> = {
    page: { minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: "'Inter', sans-serif", padding: '40px' },
    header: { backgroundColor: '#c0392b', padding: '20px 30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '30px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px' },
    backBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
    title: { fontSize: '24px', fontWeight: '700', color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' },
    container: { maxWidth: '900px', margin: '0 auto', backgroundColor: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    sectionHeader: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fef2f2', padding: '10px 15px', borderRadius: '8px', color: '#c0392b', fontWeight: '600', marginBottom: '20px', borderLeft: '4px solid #c0392b' },
    blockingBox: { background: 'linear-gradient(135deg, #fef2f2, #fecaca)', border: '3px solid #ef4444', borderRadius: '12px', padding: '24px', marginBottom: '24px', textAlign: 'center' as const },
    debugBox: { background: 'linear-gradient(135deg, #fef2f2, #fecaca)', border: '2px solid #ef4444', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', fontSize: '14px' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' },
    formGrid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '30px' },
    formGroup: { display: 'flex', flexDirection: 'column' as const, gap: '6px' },
    label: { fontSize: '14px', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' },
    required: { color: '#ef4444' },
    input: { padding: '12px', borderRadius: '8px', border: '2px solid #e2e8f0', fontSize: '15px', outline: 'none', backgroundColor: '#f8fafc', width: '100%', boxSizing: 'border-box' as const },
    inputWithIcon: { padding: '12px 12px 12px 40px', borderRadius: '8px', border: '2px solid #e2e8f0', fontSize: '15px', outline: 'none', backgroundColor: '#f8fafc', width: '100%', boxSizing: 'border-box' as const },
    textarea: { padding: '15px', borderRadius: '8px', border: '2px solid #e2e8f0', fontSize: '15px', outline: 'none', backgroundColor: '#f8fafc', minHeight: '140px', resize: 'vertical' as const, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' as const },
    buttonGroup: { textAlign: 'right' as const, marginTop: '30px' },
    btn: { padding: '14px 40px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' },
    btnCancel: { backgroundColor: '#f1f5f9', color: '#64748b', marginRight: '12px' },
    btnSave: { backgroundColor: '#c0392b', color: 'white' },
    btnSelectPatient: { backgroundColor: '#ef4444', color: 'white', marginTop: '16px' },
  };

  // =============================================================================
  // RENDER
  // =============================================================================
  return (
    <div style={styles.page}>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input:focus, textarea:focus { border-color: #c0392b !important; box-shadow: 0 0 0 4px rgba(192, 57, 43, 0.1) !important; }
        .blocked-form { opacity: 0.3; pointer-events: none; filter: grayscale(1); }
      `}</style>

      {notification.show && (
        <div style={getNotificationStyles()} role="alert">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ fontSize: '18px', color: notification.type === 'error' ? '#ef4444' : '#22c55e' }}>
              {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{notification.title}</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>{notification.message}</p>
              {notification.details?.map((d, i) => <div key={i} style={{ fontSize: '12px' }}>• {d}</div>)}
            </div>
            <button onClick={() => setNotification(p => ({ ...p, show: false }))} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer' }}>×</button>
          </div>
        </div>
      )}

      <header style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/patient')}><ArrowLeft size={18} /> Retour</button>
        <h1 style={styles.title}><Heart size={24} color="#fff" /> ❤️ Examen Cardiologique</h1>
        <div style={{ width: '100px' }} />
      </header>

      <div style={styles.container}>
        {!idsReady ? (
          <div style={styles.blockingBox}>
            <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#991b1b' }}>⛔ Patient non sélectionné</h3>
            <p style={{ fontSize: '15px', color: '#7f1d1d', marginBottom: '8px' }}>Sélectionnez un patient pour continuer.</p>
            <button onClick={() => navigate('/old-consultation')} style={{ ...styles.btn, ...styles.btnSelectPatient }}><Users size={18} /> Sélectionner</button>
          </div>
        ) : (
          <>
            <div style={styles.debugBox}>
              <div style={{ fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} color="#22c55e" /> <span>Patient sélectionné</span>
              </div>
              <div>Spécialité: <strong style={{ color: '#c0392b' }}>{userSpecialty}</strong></div>
              <div>Patient ID: <strong style={{ color: '#22c55e' }}>{patientId}</strong></div>
            </div>

            <div style={styles.sectionHeader}><User size={20} color="#c0392b" /> <span>Informations du soignant</span></div>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Service</label>
                <div style={{...styles.input, backgroundColor: '#f8fafc', cursor: 'not-allowed', opacity: 0.8, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <Heart size={16} color="#c0392b" /> {userSpecialty === 'cardiologie' ? 'Cardiologie' : userSpecialty}
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Centre <span style={styles.required}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <Building size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input id="centre" placeholder="Hôpital" value={form.centre} onChange={handleChange} style={{...styles.input, paddingLeft: '38px'}} disabled={loading} />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Médecin <span style={styles.required}>*</span></label>
                <input id="doc" placeholder="Dr. Nom" value={form.doc} onChange={handleChange} style={styles.input} disabled={loading} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Téléphone <span style={styles.required}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input id="tel" placeholder="+228..." value={form.tel} onChange={handleChange} style={{...styles.input, paddingLeft: '38px'}} disabled={loading} />
                </div>
              </div>
            </div>

            <div style={styles.sectionHeader}><Activity size={20} color="#c0392b" /> <span>Paramètres Vitaux</span></div>
            <div style={styles.formGrid3}>
              <div style={styles.formGroup}>
                <label style={{...styles.label, fontSize: '0.9rem'}}><Weight size={14} /> Poids (kg)</label>
                <input id="poids" type="number" placeholder="70" value={form.poids} onChange={handleChange} style={{...styles.input, marginTop: '5px'}} disabled={loading} />
              </div>
              <div style={styles.formGroup}>
                <label style={{...styles.label, fontSize: '0.9rem'}}><Ruler size={14} /> Taille (cm)</label>
                <input id="taille" type="number" placeholder="170" value={form.taille} onChange={handleChange} style={{...styles.input, marginTop: '5px'}} disabled={loading} />
              </div>
              <div style={styles.formGroup}>
                <label style={{...styles.label, fontSize: '0.9rem'}}><Thermometer size={14} /> Temp. (°C)</label>
                <input id="temperature" type="number" placeholder="37" value={form.temperature} onChange={handleChange} style={{...styles.input, marginTop: '5px'}} disabled={loading} />
              </div>
              <div style={styles.formGroup}>
                <label style={{...styles.label, fontSize: '0.9rem'}}><Heart size={14} color="#ef4444" /> TA Gauche</label>
                <input id="ta_gauche" placeholder="120/80" value={form.ta_gauche} onChange={handleChange} style={{...styles.input, marginTop: '5px'}} disabled={loading} />
              </div>
              <div style={styles.formGroup}>
                <label style={{...styles.label, fontSize: '0.9rem'}}><Heart size={14} color="#ef4444" /> TA Droite</label>
                <input id="ta_droit" placeholder="120/80" value={form.ta_droit} onChange={handleChange} style={{...styles.input, marginTop: '5px'}} disabled={loading} />
              </div>
              <div style={styles.formGroup}>
                <label style={{...styles.label, fontSize: '0.9rem'}}><Activity size={14} /> Pouls</label>
                <input id="pouls" type="number" placeholder="75" value={form.pouls} onChange={handleChange} style={{...styles.input, marginTop: '5px'}} disabled={loading} />
              </div>
            </div>

            <div style={styles.sectionHeader}><FileText size={20} color="#c0392b" /> <span>Observations</span></div>
            <textarea id="observations" rows={5} placeholder="État clinique..." value={form.observations} onChange={handleChange} style={{...styles.textarea, marginBottom: '30px'}} disabled={loading} />

            <div style={styles.buttonGroup}>
              <button style={{ ...styles.btn, ...styles.btnCancel }} onClick={cancelExam} disabled={loading}>✖ Annuler</button>
              <button style={{ ...styles.btn, ...styles.btnSave, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }} onClick={saveExam} disabled={loading}>
                {loading ? <><Redo size={18} style={{ animation: 'spin 1s linear infinite' }} /> Enregistrement...</> : '💾 Enregistrer'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Exam;