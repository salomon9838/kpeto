import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// =============================================================================
// TYPES
// =============================================================================
interface LoginCredentials {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
  role: 'admin' | 'doctor' | 'patient';
  user: {
    id: number;
    username: string;
    email?: string;
    specialty?: string;  // Pour les médecins
    first_name?: string;
    last_name?: string;
  };
  error?: string;
  detail?: string;
}

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================
const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 📝 Gestion des changements de formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
    setError(''); // Effacer l'erreur quand l'utilisateur tape
  };

  // 🔐 Soumission du formulaire de connexion
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validation frontend basique
    if (!credentials.username.trim() || !credentials.password.trim()) {
      setError('Veuillez remplir tous les champs.');
      setIsLoading(false);
      return;
    }

    try {
      // 🔐 Appel API vers votre endpoint Django personnalisé
      const response = await fetch('http://localhost:8000/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data: LoginResponse = await response.json();

      if (response.ok && data.token) {
        // 💾 Stockage sécurisé des tokens et infos utilisateur
        localStorage.setItem('access_token', data.token);
        localStorage.setItem('user_role', data.role);
        localStorage.setItem('user_info', JSON.stringify(data.user));
        
        // ✅ Stocker la spécialité pour utilisation ultérieure (quand on clique "Consulter")
        if (data.role === 'doctor' && data.user.specialty) {
          localStorage.setItem('user_specialty', data.user.specialty);
        }
        
        // 🔄 REDIRECTION SELON LE RÔLE
        handleRoleBasedRedirect(data.role, data.user);
        
      } else {
        // ❌ Erreur d'authentification
        setError(data.error || data.detail || 'Identifiants incorrects.');
      }
    } catch (err: any) {
      // 🌐 Erreur réseau ou serveur
      console.error('Erreur de connexion:', err);
      setError('Impossible de contacter le serveur. Vérifiez que Django tourne sur le port 8000.');
    } finally {
      setIsLoading(false);
    }
  };

  // 🗺️ Gestion des redirections par rôle
  const handleRoleBasedRedirect = (role: string, user: LoginResponse['user']) => {
    switch (role) {
      
      // 👨‍💼 ADMINISTRATEUR → Panel d'administration
      case 'admin':
        navigate('/admin/dashboard', { replace: true });
        break;
      
      // 👨‍⚕️ MÉDECIN → Dashboard en premier (PAS directement vers spécialité)
      case 'doctor':
        // ✅ La spécialité est déjà stockée dans localStorage ci-dessus
        // ✅ Redirection vers le dashboard médecin qui affiche :
        //    • Nouvelle consultation
        //    • Ancienne consultation
        //    • Statistiques
        //    • Paramètres
        navigate('/patient', { replace: true });
        break;
      
      // 👤 PATIENT → Espace patient
      case 'patient':
        navigate('/patient', { replace: true });
        break;
      
      // 🔁 Fallback pour rôles inconnus
      default:
        console.warn('Rôle inconnu:', role);
        navigate('/patient', { replace: true });
    }
  };

  // =============================================================================
  // RENDER
  // =============================================================================
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
      padding: '20px'
    }}>
      <form onSubmit={handleSubmit} style={{ 
        background: '#fff', 
        padding: '40px', 
        borderRadius: '16px', 
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: '420px',
        animation: 'fadeIn 0.3s ease'
      }}>
        {/* Logo / Titre */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            color: '#3498db', 
            marginBottom: '8px',
            fontWeight: '800',
            letterSpacing: '0.5px'
          }}>
            MÉDI-TRACK PRO
          </h1>
          <p style={{ color: '#7f8c8d', fontSize: '0.95rem', margin: 0 }}>
            Plateforme de gestion médicale
          </p>
        </div>
        
        {/* Message d'erreur */}
        {error && (
          <div style={{ 
            background: '#fef2f2', 
            color: '#b91c1c', 
            padding: '12px 16px', 
            borderRadius: '8px', 
            marginBottom: '24px',
            fontSize: '0.9rem',
            border: '1px solid #fecaca',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '1.1rem' }}>⚠️</span> {error}
          </div>
        )}

        {/* Champ Nom d'utilisateur */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '6px', 
            fontWeight: '600',
            color: '#334155',
            fontSize: '0.95rem'
          }}>
            Nom d'utilisateur
          </label>
          <input
            type="text"
            name="username"
            value={credentials.username}
            onChange={handleChange}
            required
            disabled={isLoading}
            placeholder="Entrez votre identifiant"
            style={{ 
              width: '100%', 
              padding: '12px 14px', 
              borderRadius: '8px', 
              border: '2px solid #e2e8f0',
              fontSize: '1rem',
              outline: 'none',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3498db'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            autoComplete="username"
          />
        </div>

        {/* Champ Mot de passe */}
        <div style={{ marginBottom: '25px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '6px', 
            fontWeight: '600',
            color: '#334155',
            fontSize: '0.95rem'
          }}>
            Mot de passe
          </label>
          <input
            type="password"
            name="password"
            value={credentials.password}
            onChange={handleChange}
            required
            disabled={isLoading}
            placeholder="••••••••"
            style={{ 
              width: '100%', 
              padding: '12px 14px', 
              borderRadius: '8px', 
              border: '2px solid #e2e8f0',
              fontSize: '1rem',
              outline: 'none',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3498db'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            autoComplete="current-password"
          />
        </div>

        {/* Bouton de connexion */}
        <button 
          type="submit" 
          disabled={isLoading}
          style={{ 
            width: '100%', 
            padding: '14px', 
            background: isLoading ? '#94a3b8' : '#3498db', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '8px', 
            fontWeight: '700',
            fontSize: '1rem',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.9 : 1,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
          onMouseEnter={(e) => {
            if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = '#2980b9';
          }}
          onMouseLeave={(e) => {
            if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = '#3498db';
          }}
        >
          {isLoading ? (
            <>
              <span style={{ 
                display: 'inline-block', 
                animation: 'spin 1s linear infinite',
                fontSize: '1.1rem'
              }}>⏳</span>
              Connexion...
            </>
          ) : (
            'SE CONNECTER'
          )}
        </button>
        
        {/* Lien d'aide */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '24px', 
          fontSize: '0.9rem',
          color: '#64748b'
        }}>
          <span>Problème de connexion ? </span>
          <a 
            href="#" 
            style={{ color: '#3498db', textDecoration: 'none', fontWeight: '600' }}
            onClick={(e) => {
              e.preventDefault();
              alert('Contactez l\'administrateur système :\nsupport@meditrackpro.com');
            }}
            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
          >
            Contacter le support
          </a>
        </div>
      </form>
      
      {/* Animations CSS */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input:focus {
          border-color: #3498db !important;
          box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
        }
      `}</style>
    </div>
  );
};

export default LoginForm;