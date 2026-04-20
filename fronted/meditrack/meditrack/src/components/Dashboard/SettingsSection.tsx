// components/Dashboard/SettingsSection.tsx
import React from 'react';
import { User, FamilyMember, TwoFactorMethods } from '../../types';
import { SecurityManager } from '../Security/SecurityManager';

export type SettingsTab = 'profile' | 'security' | 'family' | 'about';

interface SettingsSectionProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  currentUser: User;
  familyMembers: FamilyMember[];
  twoFactorMethods: TwoFactorMethods;
  onEditProfile: () => void;
  onAddMember: () => void;
  onEditMember: (member: FamilyMember) => void;
  onDeleteMember: (id: number) => void;
  onViewMember: (member: FamilyMember) => void;
  onSaveSecurity: (methods: TwoFactorMethods) => boolean;
  onTwoFactorChange: (methods: TwoFactorMethods) => void;
  onOpenTwoFactorModal?: () => void;
  onOpenHelpModal?: () => void;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  familyMembers,
  twoFactorMethods,
  onEditProfile,
  onAddMember,
  onEditMember,
  onDeleteMember,
  onViewMember,
  onSaveSecurity,
  onTwoFactorChange,
  onOpenTwoFactorModal,
  onOpenHelpModal
}) => {
  const handleLogout = () => {
    if (window.confirm('Voulez-vous vraiment vous déconnecter?')) {
      window.location.reload();
    }
  };

  const handle2FAClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onOpenTwoFactorModal) {
      onOpenTwoFactorModal();
    } else {
      onTabChange('security');
    }
  };

  const handleHelpClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onOpenHelpModal) {
      onOpenHelpModal();
    } else {
      onTabChange('about');
    }
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#D6EFFF', minHeight: '100vh' }}>
      {/* Profil */}
      <div style={cardStyle}>
        <div style={headerStyle}>
          <span style={{ marginRight: '10px', fontSize: '20px' }}>👤</span>
          <h3 style={titleStyle}>Profil</h3>
        </div>
        
        <div style={settingsItemStyle} onClick={onEditProfile}>
          <div>
            <h4 style={{ color: '#2C5F7C', margin: '0 0 5px 0', fontSize: '16px' }}>
              Modifier le profil
            </h4>
            <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
              Email, téléphone, adresse, mot de passe
            </p>
          </div>
          <span style={{ fontSize: '20px', color: '#2C5F7C' }}>›</span>
        </div>
      </div>

      {/* Sécurité — SecurityManager */}
      <SecurityManager
        user={{
          nom: currentUser.nom,
          prenom: currentUser.prenom,
          email: currentUser.email,
          telephone: currentUser.telephone,
          twoFactorEnabled: Object.values(twoFactorMethods).some(Boolean),
        }}
        onSecurityUpdate={(updatedUser) => {
          // On mappe twoFactorMethod → twoFactorMethods pour rester compatible avec le reste de l'app
          const newMethods: TwoFactorMethods = {
            password: false,
            pin: false,
            sms: updatedUser.twoFactorMethod === 'SMS' && updatedUser.twoFactorEnabled,
            fingerprint: false,
          };
          onTwoFactorChange(newMethods);
        }}
      />

      {/* Profil Familial */}
      <div style={cardStyle}>
        <div style={headerStyle}>
          <span style={{ marginRight: '10px', fontSize: '20px' }}>👨‍👩‍👧‍👦</span>
          <h3 style={titleStyle}>Profil Familial</h3>
        </div>
        
        <div style={settingsItemStyle} onClick={onAddMember}>
          <div>
            <h4 style={{ color: '#2C5F7C', margin: '0 0 5px 0', fontSize: '16px' }}>
              Ajouter un membre
            </h4>
            <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
              Gérer les membres de la famille
            </p>
          </div>
          <span style={{ fontSize: '24px', color: '#2C5F7C', fontWeight: 300 }}>+</span>
        </div>

        {/* Liste des membres */}
        {familyMembers.map((member) => (
          <div 
            key={member.id} 
            style={settingsItemStyle} 
            onClick={() => onViewMember(member)}
          >
            <div>
              <h4 style={{ color: '#2C5F7C', margin: '0 0 5px 0', fontSize: '16px' }}>
                {member.nom} {member.prenom}
              </h4>
              <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
                {member.lien} - {member.dateNaissance ? Math.floor((new Date().getTime() - new Date(member.dateNaissance).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : '?'} ans
              </p>
            </div>
            <span style={{ fontSize: '20px', color: '#2C5F7C' }}>›</span>
          </div>
        ))}
      </div>

      {/* À propos */}
      <div style={cardStyle}>
        <div style={headerStyle}>
          <span style={{ marginRight: '10px', fontSize: '20px' }}>ℹ️</span>
          <h3 style={titleStyle}>À propos</h3>
        </div>
        
        <div style={settingsItemStyle} onClick={handleHelpClick}>
          <div>
            <h4 style={{ color: '#2C5F7C', margin: '0 0 5px 0', fontSize: '16px' }}>
              Aide
            </h4>
            <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
              Guide d'utilisation et FAQ
            </p>
          </div>
          <span style={{ fontSize: '20px', color: '#2C5F7C' }}>›</span>
        </div>

        <div style={{
          ...settingsItemStyle,
          cursor: 'default',
          borderBottom: 'none'
        }}>
          <div>
            <h4 style={{ color: '#2C5F7C', margin: '0 0 5px 0', fontSize: '16px' }}>
              Version
            </h4>
            <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
              MediTrack-Pro v1.0.0
            </p>
          </div>
        </div>
      </div>

      {/* Bouton Déconnexion */}
      <button 
        onClick={handleLogout}
        style={{
          width: '100%',
          padding: '14px',
          background: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.3s',
          marginTop: '20px',
          maxWidth: '1200px'
        }}
      >
        Déconnexion
      </button>
    </div>
  );
};

// Styles
const cardStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: '12px',
  padding: '0',
  marginBottom: '25px',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
  border: '1px solid #e0e0e0',
  overflow: 'hidden'
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '25px 30px',
  borderBottom: '2px solid #f0f0f0'
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: '#2C5F7C',
  fontSize: '18px',
  fontWeight: 600
};

const settingsItemStyle: React.CSSProperties = {
  padding: '20px 30px',
  borderBottom: '1px solid #f0f0f0',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  transition: 'background 0.3s'
};

export default SettingsSection;
