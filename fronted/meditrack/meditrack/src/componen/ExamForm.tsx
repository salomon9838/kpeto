import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// =============================================================================
// TYPES
// =============================================================================
interface ConsultationData {
  id?: number;
  patient: number;
  service: string;
  centre_medical: string;
  nom_soignant: string;
  tel_soignant: string;
  poids?: number | null;
  taille?: number | null;
  temperature?: number | null;
  ta_bras_gauche: string;
  ta_bras_droit: string;
  pouls?: number | null;
  observations_cliniques: string;
  motif_consultation?: string;
}

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
// OPTIONS DE SERVICE
// =============================================================================
const SERVICE_CHOICES = [
  "general", "urgence", "chirurgie", "cardiologie", "ophtalmo", "urologie", "autre",
];

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================
export default function ExamForm({ patientId }: { patientId: number }): React.ReactElement {
  const navigate = useNavigate();
  
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    show: false, type: 'info', title: '', message: '', details: []
  });

  // 🎯 Afficher une notification professionnelle
  const showNotification = (type: NotificationType, title: string, message: string, details?: string[]) => {
    setNotification({ show: true, type, title, message, details });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 6000);
  };

  // 🎨 Styles dynamiques pour la notification
  const getNotificationStyles = (): React.CSSProperties => {
    const colors: Record<NotificationType, { bg: string; border: string; text: string }> = {
      success: { bg: '#f0fdf4', border: '#22c55e', text: '#166534' },
      error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
      info: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
    };
    const c = colors[notification.type];
    return {
      position: 'fixed', top: '16px', right: '16px', zIndex: 9999,
      padding: '14px 18px', borderRadius: '10px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
      borderLeft: `4px solid ${c.border}`, backgroundColor: c.bg, color: c.text,
      maxWidth: '420px', transition: 'all 0.3s ease',
      opacity: notification.show ? 1 : 0, transform: notification.show ? 'translateX(0)' : 'translateX(100%)',
    };
  };

  // 📝 Mise à jour des champs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  // 🔄 Navigation vers la prochaine étape
  const navigateToNextStep = (consultationId: number, step: 'ordonnance' | 'lab' | 'radio' | 'payment') => {
    const routes: Record<string, string> = {
      ordonnance: '/doctor/ordonnance',
      lab: '/doctor/lab',
      radio: '/doctor/radio',
      payment: '/payement',
    };

    console.log(`🚀 Navigation vers ${step}:`, routes[step]);
    
    navigate(routes[step], {
      state: {
        consultationId: consultationId,
        patientId: patientId,
        step: step,
        timestamp: new Date().toISOString()
      }
    });
  };

  // 💾 Sauvegarder l'examen clinique
  const saveExam = async () => {
    // Validation : patient requis
    if (!patientId) {
      showNotification('error', 'Patient non sélectionné', 'Veuillez sélectionner un patient avant de créer une consultation.');
      return;
    }

    // Validation : champs obligatoires
    if (!form.centre.trim() || !form.doc.trim() || !form.tel.trim()) {
      showNotification('error', 'Champs obligatoires', 'Le centre, le soignant et le téléphone sont requis.');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

      // 📦 Préparer le payload compatible Django
      const payload: ConsultationData = {
        patient: patientId,
        service: form.service,
        centre_medical: form.centre.trim(),
        nom_soignant: form.doc.trim(),
        tel_soignant: form.tel.trim(),
        poids: form.poids ? parseFloat(form.poids) : null,
        taille: form.taille ? parseFloat(form.taille) : null,
        temperature: form.temperature ? parseFloat(form.temperature) : null,
        ta_bras_gauche: form.tabg.trim() || null,
        ta_bras_droit: form.tabd.trim() || null,
        pouls: form.pouls ? parseInt(form.pouls, 10) : null,
        observations_cliniques: form.obs.trim() || null,
        motif_consultation: 'Consultation standard',
      };

      console.log('📤 Payload envoyé:', payload);

      // 🌐 Appel API avec fetch direct
      const response = await fetch('http://localhost:8000/api/consultations/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log(`📥 Réponse ${response.status}:`, responseText);

      // 🔍 Gérer les erreurs HTTP
      if (response.status === 401) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

      if (!response.ok) {
        try {
          const errors = JSON.parse(responseText);
          const errorMessages = Object.values(errors).flat ? Object.values(errors).flat().join(', ') : responseText;
          throw new Error(errorMessages || `Erreur ${response.status}`);
        } catch {
          throw new Error(responseText || `Erreur ${response.status}`);
        }
      }

      const result = JSON.parse(responseText);
      const consultationId = result.id;
      
      console.log('✅ Consultation créée ID:', consultationId);

      // ✅ Stocker dans localStorage pour fallback
      localStorage.setItem('current_consultation_id', String(consultationId));
      localStorage.setItem('current_patient_id', String(patientId));

      // ✅ Notification succès avec détails
      showNotification(
        'success',
        'Consultation enregistrée',
        'Redirection vers la prescription...',
        [
          `🆔 ID: ${consultationId}`,
          `🏥 Service: ${form.service}`,
          `👨‍⚕️ ${form.doc}`,
        ]
      );

      // Reset du formulaire
      setForm({
        service: "general", centre: "", doc: "", tel: "",
        poids: "", taille: "", temperature: "", tabg: "", tabd: "", pouls: "", obs: ""
      });

      // 🚀 NAVIGATION AUTOMATIQUE VERS TOUTES LES ÉTAPES
      // Étape 1: Ordonnance (après 1.5s pour voir la notification)
      setTimeout(() => {
        navigateToNextStep(consultationId, 'ordonnance');
      }, 1500);

    } catch (error: any) {
      console.error('❌ Erreur sauvegarde:', error);
      showNotification(
        'error',
        'Échec de l\'enregistrement',
        error.message || 'Une erreur est survenue.',
        ['Vérifiez votre connexion ou contactez l\'administrateur.']
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ❌ Annulation du formulaire
  const cancelExam = () => {
    if (window.confirm("Voulez-vous vraiment annuler ?")) {
      setForm({
        service: "general", centre: "", doc: "", tel: "",
        poids: "", taille: "", temperature: "", tabg: "", tabd: "", pouls: "", obs: ""
      });
      showNotification('info', 'Formulaire réinitialisé', '');
    }
  };

  // =============================================================================
  // STYLES
  // =============================================================================
  const styles: Record<string, React.CSSProperties> = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f0f9ff',
      padding: '30px 20px',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    },
    header: {
      maxWidth: '1000px',
      margin: '0 auto 25px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#1e293b',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    patientInfo: {
      fontSize: '13px',
      color: '#64748b',
      backgroundColor: '#f1f5f9',
      padding: '6px 12px',
      borderRadius: '6px',
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '30px',
      marginBottom: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: '1px solid #e2e8f0',
    },
    sectionTitle: {
      fontSize: '16px',
      fontWeight: '700',
      color: '#0d9488',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    },
    label: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#475569',
    },
    input: {
      padding: '12px',
      borderRadius: '8px',
      border: '2px solid #e2e8f0',
      fontSize: '15px',
      outline: 'none',
      backgroundColor: '#f8fafc',
      transition: 'border-color 0.2s',
    },
    select: {
      padding: '12px',
      borderRadius: '8px',
      border: '2px solid #e2e8f0',
      fontSize: '15px',
      outline: 'none',
      backgroundColor: '#f8fafc',
      cursor: 'pointer',
    },
    textarea: {
      padding: '14px',
      borderRadius: '8px',
      border: '2px solid #e2e8f0',
      fontSize: '15px',
      outline: 'none',
      backgroundColor: '#f8fafc',
      minHeight: '120px',
      resize: 'vertical',
      fontFamily: 'inherit',
      width: '100%',
      boxSizing: 'border-box',
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
      padding: '12px 24px',
      borderRadius: '8px',
      border: 'none',
      fontWeight: '600',
      fontSize: '14px',
      cursor: 'pointer',
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
    required: {
      color: '#ef4444',
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
        input:focus, select:focus, textarea:focus {
          border-color: #0d9488 !important;
          background-color: white !important;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
        }
      `}</style>

      {/* 🔔 Notification */}
      {notification.show && (
        <div style={getNotificationStyles()} role="alert">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ fontSize: '20px', marginTop: '2px' }}>
              {notification.type === 'success' && '✅'}
              {notification.type === 'error' && '⚠️'}
              {notification.type === 'info' && 'ℹ️'}
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{notification.title}</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.9 }}>{notification.message}</p>
              {notification.details?.map((detail, idx) => (
                <li key={idx} style={{ margin: '4px 0 0 16px', fontSize: '12px' }}>{detail}</li>
              ))}
            </div>
            <button 
              onClick={() => setNotification(prev => ({ ...prev, show: false }))} 
              style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', opacity: 0.6 }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>🩺 Examen Clinique</h1>
        <span style={styles.patientInfo}>Patient ID: {patientId}</span>
      </div>

      {/* Formulaire */}
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Section 1: Informations du soignant */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>👨‍⚕️ Information du soignant</h2>
          
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Service</label>
              <select 
                id="service" 
                value={form.service} 
                onChange={handleChange}
                style={styles.select}
              >
                {SERVICE_CHOICES.map(s => (
                  <option key={s} value={s}>
                    {s === 'general' ? 'Médecine Générale' : 
                     s === 'urgence' ? 'Urgence' :
                     s === 'chirurgie' ? 'Chirurgie' :
                     s === 'cardiologie' ? 'Cardiologie' :
                     s === 'ophtalmo' ? 'Ophtalmologie' :
                     s === 'urologie' ? 'Urologie' : 'Autre'}
                  </option>
                ))}
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
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>❤️ Paramètres vitaux</h2>
          
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

        {/* Section 3: Observations */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>📝 Observations cliniques</h2>
          <textarea
            id="obs"
            value={form.obs}
            onChange={handleChange}
            placeholder="Décrivez les observations cliniques, symptômes, diagnostics préliminaires..."
            style={styles.textarea}
          />
        </div>

        {/* Boutons */}
        <div style={styles.buttonGroup}>
          <button 
            style={{ ...styles.btn, ...styles.btnCancel }}
            onClick={cancelExam} 
            disabled={isSubmitting}
          >
            ✖ Annuler
          </button>
          <button 
            style={{ ...styles.btn, ...styles.btnSave }}
            onClick={saveExam} 
            disabled={isSubmitting}
          >
            {isSubmitting ? '⏳ Enregistrement...' : '💾 Valider et continuer'}
          </button>
        </div>

      </div>
    </div>
  );
}