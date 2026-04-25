import React, { useState, useEffect, CSSProperties } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from '../api/api';
import { 
  FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaRadiation, 
  FaUserMd, FaPhone, FaBuilding, FaRedo, FaArrowLeft
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
// COMPOSANT PRINCIPAL — RADIOLOGIE (PROFESSIONNEL + API + IDs + SERVICE FIXE)
// =============================================================================
export default function RadioForm() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 🔍 Récupération ROBUSTE des IDs (state + localStorage + fallback)
  const getIds = () => {
    const cIdState = location.state?.consultationId;
    const pIdState = location.state?.patientId;
    const cIdStore = localStorage.getItem('current_consultation_id');
    const pIdStore = localStorage.getItem('current_patient_id');
    
    const cId = cIdState || (cIdStore && cIdStore !== 'undefined' ? Number(cIdStore) : null);
    const pId = pIdState || (pIdStore && pIdStore !== 'undefined' ? Number(pIdStore) : null);
    
    console.log('🔍 RadioForm - IDs:', { fromState: { cIdState, pIdState }, fromStorage: { cIdStore, pIdStore }, resolved: { cId, pId } });
    return { cId, pId };
  };

  const [consultationId, setConsultationId] = useState<number | null>(null);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [idsReady, setIdsReady] = useState(false);

  // ✅ Chargement des IDs au montage
  useEffect(() => {
    const { cId, pId } = getIds();
    if (cId && pId) {
      setConsultationId(cId);
      setPatientId(pId);
      setIdsReady(true);
      // Re-stocker pour sécurité
      localStorage.setItem('current_consultation_id', String(cId));
      localStorage.setItem('current_patient_id', String(pId));
      console.log('✅ RadioForm - IDs chargés:', { cId, pId });
    } else {
      console.warn('⚠️ RadioForm - IDs manquants');
      showNotification('error', 'Données manquantes', 'Veuillez recommencer depuis la consultation.', ['Redirection...']);
      setTimeout(() => navigate('/old-consultation'), 2500);
    }
  }, []);

  // === VOS ÉTATS EXISTANTS (inchangés) ===
  const [centre, setCentre] = useState("");
  const [nom, setNom] = useState("");
  const [tel, setTel] = useState("");
  const [typeAnalyse, setTypeAnalyse] = useState("");
  const [region, setRegion] = useState("");
  const [motif, setMotif] = useState("");

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

  // 🔐 Vérif auth (préservée)
  const isAuthenticated = () => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('access_token');
    return !!token && token !== 'null' && token !== 'undefined';
  };

  // 💾 Votre fonction submitForm (ENRICHIE avec IDs robustes + navigation complète)
  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Vérification IDs AVANT tout
    if (!consultationId || !patientId) {
      showNotification('error', 'IDs manquants', 'Veuillez recharger la page ou recommencer depuis la consultation.');
      return;
    }

    // Validation frontend
    if (!centre.trim() || !nom.trim() || !tel.trim() || !typeAnalyse.trim() || !region.trim() || !motif.trim()) {
      showNotification('error', 'Champs obligatoires', 'Veuillez remplir tous les champs marqués d\'une étoile.');
      return;
    }

    if (!isAuthenticated()) {
      showNotification('error', 'Session expirée', 'Veuillez vous reconnecter.');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        consultation: consultationId,  // ← ID robuste
        patient: patientId,            // ← AJOUTÉ : propagation du patientId
        service: "Médecine Générale",  // ← SERVICE FIXE
        centre_radio: centre.trim(),
        type_analyse: typeAnalyse.trim(),
        region_a_examiner: region.trim(),  // ← Nom exact du modèle Django
        motif: motif.trim(),
        // Champs optionnels pour traçabilité
        nom_soignant: nom.trim(),
        tel_soignant: tel.trim(),
      };

      console.log('📤 Payload analyses-radio:', payload);

      // ✅ Appel API via apiFetch
      const newRadio = await apiFetch<any>('analyses-radio', {
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
        [`🏥 ${centre}`, `👨‍⚕️ ${nom}`]
      );

      // Reset formulaire (votre logique)
      setCentre("");
      setNom("");
      setTel("");
      setTypeAnalyse("");
      setRegion("");
      setMotif("");

      // ✅✅✅ REDIRECTION AUTOMATIQUE VERS PAIEMENT avec TOUS les IDs
      setTimeout(() => {
        console.log('🚀 Navigation vers /payement avec IDs:', {
          consultationId,
          patientId,
          radioId
        });
        navigate('/payement', {
          state: {
            consultationId,
            patientId,      // ← AJOUTÉ : propagation du patientId
            radioResultId: radioId,  // ← AJOUTÉ : propagation du radioResultId
            from: 'radio',  // ← Indique la provenance
            type: 'consultation',  // ← Type de prestation
            step: 'paiement'
          }
        });
      }, 1500);

    } catch (err: any) {
      console.error('❌ Erreur API:', err);
      
      // Gestion des erreurs de validation Django
      let errorDetails: string[] = [];
      if (err.validationErrors) {
        errorDetails = Object.entries(err.validationErrors).map(([field, msgs]) => 
          `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`
        );
      } else if (err.message) {
        // Détection réponse HTML Django
        if (err.message.trim().startsWith('<!DOCTYPE') || err.message.trim().startsWith('<html')) {
          errorDetails = ['Erreur serveur Django. Consultez les logs backend.'];
        } else {
          try {
            const parsed = JSON.parse(err.message);
            errorDetails = Object.values(parsed).flat?.().join(', ') ? [Object.values(parsed).flat().join(', ')] : [err.message];
          } catch {
            errorDetails = [err.message];
          }
        }
      } else {
        errorDetails = ['Erreur HTTP 400 - Données invalides'];
      }

      showNotification('error', 'Échec de l\'envoi', 'Le serveur a rejeté la demande.', errorDetails);
    } finally {
      setLoading(false);
    }
  };

  // =============================================================================
  // STYLES PROFESSIONNELS (Harmonisés avec style chirurgie)
  // =============================================================================
  const styles: Record<string, CSSProperties> = {
    page: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      padding: '40px',
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
    container: {
      maxWidth: '1000px',
      margin: '0 auto',
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
      padding: '14px 16px',
      borderRadius: '10px',
      border: '2px solid #e2e8f0',
      fontSize: '15px',
      outline: 'none',
      backgroundColor: '#f8fafc',
      minHeight: '100px',
      resize: 'vertical' as const,
      fontFamily: 'inherit',
      lineHeight: '1.6',
      width: '100%',
      boxSizing: 'border-box' as const,
    },
    buttonGroup: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '15px',
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
        .disabled {
          opacity: 0.5;
          pointer-events: none;
          filter: grayscale(0.3);
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
          <FaRadiation size={24} /> 📷 Analyse Radio
        </h1>
        <div style={{ width: '100px' }} />
      </header>

      <div style={styles.container}>
        {/* Debug IDs */}
        <div style={styles.debugBox}>
          <div style={{ fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {idsReady ? <FaCheckCircle color="#22c55e" /> : <FaExclamationTriangle color="#f97316" />}
            {idsReady ? '✅ IDs reçus' : '⚠️ IDs manquants'}
          </div>
          <div>Consultation: <strong style={{ color: consultationId ? '#22c55e' : '#ef4444' }}>{consultationId || '❌'}</strong></div>
          <div>Patient: <strong style={{ color: patientId ? '#22c55e' : '#ef4444' }}>{patientId || '❌'}</strong></div>
          {!idsReady && (
            <div style={{ marginTop: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button 
                onClick={() => { const { cId, pId } = getIds(); if (cId && pId) { setConsultationId(cId); setPatientId(pId); setIdsReady(true); } }}
                style={{ ...styles.btn, backgroundColor: '#f59e0b', color: 'white', padding: '6px 12px', fontSize: '12px' }}
              >
                <FaRedo size={12} style={{ marginRight: '4px' }} /> Réessayer
              </button>
              <button 
                onClick={() => navigate('/old-consultation')}
                style={{ ...styles.btn, backgroundColor: '#ef4444', color: 'white', padding: '6px 12px', fontSize: '12px' }}
              >
                ← Retour consultation
              </button>
            </div>
          )}
        </div>

        {/* Formulaire désactivé si IDs non prêts */}
        <div className={!idsReady ? 'disabled' : ''}>
          
          {/* Section 1: Informations du soignant */}
          <div style={styles.card} className="card-hover">
            <h2 style={styles.sectionTitle}>
              <FaUserMd color="#0d9488" /> Information du soignant
            </h2>
            
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Service</label>
                {/* ✅ SERVICE FIXE : Médecine Générale en lecture seule */}
                <select 
                  value="Médecine Générale"
                  disabled
                  style={{...styles.select, backgroundColor: '#f8fafc', cursor: 'not-allowed', opacity: 0.8}}
                >
                  <option>Médecine Générale</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Centre<span style={styles.required}>*</span>
                </label>
                <input
                  required
                  placeholder="ex: Centre de Radiologie"
                  value={centre}
                  onChange={(e) => setCentre(e.target.value)}
                  style={styles.input}
                  disabled={loading}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Nom et Prénom(s)<span style={styles.required}>*</span>
                </label>
                <input
                  required
                  placeholder="Nom du soignant"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  style={styles.input}
                  disabled={loading}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Téléphone<span style={styles.required}>*</span>
                </label>
                <input
                  required
                  placeholder="+228..."
                  value={tel}
                  onChange={(e) => setTel(e.target.value)}
                  style={styles.input}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Détails de l'examen */}
          <div style={styles.card} className="card-hover">
            <h2 style={styles.sectionTitle}>
              <FaRadiation color="#0d9488" /> Détails de l'examen
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ ...styles.label, marginBottom: '8px' }}>Type d'analyse <span style={styles.required}>*</span></label>
              <textarea
                required
                rows={3}
                style={{ ...styles.textarea }}
                placeholder="ex: Radiographie, Échographie, Scanner..."
                value={typeAnalyse}
                onChange={(e) => setTypeAnalyse(e.target.value)}
                disabled={loading}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ ...styles.label, marginBottom: '8px' }}>Région à examiner <span style={styles.required}>*</span></label>
              <input
                required
                style={styles.input}
                placeholder="ex: Rachis lombaire, Épaule droite..."
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label style={{ ...styles.label, marginBottom: '8px' }}>Motif <span style={styles.required}>*</span></label>
              <textarea
                required
                rows={3}
                style={{ ...styles.textarea, minHeight: '80px' }}
                placeholder="Saisir ici le motif de l'examen..."
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Boutons */}
          <div style={styles.buttonGroup}>
            <button 
              style={{ ...styles.btn, ...styles.btnCancel }}
              onClick={() => { if(window.confirm('Annuler ?')) { setCentre(''); setNom(''); setTel(''); setTypeAnalyse(''); setRegion(''); setMotif(''); } }}
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
              onClick={submitForm}
              disabled={loading || !idsReady}
              onMouseEnter={(e) => { if (!loading && idsReady) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0f766e'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0d9488'; }}
            >
              {loading ? (
                <>
                  <FaRedo style={{ animation: 'spin 1s linear infinite' }} /> Envoi en cours...
                </>
              ) : (
                <>👥 Envoyer au patient</>
              )}
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}