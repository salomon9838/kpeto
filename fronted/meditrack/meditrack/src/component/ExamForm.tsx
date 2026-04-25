import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Stethoscope, AlertCircle, CheckCircle2, Info, User, Phone, MapPin, Heart } from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================
interface ConsultationData {
  patient: number;
  service: string;
  centre_medical: string;
  nom_soignant: string;
  tel_soignant: string;
  poids?: number | null;
  taille?: number | null;
  temperature?: number | null;
  ta_bras_gauche: string;
  ta_bras_droit: string;
  pouls?: number | null;
  observations_cliniques: string;
  motif_consultation?: string;
}

type NotificationType = 'success' | 'error' | 'info';
interface NotificationState {
  show: boolean;
  type: NotificationType;
  title: string;
  message: string;
  details?: string[];
}

// =============================================================================
// COMPOSANT PRINCIPAL — EXAMEN UROLOGIE
// =============================================================================
export default function ExamForm(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 🔍 Récupération IMMÉDIATE des IDs (sans useState lazy)
  const getPatientId = (): number => {
    const fromState = location.state?.patientId;
    const fromStorage = localStorage.getItem('current_patient_id');
    const id = fromState || (fromStorage && fromStorage !== 'undefined' ? Number(fromStorage) : 0);
    console.log('🔍 UrologieExam - patientId:', id);
    return id;
  };
  
  const [patientId] = useState<number>(getPatientId());
  const [form, setForm] = useState({
    service: "urologie", centre: "", doc: "", tel: "",
    poids: "", taille: "", temperature: "", tabg: "", tabd: "", pouls: "", obs: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    show: false, type: 'info', title: '', message: '', details: []
  });

  // ✅ Vérification au montage
  useEffect(() => {
    console.log('📋 UrologieExam - patientId:', patientId);
    if (!patientId) {
      showNotification('error', 'Patient non sélectionné', 'Redirection...');
      setTimeout(() => navigate('/old-consultation'), 2000);
    }
  }, [patientId, navigate]);

  const showNotification = (type: NotificationType, title: string, message: string, details?: string[]) => {
    setNotification({ show: true, type, title, message, details });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 6000);
  };

  const getNotificationStyles = (): React.CSSProperties => {
    const colors = {
      success: { bg: '#f0fdf4', border: '#22c55e', text: '#166534' },
      error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
      info: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  // 💾 SAUVEGARDE AVEC API — VERSION CORRIGÉE
  const saveExam = async () => {
    if (!patientId) {
      showNotification('error', 'Patient non sélectionné', '');
      return;
    }
    if (!form.centre.trim() || !form.doc.trim() || !form.tel.trim()) {
      showNotification('error', 'Champs obligatoires', 'Centre, soignant et téléphone requis.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Session expirée');

      const payload: ConsultationData = {
        patient: patientId,
        service: "urologie",
        centre_medical: form.centre.trim(),
        nom_soignant: form.doc.trim(),
        tel_soignant: form.tel.trim(),
        poids: form.poids ? parseFloat(form.poids) : null,
        taille: form.taille ? parseFloat(form.taille) : null,
        temperature: form.temperature ? parseFloat(form.temperature) : null,
        ta_bras_gauche: form.tabg.trim() || null,
        ta_bras_droit: form.tabd.trim() || null,
        pouls: form.pouls ? parseInt(form.pouls, 10) : null,
        observations_cliniques: form.obs.trim() || null,
        motif_consultation: 'Consultation urologique',
      };

      console.log('📤 Payload:', payload);

      const response = await fetch('http://localhost:8000/api/consultations/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log(`📥 Réponse ${response.status}:`, responseText);

      if (response.status === 401) throw new Error('Session expirée');
      if (!response.ok) {
        try {
          const err = JSON.parse(responseText);
          throw new Error(Object.values(err).flat?.().join(', ') || responseText);
        } catch {
          throw new Error(responseText || `Erreur ${response.status}`);
        }
      }

      const result = JSON.parse(responseText);
      const consultationId = result.id;
      
      if (!consultationId) {
        console.error('❌ RÉPONSE SANS ID:', result);
        throw new Error('L\'API n\'a pas retourné d\'ID. Vérifiez le serializer Django.');
      }
      
      console.log('✅ Consultation créée, ID:', consultationId);

      // ✅ STOCKAGE IMMÉDIAT ET SÉCURISÉ
      const cIdStr = String(consultationId);
      const pIdStr = String(patientId);
      localStorage.setItem('current_consultation_id', cIdStr);
      localStorage.setItem('current_patient_id', pIdStr);
      localStorage.setItem('current_workflow_step', 'ordonnance');
      
      console.log('💾 IDs stockés:', { current_consultation_id: localStorage.getItem('current_consultation_id'), current_patient_id: localStorage.getItem('current_patient_id') });

      showNotification('success', 'Examen sauvegardé', `ID: ${consultationId}`);
      setForm({ service: "urologie", centre: "", doc: "", tel: "", poids: "", taille: "", temperature: "", tabg: "", tabd: "", pouls: "", obs: "" });

      // 🚀 NAVIGATION VERS ORDONNANCE UROLOGIE
      setTimeout(() => {
        console.log('🚀 Navigation vers /urologie/ordonnance');
        navigate('/urologie/ordonnance', {
          state: {
            consultationId: consultationId,
            patientId: patientId,
            step: 'ordonnance',
            timestamp: Date.now()
          }
        });
      }, 1000);

    } catch (err: any) {
      console.error('❌ Erreur:', err);
      showNotification('error', 'Échec', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelExam = () => {
    if (window.confirm("Annuler ?")) {
      setForm({ service: "urologie", centre: "", doc: "", tel: "", poids: "", taille: "", temperature: "", tabg: "", tabd: "", pouls: "", obs: "" });
    }
  };

  // =============================================================================
  // STYLES
  // =============================================================================
  const styles: Record<string, React.CSSProperties> = {
    page: { minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: "'Inter', sans-serif", paddingBottom: '60px' },
    header: { backgroundColor: '#0891b2', padding: '20px 30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '30px' },
    headerContent: { maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    title: { fontSize: '24px', fontWeight: '700', color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' },
    backBtn: { background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
    container: { maxWidth: '1200px', margin: '0 auto', padding: '0 30px' },
    card: { backgroundColor: 'white', borderRadius: '16px', padding: '30px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' },
    sectionTitle: { fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' },
    debugBox: { background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '2px solid #3b82f6', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', fontSize: '14px' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' },
    formGroup: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
    label: { fontSize: '14px', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' },
    required: { color: '#ef4444' },
    input: { padding: '12px 16px', borderRadius: '10px', border: '2px solid #e2e8f0', fontSize: '15px', outline: 'none', backgroundColor: '#f8fafc', width: '100%', boxSizing: 'border-box' as const },
    select: { padding: '12px 16px', borderRadius: '10px', border: '2px solid #e2e8f0', fontSize: '15px', outline: 'none', backgroundColor: '#f8fafc', cursor: 'pointer', width: '100%', boxSizing: 'border-box' as const },
    textarea: { padding: '14px 16px', borderRadius: '10px', border: '2px solid #e2e8f0', fontSize: '15px', outline: 'none', backgroundColor: '#f8fafc', minHeight: '140px', resize: 'vertical' as const, fontFamily: 'inherit', lineHeight: '1.6', width: '100%', boxSizing: 'border-box' as const },
    buttonGroup: { display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '32px', paddingTop: '24px', borderTop: '2px solid #e2e8f0' },
    btn: { padding: '14px 32px', borderRadius: '10px', border: 'none', fontWeight: '700', fontSize: '15px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s' },
    btnCancel: { backgroundColor: '#f1f5f9', color: '#64748b' },
    btnSave: { backgroundColor: '#0891b2', color: 'white' },
  };

  // =============================================================================
  // RENDER
  // =============================================================================
  return (
    <div style={styles.page}>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        input:focus, select:focus, textarea:focus { border-color: #0891b2 !important; background-color: white !important; box-shadow: 0 0 0 4px rgba(8, 145, 178, 0.1) !important; }
        .card-hover:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; transform: translateY(-2px); transition: all 0.2s ease; }
      `}</style>

      {notification.show && (
        <div style={getNotificationStyles()}>
          <div>{notification.type === 'success' ? '✅' : notification.type === 'error' ? '⚠️' : 'ℹ️'}</div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>{notification.title}</h4>
            {notification.message && <p style={{ margin: '6px 0 0 0', fontSize: '14px' }}>{notification.message}</p>}
            {notification.details?.map((d, i) => <div key={i} style={{ fontSize: '13px', marginTop: '4px' }}>• {d}</div>)}
          </div>
          <button onClick={() => setNotification(p => ({ ...p, show: false }))} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', opacity: 0.6 }}>×</button>
        </div>
      )}

      <header style={styles.header}>
        <div style={styles.headerContent}>
          <button style={styles.backBtn} onClick={() => navigate('/patient')}>← Retour</button>
          <h1 style={styles.title}><Stethoscope size={28} /> 💧 Examen Urologie</h1>
          <div style={{ width: '100px' }} />
        </div>
      </header>

      <div style={styles.container}>
        <div style={styles.debugBox}>
          <div style={{ fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} color="#3b82f6" /> IDs reçus
          </div>
          <div>Patient: <strong>{patientId || '❌'}</strong></div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}><User size={22} color="#0891b2" /> Information du soignant</h2>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Service</label>
              <select id="service" value={form.service} onChange={handleChange} style={styles.select}><option>urologie</option></select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Centre <span style={styles.required}>*</span></label>
              <input id="centre" value={form.centre} onChange={handleChange} placeholder="Centre médical" style={styles.input} required />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Nom du soignant <span style={styles.required}>*</span></label>
              <input id="doc" value={form.doc} onChange={handleChange} placeholder="Dr Nom Prénom" style={styles.input} required />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Téléphone <span style={styles.required}>*</span></label>
              <input id="tel" value={form.tel} onChange={handleChange} placeholder="+228 ..." style={styles.input} required />
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}><Heart size={22} color="#0891b2" /> Paramètres vitaux</h2>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}><label style={styles.label}>Poids (kg)</label><input id="poids" value={form.poids} onChange={handleChange} placeholder="70" type="number" step="0.1" style={styles.input} /></div>
            <div style={styles.formGroup}><label style={styles.label}>Taille (m)</label><input id="taille" value={form.taille} onChange={handleChange} placeholder="1.75" type="number" step="0.01" style={styles.input} /></div>
            <div style={styles.formGroup}><label style={styles.label}>Température (°C)</label><input id="temperature" value={form.temperature} onChange={handleChange} placeholder="37.5" type="number" step="0.1" style={styles.input} /></div>
            <div style={styles.formGroup}><label style={styles.label}>TA - Bras Gauche</label><input id="tabg" value={form.tabg} onChange={handleChange} placeholder="12/8" style={styles.input} /></div>
            <div style={styles.formGroup}><label style={styles.label}>TA - Bras Droit</label><input id="tabd" value={form.tabd} onChange={handleChange} placeholder="12/7" style={styles.input} /></div>
            <div style={styles.formGroup}><label style={styles.label}>Pouls (bpm)</label><input id="pouls" value={form.pouls} onChange={handleChange} placeholder="80" type="number" style={styles.input} /></div>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}><Stethoscope size={22} color="#0891b2" /> Observations</h2>
          <textarea id="obs" value={form.obs} onChange={handleChange} placeholder="Observations cliniques..." style={styles.textarea} />
        </div>

        <div style={styles.buttonGroup}>
          <button style={{ ...styles.btn, ...styles.btnCancel }} onClick={cancelExam} disabled={isSubmitting}>✖ Annuler</button>
          <button style={{ ...styles.btn, ...styles.btnSave, opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }} onClick={saveExam} disabled={isSubmitting}>
            {isSubmitting ? '⏳ Enregistrement...' : '💾 Sauvegarder → Ordonnance'}
          </button>
        </div>
      </div>
    </div>
  );
}