import React, { useState, useEffect, CSSProperties } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from '../api/api';
import { 
  FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaFlask, 
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
// COMPOSANT PRINCIPAL — LABORATOIRE (PROFESSIONNEL + API + IDs + SERVICE FIXE)
// =============================================================================
export default function LabForm() {
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
    
    console.log('🔍 LabForm - IDs:', { fromState: { cIdState, pIdState }, fromStorage: { cIdStore, pIdStore }, resolved: { cId, pId } });
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
      console.log('✅ LabForm - IDs chargés:', { cId, pId });
    } else {
      console.warn('⚠️ LabForm - IDs manquants');
      showNotification('error', 'Données manquantes', 'Veuillez recommencer depuis la consultation.', ['Redirection...']);
      setTimeout(() => navigate('/old-consultation'), 2500);
    }
  }, []);

  // === VOS ÉTATS EXISTANTS (inchangés) ===
  const [centre, setCentre] = useState("");
  const [doc, setDoc] = useState("");
  const [tel, setTel] = useState("");
  const [labText, setLabText] = useState("");
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

  // 🎯 Votre fonction addTag (PRÉSERVÉE)
  const addTag = (category: string, val: string) => {
    let text = labText;
    if (text.includes(category + " :")) {
      const regex = new RegExp("(" + category + " : .*)");
      text = text.replace(regex, "$1, " + val);
    } else {
      const prefix = text.length > 0 ? "\n" : "";
      text = text + prefix + category + " : " + val;
    }
    setLabText(text);
  };

  // 💾 Votre fonction submitForm (SIMPLIFIÉE - apiFetch gère déjà le token)
  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Vérification IDs AVANT tout
    if (!consultationId || !patientId) {
      showNotification('error', 'IDs manquants', 'Veuillez recharger la page ou recommencer depuis la consultation.');
      return;
    }

    // Validation frontend
    if (!centre.trim() || !doc.trim() || !tel.trim() || !labText.trim()) {
      showNotification('error', 'Champs obligatoires', 'Veuillez remplir le centre, le soignant, le téléphone et les analyses.');
      return;
    }

    // ✅ PAS DE VÉRIFICATION MANUELLE DU TOKEN - apiFetch s'en charge automatiquement
    // Si le token est manquant/expiré, apiFetch redirigera vers /login automatiquement

    setLoading(true);
    try {
      const payload = {
        consultation: consultationId,  // ← ID robuste
        patient: patientId,            // ← AJOUTÉ : propagation du patientId
        service: "Médecine Générale",  // ← SERVICE FIXE
        centre_labo: centre.trim(),
        analyses_demandees: labText.trim(),
        motif: motif.trim() || 'Analyse de routine',
        // Champs optionnels pour traçabilité
        nom_soignant: doc.trim(),
        tel_soignant: tel.trim(),
      };

      console.log('📤 Payload analyses-labo:', payload);

      // ✅ Appel API via apiFetch (gère automatiquement : token, refresh, erreurs 401)
      const newAnalyse = await apiFetch<any>('analyses-labo', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const analyseId = newAnalyse?.id;
      if (!analyseId) {
        throw new Error('L\'API n\'a pas retourné d\'ID d\'analyse');
      }
      
      console.log('✅ Analyse labo créée:', analyseId);

      // ✅ Stockage des IDs pour le workflow
      localStorage.setItem('current_lab_result_id', String(analyseId));
      localStorage.setItem('current_workflow_step', 'radio');

      // ✅ Notification succès
      showNotification(
        'success',
        'Analyses envoyées',
        'Les demandes d\'analyses ont été transmises au laboratoire.',
        [`🏥 ${centre}`, `👨‍⚕️ ${doc}`]
      );

      // Reset formulaire (votre logique)
      setCentre("");
      setDoc("");
      setTel("");
      setLabText("");
      setMotif("");

      // ✅✅✅ REDIRECTION AUTOMATIQUE VERS RADIO avec TOUS les IDs
      setTimeout(() => {
        console.log('🚀 Navigation vers /doctor/radio avec IDs:', {
          consultationId,
          patientId,
          analyseId
        });
        navigate('/doctor/radio', {
          state: {
            consultationId,
            patientId,      // ← AJOUTÉ : propagation du patientId
            labResultId: analyseId,  // ← AJOUTÉ : propagation de l'analyseId
            step: 'radio'
          }
        });
      }, 1500);

    } catch (err: any) {
      console.error('❌ Erreur API:', err);
      
      // Gestion des erreurs - apiFetch renvoie déjà un message lisible
      let errorDetails: string[] = [];
      
      // Si l'erreur vient de la redirection auto vers login
      if (err.message === 'Authentification requise') {
        showNotification('info', 'Redirection...', 'Veuillez vous reconnecter pour continuer.');
        // La redirection est déjà gérée par apiFetch
        return;
      }
      
      if (err.validationErrors) {
        errorDetails = Object.entries(err.validationErrors).map(([field, msgs]) => 
          `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`
        );
      } else if (err.message) {
        errorDetails = [err.message];
      } else {
        errorDetails = ['Une erreur inattendue est survenue'];
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
      minHeight: '140px',
      resize: 'vertical' as const,
      fontFamily: 'inherit',
      lineHeight: '1.6',
      width: '100%',
      boxSizing: 'border-box' as const,
    },
    tagSection: {
      marginTop: '24px',
      padding: '20px',
      backgroundColor: '#fafafa',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
    },
    tagTitle: {
      fontSize: '13px',
      fontWeight: '700',
      color: '#0d9488',
      marginBottom: '16px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    },
    tagCategory: {
      fontSize: '13px',
      color: '#dc2626',
      fontWeight: '600',
      marginTop: '20px',
      marginBottom: '12px',
      textDecoration: 'underline',
      textDecorationColor: '#dc2626',
    },
    tagRow: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '10px',
    },
    tag: {
      padding: '8px 16px',
      backgroundColor: 'white',
      border: '2px solid #e2e8f0',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '500',
      color: '#475569',
      transition: 'all 0.2s',
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
        .tag:hover {
          border-color: #0d9488 !important;
          background-color: '#f0f9ff' !important;
          transform: translateY(-1px);
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
          <FaFlask size={24} /> 🔬 Analyses Laboratoire
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
                  value={centre}
                  placeholder="Laboratoire National"
                  onChange={(e) => setCentre(e.target.value)}
                  style={styles.input}
                  disabled={loading}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Nom du soignant<span style={styles.required}>*</span>
                </label>
                <input
                  required
                  value={doc}
                  placeholder="Infirmier(e) de garde"
                  onChange={(e) => setDoc(e.target.value)}
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
                  value={tel}
                  placeholder="+228 91 00 00 00"
                  onChange={(e) => setTel(e.target.value)}
                  style={styles.input}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Bloc des analyses (VOTRE CODE PRÉSERVÉ + STYLES PRO) */}
          <div style={styles.card} className="card-hover">
            <h2 style={styles.sectionTitle}>
              <FaFlask color="#0d9488" /> Types d'analyses
            </h2>
            
            <div style={styles.tagSection}>
              <div style={styles.tagTitle}>📋 Cliquez pour ajouter rapidement</div>
              
              {/* PARASITOLOGIE & BACTÉRIOLOGIE */}
              <div style={styles.tagCategory}>PARASITOLOGIE & BACTÉRIOLOGIE</div>
              <div style={styles.tagRow}>
                {['GE', 'SELLES KOP', 'SCOTCH TEST', 'BCE', 'Culot urinaire', 'Crachat BAAR', 'PV', 'ECBU', 'Coproculture', 'Spermogramme/Spermoculture'].map(tag => (
                  <button key={tag} type="button" className="tag-lab" style={styles.tag} onClick={() => !loading && addTag('PARASITOLOGIE', tag)} disabled={loading}>{tag}</button>
                ))}
              </div>

              {/* SÉROLOGIE */}
              <div style={styles.tagCategory}>SÉROLOGIE</div>
              <div style={styles.tagRow}>
                {['SRV', 'Ag HBs', 'TPHA-VDRL', 'CRP', 'Toxoplasmose', 'Hépatite C (HCV)', 'Rubéole'].map(tag => (
                  <button key={tag} type="button" className="tag-lab" style={styles.tag} onClick={() => !loading && addTag('SÉROLOGIE', tag)} disabled={loading}>{tag}</button>
                ))}
              </div>

              {/* HÉMATOLOGIE */}
              <div style={styles.tagCategory}>HÉMATOLOGIE</div>
              <div style={styles.tagRow}>
                {['NFS', 'VS', 'NB-TH', 'Groupage', 'Electrophorèse'].map(tag => (
                  <button key={tag} type="button" className="tag-lab" style={styles.tag} onClick={() => !loading && addTag('HÉMATOLOGIE', tag)} disabled={loading}>{tag}</button>
                ))}
              </div>

              {/* BIOCHIMIE */}
              <div style={styles.tagCategory}>BIOCHIMIE</div>
              <div style={styles.tagRow}>
                {['Urée', 'Glycémie', 'Créatininémie', 'ASAT', 'ALAT', 'GGT', 'PAL', 'Uricémie', 'Bilirubine T', 'Bilirubine D', 'Phosphore', 'HbA1C', 'Cholesterol total', 'HDL-Cholesterol', 'LDL-Cholesterol', 'Triglycérides', 'Calcémie', 'Magnésiemie', 'TSHU', 'T3', 'T4', 'Ionogramme S.'].map(tag => (
                  <button key={tag} type="button" className="tag-lab" style={styles.tag} onClick={() => !loading && addTag('BIOCHIMIE', tag)} disabled={loading}>{tag}</button>
                ))}
              </div>
            </div>

            {/* Analyses demandées */}
            <div style={{ marginTop: '24px' }}>
              <label style={{ ...styles.label, marginBottom: '8px' }}>Analyses demandées <span style={styles.required}>*</span></label>
              <textarea
                required
                rows={5}
                style={{ ...styles.textarea }}
                value={labText}
                onChange={(e) => setLabText(e.target.value)}
                placeholder="Les analyses s'afficheront ici..."
                disabled={loading}
              />
            </div>

            {/* Motif */}
            <div style={{ marginTop: '20px' }}>
              <label style={{ ...styles.label, marginBottom: '8px' }}>Motif</label>
              <textarea
                rows={3}
                style={{ ...styles.textarea, minHeight: '80px' }}
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Saisir ici le motif..."
                disabled={loading}
              />
            </div>
          </div>

          {/* Boutons */}
          <div style={styles.buttonGroup}>
            <button 
              style={{ ...styles.btn, ...styles.btnCancel }}
              onClick={() => { if(window.confirm('Annuler ?')) { setCentre(''); setDoc(''); setTel(''); setLabText(''); setMotif(''); } }}
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
                <>👥 Envoyer au laboratoire</>
              )}
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}