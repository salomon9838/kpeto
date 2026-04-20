import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FaCheckCircle, FaExclamationTriangle, FaInfoCircle, 
  FaUserMd, FaHeartbeat, FaNotesMedical, FaArrowLeft,
  FaSpinner
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
// COMPOSANT PRINCIPAL
// =============================================================================
export default function ExamForm(): React.ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  const patientId = location.state?.patientId;

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

  const showNotification = (type: NotificationType, title: string, message: string, details?: string[]) => {
    setNotification({ show: true, type, title, message, details });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 5000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const saveExam = async () => {
    if (!form.centre.trim() || !form.doc.trim() || !form.tel.trim()) {
      showNotification('error', 'Champs obligatoires', 'Veuillez remplir tous les champs obligatoires (*)');
      return;
    }

    if (!patientId) {
      showNotification('error', 'Patient manquant', 'Aucun patient sélectionné.');
      setTimeout(() => navigate('/patient'), 2000);
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
        patient: Number(patientId),
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
      console.log(`📥 Response ${response.status}:`, responseText);

      if (response.status === 401) {
        showNotification('error', 'Session expirée', 'Veuillez vous reconnecter.');
        localStorage.removeItem('access_token');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      if (!response.ok) {
        throw new Error(responseText || `Erreur ${response.status}`);
      }

      const data = JSON.parse(responseText);
      console.log('✅ Succès:', data);

      showNotification('success', 'Examen sauvegardé', 'Données enregistrées avec succès.');

      setForm({
        service: "general", centre: "", doc: "", tel: "",
        poids: "", taille: "", temperature: "", tabg: "", tabd: "", pouls: "", obs: "",
      });

      setTimeout(() => {
        navigate('/doctor/ordonnance', { 
          state: { consultationId: data.id, patientId } 
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
  // STYLES
  // =============================================================================
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f0f9ff',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      marginBottom: '30px',
      paddingBottom: '20px',
      borderBottom: '2px solid #0d9488',
    },
    backBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 20px',
      backgroundColor: '#0d9488',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
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
    card: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '30px',
      marginBottom: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#0d9488',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
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
    select: {
      padding: '12px',
      borderRadius: '8px',
      border: '2px solid #e2e8f0',
      fontSize: '15px',
      outline: 'none',
      backgroundColor: '#f8fafc',
      cursor: 'pointer',
    },
    // ✅ CHAMP OBSERVATIONS AMÉLIORÉ - PLUS GRAND ET PROFESSIONNEL
    textarea: {
      padding: '16px',
      borderRadius: '10px',
      border: '2px solid #e2e8f0',
      fontSize: '15px',
      lineHeight: '1.6',
      outline: 'none',
      backgroundColor: '#f8fafc',
      minHeight: '250px',  // ← Hauteur beaucoup plus grande
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
    },
    btnCancel: {
      backgroundColor: '#f1f5f9',
      color: '#64748b',
    },
    btnSave: {
      backgroundColor: '#0d9488',
      color: 'white',
    },
    notification: {
      position: 'fixed' as const,
      top: '20px',
      right: '20px',
      zIndex: 9999,
      padding: '16px 20px',
      borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      borderLeft: '5px solid',
      backgroundColor: 'white',
      maxWidth: '400px',
    },
    required: {
      color: '#ef4444',
    },
  };

  const getNotificationStyle = (type: NotificationType) => {
    const config = {
      success: { border: '#22c55e', bg: '#f0fdf4', text: '#166534' },
      error: { border: '#ef4444', bg: '#fef2f2', text: '#991b1b' },
      info: { border: '#3b82f6', bg: '#eff6ff', text: '#1e40af' },
    };
    const c = config[type];
    return {
      ...styles.notification,
      borderLeftColor: c.border,
      backgroundColor: c.bg,
      color: c.text,
    };
  };

  // =============================================================================
  // RENDER
  // =============================================================================
  return (
    <div style={styles.container}>
      {/* Notification */}
      {notification.show && (
        <div style={getNotificationStyle(notification.type)}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ fontSize: '20px' }}>
              {notification.type === 'success' && <FaCheckCircle />}
              {notification.type === 'error' && <FaExclamationTriangle />}
              {notification.type === 'info' && <FaInfoCircle />}
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
              style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', opacity: 0.6 }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <button 
          style={styles.backBtn}
          onClick={() => navigate('/patient')}
        >
          <FaArrowLeft /> Retour
        </button>
        <h1 style={styles.title}>
          <FaUserMd /> Examen Clinique
        </h1>
      </div>

      {/* Formulaire */}
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Section 1: Informations du soignant */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>
            <FaUserMd /> Informations du soignant
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
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>
            <FaHeartbeat /> Paramètres vitaux
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

        {/* Section 3: Observations cliniques - CHAMP AMÉLIORÉ */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>
            <FaNotesMedical /> Observations cliniques
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
            disabled={loading}
          >
            ✖ Annuler
          </button>
          <button 
            style={{ ...styles.btn, ...styles.btnSave }}
            onClick={saveExam} 
            disabled={loading}
          >
            {loading ? (
              <>
                <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> Enregistrement...
              </>
            ) : (
              <>💾 Sauvegarder</>
            )}
          </button>
        </div>

      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input:focus, select:focus, textarea:focus {
          border-color: #0d9488 !important;
          background-color: white !important;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
        }
      `}</style>
    </div>
  );
}