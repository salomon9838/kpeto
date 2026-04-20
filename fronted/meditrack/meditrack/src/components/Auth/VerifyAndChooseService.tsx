import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaHospital, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

// =============================================================================
// TYPES
// =============================================================================
interface PatientState {
  patientId?: number;
  patientName?: string;
  patientCode?: string;
}

interface ServiceConfig {
  id: string;
  name: string;
  route: string;
  emoji: string;
  color: string;
}

// =============================================================================
// CONFIGURATION DES SERVICES (Mapping spécialité → route)
// =============================================================================
const SERVICE_ROUTES: Record<string, ServiceConfig> = {
  ophtalmo: {
    id: 'ophtalmo',
    name: 'Ophtalmologie',
    route: '/ophtalmo/consultation',
    emoji: '👁️',
    color: '#00a896'
  },
  chirurgie: {
    id: 'chirurgie',
    name: 'Chirurgie',
    route: '/chirurgie/consultation',
    emoji: '🔪',
    color: '#e74c3c'
  },
  urologie: {
    id: 'urologie',
    name: 'Urologie',
    route: '/urologie/consultation',
    emoji: '🧪',
    color: '#2980b9'
  },
  cardiologie: {
    id: 'cardiologie',
    name: 'Cardiologie',
    route: '/cardiologie/examen',
    emoji: '❤️',
    color: '#c0392b'
  },
  general: {
    id: 'general',
    name: 'Médecine Générale',
    route: '/doctor/exam',
    emoji: '🩺',
    color: '#3498db'
  }
};

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================
const VerifyAndChooseService: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [status, setStatus] = useState<'loading' | 'redirecting' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [targetService, setTargetService] = useState<ServiceConfig | null>(null);

  // Patient reçu depuis navigation
  const patientFromState = location.state as PatientState | null;

  // =============================================================================
  // REDIRECTION AUTOMATIQUE AU MONTAGE
  // =============================================================================
  useEffect(() => {
    const redirectToService = async () => {
      try {
        setStatus('loading');
        setMessage('Vérification de votre profil...');

        // 1️⃣ Vérifier le patient (requis pour toute consultation)
        const storedPatientId = localStorage.getItem('current_patient_id');
        const statePatientId = patientFromState?.patientId;

        if (!storedPatientId && !statePatientId) {
          throw new Error('Aucun patient sélectionné. Veuillez revenir à la recherche.');
        }

        // Synchroniser les infos patient dans localStorage
        if (statePatientId && !storedPatientId) {
          localStorage.setItem('current_patient_id', statePatientId.toString());
        }
        if (patientFromState?.patientName && !localStorage.getItem('current_patient_name')) {
          localStorage.setItem('current_patient_name', patientFromState.patientName);
        }
        if (patientFromState?.patientCode && !localStorage.getItem('current_patient_code')) {
          localStorage.setItem('current_patient_code', patientFromState.patientCode);
        }

        // 2️⃣ Récupérer la spécialité du médecin (définie par l'admin lors du login)
        const userSpecialty = localStorage.getItem('user_specialty');
        const userRole = localStorage.getItem('user_role');
        const token = localStorage.getItem('access_token');

        if (!token) {
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        }

        if (!userSpecialty || !['ophtalmo', 'chirurgie', 'urologie', 'cardiologie', 'general'].includes(userSpecialty)) {
          throw new Error(`Spécialité non reconnue : "${userSpecialty}". Contactez l'administrateur.`);
        }

        // 3️⃣ Trouver la configuration du service
        const service = SERVICE_ROUTES[userSpecialty];
        if (!service) {
          throw new Error(`Service non configuré pour la spécialité : ${userSpecialty}`);
        }

        setTargetService(service);
        setMessage(`Redirection vers ${service.emoji} ${service.name}...`);
        setStatus('redirecting');

        // 4️⃣ Attendre un court instant pour l'animation, puis rediriger
        await new Promise(resolve => setTimeout(resolve, 1200));

        // 5️⃣ Redirection finale avec toutes les infos nécessaires
        navigate(service.route, {
          replace: true,
          state: {
            patientId: statePatientId || (storedPatientId ? parseInt(storedPatientId) : undefined),
            patientName: localStorage.getItem('current_patient_name'),
            patientCode: localStorage.getItem('current_patient_code'),
            service: service.id,
            serviceName: service.name,
            doctorId: localStorage.getItem('current_doctor_id'),
            timestamp: new Date().toISOString()
          }
        });

      } catch (err: any) {
        console.error('❌ Erreur redirection service:', err);
        setMessage(err.message || 'Une erreur est survenue.');
        setStatus('error');
      }
    };

    redirectToService();
  }, [navigate, patientFromState]);

  // =============================================================================
  // STYLES
  // =============================================================================
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  };

  const cardStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: '20px',
    padding: '40px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 12px 35px rgba(0,0,0,0.08)',
    border: '1px solid #e2e8f0',
    textAlign: 'center'
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '3rem',
    marginBottom: '20px'
  };

  const messageStyle: React.CSSProperties = {
    fontSize: '1.1rem',
    color: '#334155',
    marginBottom: '25px',
    lineHeight: '1.5'
  };

  const spinnerStyle: React.CSSProperties = {
    display: 'inline-block',
    animation: 'spin 1s linear infinite',
    marginRight: '10px'
  };

  const infoBoxStyle: React.CSSProperties = {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
    textAlign: 'left'
  };

  const buttonStyle: React.CSSProperties = {
    background: '#64748b',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '10px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '1rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  };

  // =============================================================================
  // RENDER
  // =============================================================================
  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Icône selon l'état */}
        <div style={{ ...iconStyle, color: status === 'error' ? '#ef4444' : '#00a896' }}>
          {status === 'loading' && <FaSpinner />}
          {status === 'redirecting' && targetService && (
            <span>{targetService.emoji}</span>
          )}
          {status === 'error' && <FaExclamationTriangle />}
        </div>

        {/* Titre */}
        <h1 style={{
          fontSize: '1.8rem',
          color: '#1e293b',
          marginBottom: '10px',
          fontWeight: '800'
        }}>
          MÉDI-TRACK PRO
        </h1>

        {/* Message d'état */}
        <p style={messageStyle}>
          {status === 'loading' && '🔄 Préparation de votre session...'}
          {status === 'redirecting' && message}
          {status === 'error' && `⚠️ ${message}`}
        </p>

        {/* Info Patient (toujours visible) */}
        <div style={infoBoxStyle}>
          <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#64748b' }}>
            <strong>Patient :</strong>
          </p>
          <p style={{ margin: 0, fontWeight: '600', color: '#1e293b' }}>
            {localStorage.getItem('current_patient_name') || patientFromState?.patientName || 'Chargement...'}
          </p>
          <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            ID: <strong>{localStorage.getItem('current_patient_id')}</strong>
            {localStorage.getItem('current_patient_code') && (
              <span> • Code: {localStorage.getItem('current_patient_code')}</span>
            )}
          </p>
        </div>

        {/* Info Service (si en cours de redirection) */}
        {status === 'redirecting' && targetService && (
          <div style={{
            ...infoBoxStyle,
            borderLeft: `4px solid ${targetService.color}`,
            background: `${targetService.color}10`
          }}>
            <p style={{ margin: 0, fontWeight: '600', color: targetService.color }}>
              {targetService.emoji} {targetService.name}
            </p>
            <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Route: <code>{targetService.route}</code>
            </p>
          </div>
        )}

        {/* Bouton Retour (seulement en cas d'erreur) */}
        {status === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => navigate('/old-consultation', { replace: true })}
              style={{ ...buttonStyle, background: '#3498db' }}
            >
              ← Retour à la recherche
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                navigate('/login', { replace: true });
              }}
              style={{ ...buttonStyle, background: '#ef4444' }}
            >
              🔐 Se reconnecter
            </button>
          </div>
        )}

        {/* Animation CSS */}
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default VerifyAndChooseService;