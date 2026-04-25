import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Activity, User, Phone, MapPin, Send, AlertCircle, CheckCircle2, Info } from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================
interface RadioResultData {
  consultation: number;
  patient: number;
  service: string;
  centre_radio: string;
  nom_soignant: string;
  tel_soignant: string;
  type_analyse: string;
  region_a_examiner: string;
  motif: string;
  resultats?: string | null;
  date_demande?: string;
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
export default function RadioForm(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 🔍 Récupération sécurisée des IDs
  const [consultationId, setConsultationId] = useState<number>(() => {
    const fromState = location.state?.consultationId;
    const fromStorage = localStorage.getItem('current_consultation_id');
    const id = fromState || (fromStorage ? Number(fromStorage) : 0);
    console.log('🔍 RadioForm - consultationId:', id);
    return id;
  });
  
  const [patientId, setPatientId] = useState<number>(() => {
    const fromState = location.state?.patientId;
    const fromStorage = localStorage.getItem('current_patient_id');
    const id = fromState || (fromStorage ? Number(fromStorage) : 0);
    console.log('🔍 RadioForm - patientId:', id);
    return id;
  });

  // États du formulaire
  const [service, setService] = useState("urgence chirurgicale");
  const [centre, setCentre] = useState("");
  const [nom, setNom] = useState("");
  const [tel, setTel] = useState("");
  const [typeAnalyse, setTypeAnalyse] = useState("");
  const [region, setRegion] = useState("");
  const [motif, setMotif] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    show: false, type: 'info', title: '', message: '', details: []
  });

  // ✅ Vérification des IDs au montage
  useEffect(() => {
    console.log('📋 RadioForm - IDs:', { consultationId, patientId });
    
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

  // 💾 Soumission du formulaire
  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 Soumission radio...', { consultationId, patientId });
    
    if (!consultationId || !patientId) {
      showNotification('error', 'IDs manquants', 'Veuillez recharger la page.');
      return;
    }
    
    if (!centre.trim() || !nom.trim() || !tel.trim() || !typeAnalyse.trim() || !region.trim() || !motif.trim()) {
      showNotification('error', 'Champs obligatoires', 'Tous les champs marqués * sont requis.');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Session expirée');

      // ✅ Payload structuré pour Django REST Framework
      // Dans RadioForm.tsx, fonction submitForm

const payload = {
  consultation: consultationId,
  centre_radio: centre.trim(),
  nom_soignant: nom.trim(),
  tel_soignant: tel.trim(),
  
  // ✅ Ces champs existent déjà
  type_analyse: typeAnalyse.trim(),
  region_a_examiner: region.trim(),
  motif: motif.trim(),
};

      console.log('📤 Payload Radio:', payload);

      const response = await fetch('http://localhost:8000/api/analyses-radio/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log(`📥 Réponse ${response.status}:`, responseText.substring(0, 500));

      // ✅ Détecter réponse HTML (erreur Django)
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        console.error('❌ Réponse HTML reçue - Erreur serveur Django');
        throw new Error('Erreur serveur Django. Vérifiez les logs backend.');
      }

      if (response.status === 401) throw new Error('Session expirée');
      
      if (response.status === 400) {
        try {
          const errors = JSON.parse(responseText);
          console.error('❌ Erreurs de validation:', errors);
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
      const radioResultId = result.id;
      
      console.log('✅ Analyse radio créée:', radioResultId);
      localStorage.setItem('current_radio_result_id', String(radioResultId));
      localStorage.setItem('current_workflow_step', 'paiement');

      showNotification(
        'success',
        'Analyse radio envoyée',
        'Examen enregistré avec succès.',
        [`👨‍⚕️ ${nom}`, `🏥 ${centre}`]
      );

      // Reset formulaire
      setCentre(""); setNom(""); setTel(""); setTypeAnalyse(""); setRegion(""); setMotif("");

      // 🚀 Navigation vers Paiement
      setTimeout(() => {
        console.log('🚀 Navigation vers /payement');
        navigate('/payement', {
          state: { consultationId, patientId, radioResultId, step: 'paiement' }
        });
      }, 1800);

    } catch (err: any) {
      console.error('❌ Erreur radio:', err);
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
          <button style={styles.backBtn} onClick={() => navigate('/patient')}>← Retour</button>
          <h1 style={styles.title}><Activity size={28} /> Analyse Radio</h1>
          <div style={{ width: '100px' }} />
        </div>
      </header>

      <div style={styles.container}>
        {/* Debug IDs */}
        <div style={styles.debugBox}>
          <div style={{ fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} color="#3b82f6" /> IDs reçus
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
              <input value={centre} onChange={(e) => setCentre(e.target.value)} placeholder="Centre de Radiologie" style={styles.input} required />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Nom et Prénom(s) <span style={styles.required}>*</span></label>
              <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom du soignant" style={styles.input} required />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Téléphone <span style={styles.required}>*</span></label>
              <input value={tel} onChange={(e) => setTel(e.target.value)} placeholder="+228..." style={styles.input} required />
            </div>
          </div>
        </div>

        {/* Détails examen */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}><MapPin size={22} color="#0d9488" /> Détails de l'examen</h2>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ ...styles.label, marginBottom: '8px' }}>Type d'analyse <span style={styles.required}>*</span></label>
            <textarea value={typeAnalyse} onChange={(e) => setTypeAnalyse(e.target.value)} placeholder="ex: Radiographie, Échographie, Scanner..." style={styles.textarea} required />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ ...styles.label, marginBottom: '8px' }}>Région à examiner <span style={styles.required}>*</span></label>
            <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="ex: Rachis lombaire, Épaule droite..." style={styles.input} required />
          </div>

          <div>
            <label style={{ ...styles.label, marginBottom: '8px' }}>Motif <span style={styles.required}>*</span></label>
            <textarea value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Saisir ici le motif de l'examen..." style={styles.textarea} required />
          </div>
        </div>

        {/* Boutons */}
        <div style={styles.buttonGroup}>
          <button style={{ ...styles.btn, ...styles.btnCancel }} onClick={() => { if(confirm('Annuler ?')) { setCentre(''); setNom(''); setTel(''); setTypeAnalyse(''); setRegion(''); setMotif(''); } }}>✖ Annuler</button>
          <button style={{ ...styles.btn, ...styles.btnSave, opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }} onClick={submitForm} disabled={isSubmitting}>
            {isSubmitting ? '⏳ Envoi...' : <><Send size={18} /> Envoyer au patient</>}
          </button>
        </div>
      </div>
    </div>
  );
}