// components/Modals/CarnetModal.tsx
import React, { useState } from 'react';
import Modal from '../Common/Modal';
import { CarnetFormData } from '../../types';

interface CarnetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CarnetFormData) => void;
}

const CarnetModal: React.FC<CarnetModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<CarnetFormData>({
    date: '',
    service: '',
    medecin: '',
    diagnostic: '',
    traitement: ''
  });

  const handleSubmit = () => {
    if (formData.date && formData.service && formData.medecin) {
      onSubmit(formData);
      setFormData({ date: '', service: '', medecin: '', diagnostic: '', traitement: '' });
      onClose();
    } else {
      alert('❌ Veuillez remplir tous les champs obligatoires');
    }
  };

  return (
    <Modal isOpen={isOpen} title="Ajouter une entrée au carnet" onClose={onClose}>
      <div className="form-group">
        <label>Date</label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>Type de service</label>
        <select
          value={formData.service}
          onChange={(e) => setFormData({ ...formData, service: e.target.value })}
        >
          <option value="">Sélectionner...</option>
          <option value="Consultation">Consultation</option>
          <option value="Analyse">Analyse</option>
          <option value="Urgence">Urgence</option>
        </select>
      </div>

      <div className="form-group">
        <label>Médecin</label>
        <input
          type="text"
          placeholder="Nom du médecin"
          value={formData.medecin}
          onChange={(e) => setFormData({ ...formData, medecin: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>Diagnostic</label>
        <input
          type="text"
          placeholder="Diagnostic (optionnel)"
          value={formData.diagnostic}
          onChange={(e) => setFormData({ ...formData, diagnostic: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>Traitement</label>
        <input
          type="text"
          placeholder="Traitement prescrit (optionnel)"
          value={formData.traitement}
          onChange={(e) => setFormData({ ...formData, traitement: e.target.value })}
        />
      </div>

      {/* --- SECTION BOUTONS --- */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button 
          className="btn-primary" 
          onClick={handleSubmit} 
          style={{ flex: 1 }}
        >
          Ajouter
        </button>
        
        <button 
          className="btn-secondary" 
          onClick={onClose} 
          style={{ 
            flex: 1, 
            background: '#95a5a6', 
            color: '#fff', 
            border: 'none', 
            padding: '10px', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}
        >
          Annuler / Retour
        </button>
      </div>
    </Modal>
  );
};

export default CarnetModal;