import React from 'react';
import { FaCheckCircle, FaClock, FaUserMd, FaHospital, FaPills, FaFlask, FaXRay } from 'react-icons/fa';

interface TimelineStep { id: number; label: string; date?: string; status: 'completed' | 'current' | 'pending'; icon: React.ReactNode; }

interface PatientTimelineProps { specialty: string; steps: string[]; currentStep: number; }

export default function PatientTimeline({ specialty, steps, currentStep }: PatientTimelineProps) {
  const getIcon = (step: string) => {
    if (step.includes('Examen') || step.includes('Consultation')) return <FaUserMd />;
    if (step.includes('Ordonnance')) return <FaPills />;
    if (step.includes('Labo')) return <FaFlask />;
    if (step.includes('Radio')) return <FaXRay />;
    if (step.includes('Pharmacie') || step.includes('Paiement')) return <FaHospital />;
    return <FaClock />;
  };

  const timelineSteps: TimelineStep[] = steps.map((label, index) => ({
    id: index, label, status: index < currentStep ? 'completed' : index === currentStep ? 'current' : 'pending', icon: getIcon(label)
  }));

  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        {/* Progress line */}
        <div style={{ position: 'absolute', top: '20px', left: '50px', right: '50px', height: '3px', background: '#e2e8f0', zIndex: 1 }}>
          <div style={{ height: '100%', background: specialty === 'ophtalmo' ? '#00a896' : specialty === 'chirurgie' ? '#e74c3c' : specialty === 'urologie' ? '#2980b9' : specialty === 'cardiologie' ? '#c0392b' : '#3498db', width: `${(currentStep / (steps.length - 1)) * 100}%`, transition: 'width 0.3s ease' }} />
        </div>
        
        {timelineSteps.map((step, index) => (
          <div key={step.id} style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: step.status === 'completed' ? (specialty === 'ophtalmo' ? '#00a896' : specialty === 'chirurgie' ? '#e74c3c' : specialty === 'urologie' ? '#2980b9' : specialty === 'cardiologie' ? '#c0392b' : '#3498db') : step.status === 'current' ? '#fbbf24' : '#e2e8f0',
              color: step.status === 'completed' || step.status === 'current' ? 'white' : '#64748b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '10px', fontSize: '18px', transition: 'all 0.3s ease'
            }}>
              {step.status === 'completed' ? <FaCheckCircle size={18} /> : step.icon}
            </div>
            <div style={{ fontSize: '12px', fontWeight: step.status === 'current' ? '600' : '400', color: step.status === 'current' ? '#1e293b' : '#64748b', textAlign: 'center', maxWidth: '100px' }}>{step.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}