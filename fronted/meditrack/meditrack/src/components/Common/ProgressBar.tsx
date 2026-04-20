import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ProgressBarProps {
  specialty: string;
  currentStep: number;
  steps: string[];
  color: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ specialty, currentStep, steps, color }) => {
  const navigate = useNavigate();
  
  const labels = steps.map(s => {
    if (s.includes('consultation') || s.includes('examen')) return 'Consultation';
    if (s.includes('ordonnance')) return 'Ordonnance';
    if (s.includes('analyse')) return 'Analyse';
    if (s.includes('labo')) return 'Labo';
    if (s.includes('radio')) return 'Radio';
    if (s.includes('payement')) return 'Paiement';
    return 'Étape';
  });

  const getStepStatus = (index: number) => {
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'current';
    return 'pending';
  };

  return (
    <div style={{ 
      background: 'white', 
      padding: '12px 24px', 
      borderBottom: `3px solid ${color}`, 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px', 
      boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
      flexWrap: 'wrap'
    }}>
      <span style={{ 
        fontWeight: '700', 
        color: '#555', 
        marginRight: '8px', 
        fontSize: '0.9rem', 
        whiteSpace: 'nowrap' 
      }}>
        Parcours :
      </span>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        flex: 1, 
        overflowX: 'auto',
        gap: '4px'
      }}>
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step}>
              <div
                onClick={() => status === 'completed' && navigate(step)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  cursor: status === 'completed' ? 'pointer' : 'default',
                  background: status === 'completed' ? `${color}15` : status === 'current' ? `${color}20` : '#f8f9fa',
                  color: status === 'pending' ? '#b0b0b0' : color,
                  fontWeight: status === 'current' ? '700' : '600',
                  fontSize: '0.85rem',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  border: status === 'current' ? `2px solid ${color}` : '2px solid transparent',
                }}
                title={status === 'completed' ? 'Retourner à cette étape' : ''}
                onMouseEnter={(e) => {
                  if (status === 'completed') {
                    e.currentTarget.style.background = `${color}25`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (status === 'completed') {
                    e.currentTarget.style.background = `${color}15`;
                  }
                }}
              >
                {status === 'completed' && <span style={{ fontWeight: 'bold', marginRight: '4px' }}>✓</span>}
                {labels[index]}
              </div>
              {!isLast && (
                <div style={{ 
                  width: '16px', 
                  height: '2px', 
                  background: status === 'completed' ? color : '#e0e0e0', 
                  margin: '0 2px' 
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div style={{ 
        fontSize: '0.8rem', 
        color: '#888', 
        marginLeft: '8px', 
        whiteSpace: 'nowrap', 
        fontWeight: '500' 
      }}>
        {currentStep + 1}/{steps.length}
      </div>
    </div>
  );
};

export default ProgressBar;