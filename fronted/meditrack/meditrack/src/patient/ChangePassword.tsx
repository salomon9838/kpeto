import React, { useState, CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaLock,
  FaArrowLeft,
  FaHome,
  FaCheckCircle,
  FaExclamationCircle,
} from 'react-icons/fa';

interface Status {
  type: 'success' | 'error' | '';
  message: string;
}

export default function ChangePassword(): React.ReactElement {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [status, setStatus] = useState<Status>({ type: '', message: '' });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    
    // Validation locale uniquement
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'Les mots de passe ne correspondent pas' });
      return;
    }

    if (newPassword.length < 8) {
      setStatus({ type: 'error', message: 'Le nouveau mot de passe doit contenir au moins 8 caractères' });
      return;
    }

    // Simulation d'une réussite sans appel API
    setStatus({ type: 'success', message: 'Mot de passe modifié avec succès (Simulation)' });
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const styles: Record<string, CSSProperties> = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#D6EFFF',
      fontFamily: "'Inter', system-ui, sans-serif",
      color: '#1e293b',
      display: 'flex',
      flexDirection: 'column',
    },
    header: {
      backgroundColor: '#ffffff',
      height: '80px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      borderBottom: '1px solid #e2e8f0',
    },
    logo: {
      fontSize: '26px',
      fontWeight: '800',
      color: '#1e40af',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    logoImage: {
      height: '40px',
      width: 'auto',
      objectFit: 'contain',
    },
    main: {
      flex: 1,
      padding: '40px 20px',
      maxWidth: '600px',
      margin: '0 auto',
      width: '100%',
    },
    navBar: {
      display: 'flex',
      gap: '12px',
      marginBottom: '30px',
    },
    navBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 18px',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      backgroundColor: '#ffffff',
      color: '#475569',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.2s',
    },
    formCard: {
      backgroundColor: '#ffffff',
      borderRadius: '20px',
      padding: '40px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
      border: '1px solid #f1f5f9',
    },
    titleSection: {
      textAlign: 'center',
      marginBottom: '35px',
    },
    inputGroup: {
      marginBottom: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    label: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#334155',
      marginLeft: '4px',
    },
    input: {
      padding: '14px 16px',
      borderRadius: '12px',
      border: '1px solid #cbd5e1',
      fontSize: '16px',
      transition: 'all 0.2s',
      outline: 'none',
      backgroundColor: '#fcfdfe',
    },
    submitBtn: {
      backgroundColor: '#1e40af',
      color: '#ffffff',
      padding: '16px',
      borderRadius: '12px',
      border: 'none',
      fontSize: '16px',
      fontWeight: '700',
      cursor: 'pointer',
      marginTop: '10px',
      width: '100%',
      transition: 'background 0.2s',
    },
    alert: {
      padding: '16px',
      borderRadius: '12px',
      marginBottom: '25px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '14px',
      fontWeight: '500',
    },
    footer: {
      backgroundColor: '#1e40af',
      color: '#ffffff',
      padding: '30px 20px',
      textAlign: 'center',
      marginTop: '40px',
    },
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logo}>
          <img src="/c.png" alt="Logo" style={styles.logoImage} />
          <span>
            MediTrack <span style={{ color: '#0f172a' }}>Pro</span>
          </span>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.navBar}>
          <button style={styles.navBtn} onClick={() => navigate(-1)}>
            <FaArrowLeft /> Retour
          </button>
          <button style={styles.navBtn} onClick={() => navigate('/')}>
            <FaHome /> Accueil
          </button>
        </div>

        <div style={styles.formCard}>
          <div style={styles.titleSection}>
            <div
              style={{
                backgroundColor: '#D6EFFF',
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 15px',
              }}
            >
              
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
              Sécurité du compte
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '5px' }}>
              Mettez à jour votre mot de passe pour protéger vos accès
            </p>
          </div>

          {status.message && (
            <div
              style={{
                ...styles.alert,
                backgroundColor: status.type === 'success' ? '#f0fff4' : '#fff5f5',
                color: status.type === 'success' ? '#2f855a' : '#c53030',
                border: `1px solid ${status.type === 'success' ? '#c6f6d5' : '#feb2b2'}`,
              }}
            >
              {status.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Ancien mot de passe</label>
              <input
                type="password"
                style={styles.input}
                placeholder="••••••••"
                value={oldPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setOldPassword(e.target.value)
                }
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Nouveau mot de passe</label>
              <input
                type="password"
                style={styles.input}
                placeholder="Minimum 8 caractères"
                value={newPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewPassword(e.target.value)
                }
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                style={styles.input}
                placeholder="Répétez le nouveau mot de passe"
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setConfirmPassword(e.target.value)
                }
                required
              />
            </div>

            <button
              type="submit"
              style={styles.submitBtn}
            >
              Mettre à jour le mot de passe
            </button>
          </form>
        </div>
      </main>

      <footer style={styles.footer}>
        <div style={{ fontSize: '14px', fontWeight: '500' }}>
          MediTrack Pro — Sécurité et Confidentialité Certifiées
        </div>
      </footer>
    </div>
  );
}