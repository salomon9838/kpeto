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
export default function LabForm() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Récupérer consultationId depuis la navigation
  const consultationId = location.state?.consultationId;

  const [service, setService] = useState("Médecine Générale");
  const [centre, setCentre] = useState("");
  const [doc, setDoc] = useState("");
  const [tel, setTel] = useState("");
  const [labText, setLabText] = useState("");
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

  const addTag = (category: string, val: string) => {
    let text = labText;
    if (text.includes(category + " :")) {
      const regex = new RegExp("(" + category + " : .*)");
      text = text.replace(regex, "$1, " + val);
    } else {
      const prefix = text.length > 0 ? "\n" : "";
      text = text + prefix + category + " : " + val;
    }
    setLabText(text);
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation frontend
    if (!centre.trim() || !doc.trim() || !tel.trim() || !labText.trim()) {
      showNotification('error', 'Champs obligatoires', 'Veuillez remplir le centre, le soignant, le téléphone et les analyses.');
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
        centre_labo: centre.trim(),
        analyses_demandees: labText.trim(),
        motif: motif.trim() || 'Analyse de routine',
        // Champs optionnels pour traçabilité
        nom_soignant: doc.trim(),
        tel_soignant: tel.trim(),
      };

      console.log('📤 Payload analyses-labo:', payload);

      // ✅ Appel API vers Django
      const newAnalyse = await apiFetch<any>('analyses-labo', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      console.log('✅ Analyse labo créée:', newAnalyse);

      // ✅ Notification succès
      showNotification(
        'success',
        'Analyses envoyées',
        'Les demandes d\'analyses ont été transmises au laboratoire.',
        [`🏥 ${centre}`, `👨‍⚕️ ${doc}`]
      );

      // Reset formulaire
      setCentre("");
      setDoc("");
      setTel("");
      setLabText("");
      setMotif("");

      // ✅✅✅ REDIRECTION AUTOMATIQUE VERS RADIO (CORRIGÉ)
      setTimeout(() => {
        navigate('/doctor/radio', {  // ← Route exacte de App.tsx
          state: { consultationId: consultationId }  // ← Transmission de l'ID
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

      <h2>Analyses Laboratoire</h2>
      
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
            <select value={service} onChange={(e) => setService(e.target.value)}>
              <option>Médecine Générale</option>
              <option>Urgence</option>
              <option>Chirurgie</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              Centre<span className="star">*</span>
            </label>
            <input
              required
              value={centre}
              placeholder="Laboratoire National"
              onChange={(e) => setCentre(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>
              Nom du soignant<span className="star">*</span>
            </label>
            <input
              required
              value={doc}
              placeholder="Infirmier(e) de garde"
              onChange={(e) => setDoc(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>
              Téléphone<span className="star">*</span>
            </label>
            <input
              required
              value={tel}
              placeholder="+228 91 00 00 00"
              onChange={(e) => setTel(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* BLOC DES ANALYSES (AVEC SCROLL) */}
      <div
        style={{
          marginTop: 25,
          maxHeight: 450,
          overflowY: "auto",
          border: "1px solid #eee",
          padding: 15,
          borderRadius: 8,
          background: "#fafafa",
        }}
      >
        <label
          style={{
            display: "block",
            marginBottom: 10,
            fontWeight: "bold",
            color: "var(--primary-teal)",
          }}
        >
          TYPE D'ANALYSE RAPIDE (Cliquer pour ajouter) :
        </label>

        {/* PARASITOLOGIE & BACTÉRIOLOGIE */}
        <p
          style={{
            fontSize: 13,
            color: "red",
            fontWeight: "normal",
            marginTop: 20,
            textDecoration: "underline",
          }}
        >
          PARASITOLOGIE & BACTÉRIOLOGIE
        </p>

        <div className="tag-row">
          <button type="button" className="tag-lab" onClick={() => addTag("PARASITOLOGIE", "GE")} disabled={loading}>GE</button>
          <button type="button" className="tag-lab" onClick={() => addTag("PARASITOLOGIE", "SELLES KOP")} disabled={loading}>SELLES KOP</button>
          <button type="button" className="tag-lab" onClick={() => addTag("PARASITOLOGIE", "SCOTCH TEST")} disabled={loading}>SCOTCH TEST</button>

          <button type="button" className="tag-lab" onClick={() => addTag("BACTÉRIOLOGIE", "BCE")} disabled={loading}>BCE</button>
          <button type="button" className="tag-lab" onClick={() => addTag("BACTÉRIOLOGIE", "Culot urinaire")} disabled={loading}>Culot urinaire</button>
          <button type="button" className="tag-lab" onClick={() => addTag("BACTÉRIOLOGIE", "Crachat BAAR")} disabled={loading}>Crachat BAAR</button>
          <button type="button" className="tag-lab" onClick={() => addTag("BACTÉRIOLOGIE", "PV")} disabled={loading}>PV</button>
          <button type="button" className="tag-lab" onClick={() => addTag("BACTÉRIOLOGIE", "ECBU")} disabled={loading}>ECBU</button>
          <button type="button" className="tag-lab" onClick={() => addTag("BACTÉRIOLOGIE", "Coproculture")} disabled={loading}>Coproculture</button>
          <button type="button" className="tag-lab" onClick={() => addTag("BACTÉRIOLOGIE", "Spermogramme/Spermoculture")} disabled={loading}>
            Spermogramme/Spermoculture
          </button>
        </div>

        {/* SÉROLOGIE */}
        <p
          style={{
            fontSize: 13,
            color: "red",
            fontWeight: "normal",
            marginTop: 20,
            textDecoration: "underline",
          }}
        >
          SÉROLOGIE
        </p>

        <div className="tag-row">
          <button type="button" className="tag-lab" onClick={() => addTag("SÉROLOGIE", "SRV")} disabled={loading}>SRV</button>
          <button type="button" className="tag-lab" onClick={() => addTag("SÉROLOGIE", "Ag HBs")} disabled={loading}>Ag HBs</button>
          <button type="button" className="tag-lab" onClick={() => addTag("SÉROLOGIE", "TPHA-VDRL")} disabled={loading}>TPHA-VDRL</button>
          <button type="button" className="tag-lab" onClick={() => addTag("SÉROLOGIE", "CRP")} disabled={loading}>CRP</button>
          <button type="button" className="tag-lab" onClick={() => addTag("SÉROLOGIE", "Toxoplasmose")} disabled={loading}>Toxoplasmose</button>
          <button type="button" className="tag-lab" onClick={() => addTag("SÉROLOGIE", "Hépatite C (HCV)")} disabled={loading}>Hépatite C (HCV)</button>
          <button type="button" className="tag-lab" onClick={() => addTag("SÉROLOGIE", "Rubéole")} disabled={loading}>Rubéole</button>
        </div>

        {/* HÉMATOLOGIE */}
        <p
          style={{
            fontSize: 13,
            color: "red",
            fontWeight: "normal",
            marginTop: 20,
            textDecoration: "underline",
          }}
        >
          HÉMATOLOGIE
        </p>

        <div className="tag-row">
          <button type="button" className="tag-lab" onClick={() => addTag("HÉMATOLOGIE", "NFS")} disabled={loading}>NFS</button>
          <button type="button" className="tag-lab" onClick={() => addTag("HÉMATOLOGIE", "VS")} disabled={loading}>VS</button>
          <button type="button" className="tag-lab" onClick={() => addTag("HÉMATOLOGIE", "NB-TH")} disabled={loading}>NB-TH</button>
          <button type="button" className="tag-lab" onClick={() => addTag("HÉMATOLOGIE", "Groupage")} disabled={loading}>Groupage</button>
          <button type="button" className="tag-lab" onClick={() => addTag("HÉMATOLOGIE", "Electrophorèse")} disabled={loading}>Electrophorèse</button>
        </div>

        {/* BIOCHIMIE */}
        <p
          style={{
            fontSize: 13,
            color: "red",
            fontWeight: "normal",
            marginTop: 20,
            textDecoration: "underline",
          }}
        >
          BIOCHIMIE
        </p>

        <div className="tag-row">
          {[
            "Urée",
            "Glycémie",
            "Créatininémie",
            "ASAT",
            "ALAT",
            "GGT",
            "PAL",
            "Uricémie",
            "Bilirubine T",
            "Bilirubine D",
            "Phosphore",
            "HbA1C",
            "Cholesterol total",
            "HDL-Cholesterol",
            "LDL-Cholesterol",
            "Triglycérides",
            "Calcémie",
            "Magnésiemie",
            "TSHU",
            "T3",
            "T4",
            "Ionogramme S.",
          ].map((v, i) => (
            <button
              key={i}
              type="button"
              className="tag-lab"
              onClick={() => addTag("BIOCHIMIE", v)}
              disabled={loading}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* ANALYSES DEMANDÉES */}
      <div style={{ marginTop: 20 }}>
        <label>
          Analyses demandées<span className="star">*</span>
        </label>

        <textarea
          required
          rows={5}
          style={{ width: "100%", marginTop: 8 }}
          value={labText}
          onChange={(e) => setLabText(e.target.value)}
          placeholder="Les analyses s'afficheront ici..."
          disabled={loading}
        ></textarea>
      </div>

      {/* MOTIF */}
      <div style={{ marginTop: 20 }}>
        <label>Motif</label>

        <textarea
          rows={3}
          style={{ width: "100%", marginTop: 8 }}
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
          placeholder="Saisir ici le motif..."
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