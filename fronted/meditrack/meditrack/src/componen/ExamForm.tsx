import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

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

// =============================================================================
// COMPOSANT CHIRURGIE (Service forcé)
// =============================================================================
export default function ChirurgieExam(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 🔍 Récupérer patientId depuis state ou localStorage (fallback robuste)
  const [patientId, setPatientId] = useState<number>(() => {
    const fromState = location.state?.patientId;
    const fromStorage = localStorage.getItem('current_patient_id');
    const id = fromState || (fromStorage ? Number(fromStorage) : 0);
    console.log('🔍 ChirurgieExam - patientId récupéré:', id, { fromState, fromStorage });
    return id;
  });

  const [form, setForm] = useState({
    service: "chirurgie",  // ← FORCÉ pour la chirurgie
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

  // ✅ Vérifier si patientId existe au montage
  useEffect(() => {
    console.log('📋 ChirurgieExam - patientId au montage:', patientId);
    
    if (!patientId) {
      showNotification('error', 'Patient non sélectionné', 'Veuillez sélectionner un patient depuis la liste.');
      setTimeout(() => navigate('/old-consultation'), 2000);
    }
  }, [patientId, navigate]);

  // 🎯 Afficher notification
  const showNotification = (type: NotificationType, title: string, message: string, details?: string[]) => {
    setNotification({ show: true, type, title, message, details });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 6000);
  };

  // 📝 Mise à jour des champs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  // 💾 Sauvegarder
  const saveExam = async () => {
    if (!patientId) {
      showNotification('error', 'Patient non sélectionné', 'Veuillez sélectionner un patient.');
      return;
    }

    if (!form.centre.trim() || !form.doc.trim() || !form.tel.trim()) {
      showNotification('error', 'Champs obligatoires', 'Centre, soignant et téléphone requis.');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('Session expirée.');
      }

      const payload: ConsultationData = {
        patient: patientId,
        service: "chirurgie",  // ← TOUJOURS chirurgie
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
        motif_consultation: 'Consultation chirurgicale',
      };

      console.log('📤 Payload Chirurgie:', payload);

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

      if (response.status === 401) {
        throw new Error('Session expirée.');
      }

      if (!response.ok) {
        throw new Error(responseText || `Erreur ${response.status}`);
      }

      const result = JSON.parse(responseText);
      const consultationId = result.id;
      
      console.log('✅ Consultation chirurgie créée, ID:', consultationId);
      console.log(' patientId actuel:', patientId);

      // ✅ STOCKAGE DES IDs POUR LE FLUX COMPLET (Fallback localStorage)
      localStorage.setItem('current_consultation_id', String(consultationId));
      localStorage.setItem('current_patient_id', String(patientId));
      localStorage.setItem('current_workflow_step', 'ordonnance');

      showNotification(
        'success',
        'Consultation chirurgicale enregistrée',
        'Examen sauvegardé avec succès.',
        [
          `🆔 ID: ${consultationId}`,
          `🔪 Service: Chirurgie`,
          `👨‍⚕️ ${form.doc}`,
        ]
      );

      // Reset
      setForm({
        service: "chirurgie", centre: "", doc: "", tel: "",
        poids: "", taille: "", temperature: "", tabg: "", tabd: "", pouls: "", obs: ""
      });

      // 🚀 NAVIGATION AVEC TRANSMISSION DES IDs
      setTimeout(() => {
        console.log('🚀 Navigation vers /chirurgie/ordonnance avec state:', {
          consultationId,
          patientId
        });
        
        navigate('/chirurgie/ordonnance', {
          state: {
            consultationId: consultationId,
            patientId: patientId,
            step: 'ordonnance',
            timestamp: new Date().toISOString()
          }
        });
      }, 1500);

    } catch (error: any) {
      console.error('❌ Erreur:', error);
      showNotification('error', 'Échec', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ❌ Annuler
  const cancelExam = () => {
    if (window.confirm("Annuler ?")) {
      setForm({
        service: "chirurgie", centre: "", doc: "", tel: "",
        poids: "", taille: "", temperature: "", tabg: "", tabd: "", pouls: "", obs: ""
      });
    }
  };

  // =============================================================================
  // STYLES SIMPLIFIÉS
  // =============================================================================
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f0f9ff',
      padding: '30px 20px',
      fontFamily: 'Arial, sans-serif',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      marginBottom: '30px',
      paddingBottom: '20px',
      borderBottom: '2px solid #e74c3c',  // ← Rouge pour chirurgie
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#1e293b',
      margin: 0,
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '30px',
      marginBottom: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
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
    input: {
      padding: '12px',
      borderRadius: '8px',
      border: '2px solid #e2e8f0',
      fontSize: '15px',
      outline: 'none',
      backgroundColor: '#f8fafc',
    },
    textarea: {
      padding: '14px',
      borderRadius: '8px',
      border: '2px solid #e2e8f0',
      fontSize: '15px',
      outline: 'none',
      backgroundColor: '#f8fafc',
      minHeight: '120px',
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
    },
    btn: {
      padding: '12px 24px',
      borderRadius: '8px',
      border: 'none',
      fontWeight: '600',
      fontSize: '14px',
      cursor: 'pointer',
    },
    btnCancel: {
      backgroundColor: '#f1f5f9',
      color: '#64748b',
    },
    btnSave: {
      backgroundColor: '#e74c3c',  // ← Rouge pour chirurgie
      color: 'white',
    },
    notification: {
      position: 'fixed' as const,
      top: '20px',
      right: '20px',
      zIndex: 9999,
      padding: '16px 20px',
      borderRadius: '10px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
      borderLeft: '4px solid',
      backgroundColor: notification.type === 'success' ? '#f0fdf4' : notification.type === 'error' ? '#fef2f2' : '#eff6ff',
      borderColor: notification.type === 'success' ? '#22c55e' : notification.type === 'error' ? '#ef4444' : '#3b82f6',
      color: notification.type === 'success' ? '#166534' : notification.type === 'error' ? '#991b1b' : '#1e40af',
      maxWidth: '420px',
    },
  };

  // =============================================================================
  // RENDER
  // =============================================================================
  return (
    <div style={styles.container}>
      {/* Notification */}
      {notification.show && (
        <div style={styles.notification}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div>{notification.type === 'success' ? '✅' : notification.type === 'error' ? '⚠️' : 'ℹ️'}</div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>{notification.title}</h4>
              <p style={{ margin: '6px 0 0 0', fontSize: '14px' }}>{notification.message}</p>
              {notification.details?.map((d, i) => (
                <div key={i} style={{ fontSize: '13px', marginTop: '4px' }}>• {d}</div>
              ))}
            </div>
            <button onClick={() => setNotification(p => ({ ...p, show: false }))} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>×</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <button 
          onClick={() => navigate('/patient')}
          style={{ padding: '8px 16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }}
        >
          ← Retour
        </button>
        <h1 style={styles.title}>🔪 Examen Chirurgie</h1>
        <span style={{ fontSize: '13px', color: '#64748b', background: '#f1f5f9', padding: '6px 12px', borderRadius: '20px' }}>
          Patient ID: {patientId}
        </span>
      </div>

      {/* Formulaire */}
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={styles.card}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#e74c3c', marginBottom: '20px' }}>👨‍⚕️ Informations du chirurgien</h2>
          
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Service</label>
              <input value="🔪 Chirurgie" disabled style={{ ...styles.input, backgroundColor: '#e2e8f0', cursor: 'not-allowed' }} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Centre médical *</label>
              <input 
                id="centre" 
                value={form.centre} 
                onChange={handleChange} 
                placeholder="Ex: Bloc Opératoire A"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Chirurgien *</label>
              <input 
                id="doc" 
                value={form.doc} 
                onChange={handleChange} 
                placeholder="Dr. Nom Prénom"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Téléphone *</label>
              <input 
                id="tel" 
                value={form.tel} 
                onChange={handleChange} 
                placeholder="+228..."
                style={styles.input}
              />
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#e74c3c', marginBottom: '20px' }}>❤️ Paramètres vitaux pré-opératoires</h2>
          
          <div style={styles.formGrid}>
            {['poids', 'taille', 'temperature', 'tabg', 'tabd', 'pouls'].map(field => (
              <div key={field} style={styles.formGroup}>
                <label style={styles.label}>
                  {field === 'poids' ? 'Poids (kg)' : 
                   field === 'taille' ? 'Taille (m)' : 
                   field === 'temperature' ? 'Température (°C)' : 
                   field === 'tabg' ? 'TA - Bras Gauche' : 
                   field === 'tabd' ? 'TA - Bras Droit' : 'Pouls (bpm)'}
                </label>
                <input 
                  id={field} 
                  value={form[field as keyof typeof form]} 
                  onChange={handleChange} 
                  placeholder="..."
                  type={['poids', 'taille', 'temperature', 'pouls'].includes(field) ? 'number' : 'text'}
                  style={styles.input}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#e74c3c', marginBottom: '20px' }}>📝 Observations pré-opératoires</h2>
          <textarea
            id="obs"
            value={form.obs}
            onChange={handleChange}
            placeholder="État général, antécédents, allergies, type d'intervention prévue..."
            style={styles.textarea}
          />
        </div>

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
            {isSubmitting ? '⏳ Enregistrement...' : '🔪 Valider → Ordonnance'}
          </button>
        </div>
      </div>
    </div>
  );
}