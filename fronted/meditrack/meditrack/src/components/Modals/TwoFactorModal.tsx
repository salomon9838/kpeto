// components/Modals/TwoFactorModal.tsx
import React, { useState, useEffect } from 'react';
import { TwoFactorMethods } from '../../types';

interface TwoFactorMethod {
  id: keyof TwoFactorMethods;
  label: string;
  icon: string;
  type: 'savoir' | 'posseder' | 'etre';
}

interface TwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (methods: TwoFactorMethods) => void;
  currentMethods: TwoFactorMethods;
}

const TwoFactorModal: React.FC<TwoFactorModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  currentMethods 
}) => {
  const [selectedMethods, setSelectedMethods] = useState<TwoFactorMethods>(currentMethods);

  // Mettre à jour quand currentMethods change
  useEffect(() => {
    setSelectedMethods(currentMethods);
  }, [currentMethods, isOpen]);

  const methods: TwoFactorMethod[] = [
    { id: 'password', label: 'Mot de passe', icon: '🔑', type: 'savoir' },
    { id: 'pin', label: 'Code PIN', icon: '🔢', type: 'savoir' },
    { id: 'sms', label: 'SMS', icon: '📱', type: 'posseder' },
    { id: 'fingerprint', label: 'Empreinte', icon: '👆', type: 'etre' }
  ];

  const typeLabels = {
    savoir: 'Savoir',
    posseder: 'Posséder',
    etre: 'Être'
  };

  const handleToggleMethod = (methodId: keyof TwoFactorMethods) => {
    setSelectedMethods(prev => ({
      ...prev,
      [methodId]: !prev[methodId]
    }));
  };

  const handleSave = () => {
    const selectedCount = Object.values(selectedMethods).filter(Boolean).length;
    if (selectedCount < 2) {
      alert('❌ Veuillez sélectionner au moins 2 méthodes');
      return;
    }
    onSubmit(selectedMethods);
  };

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'savoir': return '✓';
      case 'posseder': return '✓';
      case 'etre': return '✓';
      default: return '';
    }
  };

  const selectedCount = Object.values(selectedMethods).filter(Boolean).length;

  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h2 style={titleStyle}>Configuration 2FA</h2>
          <button onClick={onClose} style={closeButtonStyle}>✕</button>
        </div>

        {/* Content */}
        <div style={contentStyle}>
          {/* Info Banner */}
          <div style={infoBannerStyle}>
            Sélectionnez 2 méthodes minimum.
          </div>

          {/* Methods grouped by type */}
          {Object.entries(typeLabels).map(([type, label]) => (
            <div key={type} style={categoryStyle}>
              <div style={categoryHeaderStyle}>
                <span style={categoryIconStyle}>
                  {getCategoryIcon(type)}
                </span>
                <span style={categoryLabelStyle}>{label}</span>
              </div>

              {methods
                .filter(method => method.type === type)
                .map(method => {
                  const isChecked = selectedMethods[method.id];
                  return (
                    <div
                      key={method.id}
                      style={{
                        ...methodItemStyle,
                        backgroundColor: isChecked ? '#e3f2fd' : '#f8f9fa',
                        borderColor: isChecked ? '#2C5F7C' : '#e0e0e0'
                      }}
                      onClick={() => handleToggleMethod(method.id)}
                    >
                      <div style={methodContentStyle}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleMethod(method.id)}
                          style={checkboxStyle}
                        />
                        <span style={methodIconStyle}>{method.icon}</span>
                        <span style={methodLabelStyle}>{method.label}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          ))}

          {/* Status message */}
          <div style={{
            marginTop: '15px',
            padding: '10px',
            backgroundColor: selectedCount >= 2 ? '#d4edda' : '#f8d7da',
            borderRadius: '6px',
            fontSize: '13px',
            color: selectedCount >= 2 ? '#155724' : '#721c24',
            textAlign: 'center'
          }}>
            {selectedCount >= 2 
              ? `✅ ${selectedCount} méthodes sélectionnées` 
              : `⚠️ Sélectionnez encore ${2 - selectedCount} méthode(s)`
            }
          </div>
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <button
            onClick={handleSave}
            disabled={selectedCount < 2}
            style={{
              ...saveButtonStyle,
              opacity: selectedCount < 2 ? 0.5 : 1,
              cursor: selectedCount < 2 ? 'not-allowed' : 'pointer',
              backgroundColor: selectedCount < 2 ? '#ccc' : '#2C5F7C'
            }}
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};

// Styles
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
};

const modalStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '12px',
  width: '90%',
  maxWidth: '450px',
  maxHeight: '90vh',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
};

const headerStyle: React.CSSProperties = {
  padding: '20px 25px',
  borderBottom: '1px solid #e0e0e0',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#f8f9fa'
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '20px',
  fontWeight: 600,
  color: '#2C5F7C'
};

const closeButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '24px',
  cursor: 'pointer',
  color: '#666',
  padding: '0',
  width: '30px',
  height: '30px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'color 0.2s'
};

const contentStyle: React.CSSProperties = {
  padding: '20px 25px',
  overflowY: 'auto',
  flex: 1
};

const infoBannerStyle: React.CSSProperties = {
  backgroundColor: '#D6EFFF',
  padding: '12px 15px',
  borderRadius: '8px',
  marginBottom: '20px',
  fontSize: '14px',
  color: '#2C5F7C',
  border: '1px solid #B3E0FF'
};

const categoryStyle: React.CSSProperties = {
  marginBottom: '20px'
};

const categoryHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: '12px'
};

const categoryIconStyle: React.CSSProperties = {
  width: '24px',
  height: '24px',
  borderRadius: '4px',
  backgroundColor: '#2C5F7C',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  marginRight: '10px',
  fontWeight: 600
};

const categoryLabelStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#333'
};

const methodItemStyle: React.CSSProperties = {
  padding: '12px 15px',
  borderRadius: '8px',
  marginBottom: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  border: '2px solid'
};

const methodContentStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center'
};

const checkboxStyle: React.CSSProperties = {
  width: '18px',
  height: '18px',
  cursor: 'pointer',
  marginRight: '12px',
  accentColor: '#2C5F7C'
};

const methodIconStyle: React.CSSProperties = {
  fontSize: '20px',
  marginRight: '10px'
};

const methodLabelStyle: React.CSSProperties = {
  fontSize: '15px',
  color: '#333',
  fontWeight: 500
};

const footerStyle: React.CSSProperties = {
  padding: '20px 25px',
  borderTop: '1px solid #e0e0e0',
  backgroundColor: '#f8f9fa'
};

const saveButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: 600,
  transition: 'all 0.3s'
};

export default TwoFactorModal;
