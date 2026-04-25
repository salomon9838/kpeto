import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FaCheckCircle, FaExclamationTriangle, FaInfoCircle, 
  FaUserMd, FaHeartbeat, FaNotesMedical, FaArrowLeft,
  FaSpinner, FaRedo
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

interface ExamFormData {
  service: string;
  centre: string;
  doc: string;
  tel: string;
  poids: string;
  taille: string;
  temperature: string;
  tabg: string;
  tabd: string;
  pouls: string;
  obs: string;
}

// =============================================================================
// COMPOSANT PRINCIPAL — EXAMEN CLINIQUE (PROFESSIONNEL + API + IDs + REDIRECTION FIXE)
// =============================================================================
export default function ExamForm(): React.ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 🔍 Récupération ROBUSTE du patientId (state + localStorage + fallback)
  const getPatientId = () => {
    const pIdState = location.state?.patientId;
    const pIdStore = localStorage.getItem('current_patient_id');
    
    const pId = pIdState || (pIdStore && pIdStore !== 'undefined' ? Number(pIdStore) : null);
    
    console.log('🔍 ExamForm - patientId:', { fromState: pIdState, fromStorage: pIdStore, resolved: pId });
    return pId;
  };

  const [patientId, setPatientId] = useState<number | null>(null);
  const [idsReady, setIdsReady] = useState(false);

  // ✅ Chargement du patientId au montage
  useEffect(() => {
    const pId = getPatientId();
    if (pId) {
      setPatientId(pId);
      setIdsReady(true);
      // Re-stocker pour sécurité
      localStorage.setItem('current_patient_id', String(pId));
      console.log('✅ ExamForm - patientId chargé:', pId);
    } else {
      console.warn('⚠️ ExamForm - patientId manquant');
      showNotification('error', 'Patient non sélectionné', 'Veuillez sélectionner un patient depuis la liste.', ['Redirection...']);
      setTimeout(() => navigate('/old-consultation'), 2500);
    }
  }, []);

  // === VOS ÉTATS EXISTANTS (inchangés) ===
  const [form, setForm] = useState<ExamFormData>({
    service: "general",
    centre: "",
    doc: "",
    tel: "",
    poids: "",
    taille: "",
    temperature: "",
    tabg: "",
    tabd: "",
    pouls: "",
    obs: "",
  });

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    show: false, type: 'info', title: '', message: '', details: []
  });

  // 🎯 Votre fonction notification (préservée + améliorée)
  const showNotification = (type: NotificationType, title: string, message: string, details?: string[]) => {
    setNotification({ show: true, type, title, message, details });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 6000);
  };

  // 🎨 Styles notification (harmonisés avec design pro)
  const getNotificationStyle = (type: NotificationType) => {
    const config = {
      success: { border: '#22c55e', bg: '#f0fdf4', text: '#166534' },
      error: { border: '#ef4444', bg: '#fef2f2', text: '#991b1b' },
      info: { border: '#0d9488', bg: '#eff6ff', text: '#1e40af' }, // ← Teal professionnel
    };
    const c = config[type];
    return {
      ...styles.notification,
      borderLeftColor: c.border,
      backgroundColor: c.bg,
      color: c.text,
    };
  };

  // 📝 Votre fonction handleChange (préservée)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  // 💾 Votre fonction saveExam (ENRICHIE avec IDs robustes + redirection FIXE vers ordonnance générale)
  const saveExam = async () => {
    // ✅ Vérification patientId AVANT tout
    if (!patientId) {
      showNotification('error', 'Patient manquant', 'Veuillez recharger la page ou recommencer.');
      return;
    }

    if (!form.centre.trim() || !form.doc.trim() || !form.tel.trim()) {
      showNotification('error', 'Champs obligatoires', 'Veuillez remplir tous les champs obligatoires (*)');
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        showNotification('error', 'Authentification requise', 'Veuillez vous reconnecter.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const payload = {
        patient: patientId, // ← ID robuste
        service: form.service,
        centre_medical: form.centre.trim(),
        nom_soignant: form.doc.trim(),
        tel_soignant: form.tel.trim(),
        motif_consultation: 'Consultation standard',
        poids: form.poids ? parseFloat(form.poids) : null,
        taille: form.taille ? parseFloat(form.taille) : null,
        temperature: form.temperature ? parseFloat(form.temperature) : null,
        ta_bras_gauche: form.tabg.trim() || null,
        ta_bras_droit: form.tabd.trim() || null,
        pouls: form.pouls ? parseInt(form.pouls, 10) : null,
        observations_cliniques: form.obs.trim() || null,
      };

      console.log('📤 Payload:', payload);

      const response = await fetch('http://localhost:8000/api/consultations/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log(`📥 Response ${response.status}:`, responseText.substring(0, 300));

      // Détection réponse HTML Django (erreur serveur)
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        throw new Error('Erreur serveur Django. Consultez les logs backend.');
      }

      if (response.status === 401) {
        showNotification('error', 'Session expirée', 'Veuillez vous reconnecter.');
        localStorage.removeItem('access_token');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      if (!response.ok) {
        try {
          const err = JSON.parse(responseText);
          const errorMsg = Object.values(err).flat?.().join(', ') || responseText;
          throw new Error(errorMsg);
        } catch {
          throw new Error(responseText || `Erreur ${response.status}`);
        }
      }

      const data = JSON.parse(responseText);
      const consultationId = data.id;
      
      if (!consultationId) {
        throw new Error('L\'API n\'a pas retourné d\'ID de consultation');
      }
      
      console.log('✅ Consultation créée, ID:', consultationId);

      // ✅ Stockage des IDs pour le workflow
      localStorage.setItem('current_consultation_id', String(consultationId));
      localStorage.setItem('current_patient_id', String(patientId));
      localStorage.setItem('current_workflow_step', 'ordonnance');

      showNotification('success', 'Examen sauvegardé', 'Données enregistrées avec succès.');

      // Reset formulaire (votre logique)
      setForm({
        service: "general", centre: "", doc: "", tel: "",
        poids: "", taille: "", temperature: "", tabg: "", tabd: "", pouls: "", obs: "",
      });

      // ✅✅✅ REDIRECTION FIXE VERS ORDONNANCE MÉDECINE GÉNÉRALE (quel que soit le service)
      setTimeout(() => {
        console.log('🚀 Navigation FIXE vers /doctor/ordonnance avec IDs:', {
          consultationId,
          patientId,
          selectedService: form.service  // ← Service sélectionné est transmis mais destination fixe
        });
        navigate('/doctor/ordonnance', { 
          state: { 
            consultationId,
            patientId,  // ← Propagation du patientId
            selectedService: form.service,  // ← Service sélectionné transmis pour info
            step: 'ordonnance'
          } 
        });
      }, 1500);

    } catch (err: any) {
      console.error('❌ Erreur:', err);
      showNotification('error', 'Échec de l\'enregistrement', err.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelExam = () => {
    if (window.confirm("Annuler le formulaire ?")) {
      setForm({
        service: "general", centre: "", doc: "", tel: "",
        poids: "", taille: "", temperature: "", tabg: "", tabd: "", pouls: "", obs: "",
      });
      showNotification('info', 'Formulaire réinitialisé', '');
    }
  };

  // =============================================================================
  // STYLES PROFESSIONNELS (Harmonisés avec style chirurgie)
  // =============================================================================
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '40px',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    },
    header: {
      backgroundColor: '#0d9488', // ← Teal professionnel (style chirurgie)
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
    card: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '30px',
      marginBottom: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      border: '1px solid #e2e8f0',
      transition: 'box-shadow 0.2s ease',
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#1e293b',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    debugBox: {
      background: idsReady ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
      border: `2px solid ${idsReady ? '#22c55e' : '#f97316'}`,
      borderRadius: '12px',
      padding: '16px 20px',
      marginBottom: '24px',
      fontSize: '14px',
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
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
    },
    required: {
      color: '#ef4444',
    },
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
    select: {
      padding: '12px',
      borderRadius: '8px',
      border: '2px solid #e2e8f0',
      fontSize: '15px',
      outline: 'none',
      backgroundColor: '#f8fafc',
      cursor: 'pointer',
      width: '100%',
      boxSizing: 'border-box' as const,
    },
    textarea: {
      padding: '16px',
      borderRadius: '10px',
      border: '2px solid #e2e8f0',
      fontSize: '15px',
      lineHeight: '1.6',
      outline: 'none',
      backgroundColor: '#f8fafc',
      minHeight: '250px',
      resize: 'vertical' as const,
      fontFamily: 'inherit',
      width: '100%',
      boxSizing: 'border-box' as const,
    },
    buttonGroup: {
      display: 'flex',
      gap: '15px',
      justifyContent: 'flex-end',
      marginTop: '30px',
      paddingTop: '20px',
      borderTop: '2px solid #e2e8f0',
    },
    btn: {
      padding: '14px 28px',
      borderRadius: '8px',
      border: 'none',
      fontWeight: '700',
      fontSize: '15px',
      cursor: 'pointer',
      display: 'flex',
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
  // RENDER
  // =============================================================================
  return (
    <div style={styles.container}>
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
        .disabled {
          opacity: 0.5;
          pointer-events: none;
          filter: grayscale(0.3);
        }
      `}</style>

      {/* 🔔 Notification */}
      {notification.show && (
        <div style={getNotificationStyle(notification.type)}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ fontSize: '20px', marginTop: '1px' }}>
              {notification.type === 'success' && <FaCheckCircle color="#22c55e" />}
              {notification.type === 'error' && <FaExclamationTriangle color="#ef4444" />}
              {notification.type === 'info' && <FaInfoCircle color="#0d9488" />}
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>{notification.title}</h4>
              {notification.message && <p style={{ margin: '6px 0 0 0', fontSize: '14px' }}>{notification.message}</p>}
              {notification.details?.map((d, i) => (
                <div key={i} style={{ margin: '4px 0 0 0', fontSize: '13px' }}>• {d}</div>
              ))}
            </div>
            <button 
              onClick={() => setNotification(p => ({ ...p, show: false }))} 
              style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', opacity: 0.6, color: 'inherit' }}
            >
              ×
            </button>
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
          <FaArrowLeft /> Retour
        </button>
        <h1 style={styles.title}>
          <FaUserMd /> Examen Clinique
        </h1>
      </header>

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Debug patientId */}
        <div style={styles.debugBox}>
          <div style={{ fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {idsReady ? <FaCheckCircle color="#22c55e" /> : <FaExclamationTriangle color="#f97316" />}
            {idsReady ? '✅ Patient ID reçu' : '⚠️ Patient ID manquant'}
          </div>
          <div>Patient: <strong style={{ color: patientId ? '#22c55e' : '#ef4444' }}>{patientId || '❌'}</strong></div>
          {!idsReady && (
            <div style={{ marginTop: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button 
                onClick={() => { const pId = getPatientId(); if (pId) { setPatientId(pId); setIdsReady(true); } }}
                style={{ ...styles.btn, backgroundColor: '#f59e0b', color: 'white', padding: '6px 12px', fontSize: '12px' }}
              >
                <FaRedo size={12} style={{ marginRight: '4px' }} /> Réessayer
              </button>
              <button 
                onClick={() => navigate('/old-consultation')}
                style={{ ...styles.btn, backgroundColor: '#ef4444', color: 'white', padding: '6px 12px', fontSize: '12px' }}
              >
                ← Retour patients
              </button>
            </div>
          )}
        </div>

        {/* Formulaire désactivé si IDs non prêts */}
        <div className={!idsReady ? 'disabled' : ''}>
          
          {/* Section 1: Informations du soignant */}
          <div style={styles.card} className="card-hover">
            <h2 style={styles.sectionTitle}>
              <FaUserMd color="#0d9488" /> Informations du soignant
            </h2>
            
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Service</label>
                <select 
                  id="service" 
                  value={form.service} 
                  onChange={handleChange}
                  style={styles.select}
                >
                  <option value="general">Médecine Générale</option>
                  <option value="urgence">Urgence</option>
                  <option value="chirurgie">Chirurgie</option>
                  <option value="cardiologie">Cardiologie</option>
                  <option value="ophtalmo">Ophtalmologie</option>
                  <option value="urologie">Urologie</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Centre médical <span style={styles.required}>*</span>
                </label>
                <input 
                  id="centre" 
                  value={form.centre} 
                  onChange={handleChange} 
                  placeholder="Ex: CHU Campus"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Nom du soignant <span style={styles.required}>*</span>
                </label>
                <input 
                  id="doc" 
                  value={form.doc} 
                  onChange={handleChange} 
                  placeholder="Dr. Nom Prénom"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Téléphone <span style={styles.required}>*</span>
                </label>
                <input 
                  id="tel" 
                  value={form.tel} 
                  onChange={handleChange} 
                  placeholder="+228 90 12 34 56"
                  style={styles.input}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Paramètres vitaux */}
          <div style={styles.card} className="card-hover">
            <h2 style={styles.sectionTitle}>
              <FaHeartbeat color="#0d9488" /> Paramètres vitaux
            </h2>
            
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Poids (kg)</label>
                <input 
                  id="poids" 
                  value={form.poids} 
                  onChange={handleChange} 
                  placeholder="70.5" 
                  type="number" 
                  step="0.1"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Taille (m)</label>
                <input 
                  id="taille" 
                  value={form.taille} 
                  onChange={handleChange} 
                  placeholder="1.75" 
                  type="number" 
                  step="0.01"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Température (°C)</label>
                <input 
                  id="temperature" 
                  value={form.temperature} 
                  onChange={handleChange} 
                  placeholder="37.0" 
                  type="number" 
                  step="0.1"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>TA - Bras Gauche</label>
                <input 
                  id="tabg" 
                  value={form.tabg} 
                  onChange={handleChange} 
                  placeholder="120/80"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>TA - Bras Droit</label>
                <input 
                  id="tabd" 
                  value={form.tabd} 
                  onChange={handleChange} 
                  placeholder="120/80"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Pouls (bpm)</label>
                <input 
                  id="pouls" 
                  value={form.pouls} 
                  onChange={handleChange} 
                  placeholder="72" 
                  type="number"
                  style={styles.input}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Observations cliniques */}
          <div style={styles.card} className="card-hover">
            <h2 style={styles.sectionTitle}>
              <FaNotesMedical color="#0d9488" /> Observations cliniques
            </h2>
            <textarea
              id="obs"
              value={form.obs}
              onChange={handleChange}
              placeholder="Décrivez en détail les observations cliniques du patient :
• Symptômes présentés
• Examen physique
• Diagnostics préliminaires
• Traitements envisagés
• Recommandations
• Suivi nécessaire..."
              style={styles.textarea}
            />
          </div>

          {/* Boutons */}
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
                  <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> Enregistrement...
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