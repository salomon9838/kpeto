import React, { useState, useEffect, CSSProperties } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from '../api/api';
import { 
  Plus, 
  Trash2, 
  Send, 
  Pill, 
  User, 
  Building, 
  Phone, 
  ClipboardList,
  CheckCircle,
  AlertTriangle,
  Info,
  ArrowLeft,
  Redo,
  Heart
} from "lucide-react";

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

interface MedicamentRow {
  med: string;
  dose: string;
  quantite: string;
  duree: string;
}

// =============================================================================
// COMPOSANT PRINCIPAL — ORDONNANCE CARDIOLOGIE
// =============================================================================
function Ordonnance({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const getIds = () => {
    const cIdState = location.state?.consultationId;
    const pIdState = location.state?.patientId;
    const cIdStore = localStorage.getItem('current_consultation_id');
    const pIdStore = localStorage.getItem('current_patient_id');
    
    const cId = cIdState || (cIdStore && cIdStore !== 'undefined' ? Number(cIdStore) : null);
    const pId = pIdState || (pIdStore && pIdStore !== 'undefined' ? Number(pIdStore) : null);
    
    console.log('🔍 OrdonnanceCardio - Debug IDs:', { 
      fromState: { cIdState, pIdState }, 
      fromStorage: { cIdStore, pIdStore }, 
      resolved: { cId, pId } 
    });
    
    return { cId, pId };
  };

  const [consultationId, setConsultationId] = useState<number | null>(null);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [consultationNumber, setConsultationNumber] = useState<number | null>(null);
  const [idsReady, setIdsReady] = useState(false);

  const [meds, setMeds] = useState<MedicamentRow[]>([
    { med: "", dose: "", quantite: "", duree: "" }
  ]);

  const [header, setHeader] = useState({
    centre: "",
    medecin: "",
    tel: "",
  });

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    show: false, type: 'info', title: '', message: '', details: []
  });

  const fetchConsultationNumber = async (pid: number) => {
    try {
      console.log(`📊 Récupération consultations pour patient #${pid}...`);
      const consultations = await apiFetch<any[]>(`consultations/?patient=${pid}&service=cardiologie`);
      const existingCount = Array.isArray(consultations) ? consultations.length : 0;
      const nextNumber = existingCount + 1;
      console.log(`✅ Patient #${pid} : ${existingCount} consultation(s) → #${nextNumber}`);
      setConsultationNumber(nextNumber);
      return nextNumber;
    } catch (err) {
      console.error('❌ Erreur comptage:', err);
      setConsultationNumber(1);
      return 1;
    }
  };

  useEffect(() => {
    const loadConsultationData = async () => {
      const { cId, pId } = getIds();
      
      if (pId) {
        setPatientId(pId);
        if (cId) setConsultationId(cId);
        setIdsReady(true);
        
        localStorage.setItem('current_patient_id', String(pId));
        if (cId) localStorage.setItem('current_consultation_id', String(cId));
        
        console.log('✅ OrdonnanceCardio - IDs chargés:', { cId, pId });
        await fetchConsultationNumber(pId);
        
      } else {
        console.error('❌ OrdonnanceCardio - PatientId MANQUANT');
        showNotification('error', 'Patient non sélectionné', 'Sélectionnez un patient.', ['Redirection...']);
        setTimeout(() => navigate('/old-consultation', { state: { from: 'cardiologie-ordonnance' } }), 3000);
      }
    };
    loadConsultationData();
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

  const addRow = () => setMeds([...meds, { med: "", dose: "", quantite: "", duree: "" }]);
  const removeRow = (index: number) => { if (meds.length > 1) setMeds(meds.filter((_, i) => i !== index)); };
  const updateMed = (index: number, field: keyof MedicamentRow, value: string) => {
    const newMeds = [...meds];
    newMeds[index] = { ...newMeds[index], [field]: value };
    setMeds(newMeds);
  };

  const saveOrdonnance = async () => {
    if (!patientId || !consultationId) {
      showNotification('error', 'Erreur', 'Patient ou consultation manquant.');
      return;
    }
    if (!header.centre.trim() || !header.medecin.trim() || !header.tel.trim()) {
      showNotification('error', 'Champs obligatoires', 'Remplissez centre, médecin et téléphone.');
      return;
    }
    const validMeds = meds.filter(m => m.med.trim() && m.dose.trim());
    if (validMeds.length === 0) {
      showNotification('error', 'Médicaments requis', 'Ajoutez au moins un médicament.');
      return;
    }

    setLoading(true);
    try {
      const ordonnancePayload = { consultation: consultationId, patient: patientId, service: "cardiologie" };
      console.log('📤 Création ordonnance:', ordonnancePayload);

      const ordonnance = await apiFetch<any>('ordonnances/', {
        method: 'POST', body: JSON.stringify(ordonnancePayload),
      });

      const ordonnanceId = ordonnance?.id;
      if (!ordonnanceId) throw new Error('Pas d\'ID retourné');
      console.log('✅ Ordonnance créée:', ordonnanceId);

      const medPromises = validMeds.map(med => 
        apiFetch<any>('medicaments-prescrits/', {
          method: 'POST',
          body: JSON.stringify({
            ordonnance: ordonnanceId,
            designation: med.med.trim(),
            posologie: med.dose.trim(),
            quantite: med.quantite.trim() || null,
            duree: med.duree.trim() || null,
          }),
        })
      );
      await Promise.all(medPromises);
      console.log('✅ Médicaments enregistrés:', validMeds.length);

      localStorage.setItem('current_ordonnance_id', String(ordonnanceId));
      localStorage.setItem('current_workflow_step', 'radio');

      showNotification('success', 'Ordonnance envoyée', `${validMeds.length} médicament(s) prescrit(s).`, [`👨‍⚕️ ${header.medecin}`]);

      setMeds([{ med: "", dose: "", quantite: "", duree: "" }]);
      setHeader({ centre: "", medecin: "", tel: "" });

      setTimeout(() => {
        console.log('🚀 Navigation vers radio...');
        if (setActiveTab) {
          setActiveTab('radio');
        } else {
          navigate('/cardiologie/radio', {
            state: { consultationId, patientId, ordonnanceId, step: 'radio' }
          });
        }
      }, 1500);

    } catch (err: any) {
      console.error('❌ Erreur API:', err);
      if (err.message === 'Authentification requise') {
        showNotification('info', 'Session expirée', 'Reconnectez-vous.');
        return;
      }
      const errorDetails = err.validationErrors 
        ? Object.entries(err.validationErrors).map(([field, msgs]: [string, any]) => 
            `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
        : [err.message || 'Erreur inconnue'];
      showNotification('error', 'Échec', errorDetails.join(', '));
    } finally {
      setLoading(false);
    }
  };

  const cancelForm = () => {
    if (window.confirm("Annuler ?")) {
      setMeds([{ med: "", dose: "", quantite: "", duree: "" }]);
      setHeader({ centre: "", medecin: "", tel: "" });
      showNotification('info', 'Annulé', 'Formulaire réinitialisé.');
    }
  };

  // =============================================================================
  // STYLES — ✅ HEADER ROUGE #c0392b POUR CARDIOLOGIE
  // =============================================================================
  const styles: Record<string, CSSProperties> = {
    page: { minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: "'Inter', sans-serif", padding: '40px' },
    
    // ✅ ✅ ✅ CORRECTION : Header rouge pour cardiologie (comme ExamForm)
    header: { 
      backgroundColor: '#c0392b',  // ← ← ← CHANGÉ de #0d9488 à #c0392b
      padding: '20px 30px', 
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
      marginBottom: '30px', 
      borderRadius: '12px', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '15px' 
    },
    
    backBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'background 0.2s' },
    title: { fontSize: '24px', fontWeight: '700', color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' },
    container: { maxWidth: '1000px', margin: '0 auto', backgroundColor: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' },
    sectionHeader: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fef2f2', padding: '12px 15px', borderRadius: '10px', color: '#c0392b', fontWeight: '600', marginBottom: '20px', borderLeft: '4px solid #c0392b' },  // ← Aussi mis en rouge
    blockingBox: { background: 'linear-gradient(135deg, #fef2f2, #fecaca)', border: '3px solid #ef4444', borderRadius: '12px', padding: '24px', marginBottom: '24px', textAlign: 'center' as const },
    debugBox: { background: 'linear-gradient(135deg, #fef2f2, #fecaca)', border: '2px solid #ef4444', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', fontSize: '14px' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '35px' },
    formGroup: { display: 'flex', flexDirection: 'column' as const, gap: '6px' },
    label: { fontWeight: '500', color: '#475569', marginBottom: '8px', display: 'block', fontSize: '14px' },
    required: { color: '#ef4444' },
    input: { width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e2e8f0', fontSize: '15px', outline: 'none', backgroundColor: '#f8fafc', transition: 'all 0.2s', boxSizing: 'border-box' as const },
    inputWithIcon: { width: '100%', padding: '12px 12px 12px 38px', borderRadius: '8px', border: '2px solid #e2e8f0', fontSize: '15px', outline: 'none', backgroundColor: '#f8fafc', transition: 'all 0.2s', boxSizing: 'border-box' as const },
    table: { width: '100%', borderCollapse: 'separate' as const, borderSpacing: '0 10px' },
    th: { padding: '0 15px', textAlign: 'left' as const, color: '#64748b', fontSize: '0.9rem', fontWeight: '600' },
    td: { padding: '5px 10px', backgroundColor: '#fcfcfd' },
    buttonGroup: { textAlign: 'right' as const, marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' },
    btn: { padding: '14px 30px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s' },
    btnAdd: { backgroundColor: '#c0392b', color: 'white', padding: '8px 16px', borderRadius: '6px', fontSize: '0.9rem' },  // ← Aussi mis en rouge
    btnDelete: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px' },
    btnCancel: { backgroundColor: '#f1f5f9', color: '#64748b' },
    btnSave: { backgroundColor: '#c0392b', color: 'white', boxShadow: '0 4px 6px -1px rgba(192, 57, 43, 0.3)' },  // ← Aussi mis en rouge
    btnSelectPatient: { backgroundColor: '#ef4444', color: 'white', marginTop: '16px' },
    consultationBadge: { fontSize: '14px', fontWeight: '400', opacity: 0.9, marginLeft: '12px', padding: '4px 12px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '20px' },
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
        tr:hover { background-color: #f1f5f9 !important; }
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

      {/* Header avec fond ROUGE #c0392b */}
      <header style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/patient')} onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.3)'} onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.2)'}>
          <ArrowLeft size={18} /> Retour
        </button>
        <h1 style={styles.title}>
          <Heart size={24} color="#fff" /> 💊 Ordonnance Cardiologie
          {consultationNumber && <span style={styles.consultationBadge}>#{consultationNumber}</span>}
        </h1>
        <div style={{ width: '100px' }} />
      </header>

      <div style={styles.container} className="card-hover">
        {!idsReady ? (
          <div style={styles.blockingBox}>
            <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#991b1b' }}>⛔ Patient non sélectionné</h3>
            <p style={{ fontSize: '15px', color: '#7f1d1d', marginBottom: '8px' }}>Sélectionnez un patient pour continuer.</p>
            <button onClick={() => navigate('/old-consultation')} style={{ ...styles.btn, ...styles.btnSelectPatient }}><User size={18} /> Sélectionner</button>
          </div>
        ) : (
          <>
            <div style={styles.debugBox}>
              <div style={{ fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} color="#22c55e" /> <span>Patient sélectionné</span>
              </div>
              <div>Consultation: <strong style={{ color: consultationId ? '#22c55e' : '#64748b' }}>{consultationId}</strong></div>
              <div>Patient ID: <strong style={{ color: '#22c55e' }}>{patientId}</strong></div>
            </div>

            <div style={styles.sectionHeader}><User size={20} color="#c0392b" /> <span>Informations de l'émetteur</span></div>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Service</label>
                <input value="Cardiologie" readOnly style={{...styles.input, backgroundColor: '#f8fafc', cursor: 'not-allowed', opacity: 0.8, fontWeight: '600'}} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Centre <span style={styles.required}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <Building size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input placeholder="Ex: Centre Hospitalier..." value={header.centre} onChange={(e) => setHeader({...header, centre: e.target.value})} style={styles.inputWithIcon} disabled={loading || !idsReady} />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Médecin <span style={styles.required}>*</span></label>
                <input placeholder="Dr. Salomon" value={header.medecin} onChange={(e) => setHeader({...header, medecin: e.target.value})} style={styles.input} disabled={loading || !idsReady} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Téléphone <span style={styles.required}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input placeholder="+228..." value={header.tel} onChange={(e) => setHeader({...header, tel: e.target.value})} style={styles.inputWithIcon} disabled={loading || !idsReady} />
                </div>
              </div>
            </div>

            <div style={{ ...styles.sectionHeader, justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Pill size={20} color="#c0392b" /> <span>Prescriptions Médicamenteuses</span>
              </div>
              <button className="btn" onClick={addRow} disabled={loading || !idsReady} style={{ ...styles.btn, ...styles.btnAdd, opacity: (loading || !idsReady) ? 0.7 : 1, cursor: (loading || !idsReady) ? 'not-allowed' : 'pointer' }} onMouseEnter={(e) => { if (!loading && idsReady) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#a93226'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#c0392b'; }}>
                <Plus size={16} /> Ajouter
              </button>
            </div>

            <div style={{ overflowX: 'auto', marginBottom: '30px' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Médicament</th>
                    <th style={styles.th}>Posologie</th>
                    <th style={styles.th}>Quantité</th>
                    <th style={styles.th}>Durée</th>
                    <th style={{ width: '50px', padding: '0 15px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {meds.map((med, i) => (
                    <tr key={i} style={{ backgroundColor: '#fcfcfd', transition: 'all 0.2s' }}>
                      <td style={styles.td}><input placeholder="Ex: Paracétamol" value={med.med} onChange={(e) => updateMed(i, "med", e.target.value)} style={{...styles.input, padding: '10px'}} disabled={loading || !idsReady} /></td>
                      <td style={styles.td}><input placeholder="1cp Matin/Soir" value={med.dose} onChange={(e) => updateMed(i, "dose", e.target.value)} style={{...styles.input, padding: '10px'}} disabled={loading || !idsReady} /></td>
                      <td style={styles.td}><input placeholder="2 boites" value={med.quantite} onChange={(e) => updateMed(i, "quantite", e.target.value)} style={{...styles.input, padding: '10px'}} disabled={loading || !idsReady} /></td>
                      <td style={styles.td}><input placeholder="7 jours" value={med.duree} onChange={(e) => updateMed(i, "duree", e.target.value)} style={{...styles.input, padding: '10px'}} disabled={loading || !idsReady} /></td>
                      <td style={{ padding: '5px 10px', textAlign: 'center' }}>
                        <button onClick={() => removeRow(i)} style={styles.btnDelete} disabled={loading || !idsReady || meds.length <= 1} title="Supprimer" onMouseEnter={(e) => { if (!loading && idsReady && meds.length > 1) (e.currentTarget as HTMLButtonElement).style.color = '#dc2626'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={styles.buttonGroup}>
              <button style={{ ...styles.btn, ...styles.btnCancel }} onClick={cancelForm} disabled={loading || !idsReady} onMouseEnter={(e) => { if (!loading && idsReady) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#e2e8f0'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f1f5f9'; }}>✖ Annuler</button>
              <button style={{ ...styles.btn, ...styles.btnSave, opacity: (loading || !idsReady) ? 0.7 : 1, cursor: (loading || !idsReady) ? 'not-allowed' : 'pointer' }} onClick={saveOrdonnance} disabled={loading || !idsReady} onMouseEnter={(e) => { if (!loading && idsReady) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#a93226'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#c0392b'; }}>
                {loading ? <><Redo size={18} style={{ animation: 'spin 1s linear infinite' }} /> Envoi...</> : <><Send size={18} /> Envoyer</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Ordonnance;