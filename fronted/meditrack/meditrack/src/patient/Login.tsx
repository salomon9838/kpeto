import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/api';

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
}

export default function Profile(): React.ReactElement {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
    email: '',
    telephone: '',
    specialite: '',
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 🔍 Charger le profil utilisateur
  useEffect(() => {
    const loadProfile = async () => {
      try {
        console.log('📡 Chargement du profil...');
        
        // 1. Récupérer l'utilisateur connecté
        const user = await apiFetch<UserData>('auth/user/');
        console.log('✅ User chargé:', user);
        
        // 2. Récupérer le profil (premier résultat)
        let telephone = '';
        let specialite = '';
        
        try {
          const profiles = await apiFetch<any[]>('profils/');
          console.log('✅ Profils trouvés:', profiles);
          if (profiles.length > 0) {
            telephone = profiles[0].telephone || '';
            specialite = profiles[0].specialite || '';
          }
        } catch (err) {
          console.warn('⚠️ Endpoint profils non disponible, utilisation valeurs vides');
        }
        
        setFormData({
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || '',
          telephone: telephone,
          specialite: specialite,
        });
      } catch (err: any) {
        console.error('❌ Erreur chargement:', err);
        setMessage({ 
          type: 'error', 
          text: `Impossible de charger le profil: ${err.message || 'Endpoint introuvable'}` 
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      console.log('📤 Mise à jour User...');
      
      // 1. Mettre à jour User (first_name, last_name, email)
      await apiFetch<UserData>('auth/user/', {
        method: 'PATCH',
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
        }),
      });
      
      console.log('✅ User mis à jour');

      setMessage({ type: 'success', text: '✅ Profil mis à jour avec succès !' });
      
    } catch (err: any) {
      console.error('❌ Erreur mise à jour:', err);
      console.error('❌ Status:', err.message);
      
      setMessage({ 
        type: 'error', 
        text: `Échec: ${err.message || 'Endpoint introuvable (404)'}` 
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const styles: Record<string, React.CSSProperties> = {
    container: {
      minHeight: '100vh', backgroundColor: '#D6EFFF', padding: '40px 20px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'sans-serif',
    },
    card: {
      backgroundColor: '#ffffff', width: '100%', maxWidth: '520px',
      borderRadius: '15px', padding: '35px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    },
    title: { textAlign: 'center', color: '#1e40af', marginBottom: '30px', fontSize: '24px' },
    backBtn: {
      alignSelf: 'flex-start', background: 'none', border: 'none', color: '#1e40af',
      cursor: 'pointer', fontSize: '16px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '6px'
    },
    inputGroup: { marginBottom: '18px' },
    label: { display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#475569' },
    input: {
      width: '100%', padding: '13px', borderRadius: '8px', border: '1px solid #cbd5e1',
      fontSize: '15px', boxSizing: 'border-box'
    },
    saveBtn: {
      width: '100%', padding: '14px', backgroundColor: saving ? '#9ca3af' : '#16a34a',
      color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '700',
      cursor: saving ? 'not-allowed' : 'pointer'
    },
    message: (type: 'success' | 'error') => ({
      padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center',
      backgroundColor: type === 'success' ? '#dcfce7' : '#fee2e2',
      color: type === 'success' ? '#166534' : '#dc2626',
    }),
  };

  if (loading) {
    return <div style={styles.container}><div style={styles.card}><p>Chargement...</p></div></div>;
  }

  return (
    <div style={styles.container}>
      <div style={{ maxWidth: '520px', width: '100%' }}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>← Retour</button>
        
        <div style={styles.card}>
          <h2 style={styles.title}>Paramètres du profil</h2>
          
          {message && <div style={styles.message(message.type)}>{message.text}</div>}
          
          <form onSubmit={handleSubmit}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Prénom</label>
              <input style={styles.input} name="first_name" value={formData.first_name} onChange={handleChange} required />
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Nom</label>
              <input style={styles.input} name="last_name" value={formData.last_name} onChange={handleChange} required />
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email</label>
              <input style={styles.input} name="email" type="email" value={formData.email} onChange={handleChange} required />
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Téléphone</label>
              <input style={styles.input} name="telephone" value={formData.telephone} onChange={handleChange} />
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Spécialité</label>
              <input style={styles.input} name="specialite" value={formData.specialite} onChange={handleChange} />
            </div>
            
            <button type="submit" style={styles.saveBtn} disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}