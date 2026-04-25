import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FlaskConical, User, Phone, MapPin, Stethoscope, Send, AlertCircle, CheckCircle2, Info } from "lucide-react";

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
// COMPOSANT PRINCIPAL — VERSION PROFESSIONNELLE
// =============================================================================
export default function LabForm(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 🔍 Récupération sécurisée des IDs
  const [consultationId, setConsultationId] = useState<number>(() => {
    const fromState = location.state?.consultationId;
    const fromStorage = localStorage.getItem('current_consultation_id');
    const id = fromState || (fromStorage ? Number(fromStorage) : 0);
    console.log('🔍 LabForm - consultationId:', id);
    return id;
  });
  
  const [patientId, setPatientId] = useState<number>(() => {
    const fromState = location.state?.patientId;
    const fromStorage = localStorage.getItem('current_patient_id');
    const id = fromState || (fromStorage ? Number(fromStorage) : 0);
    console.log('🔍 LabForm - patientId:', id);
    return id;
  });

  // États du formulaire
  const [service, setService] = useState("urgence chirurgicale");
  const [centre, setCentre] = useState("");
  const [doc, setDoc] = useState("");
  const [tel, setTel] = useState("");
  const [labText, setLabText] = useState("");
  const [motif, setMotif] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    show: false, type: 'info', title: '', message: '', details: []
  });

  // ✅ Vérification des IDs au montage
  useEffect(() => {
    console.log('📋 LabForm - IDs:', { consultationId, patientId });
    
    if (!consultationId || !patientId) {
      showNotification(
        'error', 
        'Données manquantes', 
        'Veuillez recommencer depuis la consultation.',
        ['Redirection...']
      );
      setTimeout(() => {
        localStorage.removeItem('current_consultation_id');
        localStorage.removeItem('current_patient_id');
        navigate('/old-consultation');
      }, 2000);
    }
  }, [consultationId, patientId, navigate]);

  // 🎯 Système de notification
  const showNotification = (type: NotificationType, title: string, message: string, details?: string[]) => {
    setNotification({ show: true, type, title, message, details });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 7000);
  };

  // 🎨 Styles de notification
  const getNotificationStyles = (): React.CSSProperties => {
    const colors = {
      success: { bg: '#f0fdf4', border: '#22c55e', text: '#166534', icon: <CheckCircle2 size={20} /> },
      error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b', icon: <AlertCircle size={20} /> },
      info: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af', icon: <Info size={20} /> },
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

  // 📝 Fonction existante (inchangée)
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

  // 💾 Soumission du formulaire
  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 Soumission labo...', { consultationId, patientId });
    
    if (!consultationId || !patientId) {
      showNotification('error', 'IDs manquants', 'Veuillez recharger la page.');
      return;
    }
    
    if (!centre.trim() || !doc.trim() || !tel.trim() || !labText.trim()) {
      showNotification('error', 'Champs obligatoires', 'Tous les champs marqués * sont requis.');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Session expirée');

      const payload: LabResultData = {
        consultation: consultationId,
        patient: patientId,
        service: service,
        centre_labo: centre.trim(),
        nom_soignant: doc.trim(),
        tel_soignant: tel.trim(),
        analyses_demandees: labText.trim(),
        motif: motif.trim(),
        resultats: null,
        date_prelevement: new Date().toISOString(),
      };

      console.log('📤 Payload:', payload);

      const response = await fetch('http://localhost:8000/api/analyses-labo/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log(`📥 Réponse ${response.status}:`, responseText);

      if (response.status === 401) throw new Error('Session expirée');
      
      if (response.status === 400) {
        const errors = JSON.parse(responseText);
        const errorMsg = Object.entries(errors)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join('; ');
        throw new Error(errorMsg || 'Données invalides');
      }

      if (!response.ok) throw new Error(responseText || `Erreur ${response.status}`);

      const result = JSON.parse(responseText);
      const labResultId = result.id;
      
      console.log('✅ Labo créé:', labResultId);
      localStorage.setItem('current_lab_result_id', String(labResultId));
      localStorage.setItem('current_workflow_step', 'radio');

      showNotification(
        'success',
        'Analyses envoyées',
        `${labText.split('\n').filter(l => l.trim()).length} analyse(s) prescrite(s).`,
        [`👨‍️ ${doc}`, `🏥 ${centre}`]
      );

      setCentre(""); setDoc(""); setTel(""); setLabText(""); setMotif("");

      setTimeout(() => {
        console.log('🚀 Vers /chirurgie/radio');
        navigate('/chirurgie/radio', {
          state: { consultationId, patientId, labResultId, step: 'radio' }
        });
      }, 1800);

    } catch (err: any) {
      console.error('❌ Erreur:', err);
      showNotification('error', 'Échec', err.message || 'Erreur serveur');
    } finally {
      setIsSubmitting(false);
    }
  };

  // =============================================================================
  // STYLES PROFESSIONNELS
  // =============================================================================
  const styles: Record<string, React.CSSProperties> = {
    page: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      paddingBottom: '60px',
    },
    header: {
      backgroundColor: '#e74c3c',
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
      background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
      border: '2px solid #3b82f6',
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
      textTransform: 'uppercase',
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
      backgroundColor: '#0d9488',
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
          border-color: #0d9488 !important;
          background-color: white !important;
          box-shadow: 0 0 0 4px rgba(13, 148, 136, 0.1) !important;
        }
        button:hover { opacity: 0.9; transform: translateY(-1px); }
      `}</style>

      {/* 🔔 Notification */}
      {notification.show && (
        <div style={getNotificationStyles()}>
          <div style={{ flexShrink: 0 }}>
            {notification.type === 'success' && <CheckCircle2 size={20} className="text-green-600" />}
            {notification.type === 'error' && <AlertCircle size={20} className="text-red-600" />}
            {notification.type === 'info' && <Info size={20} className="text-blue-600" />}
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>{notification.title}</h4>
            {notification.message && <p style={{ margin: '6px 0 0 0', fontSize: '14px' }}>{notification.message}</p>}
            {notification.details?.map((d, i) => <div key={i} style={{ fontSize: '13px', marginTop: '4px' }}>• {d}</div>)}
          </div>
          <button onClick={() => setNotification(p => ({ ...p, show: false }))} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', opacity: 0.6 }}>×</button>
        </div>
      )}

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <button style={styles.backBtn} onClick={() => navigate('/patient')}>← Retour</button>
          <h1 style={styles.title}><FlaskConical size={28} /> Analyses Laboratoire</h1>
          <div style={{ width: '100px' }} />
        </div>
      </header>

      <div style={styles.container}>
        {/* Debug IDs */}
        <div style={styles.debugBox}>
          <div style={{ fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} /> IDs reçus
          </div>
          <div>Consultation: <strong>{consultationId || '❌'}</strong></div>
          <div>Patient: <strong>{patientId || '❌'}</strong></div>
        </div>

        {/* Info soignant */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}><User size={22} color="#0d9488" /> Information du soignant</h2>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Service</label>
              <select value={service} onChange={(e) => setService(e.target.value)} style={styles.select}>
                <option>urgence chirurgicale</option>
                <option>urgences</option>
                <option>chirurgie</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Centre <span style={styles.required}>*</span></label>
              <input value={centre} onChange={(e) => setCentre(e.target.value)} placeholder="Laboratoire National" style={styles.input} required />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Nom du soignant <span style={styles.required}>*</span></label>
              <input value={doc} onChange={(e) => setDoc(e.target.value)} placeholder="Infirmier(e) de garde" style={styles.input} required />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Téléphone <span style={styles.required}>*</span></label>
              <input value={tel} onChange={(e) => setTel(e.target.value)} placeholder="+228 91 00 00 00" style={styles.input} required />
            </div>
          </div>
        </div>

        {/* Bloc analyses */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}><FlaskConical size={22} color="#0d9488" /> Types d'analyses</h2>
          
          <div style={styles.tagSection}>
            <div style={styles.tagTitle}>📋 Cliquez pour ajouter rapidement</div>
            
            <div style={styles.tagCategory}>PARASITOLOGIE & BACTÉRIOLOGIE</div>
            <div style={styles.tagRow}>
              {['GE', 'SELLES KOP', 'SCOTCH TEST', 'BCE', 'Culot urinaire', 'Crachat BAAR', 'PV', 'ECBU', 'Coproculture', 'Spermogramme/Spermoculture'].map(tag => (
                <button key={tag} type="button" style={styles.tag} onClick={() => addTag('PARASITOLOGIE', tag)}>{tag}</button>
              ))}
            </div>

            <div style={styles.tagCategory}>SÉROLOGIE</div>
            <div style={styles.tagRow}>
              {['SRV', 'Ag HBs', 'TPHA-VDRL', 'CRP', 'Toxoplasmose', 'Hépatite C (HCV)', 'Rubéole'].map(tag => (
                <button key={tag} type="button" style={styles.tag} onClick={() => addTag('SÉROLOGIE', tag)}>{tag}</button>
              ))}
            </div>

            <div style={styles.tagCategory}>HÉMATOLOGIE</div>
            <div style={styles.tagRow}>
              {['NFS', 'VS', 'NB-TH', 'Groupage', 'Electrophorèse'].map(tag => (
                <button key={tag} type="button" style={styles.tag} onClick={() => addTag('HÉMATOLOGIE', tag)}>{tag}</button>
              ))}
            </div>

            <div style={styles.tagCategory}>BIOCHIMIE</div>
            <div style={styles.tagRow}>
              {['Urée', 'Glycémie', 'Créatininémie', 'ASAT', 'ALAT', 'GGT', 'PAL', 'Uricémie', 'Bilirubine T', 'Bilirubine D', 'Phosphore', 'HbA1C', 'Cholesterol total', 'HDL-Cholesterol', 'LDL-Cholesterol', 'Triglycérides', 'Calcémie', 'Magnésiemie', 'TSHU', 'T3', 'T4', 'Ionogramme S.'].map(tag => (
                <button key={tag} type="button" style={styles.tag} onClick={() => addTag('BIOCHIMIE', tag)}>{tag}</button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <label style={{ ...styles.label, marginBottom: '8px' }}>Analyses demandées <span style={styles.required}>*</span></label>
            <textarea value={labText} onChange={(e) => setLabText(e.target.value)} placeholder="Les analyses s'afficheront ici..." style={styles.textarea} required />
          </div>

          <div style={{ marginTop: '20px' }}>
            <label style={{ ...styles.label, marginBottom: '8px' }}>Motif</label>
            <textarea value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Saisir ici le motif..." style={{ ...styles.textarea, minHeight: '80px' }} />
          </div>
        </div>

        {/* Boutons */}
        <div style={styles.buttonGroup}>
          <button style={{ ...styles.btn, ...styles.btnCancel }} onClick={() => { if(confirm('Annuler ?')) { setCentre(''); setDoc(''); setTel(''); setLabText(''); setMotif(''); } }}>✖ Annuler</button>
          <button style={{ ...styles.btn, ...styles.btnSave, opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }} onClick={submitForm} disabled={isSubmitting}>
            {isSubmitting ? '⏳ Envoi...' : <><Send size={18} /> Envoyer au laboratoire</>}
          </button>
        </div>
      </div>
    </div>
  );
}