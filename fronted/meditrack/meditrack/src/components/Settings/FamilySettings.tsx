// components/Settings/FamilySettings.tsx
import React from 'react';
import { FamilyMember } from '../../types';

interface FamilySettingsProps {
  familyMembers: FamilyMember[];
  onAddMember: () => void;
  onEditMember: (member: FamilyMember) => void;
  onDeleteMember: (id: number) => void;
  onViewMember: (member: FamilyMember) => void;
}

const FamilySettings: React.FC<FamilySettingsProps> = ({
  familyMembers,
  onAddMember,
  onEditMember,
  onDeleteMember,
  onViewMember
}) => {
  return (
    <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)', marginBottom: '20px' }}>
      <h3 style={{ color: '#2C5F7C', marginBottom: '20px' }}>Membres de la Famille</h3>
      
      <button className="btn-primary" onClick={onAddMember} style={{ marginBottom: '20px' }}>
        ➕ Ajouter un membre
      </button>

      {familyMembers.length === 0 ? (
        <p style={{ color: '#999', textAlign: 'center' }}>Aucun membre de famille ajouté</p>
      ) : (
        familyMembers.map(member => (
          <div key={member.id} className="family-card">
            <h4>{member.prenom} {member.nom}</h4>
            <p><strong>Lien:</strong> {member.lien}</p>
            <p><strong>Date de naissance:</strong> {new Date(member.dateNaissance).toLocaleDateString('fr-FR')}</p>
            <p><strong>Sexe:</strong> {member.sexe}</p>
            {member.telephone && <p><strong>Téléphone:</strong> {member.telephone}</p>}
            {member.email && <p><strong>Email:</strong> {member.email}</p>}
            <div className="family-actions">
              <button className="btn-edit" onClick={() => onEditMember(member)}>✏️ Modifier</button>
              <button className="btn-view" onClick={() => onViewMember(member)}>👁️ Voir</button>
              <button className="btn-delete" onClick={() => onDeleteMember(member.id)}>🗑️ Supprimer</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default FamilySettings;
