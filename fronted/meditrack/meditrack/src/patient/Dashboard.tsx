import React, { CSSProperties, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserPlus, FaHistory, FaClipboardList, FaCog } from 'react-icons/fa';

export default function Dashboard(): React.ReactElement {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const styles: Record<string, CSSProperties> = {
    container: { 
      minHeight: '100vh', 
      // Application du dégradé subtil de MediPharma (image_e9171b.png / Capture d'écran 2026-03-21)
      background: 'linear-gradient(180deg, #E3F2FD 0%, #F5F9FF 100%)', 
      fontFamily: "'Inter', sans-serif", 
      display: 'flex', 
      flexDirection: 'column',
      margin: 0,
      padding: 0
    },
    main: { flex: 1, padding: '40px 5%', maxWidth: '1200px', margin: '0 auto', width: '100%' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '25px' },
    card: { 
      background: '#ffffff', borderRadius: '20px', padding: '35px 25px', textAlign: 'center', 
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', cursor: 'pointer', border: '1px solid #e2e8f0', 
      transition: 'all 0.3s ease' 
    },
    iconBox: { 
      width: '70px', height: '70px', backgroundColor: '#f0f7ff', borderRadius: '18px', 
      display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', 
      fontSize: '2.2rem', color: '#2563eb' 
    },
    cardTitle: { fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', marginBottom: '10px' },
    footer: { padding: '30px', textAlign: 'center', borderTop: '1px solid #bae6fd' }
  };

  // Fonction pour générer le style de la carte avec l'effet de survol
  const getCardStyle = (id: string) => ({
    ...styles.card,
    transform: hoveredCard === id ? 'translateY(-10px)' : 'translateY(0)',
    borderColor: hoveredCard === id ? '#2563eb' : '#e2e8f0',
    boxShadow: hoveredCard === id ? '0 20px 25px -5px rgba(0,0,0,0.1)' : styles.card.boxShadow
  });

  const cards = [
    { id: 'new', title: 'Nouvelle Consultation', desc: 'Admission et création de dossier.', icon: <FaUserPlus />, path: '/new-consultation' },
    { id: 'old', title: 'Ancienne Consultation', desc: 'Historiques et suivis patients.', icon: <FaHistory />, path: '/old-consultation' },
    { id: 'stats', title: 'Registre & Statistiques', desc: "Analyses et bilans d'activité.", icon: <FaClipboardList />, path: '/statistics' },
    { id: 'settings', title: 'Paramètres', desc: 'Profil et accès sécurisés.', icon: <FaCog />, path: '/settings' },
  ];

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0f172a' }}>Tableau de bord</h2>
          <p style={{ color: '#64748b' }}>Gestion intelligente de votre centre médical</p>
        </div>

        <div style={styles.grid}>
          {cards.map((card) => (
            <div 
              key={card.id}
              style={getCardStyle(card.id)}
              onMouseEnter={() => setHoveredCard(card.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => navigate(card.path)}
            >
              <div style={styles.iconBox}>{card.icon}</div>
              <h3 style={styles.cardTitle}>{card.title}</h3>
              <p style={{ color: '#64748b', fontSize: '0.95rem' }}>{card.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer style={styles.footer}>
        <h4 style={{ color: '#0369a1', margin: 0 }}>MEDITRACK PRO © 2026</h4>
      </footer>
    </div>
  );
}