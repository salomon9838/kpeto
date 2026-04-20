import React, { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCog,
  FaUser,
  FaLock,
  FaSignOutAlt,
  FaStethoscope,
  FaArrowLeft,
  FaHome,
} from 'react-icons/fa';

export default function Settings(): React.ReactElement {
  const navigate = useNavigate();

  const handleLogout = (): void => {
    localStorage.clear();
    sessionStorage.clear();
    alert('Vous avez été déconnecté avec succès.');
    navigate('/');
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
      position: 'relative',
    },
    logo: {
      fontSize: '26px',
      fontWeight: '800',
      color: '#1e40af',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    main: {
      flex: 1,
      padding: '40px 20px',
      maxWidth: '800px',
      margin: '0 auto',
      width: '100%',
    },
    navBar: { display: 'flex', gap: '15px', marginBottom: '30px' },
    navBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 20px',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      backgroundColor: '#ffffff',
      color: '#475569',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.2s',
    },
    activeNav: {
      backgroundColor: '#1e40af',
      color: '#ffffff',
      border: '1px solid #1e40af',
    },
    sectionCard: {
      backgroundColor: '#ffffff',
      borderRadius: '20px',
      padding: '40px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      border: '1px solid #f1f5f9',
    },
    titleGroup: {
      textAlign: 'center',
      marginBottom: '40px',
      borderBottom: '2px solid #f8fafc',
      paddingBottom: '20px',
    },
    sectionTitle: {
      fontSize: '24px',
      fontWeight: '800',
      color: '#0f172a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
    },
    subtitle: { color: '#64748b', marginTop: '8px', fontSize: '15px' },
    buttonList: { display: 'flex', flexDirection: 'column', gap: '15px' },
    actionBtn: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '20px 25px',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      backgroundColor: '#ffffff',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      width: '100%',
      textAlign: 'left',
    },
    btnLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      fontSize: '16px',
      fontWeight: '600',
      color: '#1e293b',
    },
    logoutBtn: {
      marginTop: '30px',
      backgroundColor: '#fee2e2',
      color: '#dc2626',
      border: '1px solid #fecaca',
      padding: '18px',
      borderRadius: '12px',
      fontWeight: '700',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      cursor: 'pointer',
      width: '100%',
      transition: 'background 0.2s',
    },
    footer: {
      backgroundColor: '#1e40af',
      color: '#ffffff',
      padding: '30px 20px',
      textAlign: 'center',
    },
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logo}>
          <FaStethoscope />
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
          <button
            style={{ ...styles.navBtn, ...styles.activeNav }}
            onClick={() => navigate('/')}
          >
            <FaHome /> Accueil
          </button>
        </div>

        <section style={styles.sectionCard}>
          <div style={styles.titleGroup}>
            <h2 style={styles.sectionTitle}>
              <FaCog style={{ color: '#3b82f6' }} /> Paramètres Système
            </h2>
            <p style={styles.subtitle}>
              Gérez la sécurité de votre compte et vos informations personnelles
            </p>
          </div>

          <div style={styles.buttonList}>
            <button
              style={styles.actionBtn}
              onClick={() => navigate('/profile')}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) =>
                (e.currentTarget.style.borderColor = '#3b82f6')
              }
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) =>
                (e.currentTarget.style.borderColor = '#e2e8f0')
              }
            >
              <div style={styles.btnLabel}>
                <FaUser style={{ color: '#3b82f6' }} /> Modifier mon Profil
              </div>
              <span style={{ color: '#94a3b8' }}>→</span>
            </button>

            <button
              style={styles.actionBtn}
              onClick={() => navigate('/change-password')}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) =>
                (e.currentTarget.style.borderColor = '#3b82f6')
              }
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) =>
                (e.currentTarget.style.borderColor = '#e2e8f0')
              }
            >
              <div style={styles.btnLabel}>
                <FaLock style={{ color: '#3b82f6' }} /> Sécurité du Mot de passe
              </div>
              <span style={{ color: '#94a3b8' }}>→</span>
            </button>

            <button
              style={styles.logoutBtn}
              onClick={handleLogout}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) =>
                (e.currentTarget.style.backgroundColor = '#fecaca')
              }
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) =>
                (e.currentTarget.style.backgroundColor = '#fee2e2')
              }
            >
              <FaSignOutAlt /> Déconnexion de la session
            </button>
          </div>
        </section>
      </main>

      <footer style={styles.footer}>
        <div style={{ fontSize: '15px', fontWeight: '500' }}>
          MediTrack Pro — Solution de gestion médicale sécurisée
        </div>
      </footer>
    </div>
  );
}
