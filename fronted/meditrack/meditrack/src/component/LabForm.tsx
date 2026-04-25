import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FlaskConical, User, Phone, MapPin, Send, AlertCircle, CheckCircle2, Info } from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================
interface LabResultData {
  consultation: number;
  patient: number;
  service: string;
  centre_labo: string;
  nom_soignant: string;
  tel_soignant: string;
  analyses_demandees: string;
  motif: string;
  resultats?: string | null;
  date_prelevement?: string;
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
// COMPOSANT PRINCIPAL — LABO UROLOGIE (PROFESSIONNEL + API)
// =============================================================================
export default function LabForm(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 🔍 Récupération IMMÉDIATE et ROBUSTE des IDs
  const getIds = (): { cId: number | null; pId: number | null } => {
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
  const [service, setService] = useState("urologie");
  const [centre, setCentre] = useState("");
  const [doc, setDoc] = useState("");
  const [tel, setTel] = useState("");
  const [labText, setLabText] = useState("");
  const [motif, setMotif] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    show: false, type: 'info', title: '', message: '', details: []
  });

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

  // 🎯 Système de notification professionnel
  const showNotification = (type: NotificationType, title: string, message: string, details?: string[]) => {
    setNotification({ show: true, type, title, message, details });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 7000);
  };

  // 🎨 Styles de notification
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
      maxWidth: '450px', minWidth: '350px',
      display: 'flex', alignItems: 'flex-start', gap: '12px',
      animation: 'slideIn 0.3s ease-out',
    };
  };

  // 🔐 Token auth helper
  const getAuthToken = (): string | null => {
    const token = localStorage.getItem('access_token');
    if (!token || token === 'null' || token === 'undefined') return null;
    return token;
  };

  // 💾 Soumission avec API Django
  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 Soumission labo urologie...', { consultationId, patientId });
    
    // Validation IDs
    if (!consultationId || !patientId) {
      showNotification('error', 'IDs manquants', 'Veuillez recharger la page ou recommencer.');
      return;
    }
    
    // Validation champs obligatoires
    if (!centre.trim() || !doc.trim() || !tel.trim() || !labText.trim()) {
      showNotification('error', 'Champs obligatoires', 'Centre, soignant, téléphone et analyses sont requis.');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = getAuthToken();
      if (!token) throw new Error('Session expirée');

      const API_BASE = 'http://localhost:8000/api';
      
      // 📦 Payload pour Django (noms de champs exacts du modèle)
      const payload: LabResultData = {
        consultation: consultationId,
        patient: patientId,
        service: service,
        centre_labo: centre.trim(),  // ← Nom exact du modèle
        nom_soignant: doc.trim(),
        tel_soignant: tel.trim(),
        analyses_demandees: labText.trim(),
        motif: motif.trim(),
        resultats: null,
        date_prelevement: new Date().toISOString(),
      };

      console.log('📤 Payload Labo:', payload);

      // 🌐 Appel API
      const response = await fetch(`${API_BASE}/analyses-labo/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log(`📥 Réponse ${response.status}:`, responseText.substring(0, 300));

      // Gestion des erreurs
      if (response.status === 401) throw new Error('Session expirée');
      
      if (response.status === 400) {
        try {
          const errors = JSON.parse(responseText);
          const errorMsg = Object.entries(errors)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join('; ');
          throw new Error(errorMsg || 'Données invalides');
        } catch {
          throw new Error(responseText || 'Données invalides');
        }
      }

      if (!response.ok) throw new Error(responseText || `Erreur ${response.status}`);

      const result = JSON.parse(responseText);
      const labResultId = result.id;
      
      console.log('✅ Analyse labo créée:', labResultId);

      // ✅ Stockage des IDs pour le workflow
      localStorage.setItem('current_lab_result_id', String(labResultId));
      localStorage.setItem('current_workflow_step', 'radio');

      // ✅ Notification succès
      showNotification(
        'success',
        'Analyses envoyées au laboratoire',
        `${labText.split('\n').filter(l => l.trim()).length} analyse(s) prescrite(s).`,
        [`👨‍⚕️ ${doc}`, `🏥 ${centre}`]
      );

      // Reset formulaire (votre logique)
      setCentre("");
      setDoc("");
      setTel("");
      setLabText("");
      setMotif("");

      // 🚀 Navigation automatique vers Radio
      setTimeout(() => {
        console.log('🚀 Navigation vers /urologie/radio');
        navigate('/urologie/radio', {
          state: {
            consultationId,
            patientId,
            labResultId,
            step: 'radio'
          }
        });
      }, 1800);

    } catch (err: any) {
      console.error('❌ Erreur labo:', err);
      showNotification('error', 'Échec de l\'envoi', err.message || 'Erreur serveur');
    } finally {
      setIsSubmitting(false);
    }
  };

  // =============================================================================
  // STYLES PROFESSIONNELS (Design harmonisé Urologie)
  // =============================================================================
  const styles: Record<string, React.CSSProperties> = {
    page: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      paddingBottom: '60px',
    },
    header: {
      backgroundColor: '#0891b2', // Cyan pour urologie
      padding: '20px 30px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginBottom: '30px',
    },
    headerContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      color: 'white',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    backBtn: {
      background: 'rgba(255,255,255,0.2)',
      border: 'none',
      color: 'white',
      padding: '10px 20px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '14px',
      transition: 'background 0.2s',
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 30px',
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
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
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
      padding: '12px 16px',
      borderRadius: '10px',
      border: '2px solid #e2e8f0',
      fontSize: '15px',
      outline: 'none',
      backgroundColor: '#f8fafc',
      transition: 'all 0.2s',
      width: '100%',
      boxSizing: 'border-box' as const,
    },
    select: {
      padding: '12px 16px',
      borderRadius: '10px',
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
      gap: '16px',
      marginTop: '32px',
      paddingTop: '24px',
      borderTop: '2px solid #e2e8f0',
    },
    btn: {
      padding: '14px 32px',
      borderRadius: '10px',
      border: 'none',
      fontWeight: '700',
      fontSize: '15px',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px',
      transition: 'all 0.2s',
    },
    btnCancel: {
      backgroundColor: '#f1f5f9',
      color: '#64748b',
    },
    btnSave: {
      backgroundColor: '#0891b2',
      color: 'white',
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
        input:focus, select:focus, textarea:focus {
          border-color: #0891b2 !important;
          background-color: white !important;
          box-shadow: 0 0 0 4px rgba(8, 145, 178, 0.1) !important;
        }
        .card-hover:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
          transform: translateY(-2px);
          transition: all 0.2s ease;
        }
        .tag:hover {
          border-color: #0891b2 !important;
          backgroundColor: '#f0f9ff' !important;
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
        <div style={getNotificationStyles()}>
          <div style={{ flexShrink: 0 }}>
            {notification.type === 'success' && <CheckCircle2 size={20} color="#22c55e" />}
            {notification.type === 'error' && <AlertCircle size={20} color="#ef4444" />}
            {notification.type === 'info' && <Info size={20} color="#3b82f6" />}
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>{notification.title}</h4>
            {notification.message && <p style={{ margin: '6px 0 0 0', fontSize: '14px' }}>{notification.message}</p>}
            {notification.details?.map((d, i) => <div key={i} style={{ fontSize: '13px', marginTop: '4px' }}>• {d}</div>)}
          </div>
          <button onClick={() => setNotification(p => ({ ...p, show: false }))} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', opacity: 0.6, color: 'inherit' }}>×</button>
        </div>
      )}

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <button 
            style={styles.backBtn} 
            onClick={() => navigate('/patient')}
            onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.3)'}
            onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.2)'}
          >
            ← Retour
          </button>
          <h1 style={styles.title}>
            <FlaskConical size={28} /> 🔬 Analyses Laboratoire
          </h1>
          <div style={{ width: '100px' }} />
        </div>
      </header>

      <div style={styles.container}>
        {/* Debug IDs */}
        <div style={styles.debugBox}>
          <div style={{ fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {idsReady ? <CheckCircle2 size={18} color="#22c55e" /> : <AlertCircle size={18} color="#f97316" />}
            {idsReady ? '✅ IDs reçus' : '⚠️ IDs manquants'}
          </div>
          <div>Consultation: <strong style={{ color: consultationId ? '#22c55e' : '#ef4444' }}>{consultationId || '❌'}</strong></div>
          <div>Patient: <strong style={{ color: patientId ? '#22c55e' : '#ef4444' }}>{patientId || '❌'}</strong></div>
        </div>

        {/* Formulaire désactivé si IDs non prêts */}
        <div className={!idsReady ? 'disabled' : ''}>
          {/* Info soignant */}
          <div style={{...styles.card, cursor: 'default'}} className="card-hover">
            <h2 style={styles.sectionTitle}>
              <User size={22} color="#0891b2" /> Information du soignant
            </h2>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Service</label>
                <select 
                  value={service} 
                  onChange={(e) => setService(e.target.value)}
                  style={styles.select}
                  disabled
                >
                  <option>urologie</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Centre <span style={styles.required}>*</span></label>
                <input 
                  value={centre} 
                  onChange={(e) => setCentre(e.target.value)} 
                  placeholder="Laboratoire National" 
                  style={styles.input} 
                  required 
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nom du soignant <span style={styles.required}>*</span></label>
                <input 
                  value={doc} 
                  onChange={(e) => setDoc(e.target.value)} 
                  placeholder="Infirmier(e) de garde" 
                  style={styles.input} 
                  required 
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Téléphone <span style={styles.required}>*</span></label>
                <input 
                  value={tel} 
                  onChange={(e) => setTel(e.target.value)} 
                  placeholder="+228 91 00 00 00" 
                  style={styles.input} 
                  required 
                />
              </div>
            </div>
          </div>

          {/* Bloc des analyses (VOTRE CODE PRÉSERVÉ + STYLES PRO) */}
          <div style={{...styles.card, cursor: 'default'}} className="card-hover">
            <h2 style={styles.sectionTitle}>
              <FlaskConical size={22} color="#0891b2" /> Types d'analyses
            </h2>
            
            <div style={styles.tagSection}>
              <div style={styles.tagTitle}>📋 Cliquez pour ajouter rapidement</div>
              
              {/* PARASITOLOGIE & BACTÉRIOLOGIE */}
              <div style={styles.tagCategory}>PARASITOLOGIE & BACTÉRIOLOGIE</div>
              <div style={styles.tagRow}>
                {['GE', 'SELLES KOP', 'SCOTCH TEST', 'BCE', 'Culot urinaire', 'Crachat BAAR', 'PV', 'ECBU', 'Coproculture', 'Spermogramme/Spermoculture'].map(tag => (
                  <button key={tag} type="button" className="tag-lab" style={styles.tag} onClick={() => addTag('PARASITOLOGIE', tag)}>{tag}</button>
                ))}
              </div>

              {/* SÉROLOGIE */}
              <div style={styles.tagCategory}>SÉROLOGIE</div>
              <div style={styles.tagRow}>
                {['SRV', 'Ag HBs', 'TPHA-VDRL', 'CRP', 'Toxoplasmose', 'Hépatite C (HCV)', 'Rubéole'].map(tag => (
                  <button key={tag} type="button" className="tag-lab" style={styles.tag} onClick={() => addTag('SÉROLOGIE', tag)}>{tag}</button>
                ))}
              </div>

              {/* HÉMATOLOGIE */}
              <div style={styles.tagCategory}>HÉMATOLOGIE</div>
              <div style={styles.tagRow}>
                {['NFS', 'VS', 'NB-TH', 'Groupage', 'Electrophorèse'].map(tag => (
                  <button key={tag} type="button" className="tag-lab" style={styles.tag} onClick={() => addTag('HÉMATOLOGIE', tag)}>{tag}</button>
                ))}
              </div>

              {/* BIOCHIMIE */}
              <div style={styles.tagCategory}>BIOCHIMIE</div>
              <div style={styles.tagRow}>
                {['Urée', 'Glycémie', 'Créatininémie', 'ASAT', 'ALAT', 'GGT', 'PAL', 'Uricémie', 'Bilirubine T', 'Bilirubine D', 'Phosphore', 'HbA1C', 'Cholesterol total', 'HDL-Cholesterol', 'LDL-Cholesterol', 'Triglycérides', 'Calcémie', 'Magnésiemie', 'TSHU', 'T3', 'T4', 'Ionogramme S.'].map(tag => (
                  <button key={tag} type="button" className="tag-lab" style={styles.tag} onClick={() => addTag('BIOCHIMIE', tag)}>{tag}</button>
                ))}
              </div>
            </div>

            {/* Analyses demandées */}
            <div style={{ marginTop: '24px' }}>
              <label style={{ ...styles.label, marginBottom: '8px' }}>Analyses demandées <span style={styles.required}>*</span></label>
              <textarea
                required
                rows={5}
                style={{ ...styles.textarea, minHeight: '140px' }}
                value={labText}
                onChange={(e) => setLabText(e.target.value)}
                placeholder="Les analyses s'afficheront ici..."
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
              />
            </div>
          </div>

          {/* Boutons */}
          <div style={styles.buttonGroup}>
            <button 
              style={{ ...styles.btn, ...styles.btnCancel }} 
              onClick={() => { if(window.confirm('Annuler ?')) { setCentre(''); setDoc(''); setTel(''); setLabText(''); setMotif(''); } }}
              disabled={isSubmitting || !idsReady}
              onMouseEnter={(e) => { if (!isSubmitting && idsReady) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#e2e8f0'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f1f5f9'; }}
            >
              ✖ Annuler
            </button>
            <button 
              style={{ 
                ...styles.btn, 
                ...styles.btnSave, 
                opacity: (isSubmitting || !idsReady) ? 0.7 : 1, 
                cursor: (isSubmitting || !idsReady) ? 'not-allowed' : 'pointer' 
              }} 
              onClick={submitForm}
              disabled={isSubmitting || !idsReady}
              onMouseEnter={(e) => { if (!isSubmitting && idsReady) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0e7490'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0891b2'; }}
            >
              {isSubmitting ? '⏳ Envoi...' : <><Send size={16} /> Envoyer au laboratoire</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}