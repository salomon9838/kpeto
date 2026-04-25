import React, { useState, useEffect, CSSProperties } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../../../api/api";
import { 
  FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaPills,
  FaUserMd, FaBuilding, FaPhone, FaPlus, FaTrash, FaPaperPlane,
  FaRedo, FaArrowLeft, FaEye
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

interface Med {
  medicament: string;
  posologie: string;
  quantite: string;
  duree: string;
}

// =============================================================================
// COMPOSANT PRINCIPAL — ORDONNANCE OPHTALMO (PROFESSIONNEL + API + IDs)
// =============================================================================
export default function OrthoStep() {
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
    
    console.log('🔍 OrthoStep - Debug IDs:', { 
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
  const [meds, setMeds] = useState<Med[]>([
    { medicament: "", posologie: "", quantite: "", duree: "" }
  ]);
  const [centre, setCentre] = useState("");
  const [doctor, setDoctor] = useState("");
  const [phone, setPhone] = useState("");
  const [service] = useState("Ophtalmologie"); // ← FIXE

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    show: false, type: 'info', title: '', message: '', details: []
  });

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
        
        console.log('✅ OrthoStep - IDs chargés:', { cId, pId });
        
        // 🔢 Récupérer automatiquement le numéro de consultation (NOMBRE)
        await fetchConsultationNumber(pId);
        
      } else {
        console.error('❌ OrthoStep - PatientId MANQUANT');
        
        showNotification(
          'error', 
          'Patient non sélectionné', 
          'Vous devez sélectionner un patient depuis la liste pour continuer.',
          ['Redirection automatique dans 3 secondes...']
        );
        
        setTimeout(() => {
          navigate('/old-consultation', { 
            state: { 
              from: 'ophtalmo-ordonnance',
              message: 'Veuillez sélectionner un patient avant de créer une ordonnance'
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

  // 📝 Vos fonctions médicaments (préservées)
  const addRow = () => {
    setMeds([...meds, { medicament: "", posologie: "", quantite: "", duree: "" }]);
  };

  const removeRow = (index: number) => {
    if (meds.length > 1) {
      setMeds(meds.filter((_, i) => i !== index));
    }
  };

  const updateMed = (index: number, field: keyof Med, value: string) => {
    const newMeds = [...meds];
    newMeds[index] = { ...newMeds[index], [field]: value };
    setMeds(newMeds);
  };

  // 💾 Sauvegarde avec API Django (VÉRIFICATION patientId OBLIGATOIRE)
  const saveOrdonnance = async () => {
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

    // Validation header
    if (!centre.trim() || !doctor.trim() || !phone.trim()) {
      showNotification('error', 'Champs obligatoires', 'Veuillez remplir le centre, le médecin et le téléphone.');
      return;
    }

    // Validation médicaments : au moins 1 médicament complet
    const validMeds = meds.filter(m => m.medicament.trim() && m.posologie.trim());
    if (validMeds.length === 0) {
      showNotification('error', 'Médicaments requis', 'Ajoutez au moins un médicament avec nom et posologie.');
      return;
    }

    setLoading(true);
    try {
      // 1️⃣ Créer l'ordonnance
      const ordonnancePayload = {
        consultation: consultationId,
        patient: patientId,
        service: "ophtalmologie",
      };

      console.log('📤 Création ordonnance:', ordonnancePayload);

      const ordonnance = await apiFetch<any>('ordonnances/', {
        method: 'POST',
        body: JSON.stringify(ordonnancePayload),
      });

      const ordonnanceId = ordonnance?.id;
      if (!ordonnanceId) {
        throw new Error('L\'API n\'a pas retourné d\'ID d\'ordonnance');
      }
      
      console.log('✅ Ordonnance créée:', ordonnanceId);

      // 2️⃣ Créer les médicaments prescrits
      const medPromises = validMeds.map(med => 
        apiFetch<any>('medicaments-prescrits/', {
          method: 'POST',
          body: JSON.stringify({
            ordonnance: ordonnanceId,
            designation: med.medicament.trim(),
            posologie: med.posologie.trim(),
            quantite: med.quantite.trim() || null,
            duree: med.duree.trim() || null,
          }),
        })
      );

      await Promise.all(medPromises);
      console.log('✅ Médicaments enregistrés:', validMeds.length);

      // ✅ Stockage des IDs pour le workflow
      localStorage.setItem('current_ordonnance_id', String(ordonnanceId));
      localStorage.setItem('current_workflow_step', 'lab');

      // ✅ Notification succès
      showNotification(
        'success',
        'Ordonnance envoyée',
        `${validMeds.length} médicament(s) prescrit(s) avec succès.`,
        [`👨‍⚕️ ${doctor}`, `🏥 ${centre}`]
      );

      // Reset formulaire
      setMeds([{ medicament: "", posologie: "", quantite: "", duree: "" }]);
      setCentre(""); setDoctor(""); setPhone("");

      // ✅✅✅ REDIRECTION AUTOMATIQUE VERS LABO OPHTALMO
      setTimeout(() => {
        console.log('🚀 Navigation vers labo avec IDs:', {
          consultationId,
          patientId,
          ordonnanceId
        });
        
        navigate('/ophtalmo/labo', {
          state: { 
            consultationId,
            patientId,
            ordonnanceId,
            step: 'lab'
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
      
      showNotification('error', 'Échec de l\'enregistrement', errorDetails.join(', '));
    } finally {
      setLoading(false);
    }
  };

  const cancelForm = () => {
    if (window.confirm("Annuler l'ordonnance ?")) {
      setMeds([{ medicament: "", posologie: "", quantite: "", duree: "" }]);
      setCentre(""); setDoctor(""); setPhone("");
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
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      marginTop: '10px',
      backgroundColor: 'white',
      borderRadius: '8px',
      overflow: 'hidden',
    },
    th: {
      padding: '12px',
      textAlign: 'left' as const,
      color: '#ffffff',
      fontSize: '13px',
      fontWeight: '600',
      backgroundColor: '#0d9488',
      border: '1px solid #e2e8f0',
    },
    td: {
      border: '1px solid #e2e8f0',
      padding: '8px',
      color: '#333',
      backgroundColor: '#fcfcfd',
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
    btnAdd: {
      backgroundColor: '#0d9488',
      color: 'white',
      padding: '8px 15px',
      borderRadius: '5px',
    },
    btnDelete: {
      backgroundColor: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      width: '30px',
      height: '30px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
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
        input:focus, select:focus {
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

      {/* Header avec bouton retour + Badge numéro consultation (NOMBRE SEULEMENT) */}
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
          <FaEye size={24} /> 💊 Ordonnance Ophtalmologie
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
              Vous devez impérativement sélectionner un patient depuis la liste pour créer une ordonnance.
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
                  placeholder="Hôpital Central" 
                  style={{...styles.input, paddingLeft: '38px'}}
                  disabled={loading || !idsReady}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Nom du Médecin <span style={styles.required}>*</span></label>
              <input 
                value={doctor} 
                onChange={e => setDoctor(e.target.value)} 
                placeholder="Dr. Kouassi" 
                style={styles.input}
                disabled={loading || !idsReady}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Contact <span style={styles.required}>*</span></label>
              <div style={{ position: 'relative' }}>
                <FaPhone style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '14px' }} />
                <input 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  placeholder="+228 90 00 00 00" 
                  style={{...styles.input, paddingLeft: '38px'}}
                  disabled={loading || !idsReady}
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: LISTE DES MÉDICAMENTS */}
          <div style={styles.sectionHeader}>
            <FaPills size={20} color="#0d9488" /> <span>Liste des Médicaments</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <button 
              onClick={addRow}
              disabled={loading || !idsReady}
              style={{ 
                ...styles.btn, 
                ...styles.btnAdd,
                opacity: (loading || !idsReady) ? 0.7 : 1,
                cursor: (loading || !idsReady) ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={(e) => { if (!loading && idsReady) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0f766e'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0d9488'; }}
            >
              <FaPlus size={14} /> Ajouter
            </button>
          </div>

          <div style={{ overflowX: 'auto', marginBottom: '25px' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Médicament</th>
                  <th style={styles.th}>Posologie</th>
                  <th style={styles.th}>Quantité</th>
                  <th style={styles.th}>Durée</th>
                  <th style={{ ...styles.th, width: '60px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {meds.map((med, i) => (
                  <tr key={i}>
                    <td style={styles.td}>
                      <input 
                        style={{...styles.input, padding: '8px'}} 
                        value={med.medicament} 
                        onChange={e => updateMed(i, 'medicament', e.target.value)} 
                        placeholder="Paracétamol 500mg" 
                        disabled={loading || !idsReady}
                      />
                    </td>
                    <td style={styles.td}>
                      <input 
                        style={{...styles.input, padding: '8px'}} 
                        value={med.posologie} 
                        onChange={e => updateMed(i, 'posologie', e.target.value)} 
                        placeholder="1 comp matin/soir" 
                        disabled={loading || !idsReady}
                      />
                    </td>
                    <td style={styles.td}>
                      <input 
                        style={{...styles.input, padding: '8px'}} 
                        value={med.quantite} 
                        onChange={e => updateMed(i, 'quantite', e.target.value)} 
                        placeholder="QSP 1 boîte" 
                        disabled={loading || !idsReady}
                      />
                    </td>
                    <td style={styles.td}>
                      <input 
                        style={{...styles.input, padding: '8px'}} 
                        value={med.duree} 
                        onChange={e => updateMed(i, 'duree', e.target.value)} 
                        placeholder="5 jours" 
                        disabled={loading || !idsReady}
                      />
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <button 
                        onClick={() => removeRow(i)}
                        disabled={loading || !idsReady || meds.length <= 1}
                        style={{ 
                          ...styles.btnDelete,
                          opacity: (loading || !idsReady || meds.length <= 1) ? 0.6 : 1,
                          cursor: (loading || !idsReady || meds.length <= 1) ? 'not-allowed' : 'pointer'
                        }}
                        onMouseEnter={(e) => { if (!loading && idsReady && meds.length > 1) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#dc2626'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ef4444'; }}
                      >
                        <FaTrash size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              onClick={saveOrdonnance}
              disabled={loading || !idsReady}
              onMouseEnter={(e) => { if (!loading && idsReady) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0f766e'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0d9488'; }}
            >
              {loading ? (
                <>
                  <FaRedo size={18} style={{ animation: 'spin 1s linear infinite' }} /> Envoi en cours...
                </>
              ) : (
                <><FaPaperPlane size={18} /> Envoyer au patient</>
              )}
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}