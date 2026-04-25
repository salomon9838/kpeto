import React, { useState, useEffect, CSSProperties } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../../../api/api";
import { 
  FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaFlask,
  FaUserMd, FaBuilding, FaPhone, FaRedo, FaArrowLeft, FaEye,
  FaClipboardList
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

// =============================================================================
// COMPOSANT PRINCIPAL — ANALYSE OPHTALMO (PROFESSIONNEL + API + IDs)
// =============================================================================
export default function OphtalmoAnalyseStep() {
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
    
    console.log('🔍 OphtalmoAnalyse - Debug IDs:', { 
      fromState: { cIdState, pIdState }, 
      fromStorage: { cIdStore, pIdStore }, 
      resolved: { cId, pId } 
    });
    
    return { cId, pId };
  };

  const [consultationId, setConsultationId] = useState<number | null>(null);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [consultationNumber, setConsultationNumber] = useState<number | null>(null); // ← Numéro AUTO (sans #)
  const [idsReady, setIdsReady] = useState(false);

  // === VOS ÉTATS EXISTANTS (inchangés) ===
  const [selectedAnalyses, setSelectedAnalyses] = useState<Record<string, string[]>>({});
  const [motif, setMotif] = useState("");
  const [centre, setCentre] = useState("");
  const [doctor, setDoctor] = useState("");
  const [phone, setPhone] = useState("");
  const [service] = useState("Ophtalmologie"); // ← FIXE

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    show: false, type: 'info', title: '', message: '', details: []
  });

  // Catégories d'examens (votre code préservé)
  const categories = {
    "EXAMENS FONCTIONNELS": ["CHAMP VISUEL AUTOMATISÉ"],
    "MESURES": ["PIO", "PACHYMÉTRIE", "AR", "AR SOUS CYCLO"],
    "IMAGE": ["OCT de la macula", "OCT de la papille", "Rétinographie"]
  };

  // 🔢 Fonction pour récupérer le numéro de consultation (NOMBRE SEULEMENT)
  const fetchConsultationNumber = async (pid: number) => {
    try {
      console.log(`📊 Récupération du nombre de consultations pour patient #${pid}...`);
      const consultations = await apiFetch<any[]>(`consultations/?patient=${pid}&service=ophtalmologie`);
      const existingCount = Array.isArray(consultations) ? consultations.length : 0;
      const nextNumber = existingCount + 1;
      console.log(`✅ Patient #${pid} : ${existingCount} consultation(s) → Prochaine: ${nextNumber}`);
      setConsultationNumber(nextNumber); // ← Stocke le NOMBRE, pas "#3"
      return nextNumber;
    } catch (err) {
      console.error('❌ Erreur comptage consultations:', err);
      setConsultationNumber(1);
      return 1;
    }
  };

  // ✅ Chargement des IDs + Numéro de consultation au montage
  useEffect(() => {
    const loadData = async () => {
      const { cId, pId } = getIds();
      
      if (pId) {
        setPatientId(pId);
        if (cId) setConsultationId(cId);
        setIdsReady(true);
        
        localStorage.setItem('current_patient_id', String(pId));
        if (cId) localStorage.setItem('current_consultation_id', String(cId));
        
        console.log('✅ OphtalmoAnalyse - IDs chargés:', { cId, pId });
        
        // 🔢 Récupérer automatiquement le numéro de consultation (NOMBRE)
        await fetchConsultationNumber(pId);
        
      } else {
        console.error('❌ OphtalmoAnalyse - PatientId MANQUANT');
        
        showNotification(
          'error', 
          'Patient non sélectionné', 
          'Vous devez sélectionner un patient depuis la liste pour continuer.',
          ['Redirection automatique dans 3 secondes...']
        );
        
        setTimeout(() => {
          navigate('/old-consultation', { 
            state: { 
              from: 'ophtalmo-analyse',
              message: 'Veuillez sélectionner un patient avant de demander des examens'
            } 
          });
        }, 3000);
      }
    };
    
    loadData();
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

  // 🎯 Votre fonction addTag (PRÉSERVÉE)
  const addTag = (cat: string, val: string) => {
    setSelectedAnalyses(prev => {
      const currentCatItems = prev[cat] || [];
      if (currentCatItems.includes(val)) return prev; // Évite les doublons
      return {
        ...prev,
        [cat]: [...currentCatItems, val]
      };
    });
  };

  // Formatage du texte pour le textarea (votre code préservé)
  const formatAnalysesText = () => {
    return Object.entries(selectedAnalyses)
      .map(([cat, items]) => `${cat}: ${items.join(", ")}`)
      .join("\n");
  };

  // 💾 Sauvegarde avec API Django (VÉRIFICATION patientId OBLIGATOIRE)
  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ VÉRIFICATION STRICTE : patientId OBLIGATOIRE
    if (!patientId || !consultationId) {
      showNotification(
        'error', 
        'Erreur critique', 
        'Patient ou consultation non sélectionné. Impossible d\'enregistrer.',
        ['Veuillez recharger la page ou retourner à la consultation']
      );
      return;
    }

    // Validation frontend
    if (!centre.trim() || !doctor.trim() || !phone.trim() || Object.keys(selectedAnalyses).length === 0) {
      showNotification('error', 'Champs obligatoires', 'Veuillez remplir le centre, le soignant, le téléphone et sélectionner au moins un examen.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        consultation: consultationId,  // ← ID OBLIGATOIRE
        patient: patientId,            // ← ID OBLIGATOIRE
        service: "ophtalmologie",      // ← Service fixe
        centre_labo: centre.trim(),
        nom_soignant: doctor.trim(),
        tel_soignant: phone.trim(),
        analyses_demandees: formatAnalysesText(),
        motif: motif.trim() || 'Examen ophtalmologique de routine',
      };

      console.log('📤 Payload analyses-labo ophtalmo:', payload);

      // ✅ Appel API via apiFetch
      const newAnalyse = await apiFetch<any>('analyses-labo/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const analyseId = newAnalyse?.id;
      if (!analyseId) {
        throw new Error('L\'API n\'a pas retourné d\'ID d\'analyse');
      }
      
      console.log('✅ Analyse ophtalmo créée:', analyseId);

      // ✅ Stockage des IDs pour le workflow
      localStorage.setItem('current_lab_result_id', String(analyseId));
      localStorage.setItem('current_workflow_step', 'paiement');

      // ✅ Notification succès
      showNotification(
        'success',
        'Examens envoyés',
        'Les demandes d\'examens ont été transmises au laboratoire.',
        [`👨‍⚕️ ${doctor}`, `🏥 ${centre}`]
      );

      // Reset formulaire
      setSelectedAnalyses({});
      setMotif("");
      setCentre("");
      setDoctor("");
      setPhone("");

      // ✅✅✅ REDIRECTION AUTOMATIQUE VERS PAIEMENT avec TOUS les IDs
      setTimeout(() => {
        console.log('🚀 Navigation vers paiement avec IDs:', {
          consultationId,
          patientId,
          analyseId
        });
        
        navigate('/payement', {
          state: { 
            consultationId,
            patientId,
            labResultId: analyseId,
            from: 'ophtalmo-analyse',
            type: 'consultation',
            step: 'paiement'
          } 
        });
      }, 1500);

    } catch (err: any) {
      console.error('❌ Erreur API:', err);
      
      if (err.message === 'Authentification requise') {
        showNotification('info', 'Redirection...', 'Veuillez vous reconnecter pour continuer.');
        return;
      }
      
      const errorDetails = err.validationErrors 
        ? Object.entries(err.validationErrors).map(([field, msgs]) => 
            `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
        : [err.message || 'Erreur inconnue'];
      
      showNotification('error', 'Échec de l\'envoi', errorDetails.join(', '));
    } finally {
      setLoading(false);
    }
  };

  const cancelForm = () => {
    if (window.confirm("Annuler la demande d'examens ?")) {
      setSelectedAnalyses({});
      setMotif("");
      setCentre("");
      setDoctor("");
      setPhone("");
      showNotification('info', 'Formulaire réinitialisé', 'Tous les champs ont été effacés.');
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
    sectionHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      backgroundColor: '#f0fdf4',
      padding: '12px 15px',
      borderRadius: '10px',
      color: '#0d9488',
      fontWeight: '600',
      marginBottom: '20px',
      borderLeft: '4px solid #0d9488',
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
    label: {
      fontWeight: '600',
      fontSize: '14px',
      color: '#475569',
      display: 'block',
      marginBottom: '6px',
    },
    required: { color: '#ef4444' },
    input: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: '2px solid #e2e8f0',
      fontSize: '14px',
      outline: 'none',
      backgroundColor: '#f8fafc',
      transition: 'all 0.2s',
      boxSizing: 'border-box' as const,
    },
    select: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: '2px solid #e2e8f0',
      fontSize: '14px',
      outline: 'none',
      backgroundColor: '#f8fafc',
      transition: 'all 0.2s',
      boxSizing: 'border-box' as const,
    },
    textarea: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: '2px solid #e2e8f0',
      fontSize: '14px',
      outline: 'none',
      backgroundColor: '#f8fafc',
      minHeight: '100px',
      resize: 'vertical' as const,
      fontFamily: 'inherit',
      transition: 'all 0.2s',
      boxSizing: 'border-box' as const,
    },
    tagButton: {
      padding: '8px 14px',
      backgroundColor: '#f0fdf4',
      border: '2px solid #0d9488',
      color: '#0d9488',
      borderRadius: '20px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '500',
      transition: 'all 0.2s',
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
      backgroundColor: '#0d9488',
      color: 'white',
    },
    btnSelectPatient: {
      backgroundColor: '#ef4444',
      color: 'white',
      marginTop: '16px',
    },
    consultationBadge: {
      fontSize: '16px',
      fontWeight: '700',
      opacity: 0.95,
      marginLeft: '12px',
      padding: '6px 16px',
      backgroundColor: 'rgba(255,255,255,0.25)',
      borderRadius: '24px',
      color: 'white',
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
    <form onSubmit={submitForm} style={styles.page}>
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
        .tag-btn:hover {
          background-color: '#0d9488' !important;
          color: 'white' !important;
          transform: translateY(-1px);
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
            <button type="button" onClick={() => setNotification(p => ({ ...p, show: false }))} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', opacity: 0.6, color: 'inherit' }}>×</button>
          </div>
        </div>
      )}

      {/* Header avec bouton retour + Badge numéro consultation (NOMBRE SEULEMENT) */}
      <header style={styles.header}>
        <button 
          type="button"
          style={styles.backBtn}
          onClick={() => navigate('/patient')}
          onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.3)'}
          onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.2)'}
        >
          <FaArrowLeft /> Retour
        </button>
        <h1 style={styles.title}>
          <FaFlask size={24} /> 🔬 Examens Ophtalmologiques
          {/* ✅✅✅ NUMÉRO SEUL (pas #3, juste 3) */}
          {consultationNumber !== null && (
            <span style={styles.consultationBadge}>
              {consultationNumber}
            </span>
          )}
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
              Vous devez impérativement sélectionner un patient depuis la liste pour demander des examens ophtalmologiques.
            </p>
            <p style={{ fontSize: '14px', color: '#991b1b', marginBottom: '20px' }}>
              Redirection automatique vers la liste des patients...
            </p>
            <button 
              type="button"
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
              <span>✅ Patient sélectionné</span>
            </div>
            {/* ✅✅✅ NUMÉRO SEUL (pas #3, juste 3) */}
            <div>
              Consultation: <strong style={{ color: '#22c55e' }}>
                {consultationNumber !== null ? consultationNumber : '...'}
              </strong>
              <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '8px' }}>
                (pour ce patient)
              </span>
            </div>
            <div>Patient ID: <strong style={{ color: '#22c55e' }}>{patientId}</strong></div>
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#166534' }}>
              ✅ Workflow complet autorisé (Analyse → Paiement → Retour Patient)
            </div>
          </div>
        )}

        {/* Formulaire — DÉSACTIVÉ si pas de patientId */}
        <div className={!idsReady ? 'blocked-form' : ''}>
          
          {/* SECTION 1: INFORMATION DU SOIGNANT */}
          <div style={styles.sectionHeader}>
            <FaUserMd size={20} color="#0d9488" /> <span>Information du soignant</span>
          </div>
          
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Service</label>
              {/* ✅ SERVICE FIXE : Ophtalmologie en lecture seule */}
              <select 
                value="Ophtalmologie" 
                disabled
                style={{...styles.select, backgroundColor: '#f8fafc', cursor: 'not-allowed', opacity: 0.8, fontWeight: '600'}} 
              >
                <option>Ophtalmologie</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Centre <span style={styles.required}>*</span></label>
              <div style={{ position: 'relative' }}>
                <FaBuilding style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '14px' }} />
                <input 
                  value={centre} 
                  onChange={e => setCentre(e.target.value)} 
                  placeholder="Clinique Ophtalmologique" 
                  style={{...styles.input, paddingLeft: '38px'}}
                  disabled={loading || !idsReady}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Nom du soignant <span style={styles.required}>*</span></label>
              <input 
                value={doctor} 
                onChange={e => setDoctor(e.target.value)} 
                placeholder="Dr. Nom Prénom" 
                style={styles.input}
                disabled={loading || !idsReady}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Téléphone <span style={styles.required}>*</span></label>
              <div style={{ position: 'relative' }}>
                <FaPhone style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '14px' }} />
                <input 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  placeholder="+228..." 
                  style={{...styles.input, paddingLeft: '38px'}}
                  disabled={loading || !idsReady}
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: TYPE D'EXAMEN RAPIDE */}
          <div style={styles.sectionHeader}>
            <FaClipboardList size={20} color="#0d9488" /> <span>TYPE D'EXAMEN (Cliquer pour ajouter)</span>
          </div>
          
          {Object.entries(categories).map(([cat, tags]) => (
            <div key={cat} style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '5px 0 10px 0', fontSize: '13px', color: '#0d9488', fontWeight: '700', textTransform: 'uppercase' as const }}>{cat}</h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {tags.map(tag => {
                  const isSelected = (selectedAnalyses[cat] || []).includes(tag);
                  return (
                    <button 
                      key={tag} 
                      type="button"
                      onClick={() => !loading && !idsReady ? null : addTag(cat, tag)}
                      disabled={loading || !idsReady}
                      style={{
                        ...styles.tagButton,
                        backgroundColor: isSelected ? '#0d9488' : '#f0fdf4',
                        color: isSelected ? 'white' : '#0d9488',
                        opacity: (loading || !idsReady) ? 0.6 : 1,
                        cursor: (loading || !idsReady) ? 'not-allowed' : 'pointer',
                      }}
                      className="tag-btn"
                      onMouseEnter={(e) => { 
                        if (!loading && idsReady && !isSelected) {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0d9488';
                          (e.currentTarget as HTMLButtonElement).style.color = 'white';
                        }
                      }}
                      onMouseLeave={(e) => { 
                        if (!loading && idsReady && !isSelected) {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f0fdf4';
                          (e.currentTarget as HTMLButtonElement).style.color = '#0d9488';
                        }
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* SECTION 3: RÉSULTAT ET MOTIF */}
          <div style={{ marginBottom: '25px' }}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{...styles.label, marginBottom: '8px'}}>Examens demandés <span style={styles.required}>*</span></label>
              <textarea
                rows={5}
                value={formatAnalysesText()}
                readOnly
                placeholder="Sélectionnez les examens ci-dessus..."
                style={{ ...styles.textarea, backgroundColor: '#f9f9f9', cursor: 'default' }}
                disabled={loading || !idsReady}
              />
            </div>

            <div>
              <label style={{...styles.label, marginBottom: '8px'}}>Motif de l'examen</label>
              <textarea
                rows={2}
                value={motif}
                onChange={e => setMotif(e.target.value)}
                placeholder="Précisez le motif si nécessaire..."
                style={{ ...styles.textarea, minHeight: '60px', resize: 'vertical' as const }}
                disabled={loading || !idsReady}
              />
            </div>
          </div>

          {/* BOUTONS */}
          <div style={styles.buttonGroup}>
            <button 
              type="button"
              style={{ ...styles.btn, ...styles.btnCancel }}
              onClick={cancelForm}
              disabled={loading || !idsReady}
              onMouseEnter={(e) => { if (!loading && idsReady) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#e2e8f0'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f1f5f9'; }}
            >
              ✖ Annuler
            </button>
            <button 
              type="submit"
              style={{ 
                ...styles.btn, 
                ...styles.btnSave,
                opacity: (loading || !idsReady) ? 0.7 : 1,
                cursor: (loading || !idsReady) ? 'not-allowed' : 'pointer'
              }}
              disabled={loading || !idsReady}
              onMouseEnter={(e) => { if (!loading && idsReady) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0f766e'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0d9488'; }}
            >
              {loading ? (
                <>
                  <FaRedo size={18} style={{ animation: 'spin 1s linear infinite' }} /> Envoi en cours...
                </>
              ) : (
                <><FaClipboardList size={18} /> Envoyer au patient</>
              )}
            </button>
          </div>
          
        </div>
      </div>
    </form>
  );
}