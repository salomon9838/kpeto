import React, { useState, useEffect, CSSProperties } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/api';
import { 
  FileSearch, 
  Stethoscope, 
  Building, 
  Phone, 
  User, 
  Send, 
  Focus, 
  HeartPulse,
  ClipboardCheck,
  CheckCircle,
  AlertTriangle,
  Info,
  ArrowLeft,
  Redo
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

interface RadioFormData {
  centre: string;
  medecin: string;
  tel: string;
  typeAnalyse: string;
  region: string;
  motif: string;
}

// =============================================================================
// COMPOSANT PRINCIPAL — RADIO CARDIOLOGIE (PROFESSIONNEL + API + IDs)
// =============================================================================
function Radio({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
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
    
    console.log('🔍 RadioCardio - Debug IDs:', { 
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

  // === ÉTATS DU FORMULAIRE ===
  const [form, setForm] = useState<RadioFormData>({
    centre: "",
    medecin: "",
    tel: "",
    typeAnalyse: "",
    region: "",
    motif: "",
  });

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    show: false, type: 'info', title: '', message: '', details: []
  });

  // 🔢 Fonction pour récupérer le numéro de consultation automatique
  const fetchConsultationNumber = async (pid: number) => {
    try {
      console.log(`📊 Récupération du nombre de consultations pour patient #${pid}...`);
      const consultations = await apiFetch<any[]>(`consultations/?patient=${pid}&service=cardiologie`);
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
        
        console.log('✅ RadioCardio - IDs chargés:', { cId, pId });
        
        // 🔢 Récupérer automatiquement le numéro de consultation
        await fetchConsultationNumber(pId);
        
      } else {
        console.error('❌ RadioCardio - PatientId MANQUANT');
        
        showNotification(
          'error', 
          'Patient non sélectionné', 
          'Vous devez sélectionner un patient depuis la liste pour continuer.',
          ['Redirection automatique dans 3 secondes...']
        );
        
        setTimeout(() => {
          navigate('/old-consultation', { 
            state: { 
              from: 'cardiologie-radio',
              message: 'Veuillez sélectionner un patient avant de demander un examen radio'
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

  // 📝 Gestion des changements de formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.id]: e.target.value });
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
    if (!form.centre.trim() || !form.medecin.trim() || !form.tel.trim() || 
        !form.typeAnalyse.trim() || !form.region.trim() || !form.motif.trim()) {
      showNotification('error', 'Champs obligatoires', 'Veuillez remplir tous les champs marqués d\'une étoile.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        consultation: consultationId,  // ← ID OBLIGATOIRE
        patient: patientId,            // ← ID OBLIGATOIRE
        service: "cardiologie",        // ← Service fixe
        centre_radio: form.centre.trim(),
        nom_soignant: form.medecin.trim(),
        tel_soignant: form.tel.trim(),
        type_analyse: form.typeAnalyse.trim(),
        region_a_examiner: form.region.trim(),  // ← Nom exact du modèle Django
        motif: form.motif.trim(),
      };

      console.log('📤 Payload radio cardiologie:', payload);

      // ✅ Appel API via apiFetch
      const newRadio = await apiFetch<any>('analyses-radio/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const radioId = newRadio?.id;
      if (!radioId) {
        throw new Error('L\'API n\'a pas retourné d\'ID d\'analyse radio');
      }
      
      console.log('✅ Analyse radio créée:', radioId);

      // ✅ Stockage des IDs pour le workflow
      localStorage.setItem('current_radio_result_id', String(radioId));
      localStorage.setItem('current_workflow_step', 'paiement');

      // ✅ Notification succès
      showNotification(
        'success',
        'Analyse radio envoyée',
        'La demande d\'examen a été transmise au service de radiologie.',
        [`👨‍⚕️ ${form.medecin}`, `🏥 ${form.centre}`]
      );

      // Reset formulaire
      setForm({
        centre: "", medecin: "", tel: "",
        typeAnalyse: "", region: "", motif: "",
      });

      // ✅✅✅ REDIRECTION AUTOMATIQUE VERS PAIEMENT avec TOUS les IDs
      setTimeout(() => {
        console.log('🚀 Navigation vers paiement avec IDs:', {
          consultationId,
          patientId,
          radioId
        });
        
        if (setActiveTab) {
          setActiveTab('paiement');
        } else {
          navigate('/payement', {
            state: { 
              consultationId,
              patientId,
              radioResultId: radioId,
              from: 'radio',
              type: 'consultation',
              step: 'paiement'
            } 
          });
        }
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

  // ❌ Annulation
  const cancelForm = () => {
    if (window.confirm("Annuler la demande d'examen ?")) {
      setForm({
        centre: "", medecin: "", tel: "",
        typeAnalyse: "", region: "", motif: "",
      });
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
      maxWidth: '900px',
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
      marginTop: '10px',
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
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '30px',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
    },
    label: {
      fontWeight: '500',
      fontSize: '0.9rem',
      color: '#475569',
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
    },
    required: { color: '#ef4444' },
    input: {
      padding: '12px',
      borderRadius: '8px',
      border: '2px solid #e2e8f0',
      fontSize: '0.95rem',
      outline: 'none',
      backgroundColor: '#f8fafc',
      transition: 'all 0.2s',
      width: '100%',
      boxSizing: 'border-box' as const,
    },
    inputWithIcon: {
      padding: '12px 12px 12px 40px',
      borderRadius: '8px',
      border: '2px solid #e2e8f0',
      fontSize: '0.95rem',
      outline: 'none',
      backgroundColor: '#f8fafc',
      transition: 'all 0.2s',
      width: '100%',
      boxSizing: 'border-box' as const,
    },
    textarea: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: '2px solid #e2e8f0',
      fontSize: '0.95rem',
      minHeight: '100px',
      fontFamily: 'inherit',
      resize: 'vertical' as const,
      outline: 'none',
      backgroundColor: '#f8fafc',
      transition: 'all 0.2s',
      boxSizing: 'border-box' as const,
    },
    buttonGroup: {
      textAlign: 'right' as const,
      marginTop: '20px',
    },
    btn: {
      padding: '14px 45px',
      borderRadius: '12px',
      border: 'none',
      fontWeight: 'bold',
      fontSize: '1rem',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '12px',
      transition: 'all 0.2s',
      boxShadow: '0 4px 14px rgba(13, 148, 136, 0.4)',
    },
    btnCancel: {
      backgroundColor: '#f1f5f9',
      color: '#64748b',
      marginRight: '12px',
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
      `}</style>

      {/* 🔔 Notification */}
      {notification.show && (
        <div style={getNotificationStyles()} role="alert">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ fontSize: '18px', marginTop: '1px', color: notification.type === 'error' ? '#ef4444' : notification.type === 'success' ? '#22c55e' : '#0d9488' }}>
              {notification.type === 'success' && <CheckCircle size={18} />}
              {notification.type === 'error' && <AlertTriangle size={18} />}
              {notification.type === 'info' && <Info size={18} />}
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
          <ArrowLeft size={18} /> Retour
        </button>
        <h1 style={styles.title}>
          <HeartPulse size={24} color="#fff" /> 📷 Demande Radio Cardiologie
          {consultationNumber && (
            <span style={styles.consultationBadge}>#{consultationNumber}</span>
          )}
        </h1>
        <div style={{ width: '100px' }} />
      </header>

      <div style={styles.container} className="card-hover">
        
        {/* 🚫 BLOCAGE TOTAL si patientId manquant */}
        {!idsReady && (
          <div style={styles.blockingBox}>
            <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#991b1b', marginBottom: '12px' }}>
              ⛔ Accès refusé — Patient non sélectionné
            </h3>
            <p style={{ fontSize: '15px', color: '#7f1d1d', marginBottom: '8px' }}>
              Vous devez impérativement sélectionner un patient depuis la liste pour demander un examen radiologique.
            </p>
            <p style={{ fontSize: '14px', color: '#991b1b', marginBottom: '20px' }}>
              Redirection automatique vers la liste des patients...
            </p>
            <button 
              onClick={() => navigate('/old-consultation')}
              style={{ ...styles.btn, ...styles.btnSelectPatient }}
            >
              <User size={18} /> Sélectionner un patient maintenant
            </button>
          </div>
        )}

        {/* ✅ Box de confirmation si IDs présents */}
        {idsReady && (
          <div style={styles.debugBox}>
            <div style={{ fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={18} color="#22c55e" />
              <span>Patient sélectionné</span>
            </div>
            
           <div>Consultation: <strong style={{ color: consultationId ? '#22c55e' : '#64748b' }}>{consultationId}</strong></div>
            <div>Patient ID: <strong style={{ color: '#22c55e' }}>{patientId}</strong></div>
            
          </div>
        )}

        {/* Formulaire — DÉSACTIVÉ si pas de patientId */}
        <form onSubmit={submitForm} className={!idsReady ? 'blocked-form' : ''}>
          
          {/* --- SECTION 1 : ÉMETTEUR --- */}
          <div style={styles.sectionHeader}>
            <User size={20} color="#0d9488" /> <span>Informations du prescripteur</span>
          </div>

          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Service</label>
              {/* ✅ SERVICE FIXE : Cardiologie en lecture seule */}
              <input 
                value="Cardiologie" 
                readOnly 
                style={{...styles.input, backgroundColor: '#f8fafc', cursor: 'not-allowed', opacity: 0.8, fontWeight: 'bold'}} 
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Centre <span style={styles.required}>*</span></label>
              <div style={{ position: 'relative' }}>
                <Building size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  id="centre"
                  placeholder="Ex: Clinique de l'Espoir" 
                  value={form.centre}
                  onChange={handleChange}
                  style={styles.inputWithIcon}
                  disabled={loading || !idsReady}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Médecin <span style={styles.required}>*</span></label>
              <div style={{ position: 'relative' }}>
                <Stethoscope size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  id="medecin"
                  placeholder="Dr. Salomon" 
                  value={form.medecin}
                  onChange={handleChange}
                  style={styles.inputWithIcon}
                  disabled={loading || !idsReady}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Téléphone <span style={styles.required}>*</span></label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  id="tel"
                  placeholder="+228..." 
                  value={form.tel}
                  onChange={handleChange}
                  style={styles.inputWithIcon}
                  disabled={loading || !idsReady}
                />
              </div>
            </div>
          </div>

          {/* --- SECTION 2 : DETAILS EXAMEN --- */}
          <div style={styles.sectionHeader}>
            <Focus size={20} color="#0d9488" /> <span>Détails de l'analyse</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '30px' }}>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                 <HeartPulse size={16} color="#0d9488" /> Type d'analyse <span style={styles.required}>*</span>
              </label>
              <textarea 
                id="typeAnalyse"
                placeholder="Ex: Échographie Doppler Cardiaque, ECG, Radio Thoracique..." 
                value={form.typeAnalyse}
                onChange={handleChange}
                style={{...styles.textarea, minHeight: '80px'}}
                disabled={loading || !idsReady}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                 <Focus size={16} color="#0d9488" /> Région à examiner <span style={styles.required}>*</span>
              </label>
              <textarea 
                id="region"
                placeholder="Ex: Région précordiale, thorax de face..." 
                value={form.region}
                onChange={handleChange}
                style={{...styles.textarea, minHeight: '80px'}}
                disabled={loading || !idsReady}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                 <ClipboardCheck size={16} color="#0d9488" /> Motif de l'examen <span style={styles.required}>*</span>
              </label>
              <textarea 
                id="motif"
                placeholder="Ex: Suspicion d'insuffisance mitrale, essoufflement à l'effort..." 
                value={form.motif}
                onChange={handleChange}
                style={{...styles.textarea, minHeight: '80px'}}
                disabled={loading || !idsReady}
              />
            </div>
          </div>

          {/* Boutons */}
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
                  <Redo size={18} style={{ animation: 'spin 1s linear infinite' }} /> Envoi en cours...
                </>
              ) : (
                <><Send size={18} /> Transmettre la demande</>
              )}
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
}

export default Radio;