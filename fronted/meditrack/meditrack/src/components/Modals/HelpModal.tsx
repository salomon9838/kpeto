// components/Modals/HelpModal.tsx
import React from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const faqs = [
    {
      question: "Q: Comment modifier mes informations personnelles?",
      answer: "R: Allez dans Paramètres > Profil > Modifier le profil"
    },
    {
      question: "Q: Comment ajouter un membre de ma famille?",
      answer: "R: Allez dans Paramètres > Profil Familial > Ajouter un membre"
    },
    {
      question: "Q: Comment activer la double authentification?",
      answer: "R: Allez dans Paramètres > Sécurité > Double authentification"
    },
    {
      question: "Q: Mes paiements sont-ils sécurisés?",
      answer: "R: Oui, via Moov Money et TMoney avec cryptage SSL."
    },
    {
      question: "Q: Comment consulter mon historique médical?",
      answer: "R: Utilisez l'onglet \"Historique\" dans votre espace patient."
    }
  ];

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        
        {/* Header avec bouton Retour intégré */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
              onClick={onClose} 
              style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#2C5F7C', fontWeight: 'bold' }}
              title="Retour"
            >
              ←
            </button>
            <h2 style={titleStyle}>Centre d'aide MediTrack</h2>
          </div>
          <button onClick={onClose} style={closeButtonStyle}>✕</button>
        </div>

        {/* Content */}
        <div style={contentStyle}>
          <div style={descriptionStyle}>
            <p style={descriptionTextStyle}>
              MediTrack-Pro vous permet de gérer votre dossier médical, 
              effectuer des paiements et suivre votre santé familiale en toute sécurité.
            </p>
          </div>

          <h3 style={sectionTitleStyle}>Questions fréquentes</h3>

          <div style={faqContainerStyle}>
            {faqs.map((faq, index) => (
              <div key={index} style={faqItemStyle}>
                <div style={questionStyle}>{faq.question}</div>
                <div style={answerStyle}>{faq.answer}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer avec bouton Fermer/Retour */}
        <div style={footerStyle}>
          <button 
            onClick={onClose} 
            style={closeButtonLargeStyle}
          >
            Compris, retourner au menu
          </button>
        </div>
      </div>
    </div>
  );
};

// Styles (Harmonisés avec MediTrack Pro)
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '20px'
};

const modalStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '16px',
  width: '100%',
  maxWidth: '550px',
  maxHeight: '90vh',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
};

const headerStyle: React.CSSProperties = {
  padding: '15px 25px',
  borderBottom: '1px solid #f1f5f9',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#f8fafc'
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '18px',
  fontWeight: 600,
  color: '#1e293b'
};

const closeButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '20px',
  cursor: 'pointer',
  color: '#94a3b8'
};

const contentStyle: React.CSSProperties = {
  padding: '25px',
  overflowY: 'auto',
  flex: 1
};

const descriptionStyle: React.CSSProperties = {
  marginBottom: '25px',
  padding: '15px',
  backgroundColor: '#f0f9ff',
  borderRadius: '10px',
  border: '1px solid #e0f2fe'
};

const descriptionTextStyle: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: '1.5',
  color: '#0369a1',
  margin: 0
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  color: '#2C5F7C',
  marginBottom: '15px'
};

const faqContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
};

const faqItemStyle: React.CSSProperties = {
  padding: '15px',
  borderRadius: '10px',
  border: '1px solid #f1f5f9',
  backgroundColor: '#fff'
};

const questionStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#1e293b',
  marginBottom: '5px'
};

const answerStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#64748b',
  lineHeight: '1.5'
};

const footerStyle: React.CSSProperties = {
  padding: '20px 25px',
  borderTop: '1px solid #f1f5f9'
};

const closeButtonLargeStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  backgroundColor: '#2C5F7C',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '15px',
  fontWeight: 600,
  cursor: 'pointer'
};

export default HelpModal;