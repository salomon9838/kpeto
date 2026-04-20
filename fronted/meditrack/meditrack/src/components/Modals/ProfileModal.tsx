// components/Modals/ProfileModal.tsx
import React, { useState, useEffect } from 'react';
import Modal from '../Common/Modal';
import { User } from '../../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<User>) => void;
  currentUser: User;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onSubmit, currentUser }) => {
  const [formData, setFormData] = useState({
    telephone: '',
    adresse: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        telephone: currentUser.telephone || '',
        adresse: currentUser.adresse || '',
        password: '',
        confirmPassword: ''
      });
    }
  }, [currentUser, isOpen]);

  const handleSubmit = () => {
    if (!formData.telephone || !formData.adresse) {
      alert('❌ Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      alert('❌ Les mots de passe ne correspondent pas');
      return;
    }

    const updatedData: Partial<User> = {
      telephone: formData.telephone,
      adresse: formData.adresse
    };

    if (formData.password) {
      updatedData.password = formData.password;
    }

    onSubmit(updatedData);
    setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
    onClose();
  };

  return (
    <Modal isOpen={isOpen} title="Modifier le Profil" onClose={onClose}>
      {/* Bannière d'information */}
      <div style={infoBannerStyle}>
        <span style={{ fontSize: '16px', marginRight: '8px' }}>ℹ️</span>
        <span style={{ fontSize: '13px' }}>
          Le nom, prénom, nom d'utilisateur et email ne sont pas modifiables.
        </span>
      </div>

      {/* Champs NON modifiables (lecture seule) */}
      <div style={readOnlySectionStyle}>
        <h4 style={sectionTitleStyle}>Informations fixes</h4>
        
        <div className="form-group">
          <label>Nom</label>
          <div style={readOnlyFieldStyle}>
            <span style={iconStyle}>👤</span>
            {currentUser.nom}
          </div>
        </div>

        <div className="form-group">
          <label>Prénom</label>
          <div style={readOnlyFieldStyle}>
            <span style={iconStyle}>👤</span>
            {currentUser.prenom}
          </div>
        </div>

        <div className="form-group">
          <label>Nom d'utilisateur</label>
          <div style={readOnlyFieldStyle}>
            <span style={iconStyle}>🔑</span>
            {currentUser.username}
          </div>
        </div>

        <div className="form-group">
          <label>Email</label>
          <div style={readOnlyFieldStyle}>
            <span style={iconStyle}>📧</span>
            {currentUser.email}
          </div>
        </div>
      </div>

      {/* Séparateur */}
      <div style={separatorStyle}></div>

      {/* Champs MODIFIABLES */}
      <div style={editableSectionStyle}>
        <h4 style={sectionTitleStyle}>Informations modifiables</h4>

        <div className="form-group">
          <label>Téléphone *</label>
          <input
            type="tel"
            value={formData.telephone}
            onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
            placeholder="+228 XX XX XX XX"
            required
          />
        </div>

        <div className="form-group">
          <label>Adresse *</label>
          <input
            type="text"
            value={formData.adresse}
            onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
            placeholder="Votre adresse complète"
            required
          />
        </div>

        <div className="form-group">
          <label>Nouveau mot de passe (optionnel)</label>
          <input
            type="password"
            placeholder="Laisser vide pour ne pas changer"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Confirmer le nouveau mot de passe</label>
          <input
            type="password"
            placeholder="Confirmer le mot de passe"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            disabled={!formData.password}
          />
        </div>
      </div>

      <button className="btn-primary" onClick={handleSubmit}>
        💾 Enregistrer les modifications
      </button>
    </Modal>
  );
};

// Styles
const infoBannerStyle: React.CSSProperties = {
  backgroundColor: '#fff3cd',
  padding: '12px 15px',
  borderRadius: '8px',
  border: '1px solid #ffc107',
  color: '#856404',
  display: 'flex',
  alignItems: 'center',
  marginBottom: '20px'
};

const readOnlySectionStyle: React.CSSProperties = {
  marginBottom: '20px'
};

const editableSectionStyle: React.CSSProperties = {
  marginBottom: '20px'
};

const sectionTitleStyle: React.CSSProperties = {
  color: '#2C5F7C',
  fontSize: '14px',
  fontWeight: 600,
  marginBottom: '15px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

const readOnlyFieldStyle: React.CSSProperties = {
  backgroundColor: '#f8f9fa',
  padding: '12px 15px',
  borderRadius: '8px',
  border: '1px solid #e0e0e0',
  fontSize: '15px',
  color: '#333',
  display: 'flex',
  alignItems: 'center',
  fontWeight: 500,
  cursor: 'not-allowed'
};

const iconStyle: React.CSSProperties = {
  marginRight: '10px',
  fontSize: '18px'
};

const separatorStyle: React.CSSProperties = {
  height: '1px',
  backgroundColor: '#e0e0e0',
  margin: '25px 0'
};

export default ProfileModal;
