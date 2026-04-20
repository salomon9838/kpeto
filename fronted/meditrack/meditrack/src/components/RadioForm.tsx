import { useState, CSSProperties } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from '../api/api';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

// =============================================================================
// TYPES
// =============================================================================
type NotificationType = 'success' | 'error' | 'info';

interface NotificationState {
  show: boolean;
  type: NotificationType;
  title: string;
  message: string;
  details?: string[];
}

// =============================================================================
// COMPOSANT
// =============================================================================
export default function RadioForm() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Récupérer consultationId depuis la navigation
  const consultationId = location.state?.consultationId;

  const [centre, setCentre] = useState("");
  const [nom, setNom] = useState("");
  const [tel, setTel] = useState("");
  const [typeAnalyse, setTypeAnalyse] = useState("");
  const [region, setRegion] = useState("");
  const [motif, setMotif] = useState(""); 

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    show: false, type: 'info', title: '', message: '', details: []
  });

  // 🎯 Notification professionnelle
  const showNotification = (type: NotificationType, title: string, message: string, details?: string[]) => {
    setNotification({ show: true, type, title, message, details });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 6000);
  };

  // 🎨 Styles notification
  const getNotificationStyles = (): CSSProperties => {
    const colors: Record<NotificationType, { bg: string; border: string; text: string }> = {
      success: { bg: '#f0fdf4', border: '#22c55e', text: '#166534' },
      error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
      info: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
    };
    const c = colors[notification.type];
    return {
      position: 'fixed', top: '16px', right: '16px', zIndex: 9999,
      padding: '14px 18px', borderRadius: '10px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
      borderLeft: `4px solid ${c.border}`, backgroundColor: c.bg, color: c.text,
      maxWidth: '420px', transition: 'all 0.3s ease',
      opacity: notification.show ? 1 : 0, transform: notification.show ? 'translateX(0)' : 'translateX(100%)',
    };
  };

  // 🔐 Vérif auth
  const isAuthenticated = () => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('access_token');
    return !!token && token !== 'null' && token !== 'undefined';
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation frontend
    if (!centre.trim() || !nom.trim() || !tel.trim() || !typeAnalyse.trim() || !region.trim() || !motif.trim()) {
      showNotification('error', 'Champs obligatoires', 'Veuillez remplir tous les champs marqués d\'une étoile.');
      return;
    }

    if (!consultationId) {
      showNotification('error', 'Consultation manquante', 'Aucune consultation liée. Retour à la page précédente...');
      setTimeout(() => navigate('/doctor/exam'), 2000);
      return;
    }

    if (!isAuthenticated()) {
      showNotification('error', 'Session expirée', 'Veuillez vous reconnecter.');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        consultation: Number(consultationId),
        centre_radio: centre.trim(),
        type_analyse: typeAnalyse.trim(),
        region_a_examiner: region.trim(),
        motif: motif.trim(),
        // Champs optionnels pour traçabilité
        nom_soignant: nom.trim(),
        tel_soignant: tel.trim(),
      };

      console.log('📤 Payload analyses-radio:', payload);

      // ✅ Appel API vers Django
      const newRadio = await apiFetch<any>('analyses-radio', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      console.log('✅ Analyse radio créée:', newRadio);

      // ✅ Notification succès
      showNotification(
        'success',
        'Analyse radio envoyée',
        'La demande d\'examen a été transmise au service de radiologie.',
        [`🏥 ${centre}`, `👨‍⚕️ ${nom}`]
      );

      // Reset formulaire
      setCentre("");
      setNom("");
      setTel("");
      setTypeAnalyse("");
      setRegion("");
      setMotif("");

      // ✅✅✅ REDIRECTION AUTOMATIQUE VERS PAIEMENT/PHARMACIE (CORRIGÉ)
      setTimeout(() => {
        // ⚠️ Adaptez cette route selon votre structure réelle :
        // - "/payement" pour le paiement
        // - "/pharmacy" ou "/doctor/pharmacy" pour la pharmacie
        // - "/accueil" pour l'accueil général
        navigate('/payement', {  // ← Route de votre choix
          state: { 
            consultationId: consultationId,
            from: 'radio',  // ← Indique la provenance pour personnaliser l'UI paiement
            type: 'consultation'  // ← Type de prestation à facturer
          }
        });
      }, 1500);

    } catch (err: any) {
      console.error('❌ Erreur API:', err);
      
      // Gestion des erreurs de validation Django
      let errorDetails: string[] = [];
      if (err.validationErrors) {
        errorDetails = Object.entries(err.validationErrors).map(([field, msgs]) => 
          `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`
        );
      } else if (err.message) {
        errorDetails = [err.message];
      } else {
        errorDetails = ['Erreur HTTP 400 - Données invalides'];
      }

      showNotification('error', 'Échec de l\'envoi', 'Le serveur a rejeté la demande.', errorDetails);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submitForm}>
      {/* 🔔 Notification professionnelle */}
      {notification.show && (
        <div style={getNotificationStyles()} role="alert">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ fontSize: '18px', marginTop: '1px', color: notification.type === 'error' ? '#ef4444' : notification.type === 'success' ? '#22c55e' : '#3b82f6' }}>
              {notification.type === 'success' && <FaCheckCircle size={18} />}
              {notification.type === 'error' && <FaExclamationTriangle size={18} />}
              {notification.type === 'info' && <FaInfoCircle size={18} />}
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{notification.title}</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.9 }}>{notification.message}</p>
              {notification.details?.map((d, i) => (
                <li key={i} style={{ margin: '2px 0 0 14px', fontSize: '12px', paddingLeft: 0 }}>{d}</li>
              ))}
            </div>
            <button onClick={() => setNotification(p => ({ ...p, show: false }))} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', opacity: 0.6, padding: 0, lineHeight: 1 }}>×</button>
          </div>
        </div>
      )}

      <h2>Analyse Radio</h2>
      
      <div className="box">
        <label
          style={{
            display: "block",
            marginBottom: 10,
            fontWeight: "bold",
            fontSize: 15,
            color: "var(--primary-teal)",
          }}
        >
          Information du soignant
        </label>

        <div className="form-grid">
          <div className="form-group">
            <label>Service</label>
            <select disabled={loading}>
              <option>Médecine Générale</option>
              <option>Urgence</option>
              <option>Chirurgie</option>
              <option>Radiologie</option>
            </select>
          </div>

          <div className="form-group">
            <label>Centre<span className="star">*</span></label>
            <input
              required
              placeholder="ex: Centre de Radiologie"
              value={centre}
              onChange={(e) => setCentre(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Nom et Prénom(s)<span className="star">*</span></label>
            <input
              required
              placeholder="Nom du soignant"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Téléphone<span className="star">*</span></label>
            <input
              required
              placeholder="+228..."
              value={tel}
              onChange={(e) => setTel(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <label>Type d'analyse<span className="star">*</span></label>
        <textarea
          required
          rows={3}
          style={{ width: "100%", marginTop: 8 }}
          placeholder="ex: Radiographie, Échographie, Scanner..."
          value={typeAnalyse}
          onChange={(e) => setTypeAnalyse(e.target.value)}
          disabled={loading}
        ></textarea>
      </div>

      <div style={{ marginTop: 20 }}>
        <label>Région à examiner<span className="star">*</span></label>
        <input
          required
          style={{ width: "100%", marginTop: 8 }}
          placeholder="ex: Rachis lombaire, Épaule droite..."
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          disabled={loading}
        />
      </div>

      <div style={{ marginTop: 20 }}>
        <label>Motif<span className="star">*</span></label>
        <textarea
          required
          rows={3}
          style={{ width: "100%", marginTop: 8 }}
          placeholder="Saisir ici le motif de l'examen..."
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
          disabled={loading}
        ></textarea>
      </div>

      <div className="btn-group">
        <button 
          type="submit" 
          className="btn"
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? '⏳ Envoi en cours...' : '👥 Envoyer au patient'}
        </button>
      </div>
    </form>
  );
}