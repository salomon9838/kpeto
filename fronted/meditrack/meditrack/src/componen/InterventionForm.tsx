import React, { useState, useEffect, CSSProperties } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../api/api';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaScalpel, FaUserMd, FaBuilding, FaPhone, FaRedo, FaArrowLeft } from 'react-icons/fa';

type NotificationType = 'success' | 'error' | 'info';

interface NotificationState {
  show: boolean;
  type: NotificationType;
  title: string;
  message: string;
  details?: string[];
}

interface InterventionFormData {
  centre: string;
  medecin: string;
  tel: string;
  typeIntervention: string;
  anesthesie: string;
  dureeEstimee: string;
  risque: string;
  consentement: boolean;
  observations: string;
}

export default function InterventionForm() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const getIds = () => {
    const cIdState = location.state?.consultationId;
    const pIdState = location.state?.patientId;
    const cIdStore = localStorage.getItem('current_consultation_id');
    const pIdStore = localStorage.getItem('current_patient_id');
    const cId = cIdState || (cIdStore && cIdStore !== 'undefined' ? Number(cIdStore) : null);
    const pId = pIdState || (pIdStore && pIdStore !== 'undefined' ? Number(pIdStore) : null);
    return { cId, pId };
  };

  const [consultationId, setConsultationId] = useState<number | null>(null);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [consultationNumber, setConsultationNumber] = useState<number | null>(null);
  const [idsReady, setIdsReady] = useState(false);

  const [form, setForm] = useState<InterventionFormData>({
    centre: "", medecin: "", tel: "",
    typeIntervention: "", anesthesie: "", dureeEstimee: "",
    risque: "", consentement: false, observations: ""
  });

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    show: false, type: 'info', title: '', message: '', details: []
  });

  const fetchConsultationNumber = async (pid: number) => {
    try {
      const consultations = await apiFetch<any[]>(`consultations/?patient=${pid}&service=chirurgie`);
      setConsultationNumber((Array.isArray(consultations) ? consultations.length : 0) + 1);
    } catch { setConsultationNumber(1); }
  };

  useEffect(() => {
    const loadData = async () => {
      const { cId, pId } = getIds();
      if (pId) {
        setPatientId(pId);
        if (cId) setConsultationId(cId);
        setIdsReady(true);
        localStorage.setItem('current_patient_id', String(pId));
        if (cId) localStorage.setItem('current_consultation_id', String(cId));
        await fetchConsultationNumber(pId);
      } else {
        showNotification('error', 'Patient manquant', 'Redirection...');
        setTimeout(() => navigate('/old-consultation'), 2000);
      }
    };
    loadData();
  }, []);

  const showNotification = (type: NotificationType, title: string, message: string, details?: string[]) => {
    setNotification({ show: true, type, title, message, details });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 6000);
  };

  const getNotificationStyles = (): CSSProperties => {
    const colors = {
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
      maxWidth: '450px', display: 'flex', alignItems: 'flex-start', gap: '12px',
      animation: 'slideIn 0.3s ease-out',
    };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm(prev => ({ ...prev, [id]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !consultationId) {
      showNotification('error', 'Erreur', 'Patient ou consultation manquant.');
      return;
    }
    if (!form.centre.trim() || !form.medecin.trim() || !form.typeIntervention.trim()) {
      showNotification('error', 'Champs obligatoires', 'Veuillez remplir les champs requis.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        consultation: consultationId,
        patient: patientId,
        service: "chirurgie",
        centre_chirurgie: form.centre.trim(),
        nom_chirurgien: form.medecin.trim(),
        tel_chirurgien: form.tel.trim(),
        type_intervention: form.typeIntervention.trim(),
        type_anesthesie: form.anesthesie.trim() || null,
        duree_estimee: form.dureeEstimee.trim() || null,
        niveau_risque: form.risque.trim() || null,
        consentement_signe: form.consentement,
        observations: form.observations.trim() || null,
      };

      console.log('📤 Payload intervention:', payload);
      const newIntervention = await apiFetch<any>('interventions-chirurgie/', {
        method: 'POST', body: JSON.stringify(payload),
      });

      if (!newIntervention?.id) throw new Error('Pas d\'ID retourné');
      
      showNotification('success', 'Intervention planifiée', 'L\'intervention a été enregistrée.');
      localStorage.setItem('current_intervention_id', String(newIntervention.id));
      localStorage.setItem('current_workflow_step', 'paiement');

      setTimeout(() => {
        navigate('/payement', {
          state: { consultationId, patientId, interventionId: newIntervention.id, step: 'paiement' }
        });
      }, 1500);

    } catch (err: any) {
      console.error('❌ Erreur:', err);
      const details = err.validationErrors 
        ? Object.entries(err.validationErrors).map(([f, m]: [string, any]) => `${f}: ${Array.isArray(m) ? m.join(', ') : m}`)
        : [err.message || 'Erreur inconnue'];
      showNotification('error', 'Échec', details[0], details.slice(1));
    } finally {
      setLoading(false);
    }
  };

  const styles: Record<string, CSSProperties> = {
    page: { minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif", padding: '40px' },
    header: { background: '#e74c3c', padding: '20px 30px', marginBottom: '30px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
    backBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    title: { fontSize: '24px', fontWeight: '700', color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' },
    container: { maxWidth: '900px', margin: '0 auto', background: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    sectionHeader: { display: 'flex', alignItems: 'center', gap: '10px', background: '#fef2f2', padding: '12px 15px', borderRadius: '10px', color: '#e74c3c', fontWeight: '600', marginBottom: '20px', borderLeft: '4px solid #e74c3c' },
    debugBox: { background: '#fef2f2', border: '2px solid #ef4444', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', fontSize: '14px' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '25px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontWeight: '600', fontSize: '14px', color: '#475569' },
    required: { color: '#ef4444' },
    input: { padding: '12px', borderRadius: '8px', border: '2px solid #e2e8f0', fontSize: '14px', outline: 'none', backgroundColor: '#f8fafc', transition: 'border-color 0.2s', width: '100%', boxSizing: 'border-box' },
    textarea: { ...{ padding: '12px', borderRadius: '8px', border: '2px solid #e2e8f0', fontSize: '14px', outline: 'none', backgroundColor: '#f8fafc', minHeight: '100px', resize: 'vertical', fontFamily: 'inherit', transition: 'border-color 0.2s', width: '100%', boxSizing: 'border-box' } as CSSProperties },
    select: { padding: '12px', borderRadius: '8px', border: '2px solid #e2e8f0', fontSize: '14px', outline: 'none', backgroundColor: 'white', width: '100%', boxSizing: 'border-box' },
    checkbox: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
    buttonGroup: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '30px', paddingTop: '20px', borderTop: '2px solid #e2e8f0' },
    btn: { padding: '12px 24px', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' },
    btnCancel: { background: '#f1f5f9', color: '#64748b' },
    btnSave: { background: '#e74c3c', color: 'white' },
    consultationBadge: { fontSize: '16px', fontWeight: '700', opacity: 0.95, marginLeft: '12px', padding: '6px 16px', background: 'rgba(255,255,255,0.25)', borderRadius: '24px', color: 'white' },
  };

  return (
    <form onSubmit={handleSubmit} style={styles.page}>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input:focus, select:focus, textarea:focus { border-color: #e74c3c !important; box-shadow: 0 0 0 4px rgba(231, 76, 60, 0.1) !important; }
      `}</style>

      {notification.show && (
        <div style={getNotificationStyles()}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ fontSize: '18px', color: notification.type === 'error' ? '#ef4444' : '#22c55e' }}>
              {notification.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{notification.title}</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>{notification.message}</p>
              {notification.details?.map((d, i) => <div key={i} style={{ fontSize: '12px', marginTop: '4px' }}>• {d}</div>)}
            </div>
            <button onClick={() => setNotification(p => ({ ...p, show: false }))} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer' }}>×</button>
          </div>
        </div>
      )}

      <header style={styles.header}>
        <button type="button" style={styles.backBtn} onClick={() => navigate('/patient')}><FaArrowLeft /> Retour</button>
        <h1 style={styles.title}><FaScalpel /> 🔪 Intervention Chirurgicale {consultationNumber && <span style={styles.consultationBadge}>{consultationNumber}</span>}</h1>
        <div style={{ width: '100px' }} />
      </header>

      <div style={styles.container}>
        {!idsReady ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
            <FaExclamationTriangle size={48} style={{ marginBottom: '16px' }} />
            <h3>Patient non sélectionné</h3>
            <p>Redirection...</p>
          </div>
        ) : (
          <>
            <div style={styles.debugBox}>
              <div style={{ fontWeight: '700', marginBottom: '8px' }}>✅ Patient sélectionné</div>
              <div>Consultation: <strong>{consultationNumber || '...'}</strong></div>
              <div>Patient ID: <strong>{patientId}</strong></div>
            </div>

            <div style={styles.sectionHeader}><FaUserMd size={20} color="#e74c3c" /> <span>Informations du chirurgien</span></div>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Service</label>
                <input value="Chirurgie" readOnly style={{...styles.input, background: '#f8fafc', cursor: 'not-allowed', opacity: 0.8, fontWeight: '600'}} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Centre <span style={styles.required}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <FaBuilding style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input id="centre" value={form.centre} onChange={handleChange} placeholder="Hôpital Central" style={{...styles.input, paddingLeft: '38px'}} disabled={loading} />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Chirurgien <span style={styles.required}>*</span></label>
                <input id="medecin" value={form.medecin} onChange={handleChange} placeholder="Dr. Nom" style={styles.input} disabled={loading} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Téléphone <span style={styles.required}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <FaPhone style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input id="tel" value={form.tel} onChange={handleChange} placeholder="+228..." style={{...styles.input, paddingLeft: '38px'}} disabled={loading} />
                </div>
              </div>
            </div>

            <div style={styles.sectionHeader}><FaScalpel size={20} color="#e74c3c" /> <span>Détails de l'intervention</span></div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{...styles.label, marginBottom: '8px'}}>Type d'intervention <span style={styles.required}>*</span></label>
              <select id="typeIntervention" value={form.typeIntervention} onChange={handleChange} style={styles.select} disabled={loading}>
                <option value="">Sélectionner...</option>
                <option value="appendicectomie">Appendicectomie</option>
                <option value="hernie">Cure de hernie</option>
                <option value="cholecystectomie">Cholécystectomie</option>
                <option value="cesarienne">Césarienne</option>
                <option value="autre">Autre (préciser)</option>
              </select>
            </div>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Type d'anesthésie</label>
                <select id="anesthesie" value={form.anesthesie} onChange={handleChange} style={styles.select} disabled={loading}>
                  <option value="">Sélectionner...</option>
                  <option value="generale">Générale</option>
                  <option value="locale">Locale</option>
                  <option value="rachianesthesie">Rachianesthésie</option>
                  <option value="peridurale">Péridurale</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Durée estimée</label>
                <input id="dureeEstimee" value={form.dureeEstimee} onChange={handleChange} placeholder="ex: 2h30" style={styles.input} disabled={loading} />
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{...styles.label, marginBottom: '8px'}}>Niveau de risque</label>
              <select id="risque" value={form.risque} onChange={handleChange} style={styles.select} disabled={loading}>
                <option value="">Sélectionner...</option>
                <option value="faible">Faible</option>
                <option value="moyen">Moyen</option>
                <option value="eleve">Élevé</option>
                <option value="critique">Critique</option>
              </select>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={styles.checkbox}>
                <input type="checkbox" id="consentement" checked={form.consentement} onChange={handleChange} disabled={loading} />
                <span>Consentement éclairé signé par le patient</span>
              </label>
            </div>
            <div style={{ marginBottom: '25px' }}>
              <label style={{...styles.label, marginBottom: '8px'}}>Observations / Précautions</label>
              <textarea id="observations" value={form.observations} onChange={handleChange} placeholder="Précisions sur l'intervention..." style={styles.textarea} disabled={loading} />
            </div>

            <div style={styles.buttonGroup}>
              <button type="button" style={{...styles.btn, ...styles.btnCancel}} onClick={() => navigate(-1)} disabled={loading}>✖ Annuler</button>
              <button type="submit" style={{...styles.btn, ...styles.btnSave, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer'}} disabled={loading}>
                {loading ? <><FaRedo size={18} style={{ animation: 'spin 1s linear infinite' }} /> Enregistrement...</> : '💾 Planifier l\'intervention'}
              </button>
            </div>
          </>
        )}
      </div>
    </form>
  );
}