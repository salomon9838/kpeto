import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaEye, 
  FaHeartbeat, 
  FaFlask, 
  FaHeart, 
  FaUserMd,
  FaUser 
} from 'react-icons/fa';

interface ServiceOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  firstRoute: string;
  description: string;
}

const services: ServiceOption[] = [
  { 
    id: 'ophtalmo', 
    name: 'Ophtalmologie', 
    icon: <FaEye size={32} />, 
    color: '#00a896', 
    bgColor: '#e6f7f5', 
    firstRoute: '/ophtalmo/consultation', 
    description: 'Examens visuels, ordonnances, analyses' 
  },
  { 
    id: 'chirurgie', 
    name: 'Chirurgie', 
    icon: <FaHeartbeat size={32} />, 
    color: '#e74c3c', 
    bgColor: '#fdeaea', 
    firstRoute: '/chirurgie/consultation', 
    description: 'Consultations pré/post-opératoires' 
  },
  { 
    id: 'urologie', 
    name: 'Urologie', 
    icon: <FaFlask size={32} />, 
    color: '#2980b9', 
    bgColor: '#e8f4fc', 
    firstRoute: '/urologie/consultation', 
    description: 'Soins urologiques et bilans' 
  },
  { 
    id: 'cardiologie', 
    name: 'Cardiologie', 
    icon: <FaHeart size={32} />, 
    color: '#c0392b', 
    bgColor: '#f9e8e7', 
    firstRoute: '/cardiologie/examen', 
    description: 'Examens cardiaques et suivi' 
  },
  { 
    id: 'general', 
    name: 'Médecine Générale', 
    icon: <FaUserMd size={32} />, 
    color: '#3498db', 
    bgColor: '#eaf2f8', 
    firstRoute: '/doctor/exam', 
    description: 'Consultations et soins standards' 
  },
];

const ServiceSelection: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      navigate('/login');
    }
  }, [navigate]);

  const handleSelectService = (service: ServiceOption) => {
    localStorage.setItem('user_specialty', service.id);
    localStorage.removeItem('current_consultation_id');
    navigate(service.firstRoute);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '20px' 
    }}>
      <h1 style={{ 
        fontSize: '2.5rem', 
        color: '#2c3e50', 
        marginBottom: '10px', 
        fontWeight: '800',
        textAlign: 'center'
      }}>
        MÉDI-TRACK PRO
      </h1>
      <p style={{ 
        color: '#7f8c8d', 
        marginBottom: '40px', 
        fontSize: '1.1rem',
        textAlign: 'center'
      }}>
        Sélectionnez votre service pour commencer la session
      </p>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '24px', 
        maxWidth: '1200px', 
        width: '100%' 
      }}>
        {services.map((s) => (
          <div
            key={s.id}
            onClick={() => handleSelectService(s)}
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '30px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              border: `2px solid transparent`,
              boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.borderColor = s.color;
              e.currentTarget.style.boxShadow = `0 8px 25px ${s.color}30`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.05)';
            }}
          >
            <div style={{ 
              background: s.bgColor, 
              width: '70px', 
              height: '70px', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: s.color, 
              marginBottom: '20px' 
            }}>
              {s.icon}
            </div>
            <h3 style={{ 
              margin: '0 0 8px 0', 
              color: '#2c3e50', 
              fontSize: '1.3rem',
              fontWeight: '700'
            }}>
              {s.name}
            </h3>
            <p style={{ 
              margin: 0, 
              color: '#7f8c8d', 
              fontSize: '0.95rem', 
              lineHeight: '1.5' 
            }}>
              {s.description}
            </p>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate('/patient')}
        style={{ 
          marginTop: '40px', 
          background: 'transparent', 
          border: '2px solid #3498db', 
          color: '#3498db', 
          padding: '12px 28px', 
          borderRadius: '8px', 
          cursor: 'pointer', 
          fontWeight: '600',
          fontSize: '1rem',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#3498db';
          e.currentTarget.style.color = 'white';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#3498db';
        }}
      >
        <FaUser style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'middle' }} />
        Espace Patient
      </button>
    </div>
  );
};

export default ServiceSelection;