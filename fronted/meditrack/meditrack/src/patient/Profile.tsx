import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/api'; // ✅ Utilitaire API centralisé
import { FaArrowLeft, FaUser, FaPhone, FaBriefcase, FaEnvelope, FaCheckCircle } from 'react-icons/fa';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface UserProfileData {
  id: number;
  user: number;
  telephone: string;
  specialite: string;
  avatar?: string | null;
  is_doctor: boolean;
}

interface UserData {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
  telephone: string;
  specialite: string;
  centre?: string;
}

type NotificationType = 'success' | 'error' | 'info';

interface NotificationState {
  show: boolean;
  type: NotificationType;
  title: string;
  message: string;
}

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

export default function Profile(): React.ReactElement {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
    email: '',
    telephone: '',
    specialite: '',
    centre: '',
  });

  const [userProfileId, setUserProfileId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [notification, setNotification] = useState<NotificationState>({
    show: false, type: 'info', title: '', message: ''
  });

  // 🎯 Afficher une notification
  const showNotification = (type: NotificationType, title: string, message: string) => {
    setNotification({ show: true, type, title, message });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 5000);
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
      position: 'fixed', top: '16px', right: '16px', zIndex: 9999,
      padding: '14px 20px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      borderLeft: `4px solid ${c.border}`, backgroundColor: c.bg, color: c.text,
      maxWidth: '400px', transition: 'all 0.3s ease',
      opacity: notification.show ? 1 : 0, transform: notification.show ? 'translateX(0)' : 'translateX(100%)',
    };
  };

  // 🔍 Charger le profil au montage
  useEffect(() => {
    const loadProfile = async () => {
      try {
        // 1. Récupérer les infos User (nom, email)
        const user = await apiFetch<any>('profile/'); 
        
        // 2. Récupérer le UserProfile (telephone, specialite)
        // Le ViewSet filtre automatiquement pour l'utilisateur connecté
        const profiles = await apiFetch<UserProfileData[]>('profils/');
        const profile = profiles[0]; // Premier (et seul) résultat
        
        if (profile) {
          setUserProfileId(profile.id);
          setFormData({
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            email: user.email || '',
            telephone: profile.telephone || '',
            specialite: profile.specialite || '',
            centre: '', // Champ UI uniquement
          });
        }
      } catch (err: any) {
        console.error('Erreur chargement profil:', err);
        showNotification('error', 'Chargement échoué', err.message || 'Impossible de récupérer le profil.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // 📝 Gestion des changements
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 💾 Soumission : Mise à jour des DEUX modèles
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSaving(true);

    try {
      // 1. Mettre à jour le modèle User (champs auth)
      await apiFetch<any>('profile/', {  // ← Au lieu de 'auth/user/'
  method: 'PATCH',
  body: JSON.stringify({
    first_name: formData.first_name,
    last_name: formData.last_name,
    email: formData.email,
    telephone: formData.telephone,
    specialite: formData.specialite,
  }),
});
      // 2. Mettre à jour le modèle UserProfile (champs métier)
      if (userProfileId) {
        await apiFetch<UserProfileData>(`profils/${userProfileId}/`, {
          method: 'PATCH',
          body: JSON.stringify({
            telephone: formData.telephone.trim(),
            specialite: formData.specialite.trim(),
          }),
        });
      }

      showNotification('success', 'Profil mis à jour', 'Vos informations ont été enregistrées avec succès.');

    } catch (err: any) {
      console.error('Erreur mise à jour:', err);
      
      // Gestion des erreurs de validation
      let errorMsg = err.message || 'Erreur inconnue';
      if (err.validationErrors) {
        const details = Object.entries(err.validationErrors)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join(' • ');
        errorMsg = details;
      }
      
      showNotification('error', 'Échec de la mise à jour', errorMsg);
    } finally {
      setSaving(false);
    }
  };

  // =============================================================================
  // STYLES
  // =============================================================================
  const styles: Record<string, React.CSSProperties> = {
    container: {
      minHeight: '100vh', backgroundColor: '#D6EFFF', padding: '40px 20px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    card: {
      backgroundColor: '#ffffff', width: '100%', maxWidth: '520px',
      borderRadius: '15px', padding: '35px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      position: 'relative'
    },
    title: {
      textAlign: 'center', color: '#1e40af', marginBottom: '30px',
      fontSize: '24px', fontWeight: '700', display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: '10px'
    },
    backBtn: {
      alignSelf: 'flex-start', backgroundColor: 'transparent', border: 'none',
      color: '#1e40af', cursor: 'pointer', fontSize: '16px', fontWeight: '600',
      marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '6px',
      padding: '8px 16px', borderRadius: '10px'
    },
    inputGroup: { marginBottom: '18px' },
    label: {
      display: 'flex', alignItems: 'center', gap: '6px',
      marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#475569'
    },
    input: {
      width: '100%', padding: '13px 16px', borderRadius: '8px',
      border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none',
      boxSizing: 'border-box', transition: 'border-color 0.2s'
    },
    saveBtn: {
      width: '100%', padding: '14px',
      backgroundColor: saving ? '#9ca3af' : '#16a34a', color: 'white',
      border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '700',
      cursor: saving ? 'not-allowed' : 'pointer', marginTop: '15px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      transition: 'background-color 0.2s'
    },
    loadingState: { textAlign: 'center', padding: '40px 20px', color: '#64748b' }
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.loadingState}>
            <p>⏳ Chargement de votre profil...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* 🔔 Notification */}
      {notification.show && (
        <div style={getNotificationStyles()} role="alert">
          <strong>{notification.title}</strong>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{notification.message}</p>
        </div>
      )}

      <div style={{ maxWidth: '520px', width: '100%' }}>
        <button 
          style={styles.backBtn} 
          onClick={() => navigate(-1)}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <FaArrowLeft /> Retour
        </button>

        <div style={styles.card}>
          <h2 style={styles.title}>
            <FaUser /> Paramètres du profil
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Section Identité */}
            <div style={{ ...styles.inputGroup, paddingBottom: '15px', borderBottom: '1px solid #f1f5f9', marginBottom: '20px' }}>
              <label style={{ ...styles.label, color: '#1e40af' }}><FaUser /> Identité</label>
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Prénom</label>
              <input
                style={styles.input}
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                placeholder="Ex: Salomon"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Nom</label>
              <input
                style={styles.input}
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                placeholder="Ex: Koumedjina"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}><FaEnvelope style={{ fontSize: '14px' }}/> Email</label>
              <input
                style={styles.input}
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="vous@email.com"
              />
            </div>

            {/* Section Profession */}
            <div style={{ ...styles.inputGroup, paddingTop: '10px', paddingBottom: '15px', borderBottom: '1px solid #f1f5f9', marginBottom: '20px' }}>
              <label style={{ ...styles.label, color: '#16a34a' }}><FaBriefcase /> Profession</label>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}><FaPhone style={{ fontSize: '14px' }}/> Téléphone</label>
              <input
                style={styles.input}
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                required
                placeholder="+228 90 12 34 56"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Spécialité / Poste</label>
              <input
                style={styles.input}
                name="specialite"
                value={formData.specialite}
                onChange={handleChange}
                required
                placeholder="Ex: Médecin généraliste, Développeur..."
              />
            </div>

            <button type="submit" style={styles.saveBtn} disabled={saving}>
              <FaCheckCircle /> {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}