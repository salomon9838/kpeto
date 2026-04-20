// components/Settings/ProfileSettings.tsx
import React from 'react';
import { User } from '../../types';

interface ProfileSettingsProps {
  currentUser: User;
  onEditProfile: () => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ currentUser, onEditProfile }) => {
  return (
    <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)' }}>
      <h3 style={{ color: '#2C5F7C', marginBottom: '20px' }}>Informations Personnelles</h3>
      <div style={{ marginBottom: '15px' }}>
        <p><strong>Nom:</strong> {currentUser.nom}</p>
        <p><strong>Prénom:</strong> {currentUser.prenom}</p>
        <p><strong>Nom d'utilisateur:</strong> {currentUser.username}</p>
        <p><strong>Email:</strong> {currentUser.email}</p>
        <p><strong>Téléphone:</strong> {currentUser.telephone}</p>
        <p><strong>Adresse:</strong> {currentUser.adresse}</p>
      </div>
      <button className="btn-primary" onClick={onEditProfile}>
        ✏️ Modifier le profil
      </button>
    </div>
  );
};

export default ProfileSettings;
