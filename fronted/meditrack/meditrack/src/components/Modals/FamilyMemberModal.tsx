// components/Modals/FamilyMemberModal.tsx
import React, { useState, useEffect } from 'react';
import Modal from '../Common/Modal';
import { MemberFormData, FamilyMember } from '../../types';

interface FamilyMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MemberFormData) => void;
  mode: 'add' | 'edit';
  member?: FamilyMember | null;
}

const FamilyMemberModal: React.FC<FamilyMemberModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  mode,
  member 
}) => {
  const [formData, setFormData] = useState<MemberFormData>({
    nom: '',
    prenom: '',
    dateNaissance: '',
    sexe: '',
    lien: '',
    telephone: '',
    email: ''
  });

  useEffect(() => {
    if (mode === 'edit' && member) {
      setFormData({
        nom: member.nom,
        prenom: member.prenom,
        dateNaissance: member.dateNaissance,
        sexe: member.sexe,
        lien: member.lien,
        telephone: member.telephone || '',
        email: member.email || ''
      });
    } else {
      setFormData({
        nom: '',
        prenom: '',
        dateNaissance: '',
        sexe: '',
        lien: '',
        telephone: '',
        email: ''
      });
    }
  }, [mode, member, isOpen]);

  const handleSubmit = () => {
    if (!formData.nom || !formData.prenom || !formData.dateNaissance || !formData.sexe || !formData.lien) {
      alert('❌ Veuillez remplir tous les champs obligatoires');
      return;
    }
    onSubmit(formData);
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      title={mode === 'add' ? 'Ajouter un Membre Familial' : 'Modifier un Membre Familial'} 
      onClose={onClose}
    >
      <div className="form-group">
        <label>Nom</label>
        <input
          type="text"
          placeholder="Nom"
          value={formData.nom}
          onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>Prénom</label>
        <input
          type="text"
          placeholder="Prénom"
          value={formData.prenom}
          onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>Date de naissance</label>
        <input
          type="date"
          value={formData.dateNaissance}
          onChange={(e) => setFormData({ ...formData, dateNaissance: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>Sexe</label>
        <select
          value={formData.sexe}
          onChange={(e) => setFormData({ ...formData, sexe: e.target.value })}
        >
          <option value="">Sélectionner...</option>
          <option value="Masculin">Masculin</option>
          <option value="Féminin">Féminin</option>
          <option value="Autre">Autre</option>
        </select>
      </div>

      <div className="form-group">
        <label>Lien de parenté</label>
        <select
          value={formData.lien}
          onChange={(e) => setFormData({ ...formData, lien: e.target.value })}
        >
          <option value="">Sélectionner...</option>
          <option value="Conjoint(e)">Conjoint(e)</option>
          <option value="Enfant">Enfant</option>
          <option value="Parent">Parent</option>
          <option value="Frère/Sœur">Frère/Sœur</option>
          <option value="Autre">Autre</option>
        </select>
      </div>

      <div className="form-group">
        <label>Téléphone (optionnel)</label>
        <input
          type="tel"
          placeholder="+228 XX XX XX XX"
          value={formData.telephone}
          onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>Email (optionnel)</label>
        <input
          type="email"
          placeholder="email@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>

      {/* --- ACTIONS --- */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '25px' }}>
        <button 
          className="btn-primary" 
          onClick={handleSubmit}
          style={{ flex: 2, padding: '12px', borderRadius: '8px', cursor: 'pointer' }}
        >
          {mode === 'add' ? 'Ajouter le membre' : 'Enregistrer les modifications'}
        </button>

        <button 
          type="button"
          onClick={onClose}
          style={{ 
            flex: 1, 
            padding: '12px', 
            borderRadius: '8px', 
            border: '1px solid #cbd5e1',
            backgroundColor: '#f1f5f9',
            color: '#475569',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Annuler
        </button>
      </div>
    </Modal>
  );
};

export default FamilyMemberModal;