import React, { useState, useEffect, CSSProperties } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../../../api/api";
import { 
  FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaEye,
  FaUserMd, FaBuilding, FaPhone, FaRedo, FaArrowLeft
} from 'react-icons/fa';

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

interface ExamData {
  avl_od: string; 
  avl_og: string;
  ts_od: string; 
  ts_og: string;
  avlac_od: string; 
  avlac_og: string;
  vp: string;
}

// =============================================================================
// COMPOSANT PRINCIPAL — EXAM OPHTALMO
// =============================================================================
export default function ExamStep() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 🔍 Récupération STRICTE des IDs
  const getIds = () => {
    const cIdState = location.state?.consultationId;
    const pIdState = location.state?.patientId;
    const cIdStore = localStorage.getItem('current_consultation_id');
    const pIdStore = localStorage.getItem('current_patient_id');
    
    const cId = cIdState || (cIdStore && cIdStore !== 'undefined' ? Number(cIdStore) : null);
    const pId = pIdState || (pIdStore && pIdStore !== 'undefined' ? Number(pIdStore) : null);
    
    console.log('🔍 ExamOphtalmo - Debug IDs:', { fromState: { cIdState, pIdState }, fromStorage: { cIdStore, pIdStore }, resolved: { cId, pId } });
    return { cId, pId };
  };

  const [consultationId, setConsultationId] = useState<number | null>(null);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [consultationNumber, setConsultationNumber] = useState<number | null>(null);
  const [idsReady, setIdsReady] = useState(false);

  // === ÉTATS DU FORMULAIRE ===
  const [motif, setMotif] = useState("");
  const [diagnostic, setDiagnostic] = useState("");
  const [centre, setCentre] = useState("");
  const [doctor, setDoctor] = useState("");
  const [phone, setPhone] = useState("");
  const [service] = useState("Ophtalmologie");

  const [exam, setExam] = useState<ExamData>({
    avl_od: "", avl_og: "", ts_od: "", ts_og: "", avlac_od: "", avlac_og: "", vp: ""
  });

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    show: false, type: 'info', title: '', message: '', details: []
  });

  // 🔢 Récupération numéro consultation
  const fetchConsultationNumber = async (pid: number) => {
    try {
      const consultations = await apiFetch<any[]>(`consultations/?patient=${pid}&service=ophtalmologie`);
      const nextNumber = (Array.isArray(consultations) ? consultations.length : 0) + 1;
      setConsultationNumber(nextNumber);
    } catch (err) {
      setConsultationNumber(1);
    }
  };

  // ✅ Chargement initial
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

  // 🎯 Notification
  const showNotification = (type: NotificationType, title: string, message: string, details?: string[]) => {
    setNotification({ show: true, type, title, message, details });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 6000);
  };

  // 🎨 Styles notification
  const getNotificationStyles = (): CSSProperties => {
    const colors = {
      success: { bg: '#f0fdf4', border: '#22c55e', text: '#166534' },
      error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
      info: { bg: '#eff6ff', border: '#0d9488', text: '#1e40af' },
    };
    const c = colors[notification.type];
    return {
      position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
      padding: '16px 20px', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
      borderLeft: `5px solid ${c.border}`, backgroundColor: c.bg, color: c.text,
      maxWidth: '450px', display: 'flex', alignItems: 'flex-start', gap: '12px', animation: 'slideIn 0.3s ease-out',
    };
  };

  const inputStyle: CSSProperties = { width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e2e8f0', fontSize: '14px', outline: 'none', backgroundColor: '#f8fafc', transition: 'all 0.2s', boxSizing: 'border-box' as const };
  const tableHeaderStyle: CSSProperties = { border: '1px solid #e2e8f0', padding: '12px', textAlign: 'left', color: '#ffffff', fontSize: '13px', fontWeight: '600', backgroundColor: '#0d9488' };
  const tableCellStyle: CSSProperties = { border: '1px solid #e2e8f0', padding: '8px', color: '#333', backgroundColor: '#fcfcfd' };
  const labelStyle: CSSProperties = { fontWeight: '600', fontSize: '14px', color: '#475569', display: 'block', marginBottom: '6px' };

  // 💾 Sauvegarde
 const saveExam = async () => {
  console.log('🔍 ========== DÉBUT SAVEEXAM ==========');
  console.log('📋 État:', { patientId, consultationId, idsReady });
  console.log('📋 Formulaire:', { centre, doctor, phone, motif, diagnostic });
  console.log('📋 Examen:', exam);

  if (!patientId) {
    showNotification('error', 'Erreur', 'Patient manquant.');
    return;
  }
  if (!centre.trim() || !doctor.trim() || !phone.trim() || !motif.trim()) {
    showNotification('error', 'Champs obligatoires', 'Veuillez remplir tous les champs requis.');
    return;
  }

  setLoading(true);
  try {
    // 1️⃣ Créer Consultation
    const consultPayload = {
      patient: patientId,
      service: "ophtalmo",
      centre_medical: centre.trim(),
      nom_soignant: doctor.trim(),
      tel_soignant: phone.trim(),
      motif_consultation: motif.trim(),
      observations_cliniques: diagnostic.trim() || null,
    };

    console.log('📤 [ÉTAPE 1] Payload consultation:', JSON.stringify(consultPayload, null, 2));

    const newConsult = await apiFetch<any>('consultations/', { 
      method: 'POST', 
      body: JSON.stringify(consultPayload) 
    });
    
    const newConsultId = newConsult?.id;
    console.log('✅ Consultation créée:', newConsultId);
    console.log('📥 Réponse complète:', newConsult);

    if (!newConsultId) {
      throw new Error('Pas d\'ID consultation retourné');
    }

    // 2️⃣ Créer ExamenOphtalmo — VERSION SIMPLIFIÉE
    const examenPayload = {
      consultation: newConsultId,  // ← Doit être un NOMBRE
      av_od_loin: exam.avl_od || "",
      av_og_loin: exam.avl_og || "",
      av_od_pres: exam.avlac_od || "",
      av_og_pres: exam.avlac_og || "",
      pression_intraoculaire_od: exam.ts_od || "",
      pression_intraoculaire_og: exam.ts_og || "",
      // Champs vides pour éviter les erreurs
      paupieres_annexes: "",
      conjonctive: "",
      cornee: "",
      chambre_anterieure: "",
      iris_pupille: "",
      cristallin: "",
      fond_oeil_od: "",
      fond_oeil_og: "",
      refraction_auto: "",
      correction_proposee: "",
    };

    console.log('📤 [ÉTAPE 2] Payload examen ophtalmo:', JSON.stringify(examenPayload, null, 2));
    console.log('🔢 Type consultation:', typeof examenPayload.consultation, examenPayload.consultation);

    try {
      const response = await fetch('http://localhost:8000/api/examens-ophtalmo/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(examenPayload),
      });

      console.log('📥 Status HTTP:', response.status);
      console.log('📥 Headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('📥 Response text:', responseText);

      if (!response.ok) {
        // Tenter de parser JSON
        try {
          const errorData = JSON.parse(responseText);
          console.error('❌ Erreurs de validation Django:', errorData);
          
          const errorMessages = Object.entries(errorData).map(([field, msgs]) => {
            return `🔴 ${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`;
          }).join('\n');
          
          throw new Error(`Validation échouée:\n${errorMessages}`);
        } catch (parseErr) {
          throw new Error(`Status ${response.status}: ${responseText.substring(0, 200)}`);
        }
      }

      const newExamen = JSON.parse(responseText);
      console.log('✅ Examen créé:', newExamen);

      showNotification('success', 'Succès', 'Examen enregistré.', [`🆔 Consultation #${newConsultId}`]);
      
      localStorage.setItem('current_consultation_id', String(newConsultId));
      localStorage.setItem('current_patient_id', String(patientId));
      localStorage.setItem('current_workflow_step', 'ordonnance');

      // Reset
      setMotif(""); setDiagnostic(""); setCentre(""); setDoctor(""); setPhone("");
      setExam({ avl_od: "", avl_og: "", ts_od: "", ts_og: "", avlac_od: "", avlac_og: "", vp: "" });

      setTimeout(() => {
        console.log('🚀 Navigation vers ordonnance...');
        navigate('/ophtalmo/ordonnance', { 
          state: { consultationId: newConsultId, patientId, step: 'ordonnance' } 
        });
      }, 1500);

    } catch (examenErr: any) {
      console.error('❌ Erreur création examen:', examenErr);
      console.error('❌ Stack:', examenErr.stack);
      
      // Afficher les détails dans la notification
      const errorDetails = examenErr.message.split('\n').filter((l: string) => l.startsWith('🔴'));
      
      showNotification(
        'error', 
        'Échec création examen', 
        examenErr.message.split('\n')[0], 
        errorDetails.length > 0 ? errorDetails : ['Vérifiez la console (F12) pour les détails']
      );
      
      // Annuler la consultation créée
      try {
        await apiFetch(`consultations/${newConsultId}/`, { method: 'DELETE' });
        console.log('🗑️ Consultation annulée (rollback)');
      } catch (delErr) {
        console.error('⚠️ Impossible d\'annuler la consultation:', delErr);
      }
    }

  } catch (err: any) {
    console.error('❌ Erreur générale:', err);
    console.error('❌ Message:', err.message);
    
    let details = [];
    if (err.validationErrors) {
      details = Object.entries(err.validationErrors).map(([f, m]: [string, any]) => `${f}: ${Array.isArray(m) ? m.join(', ') : m}`);
    } else if (err.message) {
      details = [err.message];
    }
    
    showNotification('error', 'Échec', 'Erreur serveur.', details);
  } finally {
    setLoading(false);
    console.log('🏁 ========== FIN SAVEEXAM ==========');
  }
};

  const cancelForm = () => {
    if (confirm("Annuler ?")) {
      setMotif(""); setDiagnostic(""); setCentre(""); setDoctor(""); setPhone("");
      setExam({ avl_od: "", avl_og: "", ts_od: "", ts_og: "", avlac_od: "", avlac_og: "", vp: "" });
    }
  };

  const styles: Record<string, CSSProperties> = {
    page: { minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: "'Inter', sans-serif", padding: '40px' },
    header: { backgroundColor: '#0d9488', padding: '20px 30px', marginBottom: '30px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px' },
    backBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    title: { fontSize: '24px', fontWeight: '700', color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' },
    container: { maxWidth: '1000px', margin: '0 auto', backgroundColor: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    sectionTitle: { fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '4px solid #0d9488', paddingLeft: '12px' },
    debugBox: { background: '#f0fdf4', border: '2px solid #22c55e', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', fontSize: '14px' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '20px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '6px', flex: '1', minWidth: '150px' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
    buttonGroup: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '30px', paddingTop: '20px', borderTop: '2px solid #e2e8f0' },
    btn: { padding: '12px 24px', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' },
    btnCancel: { backgroundColor: '#f1f5f9', color: '#64748b' },
    btnSave: { backgroundColor: '#0d9488', color: 'white' },
    consultationBadge: { fontSize: '14px', padding: '4px 12px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '20px', marginLeft: '12px' },
  };

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        input:focus, textarea:focus { border-color: #0d9488 !important; background-color: white !important; box-shadow: 0 0 0 4px rgba(13, 148, 136, 0.1) !important; }
        .card-hover:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; }
        .blocked-form { opacity: 0.3; pointer-events: none; }
        tr:hover { background-color: #f1f5f9 !important; }
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
        <button style={styles.backBtn} onClick={() => navigate('/patient')}><FaArrowLeft /> Retour</button>
        <h1 style={styles.title}><FaEye /> 👁️ Consultation Ophtalmologique </h1>
        <div style={{ width: '100px' }} />
      </header>

      <div style={styles.container} className="card-hover">
        {!idsReady ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
            <FaExclamationTriangle size={48} style={{ marginBottom: '16px' }} />
            <h3>Patient non sélectionné</h3>
            <p>Redirection...</p>
          </div>
        ) : (
          <div>
            <div style={styles.debugBox}>
              <div style={{ fontWeight: '700', marginBottom: '8px' }}>✅ Patient sélectionné</div>
             
              <div>Patient ID: <strong>{patientId}</strong></div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={labelStyle}>Motif de consultation <span style={{ color: '#ef4444' }}>*</span></label>
              <textarea value={motif} onChange={e => setMotif(e.target.value)} placeholder="Pourquoi le patient consulte-t-il ?" rows={3} style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }} disabled={loading} />
            </div>

            <h3 style={styles.sectionTitle}><FaEye /> Examen physique</h3>
            <div style={{ overflowX: 'auto', marginBottom: '25px' }}>
              <table style={styles.table}>
                <thead><tr>
                  <th style={tableHeaderStyle}>Examen</th>
                  <th style={tableHeaderStyle}>OD (Droit)</th>
                  <th style={tableHeaderStyle}>OG (Gauche)</th>
                </tr></thead>
                <tbody>
                  <tr><td style={tableCellStyle}>AVL (Loin)</td>
                    <td style={tableCellStyle}><input style={{ ...inputStyle, padding: '8px' }} value={exam.avl_od} onChange={e => setExam({ ...exam, avl_od: e.target.value })} placeholder="10/10" disabled={loading} /></td>
                    <td style={tableCellStyle}><input style={{ ...inputStyle, padding: '8px' }} value={exam.avl_og} onChange={e => setExam({ ...exam, avl_og: e.target.value })} placeholder="10/10" disabled={loading} /></td>
                  </tr>
                  <tr><td style={tableCellStyle}>TS (Pression)</td>
                    <td style={tableCellStyle}><input style={{ ...inputStyle, padding: '8px' }} value={exam.ts_od} onChange={e => setExam({ ...exam, ts_od: e.target.value })} placeholder="15 mmHg" disabled={loading} /></td>
                    <td style={tableCellStyle}><input style={{ ...inputStyle, padding: '8px' }} value={exam.ts_og} onChange={e => setExam({ ...exam, ts_og: e.target.value })} placeholder="15 mmHg" disabled={loading} /></td>
                  </tr>
                  <tr><td style={tableCellStyle}>AVLAC (Correction)</td>
                    <td style={tableCellStyle}><input style={{ ...inputStyle, padding: '8px' }} value={exam.avlac_od} onChange={e => setExam({ ...exam, avlac_od: e.target.value })} placeholder="10/10" disabled={loading} /></td>
                    <td style={tableCellStyle}><input style={{ ...inputStyle, padding: '8px' }} value={exam.avlac_og} onChange={e => setExam({ ...exam, avlac_og: e.target.value })} placeholder="10/10" disabled={loading} /></td>
                  </tr>
                  <tr><td style={tableCellStyle}>VP (Près)</td>
                    <td colSpan={2} style={tableCellStyle}><input style={{ ...inputStyle, padding: '8px' }} value={exam.vp} onChange={e => setExam({ ...exam, vp: e.target.value })} placeholder="P1, P2..." disabled={loading} /></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={labelStyle}>Diagnostic / Observations</label>
              <textarea value={diagnostic} onChange={e => setDiagnostic(e.target.value)} placeholder="Observations..." rows={4} style={{ ...inputStyle, resize: 'vertical', minHeight: '100px' }} disabled={loading} />
            </div>

            <h3 style={styles.sectionTitle}><FaUserMd /> Information du soignant</h3>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}><label style={labelStyle}>Service</label><input value="Ophtalmologie" readOnly style={{ ...inputStyle, backgroundColor: '#f8fafc', cursor: 'not-allowed', opacity: 0.8, fontWeight: '600' }} /></div>
              <div style={styles.formGroup}><label style={labelStyle}>Centre <span style={{ color: '#ef4444' }}>*</span></label><input value={centre} onChange={e => setCentre(e.target.value)} placeholder="ex: CHU" style={inputStyle} disabled={loading} /></div>
              <div style={styles.formGroup}><label style={labelStyle}>Médecin <span style={{ color: '#ef4444' }}>*</span></label><input value={doctor} onChange={e => setDoctor(e.target.value)} placeholder="Nom" style={inputStyle} disabled={loading} /></div>
              <div style={styles.formGroup}><label style={labelStyle}>Téléphone <span style={{ color: '#ef4444' }}>*</span></label><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+228..." style={inputStyle} disabled={loading} /></div>
            </div>

            <div style={styles.buttonGroup}>
              <button style={{ ...styles.btn, ...styles.btnCancel }} onClick={cancelForm} disabled={loading}>✖ Annuler</button>
              <button style={{ ...styles.btn, ...styles.btnSave, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }} onClick={saveExam} disabled={loading}>
                {loading ? '⏳ Enregistrement...' : '💾 Sauvegarder → Ordonnance'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}