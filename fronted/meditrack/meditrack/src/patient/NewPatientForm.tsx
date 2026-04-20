import React, { useState, CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaIdCard,
  FaPhoneAlt,
  FaInfoCircle,
  FaShieldAlt,
  FaCheckCircle,
} from 'react-icons/fa';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface PatientFormData {
  prenoms: string;
  nom: string;
  age: string;
  sexe: 'M' | 'F' | '';
  telephone: string;
  email: string;
  adresse: string;
  profession: string;
  contactUrgence: string;
  telUrgence: string;
  estAssure: 'Oui' | 'Non';
  typeAssurance: string;
}

interface PatientResponse {
  id: number;
  code_patient: string;
  nom: string;
  prenoms: string;
  age: number;
  sexe: 'M' | 'F';
  telephone: string;
  adresse: string;
  profession: string;
  est_assure: boolean;
  contact_urgence_nom: string;
  contact_urgence_tel: string;
  created_at?: string;
  updated_at?: string;
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
// COMPOSANT PRINCIPAL
// =============================================================================

export default function NewConsultationForm(): React.ReactElement {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<PatientFormData>({
    prenoms: '',
    nom: '',
    age: '',
    sexe: '',
    telephone: '',
    email: '',
    adresse: '',
    profession: '',
    contactUrgence: '',
    telUrgence: '',
    estAssure: 'Non',
    typeAssurance: '',
  });

  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    type: 'info',
    title: '',
    message: '',
    details: [],
  });
  const [loading, setLoading] = useState(false);

  // 📱 Formater le numéro au format +228 XX XX XX XX
  const formatPhoneNumber = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    const cleanNumber = numbers.startsWith('228') ? numbers : `228${numbers}`;
    if (cleanNumber.length === 11) {
      return `+228 ${cleanNumber.slice(3, 5)} ${cleanNumber.slice(5, 7)} ${cleanNumber.slice(7, 9)} ${cleanNumber.slice(9, 11)}`;
    }
    return value;
  };

  // 🎯 Afficher une notification professionnelle
  const showNotification = (type: NotificationType, title: string, message: string, details?: string[]) => {
    setNotification({ show: true, type, title, message, details });
    setTimeout(() => setNotification((prev) => ({ ...prev, show: false })), 8000);
  };

  // 🎨 Styles dynamiques pour la notification
  const getNotificationStyles = (): CSSProperties => {
    const base: CSSProperties = {
      position: 'fixed',
      top: '16px',
      right: '16px',
      zIndex: 9999,
      padding: '16px 20px',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
      borderLeft: '4px solid',
      maxWidth: '450px',
      transition: 'all 0.3s ease',
      opacity: notification.show ? 1 : 0,
      transform: notification.show ? 'translateX(0)' : 'translateX(100%)',
    };

    const colors: Record<NotificationType, { bg: string; border: string; text: string }> = {
      success: { bg: '#f0fdf4', border: '#22c55e', text: '#166534' },
      error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
      info: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
    };

    const color = colors[notification.type];
    return {
      ...base,
      backgroundColor: color.bg,
      borderColor: color.border,
      color: color.text,
    };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    if (name === 'telephone' || name === 'telUrgence') {
      setFormData((prev) => ({ ...prev, [name]: formatPhoneNumber(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // 🔐 Vérification du token JWT
    const token = localStorage.getItem('access_token');
    if (!token) {
      showNotification('error', 'Non authentifié', 'Veuillez vous connecter pour enregistrer un patient.');
      setLoading(false);
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    // ✅ Validation frontend stricte
    if (!formData.nom.trim() || !formData.prenoms.trim() || !formData.age || !formData.sexe) {
      showNotification('error', 'Champs obligatoires', 'Veuillez remplir le nom, les prénoms, l\'âge et le sexe.');
      setLoading(false);
      return;
    }

    if (formData.sexe !== 'M' && formData.sexe !== 'F') {
      showNotification('error', 'Sexe invalide', 'Veuillez sélectionner Masculin ou Féminin.');
      setLoading(false);
      return;
    }

    try {
      // ✅ Génération automatique du code patient unique
      const generatedCode = `PAT-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      const payload = {
        code_patient: generatedCode,
        nom: formData.nom.trim().toUpperCase(),
        prenoms: formData.prenoms.trim(),
        age: parseInt(formData.age, 10),
        sexe: formData.sexe,
        telephone: formData.telephone.trim(),
        adresse: formData.adresse.trim(),
        profession: formData.profession.trim() || '',
        contact_urgence_nom: formData.contactUrgence.trim(),
        contact_urgence_tel: formData.telUrgence.trim(),
        est_assure: formData.estAssure === 'Oui',
      };

      console.log('📤 Payload envoyé à Django:', JSON.stringify(payload, null, 2));

      // ✅ Appel API
      const API_BASE = 'http://localhost:8000/api';
      const response = await fetch(`${API_BASE}/patients/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log(`📡 Status: ${response.status}`, responseText);

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { detail: responseText || `HTTP ${response.status}` };
        }

        console.error('❌ Erreur Django:', errorData);

        let errorDetails: string[] = [];
        if (typeof errorData === 'object' && errorData !== null) {
          for (const [field, messages] of Object.entries(errorData)) {
            if (Array.isArray(messages)) {
              errorDetails.push(`• ${field}: ${messages.join(', ')}`);
            }
          }
        }

        throw new Error(JSON.stringify(errorData));
      }

      // ✅ Succès
      const newPatient: PatientResponse = JSON.parse(responseText);
      console.log('✅ Patient créé avec succès:', newPatient);

      showNotification(
        'success',
        'Patient enregistré avec succès',
        'Le dossier médical a été créé. Vous pouvez maintenant rechercher ce patient dans "Ancienne consultation".',
        [
          `🆔 Code: ${newPatient.code_patient}`,
          `👤 ${newPatient.nom} ${newPatient.prenoms}`,
          `📞 ${newPatient.telephone}`,
        ]
      );

      // 🔁 REDIRECTION VERS LE DASHBOARD PATIENT (au lieu de l'interface médecin)
      setTimeout(() => {
        navigate('/patient', { 
          state: { 
            message: `Patient ${newPatient.nom} ${newPatient.prenoms} enregistré. Allez dans "Ancienne consultation" pour consulter son dossier.` 
          } 
        });
      }, 2500);

    } catch (error: any) {
      console.error('❌ Exception globale:', error);

      let errorDetails: string[] = [];
      try {
        const parsed = JSON.parse(error.message);
        for (const [field, messages] of Object.entries(parsed)) {
          if (Array.isArray(messages)) {
            errorDetails.push(`• ${field}: ${messages.join(', ')}`);
          }
        }
      } catch {
        errorDetails = [error.message || 'Erreur inconnue'];
      }

      showNotification(
        'error',
        'Échec de l\'enregistrement',
        'Le serveur a rejeté la demande. Détails:',
        errorDetails.length > 0 ? errorDetails : ['Vérifiez la console (F12) pour plus de détails']
      );
    } finally {
      setLoading(false);
    }
  };

  // =============================================================================
  // STYLES
  // =============================================================================
  const styles: Record<string, CSSProperties> = {
    main: {
      minHeight: '100vh',
      backgroundColor: '#D6EFFF',
      padding: '40px 20px',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    container: {
      backgroundColor: '#ffffff',
      width: '100%',
      maxWidth: '900px',
      borderRadius: '20px',
      padding: '40px',
      boxShadow: '0 15px 35px rgba(0, 0, 0, 0.08)',
      position: 'relative',
    },
    header: {
      textAlign: 'center',
      marginBottom: '35px',
    },
    title: {
      fontSize: '28px',
      fontWeight: '800',
      color: '#1e293b',
      margin: '10px 0',
    },
    sectionHeading: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      color: '#0369a1',
      fontSize: '16px',
      fontWeight: '700',
      margin: '30px 0 15px 0',
      borderBottom: '2px solid #f1f5f9',
      paddingBottom: '8px',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '15px',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
    },
    label: {
      fontSize: '12px',
      fontWeight: '700',
      color: '#475569',
      textTransform: 'uppercase',
    },
    input: {
      padding: '10px 14px',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      fontSize: '15px',
      outline: 'none',
      transition: 'border-color 0.2s',
    },
    backBtn: {
      alignSelf: 'flex-start',
      backgroundColor: '#ffffff',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '10px',
      cursor: 'pointer',
      marginBottom: '15px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontWeight: '600',
      color: '#0369a1',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    },
    submitBtn: {
      width: '100%',
      backgroundColor: loading ? '#9ca3af' : '#059669',
      color: '#ffffff',
      padding: '14px',
      borderRadius: '10px',
      border: 'none',
      fontSize: '16px',
      fontWeight: '700',
      cursor: loading ? 'not-allowed' : 'pointer',
      marginTop: '30px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      transition: 'background-color 0.2s',
    },
  };

  return (
    <main style={styles.main}>
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
              {notification.details && notification.details.length > 0 && (
                <ul style={{ margin: '8px 0 0 0', padding: '0 0 0 16px', fontSize: '12px', opacity: 0.85 }}>
                  {notification.details.map((detail, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>
                      {detail}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              onClick={() => setNotification((prev) => ({ ...prev, show: false }))}
              style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', opacity: 0.6, padding: 0, lineHeight: 1 }}
              aria-label="Fermer"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <button style={styles.backBtn} onClick={() => navigate('/patient')}>
        <FaArrowLeft /> Retour au tableau de bord
      </button>

      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Nouveau Dossier Patient</h2>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Section Identité */}
          <div style={styles.sectionHeading}>
            <FaIdCard /> IDENTITÉ
          </div>
          <div style={styles.grid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Nom *</label>
              <input style={styles.input} type="text" name="nom" value={formData.nom} onChange={handleChange} required placeholder="Ex: KONAN" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Prénoms *</label>
              <input style={styles.input} type="text" name="prenoms" value={formData.prenoms} onChange={handleChange} required placeholder="Ex: Jean Pierre" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Âge *</label>
              <input style={styles.input} type="number" name="age" value={formData.age} onChange={handleChange} required min="0" max="120" placeholder="Ex: 35" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Sexe *</label>
              <select name="sexe" value={formData.sexe} onChange={handleChange} required style={styles.input}>
                <option value="">Sélectionner</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
          </div>

          {/* Section Contact */}
          <div style={styles.sectionHeading}>
            <FaPhoneAlt /> CONTACT
          </div>
          <div style={styles.grid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Téléphone *</label>
              <input style={styles.input} type="tel" name="telephone" value={formData.telephone} onChange={handleChange} required placeholder="+228 90 12 34 56" />
            </div>
            <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
              <label style={styles.label}>Adresse *</label>
              <input style={styles.input} type="text" name="adresse" value={formData.adresse} onChange={handleChange} required placeholder="Ex: Lomé, Quartier Tokoin" />
            </div>
            <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
              <label style={styles.label}>Email (optionnel)</label>
              <input style={styles.input} type="email" name="email" value={formData.email} onChange={handleChange} placeholder="patient@email.com" />
            </div>
          </div>

          {/* Section Assurance */}
          <div style={styles.sectionHeading}>
            <FaShieldAlt /> ASSURANCE
          </div>
          <div style={styles.grid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Profession</label>
              <input style={styles.input} type="text" name="profession" value={formData.profession} onChange={handleChange} placeholder="Ex: Enseignant" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Assuré ?</label>
              <select style={styles.input} name="estAssure" value={formData.estAssure} onChange={handleChange} required>
                <option value="Non">Non</option>
                <option value="Oui">Oui</option>
              </select>
            </div>
            {formData.estAssure === 'Oui' && (
              <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
                <label style={styles.label}>Compagnie d'assurance</label>
                <select style={styles.input} name="typeAssurance" value={formData.typeAssurance} onChange={handleChange}>
                  <option value="">Choisir...</option>
                  <option value="CNAMGS">CNAMGS</option>
                  <option value="ASCOMA">ASCOMA</option>
                  <option value="NSIA">NSIA</option>
                  <option value="AUTRE">Autre</option>
                </select>
                <small style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  ℹ️ Stocké localement (ajoutez le champ au backend si besoin)
                </small>
              </div>
            )}
          </div>

          {/* Section Urgence */}
          <div style={styles.sectionHeading}>
            <FaInfoCircle /> CONTACT D'URGENCE
          </div>
          <div style={styles.grid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Nom du contact *</label>
              <input style={styles.input} type="text" name="contactUrgence" value={formData.contactUrgence} onChange={handleChange} required placeholder="Ex: Marie KONAN" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Téléphone du contact *</label>
              <input style={styles.input} type="tel" name="telUrgence" value={formData.telUrgence} onChange={handleChange} required placeholder="+228 70 12 34 56" />
            </div>
          </div>

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            <FaCheckCircle /> {loading ? 'ENREGISTREMENT...' : 'ENREGISTRER LE PATIENT'}
          </button>
        </form>
      </div>
    </main>
  );
}