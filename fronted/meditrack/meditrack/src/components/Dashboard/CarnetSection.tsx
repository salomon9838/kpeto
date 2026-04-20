// components/Dashboard/CarnetSection.tsx
import React from 'react';
import { MedicalEntry } from '../../types';

interface CarnetSectionProps {
  medicalHistory: MedicalEntry[];
  onAddEntry: () => void;
  onDownload: () => void;
  onDeleteEntry: (id: number) => void;
}

const CarnetSection: React.FC<CarnetSectionProps> = ({
  medicalHistory,
  onAddEntry,
  onDownload,
  onDeleteEntry
}) => {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '30px',
      height: '150px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ 
        color: '#2C5F7C', 
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid rgba(0,0,0,0.1)',
        gap: '10px'
      }}>
        📋 Historique Médical
      </h2>
      
      <p style={{ 
        color: '#666', 
        textAlign: 'center', 
        padding: '10px 10px',
        fontSize: '14px'
      }}>
        Aucun historique médical disponible.
      </p>
    </div>
  );
};

export default CarnetSection;