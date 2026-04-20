// components/Settings/SecuritySettings.tsx
import React from 'react';
import { TwoFactorMethods } from '../../types';

interface SecuritySettingsProps {
  twoFactorMethods: TwoFactorMethods;
  onOpenModal: () => void;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  twoFactorMethods,
  onOpenModal
}) => {
  // Compter les méthodes activées
  const activeMethodsCount = Object.values(twoFactorMethods).filter(Boolean).length;
  const isConfigured = activeMethodsCount >= 2;

  // Labels pour les méthodes
  const methodLabels: Record<keyof TwoFactorMethods, string> = {
    password: '🔑 Mot de passe',
    pin: '🔢 Code PIN',
    sms: '📱 SMS',
    fingerprint: '👆 Empreinte digitale'
  };

  // Obtenir les méthodes actives
  const activeMethods = Object.entries(twoFactorMethods)
    .filter(([_, active]) => active)
    .map(([method]) => methodLabels[method as keyof TwoFactorMethods]);

  return (
    <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: '#2C5F7C', margin: 0 }}>🔐 Sécurité</h3>
        <button 
          onClick={onOpenModal}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2C5F7C',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          ⚙️ Configurer
        </button>
      </div>

      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #e0e0e0'
      }}>
        <div style={{ marginBottom: '15px' }}>
          <h4 style={{ color: '#2C5F7C', fontSize: '16px', marginBottom: '8px' }}>
            Double authentification (2FA)
          </h4>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '12px' }}>
            Sécurisez votre compte avec au moins 2 méthodes d'authentification
          </p>
        </div>

        <div style={{
          padding: '15px',
          backgroundColor: isConfigured ? '#d4edda' : '#fff3cd',
          borderRadius: '6px',
          border: `1px solid ${isConfigured ? '#c3e6cb' : '#ffeeba'}`,
          marginBottom: '15px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            marginBottom: isConfigured ? '10px' : '0'
          }}>
            <span style={{ fontSize: '20px', marginRight: '10px' }}>
              {isConfigured ? '✅' : '⚠️'}
            </span>
            <strong style={{ 
              color: isConfigured ? '#155724' : '#856404',
              fontSize: '15px'
            }}>
              {isConfigured ? 'Sécurité renforcée - Configurée' : 'Sécurité renforcée - Non configurée'}
            </strong>
          </div>
          
          {isConfigured && (
            <div style={{
              marginTop: '10px',
              paddingTop: '10px',
              borderTop: '1px solid #c3e6cb'
            }}>
              <p style={{ 
                color: '#155724', 
                fontSize: '13px',
                marginBottom: '8px',
                fontWeight: 500
              }}>
                Méthodes actives ({activeMethodsCount}) :
              </p>
              <ul style={{
                margin: 0,
                paddingLeft: '20px',
                color: '#155724',
                fontSize: '13px'
              }}>
                {activeMethods.map((method, index) => (
                  <li key={index} style={{ marginBottom: '4px' }}>{method}</li>
                ))}
              </ul>
            </div>
          )}

          {!isConfigured && (
            <p style={{ 
              color: '#856404', 
              fontSize: '13px',
              margin: '8px 0 0 30px'
            }}>
              Cliquez sur "Configurer" pour activer la 2FA
            </p>
          )}
        </div>

        <div style={{
          backgroundColor: '#e3f2fd',
          padding: '12px',
          borderRadius: '6px',
          border: '1px solid #90caf9'
        }}>
          <p style={{ 
            color: '#1976d2', 
            fontSize: '13px',
            margin: 0,
            lineHeight: '1.5'
          }}>
            💡 <strong>Astuce :</strong> Pour une sécurité optimale, combinez différents types d'authentification (Savoir + Posséder + Être)
          </p>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
