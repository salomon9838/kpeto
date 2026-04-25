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
// COMPOSANT PRINCIPAL — EXAM OPHTALMO (PROFESSIONNEL + API + IDs + SERVICE FIXE)
// =============================================================================
export default function ExamStep() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 🔍 Récupération STRICTE des IDs (patientId OBLIGATOIRE)
  const getIds = () => {
    const cIdState = location.state?.consultationId;
    const pIdState = location.state?.patientId;
    const cIdStore = localStorage.getItem('current_consultation_id');
    const pIdStore = localStorage.getItem('current_patient_id');
    
    const cId = cIdState || (cIdStore && cIdStore !== 'undefined' ? Number(cIdStore) : null);
    const pId = pIdState || (pIdStore && pIdStore !== 'undefined' ? Number(pIdStore) : null);
    
    console.log('🔍 ExamOphtalmo - Debug IDs:', { 
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

  // === VOS ÉTATS EXISTANTS (inchangés) ===
  const [motif, setMotif] = useState("");
  const [diagnostic, setDiagnostic] = useState("");
  const [centre, setCentre] = useState("");
  const [doctor, setDoctor] = useState("");
  const [phone, setPhone] = useState("");
  const [service] = useState("Ophtalmologie"); // ← FIXE, non modifiable

  const [exam, setExam] = useState<ExamData>({
    avl_od: "", 
    avl_og: "",
    ts_od: "", 
    ts_og: "",
    avlac_od: "", 
    avlac_og: "",
    vp: ""
  });

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    show: false, type: 'info', title: '', message: '', details: []
  });

  // 🔢 Fonction pour récupérer le numéro de consultation automatique
  const fetchConsultationNumber = async (pid: number) => {
    try {
      console.log(`📊 Récupération du nombre de consultations pour patient #${pid}...`);
      const consultations = await apiFetch<any[]>(`consultations/?patient=${pid}&service=ophtalmologie`);
      const existingCount = Array.isArray(consultations) ? consultations.length : 0;
      const nextNumber = existingCount + 1;
      console.log(`✅ Patient #${pid} : ${existingCount} consultation(s) → Prochaine: #${nextNumber}`);
      setConsultationNumber(nextNumber);
      return nextNumber;
    } catch (err) {
      console.error('❌ Erreur comptage consultations:', err);
      setConsultationNumber(1);
      return 1;
    }
  };

  // ✅ Chargement des IDs + Numéro de consultation au montage
  useEffect(() => {
    const loadConsultationData = async () => {
      const { cId, pId } = getIds();
      
      if (pId) {
        setPatientId(pId);
        if (cId) setConsultationId(cId);
        setIdsReady(true);
        
        localStorage.setItem('current_patient_id', String(pId));
        if (cId) localStorage.setItem('current_consultation_id', String(cId));
        
        console.log('✅ ExamOphtalmo - IDs chargés:', { cId, pId });
        
        // 🔢 Récupérer automatiquement le numéro de consultation
        await fetchConsultationNumber(pId);
        
      } else {
        console.error('❌ ExamOphtalmo - PatientId MANQUANT');
        
        showNotification(
          'error', 
          'Patient non sélectionné', 
          'Vous devez sélectionner un patient depuis la liste pour continuer.',
          ['Redirection automatique dans 3 secondes...']
        );
        
        setTimeout(() => {
          navigate('/old-consultation', { 
            state: { 
              from: 'ophtalmo-exam',
              message: 'Veuillez sélectionner un patient avant de consulter en ophtalmologie'
            } 
          });
        }, 3000);
      }
    };
    
    loadConsultationData();
  }, []);

  // 🎯 Fonction notification professionnelle
  const showNotification = (type: NotificationType, title: string, message: string, details?: string[]) => {
    setNotification({ show: true, type, title, message, details });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 6000);
  };

  // 🎨 Styles notification (harmonisés avec design pro)
  const getNotificationStyles = (): CSSProperties => {
    const colors: Record<NotificationType, { bg: string; border: string; text: string }> = {
      success: { bg: '#f0fdf4', border: '#22c55e', text: '#166534' },
      error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
      info: { bg: '#eff6ff', border: '#0d9488', text: '#1e40af' }, // ← Teal professionnel
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

  // 📝 Style pour les inputs (harmonisé)
  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '2px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#f8fafc',
    transition: 'all 0.2s',
    boxSizing: 'border-box' as const,
  };

  // Style tableau (header teal sur fond blanc)
  const tableHeaderStyle: CSSProperties = {
    border: '1px solid #e2e8f0',
    padding: '12px',
    textAlign: 'left' as const,
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '600',
    backgroundColor: '#0d9488' // ← Teal professionnel
  };

  const tableCellStyle: CSSProperties = {
    border: '1px solid #e2e8f0',
    padding: '8px',
    color: '#333',
    backgroundColor: '#fcfcfd',
  };

  const labelStyle: CSSProperties = {
    fontWeight: '600',
    fontSize: '14px',
    color: '#475569',
    display: 'block',
    marginBottom: '6px',
  };

  const requiredStyle: CSSProperties = { color: '#ef4444' };

 const saveExam = async () => {
  // ✅ Validations
  if (!patientId) {
    showNotification('error', 'Erreur critique', 'Patient non sélectionné.');
    return;
  }
  if (!centre.trim() || !doctor.trim() || !phone.trim() || !motif.trim()) {
    showNotification('error', 'Champs obligatoires', 'Veuillez remplir tous les champs obligatoires.');
    return;
  }

  setLoading(true);
  try {
    // =====================================================
    // ÉTAPE 1 : Créer la Consultation
    // =====================================================
    const consultationPayload = {
      patient: patientId,
      service: "ophtalmologie",
      centre_medical: centre.trim(),
      nom_soignant: doctor.trim(),
      tel_soignant: phone.trim(),
      motif_consultation: motif.trim(),
      observations_cliniques: diagnostic.trim() || null,
    };

    console.log('📤 Étape 1 - Payload consultation:', consultationPayload);

    const newConsultation = await apiFetch<any>('consultations/', {
      method: 'POST',
      body: JSON.stringify(consultationPayload),
    });

    const consultationId = newConsultation?.id;
    if (!consultationId) {
      throw new Error('L\'API n\'a pas retourné d\'ID de consultation');
    }
    console.log('✅ Consultation créée:', consultationId);

    // =====================================================
    // ÉTAPE 2 : Créer l'ExamenOphtalmo lié
    // =====================================================
    const examenPayload = {
      consultation: consultationId,
      // ✅ Noms EXACTS du modèle Django
      av_od_loin: exam.avl_od || "",
      av_og_loin: exam.avl_og || "",
      av_od_pres: exam.avlac_od || "",
      av_og_pres: exam.avlac_og || "",
      pression_intraoculaire_od: exam.ts_od || "",
      pression_intraoculaire_og: exam.ts_og || "",
      // Champs optionnels (vides pour l'instant)
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

    console.log('📤 Étape 2 - Payload examen ophtalmo:', examenPayload);

    // ✅✅✅ CORRECTION : Endpoint avec "s" → 'examens-ophtalmo/'
    const newExamen = await apiFetch<any>('examens-ophtalmo/', {  // ← "examens" avec S
      method: 'POST',
      body: JSON.stringify(examenPayload),
    });

    console.log('✅ Examen ophtalmo créé:', newExamen?.id);

    // ✅ Stockage des IDs
    localStorage.setItem('current_consultation_id', String(consultationId));
    localStorage.setItem('current_patient_id', String(patientId));
    localStorage.setItem('current_workflow_step', 'ordonnance');

    // ✅ Notification succès
    showNotification(
      'success',
      'Consultation sauvegardée',
      'L\'examen ophtalmologique a été enregistré avec succès.',
      [`🆔 Consultation #${consultationId}`]
    );

    // Reset formulaire
    setMotif(""); setDiagnostic(""); setCentre(""); setDoctor(""); setPhone("");
    setExam({ avl_od: "", avl_og: "", ts_od: "", ts_og: "", avlac_od: "", avlac_og: "", vp: "" });

    // ✅ REDIRECTION
    setTimeout(() => {
      navigate('/ophtalmo/ordonnance', {
        state: { consultationId, patientId, step: 'ordonnance' }
      });
    }, 1500);

  } catch (err: any) {
    console.error('❌ Erreur API:', err);
    
    if (err.message === 'Authentification requise') {
      showNotification('info', 'Redirection...', 'Veuillez vous reconnecter.');
      return;
    }
    
    // ✅ Gestion améliorée des erreurs
    let errorDetails: string[] = [];
    if (err.validationErrors) {
      errorDetails = Object.entries(err.validationErrors).map(([field, msgs]) => 
        `🔴 ${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`
      );
    } else if (err.detail) {
      errorDetails = [err.detail];
    } else if (err.message) {
      try {
        const parsed = JSON.parse(err.message);
        errorDetails = Object.entries(parsed).map(([field, msgs]: [string, any]) => 
          `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`
        );
      } catch {
        errorDetails = [err.message];
      }
    }
    
    console.error('🚨 Erreurs de validation:', errorDetails);
    showNotification('error', 'Échec', 'Le serveur a rejeté la demande.', errorDetails);
  } finally {
    setLoading(false);
  }
};
  const cancelForm = () => {
    if (confirm("Voulez-vous vraiment annuler ? Tous les champs seront effacés.")) {
      setMotif("");
      setDiagnostic("");
      setCentre("");
      setDoctor("");
      setPhone("");
      setExam({ avl_od: "", avl_og: "", ts_od: "", ts_og: "", avlac_od: "", avlac_og: "", vp: "" });
      showNotification('info', 'Formulaire annulé', 'Tous les champs ont été réinitialisés.');
    }
  };

  // =============================================================================
  // STYLES PROFESSIONNELS (Harmonisés avec style chirurgie - Teal #0d9488)
  // =============================================================================
  const styles: Record<string, CSSProperties> = {
    page: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      padding: '40px',
    },
    header: {
      backgroundColor: '#0d9488',
      padding: '20px 30px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginBottom: '30px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
    },
    backBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 20px',
      backgroundColor: 'rgba(255,255,255,0.2)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'background 0.2s',
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      color: 'white',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    container: {
      maxWidth: '1000px',
      margin: '0 auto',
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '30px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      border: '1px solid #e2e8f0',
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#1e293b',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      borderLeft: '4px solid #0d9488',
      paddingLeft: '12px',
    },
    blockingBox: {
      background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
      border: '3px solid #ef4444',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
      textAlign: 'center' as const,
    },
    debugBox: {
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      border: '2px solid #22c55e',
      borderRadius: '12px',
      padding: '16px 20px',
      marginBottom: '24px',
      fontSize: '14px',
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '15px',
      marginBottom: '20px',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '6px',
      flex: '1',
      minWidth: '150px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      marginTop: '10px',
      backgroundColor: 'white',
      borderRadius: '8px',
      overflow: 'hidden',
    },
    buttonGroup: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
      marginTop: '30px',
      paddingTop: '20px',
      borderTop: '2px solid #e2e8f0',
    },
    btn: {
      padding: '12px 24px',
      borderRadius: '8px',
      border: 'none',
      fontWeight: '600',
      fontSize: '14px',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s',
    },
    btnCancel: {
      backgroundColor: '#f1f5f9',
      color: '#64748b',
    },
    btnSave: {
      backgroundColor: '#0d9488', // ← Teal professionnel
      color: 'white',
    },
    btnSelectPatient: {
      backgroundColor: '#ef4444',
      color: 'white',
      marginTop: '16px',
    },
    consultationBadge: {
      fontSize: '14px',
      fontWeight: '400',
      opacity: 0.9,
      marginLeft: '12px',
      padding: '4px 12px',
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: '20px',
    },
    notification: {
      position: 'fixed' as const,
      top: '20px',
      right: '20px',
      zIndex: 9999,
      padding: '16px 20px',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
      borderLeft: '5px solid',
      backgroundColor: 'white',
      maxWidth: '450px',
      minWidth: '350px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      animation: 'slideIn 0.3s ease-out',
    },
  };

  // =============================================================================
  // RENDER — BLOCAGE TOTAL si patientId manquant
  // =============================================================================
  return (
    <div style={styles.page}>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input:focus, select:focus, textarea:focus {
          border-color: #0d9488 !important;
          background-color: white !important;
          box-shadow: 0 0 0 4px rgba(13, 148, 136, 0.1) !important;
        }
        .card-hover:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
          transform: translateY(-2px);
          transition: all 0.2s ease;
        }
        .blocked-form {
          opacity: 0.3;
          pointer-events: none;
          filter: grayscale(1);
        }
        tr:hover {
          background-color: #f1f5f9 !important;
        }
      `}</style>

      {/* 🔔 Notification */}
      {notification.show && (
        <div style={getNotificationStyles()} role="alert">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ fontSize: '18px', marginTop: '1px', color: notification.type === 'error' ? '#ef4444' : notification.type === 'success' ? '#22c55e' : '#0d9488' }}>
              {notification.type === 'success' && <FaCheckCircle size={18} />}
              {notification.type === 'error' && <FaExclamationTriangle size={18} />}
              {notification.type === 'info' && <FaInfoCircle size={18} />}
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{notification.title}</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.9 }}>{notification.message}</p>
              {notification.details?.map((d, i) => (
                <div key={i} style={{ margin: '2px 0 0 0', fontSize: '12px' }}>• {d}</div>
              ))}
            </div>
            <button onClick={() => setNotification(p => ({ ...p, show: false }))} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', opacity: 0.6, color: 'inherit' }}>×</button>
          </div>
        </div>
      )}

      {/* Header avec bouton retour + Badge numéro consultation */}
      <header style={styles.header}>
        <button 
          style={styles.backBtn}
          onClick={() => navigate('/patient')}
          onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.3)'}
          onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.2)'}
        >
          <FaArrowLeft /> Retour
        </button>
        <h1 style={styles.title}>
          <FaEye size={24} /> 👁️ Consultation Ophtalmologique
         
          
        </h1>
        <div style={{ width: '100px' }} />
      </header>

      <div style={styles.container} className="card-hover">
        
        {/* 🚫 BLOCAGE TOTAL si patientId manquant */}
        {!idsReady && (
          <div style={styles.blockingBox}>
            <FaExclamationTriangle size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#991b1b', marginBottom: '12px' }}>
              ⛔ Accès refusé — Patient non sélectionné
            </h3>
            <p style={{ fontSize: '15px', color: '#7f1d1d', marginBottom: '8px' }}>
              Vous devez impérativement sélectionner un patient depuis la liste pour effectuer une consultation ophtalmologique.
            </p>
            <p style={{ fontSize: '14px', color: '#991b1b', marginBottom: '20px' }}>
              Redirection automatique vers la liste des patients...
            </p>
            <button 
              onClick={() => navigate('/old-consultation')}
              style={{ ...styles.btn, ...styles.btnSelectPatient }}
            >
              <FaUserMd size={18} style={{ marginRight: '4px' }} /> Sélectionner un patient maintenant
            </button>
          </div>
        )}

        {/* ✅ Box de confirmation si IDs présents */}
        {idsReady && (
          <div style={styles.debugBox}>
            <div style={{ fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaCheckCircle size={18} color="#22c55e" />
              <span>Patient sélectionné</span>
            </div>
           <div>Consultation <strong style={{ color: consultationId ? '#22c55e' : '#64748b' }}>{consultationId}</strong></div>
            <div>Patient ID: <strong style={{ color: '#22c55e' }}>{patientId}</strong></div>
            
          </div>
        )}

        {/* Formulaire — DÉSACTIVÉ si pas de patientId */}
        <div className={!idsReady ? 'blocked-form' : ''}>
          
          {/* SECTION 1: MOTIF */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ ...labelStyle, marginBottom: '8px' }}>Motif de consultation <span style={requiredStyle}>*</span></label>
            <textarea
              value={motif}
              onChange={e => setMotif(e.target.value)}
              placeholder="Pourquoi le patient consulte-t-il ?"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' as const, minHeight: '80px' }}
              disabled={loading || !idsReady}
            />
          </div>

          {/* SECTION 2: EXAMEN PHYSIQUE */}
          <h3 style={styles.sectionTitle}>
            <FaEye size={20} color="#0d9488" /> Examen physique
          </h3>
          <div style={{ overflowX: 'auto', marginBottom: '25px' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Examen</th>
                  <th style={tableHeaderStyle}>OD (Œil Droit)</th>
                  <th style={tableHeaderStyle}>OG (Œil Gauche)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tableCellStyle}>AVL (Acuité Visuelle de Loin)</td>
                  <td style={tableCellStyle}>
                    <input 
                      style={{...inputStyle, padding: '8px'}} 
                      value={exam.avl_od} 
                      onChange={e => setExam({...exam, avl_od: e.target.value})} 
                      placeholder="10/10" 
                      disabled={loading || !idsReady} 
                    />
                  </td>
                  <td style={tableCellStyle}>
                    <input 
                      style={{...inputStyle, padding: '8px'}} 
                      value={exam.avl_og} 
                      onChange={e => setExam({...exam, avl_og: e.target.value})} 
                      placeholder="10/10" 
                      disabled={loading || !idsReady} 
                    />
                  </td>
                </tr>
                <tr>
                  <td style={tableCellStyle}>TS (Pression intraoculaire)</td>
                  <td style={tableCellStyle}>
                    <input 
                      style={{...inputStyle, padding: '8px'}} 
                      value={exam.ts_od} 
                      onChange={e => setExam({...exam, ts_od: e.target.value})} 
                      placeholder="15 mmHg" 
                      disabled={loading || !idsReady} 
                    />
                  </td>
                  <td style={tableCellStyle}>
                    <input 
                      style={{...inputStyle, padding: '8px'}} 
                      value={exam.ts_og} 
                      onChange={e => setExam({...exam, ts_og: e.target.value})} 
                      placeholder="15 mmHg" 
                      disabled={loading || !idsReady} 
                    />
                  </td>
                </tr>
                <tr>
                  <td style={tableCellStyle}>AVLAC (Avec correction)</td>
                  <td style={tableCellStyle}>
                    <input 
                      style={{...inputStyle, padding: '8px'}} 
                      value={exam.avlac_od} 
                      onChange={e => setExam({...exam, avlac_od: e.target.value})} 
                      placeholder="10/10" 
                      disabled={loading || !idsReady} 
                    />
                  </td>
                  <td style={tableCellStyle}>
                    <input 
                      style={{...inputStyle, padding: '8px'}} 
                      value={exam.avlac_og} 
                      onChange={e => setExam({...exam, avlac_og: e.target.value})} 
                      placeholder="10/10" 
                      disabled={loading || !idsReady} 
                    />
                  </td>
                </tr>
                <tr>
                  <td style={tableCellStyle}>VP (Vision de Près)</td>
                  <td colSpan={2} style={tableCellStyle}>
                    <input 
                      style={{...inputStyle, padding: '8px'}} 
                      value={exam.vp} 
                      onChange={e => setExam({...exam, vp: e.target.value})} 
                      placeholder="P1, P2, etc." 
                      disabled={loading || !idsReady} 
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* SECTION 3: DIAGNOSTIC */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ ...labelStyle, marginBottom: '8px' }}>Diagnostic / Observations</label>
            <textarea
              value={diagnostic}
              onChange={e => setDiagnostic(e.target.value)}
              placeholder="Décrivez vos observations cliniques..."
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' as const, minHeight: '100px' }}
              disabled={loading || !idsReady}
            />
          </div>

          {/* SECTION 4: INFORMATION SOIGNANT */}
          <h3 style={styles.sectionTitle}>
            <FaUserMd size={20} color="#0d9488" /> Information du soignant
          </h3>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={labelStyle}>Service</label>
              {/* ✅ SERVICE FIXE : Ophtalmologie en lecture seule */}
              <input 
                value="Ophtalmologie" 
                readOnly 
                style={{...inputStyle, backgroundColor: '#f8fafc', cursor: 'not-allowed', opacity: 0.8, fontWeight: '600'}} 
              />
            </div>

            <div style={styles.formGroup}>
              <label style={labelStyle}>Centre <span style={requiredStyle}>*</span></label>
              <div style={{ position: 'relative' }}>
                <FaBuilding style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '14px' }} />
                <input 
                  value={centre} 
                  onChange={e => setCentre(e.target.value)} 
                  placeholder="ex: CHU" 
                  style={{...inputStyle, paddingLeft: '38px'}}
                  disabled={loading || !idsReady}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={labelStyle}>Nom et Prénom(s) <span style={requiredStyle}>*</span></label>
              <input 
                value={doctor} 
                onChange={e => setDoctor(e.target.value)} 
                placeholder="Nom du soignant" 
                style={inputStyle}
                disabled={loading || !idsReady}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={labelStyle}>Téléphone <span style={requiredStyle}>*</span></label>
              <div style={{ position: 'relative' }}>
                <FaPhone style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '14px' }} />
                <input 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  placeholder="+228..." 
                  style={{...inputStyle, paddingLeft: '38px'}}
                  disabled={loading || !idsReady}
                />
              </div>
            </div>
          </div>

          {/* BOUTONS */}
          <div style={styles.buttonGroup}>
            <button 
              style={{ ...styles.btn, ...styles.btnCancel }}
              onClick={cancelForm}
              disabled={loading || !idsReady}
              onMouseEnter={(e) => { if (!loading && idsReady) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#e2e8f0'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f1f5f9'; }}
            >
              ✖ Annuler
            </button>
            <button 
              style={{ 
                ...styles.btn, 
                ...styles.btnSave,
                opacity: (loading || !idsReady) ? 0.7 : 1,
                cursor: (loading || !idsReady) ? 'not-allowed' : 'pointer'
              }}
              onClick={saveExam}
              disabled={loading || !idsReady}
              onMouseEnter={(e) => { if (!loading && idsReady) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0f766e'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0d9488'; }}
            >
              {loading ? (
                <>
                  <FaRedo size={18} style={{ animation: 'spin 1s linear infinite' }} /> Enregistrement...
                </>
              ) : (
                <>💾 Sauvegarder → Ordonnance</>
              )}
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}