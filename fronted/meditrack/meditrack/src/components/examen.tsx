import React, { useState, useEffect, CSSProperties } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/api';
import { 
  User, 
  Stethoscope, 
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
// COMPOSANT PRINCIPAL — EXAM CARDIOLOGIE (PatientId OBLIGATOIRE)
// =============================================================================
function Exam({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 🔍 Récupération STRICTE des IDs (patientId OBLIGATOIRE)
  const getIds = () => {
    // 1️⃣ Essayer depuis location.state (React Router)
    const cIdState = location.state?.consultationId;
    const pIdState = location.state?.patientId;
    
    // 2️⃣ Essayer depuis localStorage (fallback)
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

  // === ÉTATS DU FORMULAIRE ===
  const [form, setForm] = useState<ExamFormData>({
    centre: "",
    doc: "",
    tel: "",
    poids: "",
    taille: "",
    temperature: "",
    ta_gauche: "",
    ta_droit: "",
    pouls: "",
    observations: "",
  });

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    show: false, type: 'info', title: '', message: '', details: []
  });

  // ✅ Chargement des IDs au montage (BLOQUANT si patientId manquant)
  useEffect(() => {
    const { cId, pId } = getIds();
    
    if (pId) {
      // ✅ Patient ID présent → on peut continuer
      setPatientId(pId);
      if (cId) setConsultationId(cId);
      setIdsReady(true);
      
      // Re-stocker pour sécurité
      localStorage.setItem('current_patient_id', String(pId));
      if (cId) localStorage.setItem('current_consultation_id', String(cId));
      
      console.log('✅ ExamCardio - IDs chargés:', { cId, pId });
    } else {
      // ❌ Patient ID MANQUANT → BLOCAGE TOTAL
      console.error('❌ ExamCardio - PatientId MANQUANT - Blocage du formulaire');
      
      showNotification(
        'error', 
        'Patient non sélectionné', 
        'Vous devez sélectionner un patient depuis la liste pour continuer.',
        ['Redirection automatique dans 3 secondes...']
      );
      
      // Redirection forcée après 3 secondes
      setTimeout(() => {
        navigate('/old-consultation', { 
          state: { 
            from: 'cardiologie',
            message: 'Veuillez sélectionner un patient avant de consulter'
          } 
        });
      }, 3000);
    }
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

  // 💾 Sauvegarde avec API Django (VÉRIFICATION patientId OBLIGATOIRE + Validation médicale)
const saveExam = async () => {
  // ✅ VÉRIFICATION STRICTE : patientId OBLIGATOIRE
  if (!patientId) {
    showNotification(
      'error', 
      'Erreur critique', 
      'Patient non sélectionné. Impossible d\'enregistrer la consultation.',
      ['Veuillez recharger la page ou retourner à la liste des patients']
    );
    return;
  }

  // ✅ VALIDATION FRONTEND DES CHAMPS OBLIGATOIRES
  if (!form.centre.trim() || !form.doc.trim() || !form.tel.trim()) {
    showNotification('error', 'Champs obligatoires', 'Veuillez remplir le centre, le médecin et le téléphone.');
    return;
  }

  // ✅ VALIDATION DES VALEURS MÉDICALES (pour éviter les erreurs 400)
  
  // Température : 35-42°C (valeurs médicalement plausibles)
  if (form.temperature) {
    const temp = parseFloat(form.temperature);
    if (isNaN(temp) || temp < 35 || temp > 42) {
      showNotification(
        'error', 
        'Température invalide', 
        'La température doit être comprise entre 35°C et 42°C.',
        [`Valeur saisie: ${form.temperature}°C`]
      );
      return;
    }
  }

  // Poids : 0.5-300 kg
  if (form.poids) {
    const poids = parseFloat(form.poids);
    if (isNaN(poids) || poids < 0.5 || poids > 300) {
      showNotification(
        'error', 
        'Poids invalide', 
        'Le poids doit être compris entre 0.5 kg et 300 kg.',
        [`Valeur saisie: ${form.poids} kg`]
      );
      return;
    }
  }

  // Taille : 20-250 cm
  if (form.taille) {
    const taille = parseFloat(form.taille);
    if (isNaN(taille) || taille < 20 || taille > 250) {
      showNotification(
        'error', 
        'Taille invalide', 
        'La taille doit être comprise entre 20 cm et 250 cm.',
        [`Valeur saisie: ${form.taille} cm`]
      );
      return;
    }
  }

  // Pouls : 30-220 bpm
  if (form.pouls) {
    const pouls = parseInt(form.pouls, 10);
    if (isNaN(pouls) || pouls < 30 || pouls > 220) {
      showNotification(
        'error', 
        'Pouls invalide', 
        'Le pouls doit être compris entre 30 et 220 bpm.',
        [`Valeur saisie: ${form.pouls} bpm`]
      );
      return;
    }
  }

  // TA : format "XX/YY" avec valeurs plausibles
  const validateTA = (ta: string, label: string): boolean => {
    if (!ta) return true;
    const parts = ta.split('/');
    if (parts.length !== 2) {
      showNotification('error', `${label} invalide`, 'Format attendu: "12/8" (systolique/diastolique).');
      return false;
    }
    const sys = parseInt(parts[0], 10);
    const dia = parseInt(parts[1], 10);
    if (isNaN(sys) || isNaN(dia) || sys < 60 || sys > 250 || dia < 40 || dia > 150) {
      showNotification(
        'error', 
        `${label} invalide`, 
        'TA systolique: 60-250 mmHg, diastolique: 40-150 mmHg.',
        [`Valeur saisie: ${ta}`]
      );
      return false;
    }
    return true;
  };

  if (!validateTA(form.ta_gauche, 'TA bras gauche') || !validateTA(form.ta_droit, 'TA bras droit')) {
    return;
  }

  setLoading(true);
  try {
    // ✅ PAYLOAD AVEC VALEURS CORRECTES
    const payload = {
      patient: patientId,              // ← ID OBLIGATOIRE (number)
      service: "cardio",          // ← DOIT correspondre EXACTEMENT à doctor_profile.specialty
      centre_medical: form.centre.trim(),
      nom_soignant: form.doc.trim(),
      tel_soignant: form.tel.trim(),
      motif_consultation: 'Consultation cardiologique',
      poids: form.poids ? parseFloat(form.poids) : null,
      taille: form.taille ? parseFloat(form.taille) : null,
      temperature: form.temperature ? parseFloat(form.temperature) : null,
      ta_bras_gauche: form.ta_gauche.trim() || null,
      ta_bras_droit: form.ta_droit.trim() || null,
      pouls: form.pouls ? parseInt(form.pouls, 10) : null,
      observations_cliniques: form.observations.trim() || null,
    };

    console.log('📤 Payload cardiologie:', JSON.stringify(payload, null, 2));

    // ✅ APPEL API AVEC GESTION D'ERREUR AMÉLIORÉE
    // On utilise fetch directement pour mieux voir les erreurs Django
    const token = localStorage.getItem('access_token');
    const response = await fetch('http://localhost:8000/api/consultations/', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('📥 Status HTTP:', response.status);
    console.log('📥 Content-Type:', response.headers.get('content-type'));

    const responseText = await response.text();
    console.log('📥 Response body:', responseText);

    if (!response.ok) {
      // ✅ Tenter de parser JSON pour afficher les erreurs de validation Django
      try {
        const errorData = JSON.parse(responseText);
        console.error('❌ Erreurs de validation Django:', errorData);
        
        // Traduction des noms de champs pour l'affichage
        const fieldLabels: Record<string, string> = {
          patient: 'Patient',
          service: 'Service',
          centre_medical: 'Centre médical',
          nom_soignant: 'Nom du soignant',
          tel_soignant: 'Téléphone',
          motif_consultation: 'Motif',
          poids: 'Poids',
          taille: 'Taille',
          temperature: 'Température',
          ta_bras_gauche: 'TA bras gauche',
          ta_bras_droit: 'TA bras droit',
          pouls: 'Pouls',
          observations_cliniques: 'Observations',
        };

        const errorMessages = Object.entries(errorData).map(([field, msgs]) => {
          const label = fieldLabels[field] || field;
          const messages = Array.isArray(msgs) ? msgs.join(', ') : msgs;
          return `🔴 ${label}: ${messages}`;
        });

        throw new Error(`Validation échouée:\n${errorMessages.join('\n')}`);
        
      } catch (parseErr) {
        // Si ce n'est pas du JSON, afficher le texte brut
        throw new Error(`Erreur ${response.status}: ${responseText.substring(0, 300)}`);
      }
    }

    // ✅ Réponse réussie
    const newConsultation = JSON.parse(responseText);
    const newConsultationId = newConsultation?.id;
    
    if (!newConsultationId) {
      throw new Error('L\'API n\'a pas retourné d\'ID de consultation');
    }
    
    console.log('✅ Consultation cardiologie créée:', newConsultationId);

    // ✅ Stockage des IDs pour le workflow
    localStorage.setItem('current_consultation_id', String(newConsultationId));
    localStorage.setItem('current_patient_id', String(patientId));
    localStorage.setItem('current_workflow_step', 'ordonnance');

    // ✅ Notification succès
    showNotification(
      'success',
      'Examen cardiologique enregistré',
      'Données sauvegardées avec succès.',
      [`👨‍⚕️ ${form.doc}`, `🏥 ${form.centre}`]
    );

    // Reset formulaire
    setForm({
      centre: "", doc: "", tel: "",
      poids: "", taille: "", temperature: "",
      ta_gauche: "", ta_droit: "", pouls: "",
      observations: "",
    });

    // ✅✅✅ REDIRECTION AUTOMATIQUE VERS ORDONNANCE CARDIO
    setTimeout(() => {
      console.log('🚀 Navigation vers ordonnance avec IDs:', {
        consultationId: newConsultationId,
        patientId
      });
      
      if (setActiveTab) {
        setActiveTab('ordonnance');
      } else {
        navigate('/cardiologie/ordonnance', {
          state: { 
            consultationId: newConsultationId,
            patientId,
            step: 'ordonnance'
          } 
        });
      }
    }, 1500);

  } catch (err: any) {
    console.error('❌ Erreur API:', err);
    
    // Gestion des erreurs d'authentification
    if (err.message === 'Authentification requise' || err.message?.includes('401')) {
      showNotification('info', 'Session expirée', 'Veuillez vous reconnecter pour continuer.');
      localStorage.removeItem('access_token');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    
    // Gestion des erreurs de validation Django
    let errorDetails: string[] = [];
    
    if (err.validationErrors) {
      errorDetails = Object.entries(err.validationErrors).map(([field, msgs]) => 
        `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`
      );
    } else if (err.message) {
      // Extraire les lignes qui commencent par 🔴 (erreurs de validation)
      const lines = err.message.split('\n');
      errorDetails = lines.filter((l: string) => l.startsWith('🔴'));
      
      if (errorDetails.length === 0) {
        // Si pas d'erreurs formatées, afficher le message brut
        errorDetails = [err.message.split('\n')[0]];
      }
    } else {
      errorDetails = ['Erreur inconnue - Vérifiez la console (F12)'];
    }
    
    console.error('🚨 Détails des erreurs:', errorDetails);
    
    showNotification(
      'error', 
      'Échec de l\'enregistrement', 
      errorDetails[0] || 'Le serveur a rejeté la demande.',
      errorDetails.length > 1 ? errorDetails.slice(1) : undefined
    );
    
  } finally {
    setLoading(false);
  }
};

  // ❌ Annulation
  const cancelExam = () => {
    if (window.confirm("Annuler le formulaire ?")) {
      setForm({
        centre: "", doc: "", tel: "",
        poids: "", taille: "", temperature: "",
        ta_gauche: "", ta_droit: "", pouls: "",
        observations: "",
      });
      showNotification('info', 'Formulaire réinitialisé', 'Tous les champs ont été effacés.');
    }
  };

  // =============================================================================
  // STYLES PROFESSIONNELS
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
      padding: '10px 15px',
      borderRadius: '8px',
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
    formGrid3: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '15px',
      marginBottom: '30px',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '6px',
    },
    label: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#475569',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    required: { color: '#ef4444' },
    input: {
      padding: '12px',
      borderRadius: '8px',
      border: '2px solid #e2e8f0',
      fontSize: '15px',
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
      fontSize: '15px',
      outline: 'none',
      backgroundColor: '#f8fafc',
      transition: 'all 0.2s',
      width: '100%',
      boxSizing: 'border-box' as const,
    },
    textarea: {
      padding: '15px',
      borderRadius: '8px',
      border: '2px solid #e2e8f0',
      fontSize: '15px',
      outline: 'none',
      backgroundColor: '#f8fafc',
      minHeight: '140px',
      resize: 'vertical' as const,
      fontFamily: 'inherit',
      width: '100%',
      boxSizing: 'border-box' as const,
    },
    buttonGroup: {
      textAlign: 'right' as const,
      marginTop: '30px',
    },
    btn: {
      padding: '14px 40px',
      borderRadius: '10px',
      border: 'none',
      fontWeight: 'bold',
      fontSize: '1rem',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s',
      boxShadow: '0 4px 6px -1px rgba(13, 148, 136, 0.4)',
    },
    btnCancel: {
      backgroundColor: '#f1f5f9',
      color: '#64748b',
      marginRight: '12px',
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

      {/* Header avec bouton retour */}
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
          <Heart size={24} color="#fff" /> ❤️ Examen Cardiologique
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
              Vous devez impérativement sélectionner un patient depuis la liste pour effectuer une consultation cardiologique.
            </p>
            <p style={{ fontSize: '14px', color: '#991b1b', marginBottom: '20px' }}>
              Redirection automatique vers la liste des patients...
            </p>
            <button 
              onClick={() => navigate('/old-consultation')}
              style={{ ...styles.btn, ...styles.btnSelectPatient }}
            >
              <Users size={18} /> Sélectionner un patient maintenant
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
           
            <div>Patient ID: <strong style={{ color: '#22c55e' }}>{patientId}</strong></div>
            
          </div>
        )}

        {/* Formulaire — DÉSACTIVÉ si pas de patientId */}
        <div className={!idsReady ? 'blocked-form' : ''}>
          
          {/* --- SECTION 1 : INFORMATIONS SOIGNANT --- */}
          <div style={styles.sectionHeader}>
            <User size={20} color="#0d9488" /> <span>Informations du soignant</span>
          </div>
          
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Service</label>
              <input 
                value="Cardiologie" 
                readOnly 
                style={{...styles.input, backgroundColor: '#f8fafc', cursor: 'not-allowed', opacity: 0.8, fontWeight: 'bold'}} 
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Centre Médical <span style={styles.required}>*</span></label>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                 <Building size={18} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
                 <input 
                   id="centre" 
                   placeholder="Nom de l'établissement" 
                   value={form.centre}
                   onChange={handleChange}
                   style={styles.inputWithIcon}
                   disabled={loading || !idsReady}
                 />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Nom du Médecin <span style={styles.required}>*</span></label>
              <input 
                id="doc" 
                placeholder="Dr. Nom Prénom" 
                value={form.doc}
                onChange={handleChange}
                style={styles.input}
                disabled={loading || !idsReady}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Téléphone <span style={styles.required}>*</span></label>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                 <Phone size={18} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
                 <input 
                   id="tel" 
                   placeholder="+228 90 00 00 00" 
                   value={form.tel}
                   onChange={handleChange}
                   style={styles.inputWithIcon}
                   disabled={loading || !idsReady}
                 />
              </div>
            </div>
          </div>

          {/* --- SECTION 2 : PARAMÈTRES VITAUX --- */}
          <div style={styles.sectionHeader}>
            <Activity size={20} color="#0d9488" /> <span>Paramètres Vitaux</span>
          </div>

          <div style={styles.formGrid3}>
            <div style={styles.formGroup}>
              <label style={{...styles.label, fontSize: '0.9rem'}}><Weight size={14} color="#0d9488" /> Poids (kg)</label>
              <input 
                id="poids" 
                type="number" 
                placeholder="0.0" 
                value={form.poids}
                onChange={handleChange}
                style={{...styles.input, marginTop: '5px'}}
                disabled={loading || !idsReady}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={{...styles.label, fontSize: '0.9rem'}}><Ruler size={14} color="#0d9488" /> Taille (cm)</label>
              <input 
                id="taille" 
                type="number" 
                placeholder="170" 
                value={form.taille}
                onChange={handleChange}
                style={{...styles.input, marginTop: '5px'}}
                disabled={loading || !idsReady}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={{...styles.label, fontSize: '0.9rem'}}><Thermometer size={14} color="#0d9488" /> Température (°C)</label>
              <input 
                id="temperature" 
                type="number" 
                placeholder="37.5" 
                value={form.temperature}
                onChange={handleChange}
                style={{...styles.input, marginTop: '5px'}}
                disabled={loading || !idsReady}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={{...styles.label, fontSize: '0.9rem'}}><Heart size={14} color="#ef4444" /> TA bras gauche</label>
              <input 
                id="ta_gauche" 
                placeholder="12/8" 
                value={form.ta_gauche}
                onChange={handleChange}
                style={{...styles.input, marginTop: '5px'}}
                disabled={loading || !idsReady}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={{...styles.label, fontSize: '0.9rem'}}><Heart size={14} color="#ef4444" /> TA bras droit</label>
              <input 
                id="ta_droit" 
                placeholder="12/8" 
                value={form.ta_droit}
                onChange={handleChange}
                style={{...styles.input, marginTop: '5px'}}
                disabled={loading || !idsReady}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={{...styles.label, fontSize: '0.9rem'}}><Activity size={14} color="#0d9488" /> Pouls (bpm)</label>
              <input 
                id="pouls" 
                type="number" 
                placeholder="75" 
                value={form.pouls}
                onChange={handleChange}
                style={{...styles.input, marginTop: '5px'}}
                disabled={loading || !idsReady}
              />
            </div>
          </div>

          {/* --- SECTION 3 : OBSERVATIONS --- */}
          <div style={styles.sectionHeader}>
            <FileText size={20} color="#0d9488" /> <span>Observations Cliniques</span>
          </div>

          <textarea 
            id="observations"
            rows={5} 
            placeholder="Décrivez ici l'état clinique détaillé du patient :
• Symptômes cardiaques
• Antécédents pertinents
• Examen physique
• Diagnostics préliminaires
• Traitements envisagés..." 
            value={form.observations}
            onChange={handleChange}
            style={{...styles.textarea, marginBottom: '30px'}}
            disabled={loading || !idsReady}
          />

          {/* Boutons — DÉSACTIVÉS si pas de patientId */}
          <div style={styles.buttonGroup}>
            <button 
              style={{ ...styles.btn, ...styles.btnCancel }}
              onClick={cancelExam}
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
                  <Redo size={18} style={{ animation: 'spin 1s linear infinite' }} /> Enregistrement...
                </>
              ) : (
                <>💾 Enregistrer et continuer</>
              )}
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default Exam;