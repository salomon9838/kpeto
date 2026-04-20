import { useState, CSSProperties } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../../../api/api";
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

interface ExamData {
  avl_od: string; 
  avl_og: string;
  ts_od: string; 
  ts_og: string;
  avlac_od: string; 
  avlac_og: string;
  vp: string;
}

// =============================================================================
// COMPOSANT
// =============================================================================
export default function ExamStep() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Récupérer patientId depuis la navigation
  const patientId = location.state?.patientId;

  const [motif, setMotif] = useState("");
  const [diagnostic, setDiagnostic] = useState("");
  const [centre, setCentre] = useState("");
  const [doctor, setDoctor] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("Ophtalmologie");

  const [exam, setExam] = useState<ExamData>({
    avl_od: "", 
    avl_og: "",
    ts_od: "", 
    ts_og: "",
    avlac_od: "", 
    avlac_og: "",
    vp: ""
  });

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

  // Style pour les inputs
  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    marginTop: '5px'
  };

  // Style tableau (header blanc sur fond vert)
  const tableHeaderStyle: CSSProperties = {
    border: '1px solid #eee',
    padding: '12px',
    textAlign: 'left',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#00a896'
  };

  const tableCellStyle: CSSProperties = {
    border: '1px solid #eee',
    padding: '8px',
    color: '#333'
  };

  const labelStyle: CSSProperties = {
    fontWeight: 'bold',
    fontSize: '14px',
    color: '#555',
    display: 'block'
  };

  // 💾 Sauvegarde consultation ophtalmo
  const saveExam = async () => {
    // Validation frontend
    if (!centre.trim() || !doctor.trim() || !phone.trim() || !motif.trim()) {
      showNotification('error', 'Champs obligatoires', 'Veuillez remplir le centre, le soignant, le téléphone et le motif.');
      return;
    }

    if (!patientId) {
      showNotification('error', 'Patient manquant', 'Aucun patient sélectionné. Retour à la liste...');
      setTimeout(() => navigate('/old-consultation'), 2000);
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
        patient: Number(patientId),
        service: service,
        centre_medical: centre.trim(),
        nom_soignant: doctor.trim(),
        tel_soignant: phone.trim(),
        motif_consultation: motif.trim(),
        observations_cliniques: diagnostic.trim(),
        // Champs spécifiques ophtalmo (à adapter selon votre modèle)
        examen_ophtalmo: {
          avl_od: exam.avl_od,
          avl_og: exam.avl_og,
          ts_od: exam.ts_od,
          ts_og: exam.ts_og,
          avlac_od: exam.avlac_od,
          avlac_og: exam.avlac_og,
          vp: exam.vp,
        }
      };

      console.log('📤 Payload consultation ophtalmo:', payload);

      // ✅ Appel API vers Django
      const newConsultation = await apiFetch<any>('consultations', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      console.log('✅ Consultation ophtalmo créée:', newConsultation);

      // ✅ Notification succès
      showNotification(
        'success',
        'Consultation sauvegardée',
        'L\'examen ophtalmologique a été enregistré avec succès.',
        [`🆔 Consultation #${newConsultation.id}`, `👁️ ${doctor}`]
      );

      // Reset formulaire (optionnel)
      setMotif("");
      setDiagnostic("");
      setCentre("");
      setDoctor("");
      setPhone("");
      setExam({ avl_od: "", avl_og: "", ts_od: "", ts_og: "", avlac_od: "", avlac_og: "", vp: "" });

      // ✅✅✅ REDIRECTION AUTOMATIQUE VERS ORDONNANCE OPHTALMO (CORRIGÉ)
      setTimeout(() => {
        navigate('/ophtalmo/ordonnance', {  // ← Route exacte de App.tsx
          state: { consultationId: newConsultation.id, patientId }  // ← Transmission des IDs
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

      showNotification('error', 'Échec de l\'enregistrement', 'Le serveur a rejeté la demande.', errorDetails);
    } finally {
      setLoading(false);
    }
  };

  const cancelForm = () => {
    if (confirm("Voulez-vous vraiment annuler ? Tous les champs seront effacés.")) {
      setMotif("");
      setDiagnostic("");
      setCentre("");
      setDoctor("");
      setPhone("");
      setExam({ avl_od: "", avl_og: "", ts_od: "", ts_og: "", avlac_od: "", avlac_og: "", vp: "" });
      showNotification('info', 'Formulaire annulé', 'Tous les champs ont été réinitialisés.');
    }
  };

  // =============================================================================
  // RENDER
  // =============================================================================
  return (
    <div className="container" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      
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

      <div className="card active" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#2c3e50', borderBottom: '2px solid #00a896', paddingBottom: '10px' }}>
          👁️ Consultation Ophtalmologique
        </h2>

        {/* SECTION 1: MOTIF */}
        <div style={{ marginBottom: '25px' }}>
          <label style={{ fontWeight: 'bold', display: 'block', color: '#555' }}>Motif de consultation</label>
          <textarea
            value={motif}
            onChange={e => setMotif(e.target.value)}
            placeholder="Pourquoi le patient consulte-t-il ?"
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
            disabled={loading}
          />
        </div>

        {/* SECTION 2: EXAMEN PHYSIQUE */}
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ color: '#00a896', borderLeft: '4px solid #00a896', paddingLeft: '10px' }}>Examen physique</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Examen</th>
                <th style={tableHeaderStyle}>OD (Œil Droit)</th>
                <th style={tableHeaderStyle}>OG (Œil Gauche)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tableCellStyle}>AVL (Acuité Visuelle de Loin)</td>
                <td style={tableCellStyle}><input style={inputStyle} value={exam.avl_od} onChange={e => setExam({...exam, avl_od: e.target.value})} placeholder="10/10" disabled={loading} /></td>
                <td style={tableCellStyle}><input style={inputStyle} value={exam.avl_og} onChange={e => setExam({...exam, avl_og: e.target.value})} placeholder="10/10" disabled={loading} /></td>
              </tr>
              <tr>
                <td style={tableCellStyle}>TS (Pression intraoculaire)</td>
                <td style={tableCellStyle}><input style={inputStyle} value={exam.ts_od} onChange={e => setExam({...exam, ts_od: e.target.value})} placeholder="15 mmHg" disabled={loading} /></td>
                <td style={tableCellStyle}><input style={inputStyle} value={exam.ts_og} onChange={e => setExam({...exam, ts_og: e.target.value})} placeholder="15 mmHg" disabled={loading} /></td>
              </tr>
              <tr>
                <td style={tableCellStyle}>AVLAC (Avec correction)</td>
                <td style={tableCellStyle}><input style={inputStyle} value={exam.avlac_od} onChange={e => setExam({...exam, avlac_od: e.target.value})} placeholder="10/10" disabled={loading} /></td>
                <td style={tableCellStyle}><input style={inputStyle} value={exam.avlac_og} onChange={e => setExam({...exam, avlac_og: e.target.value})} placeholder="10/10" disabled={loading} /></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SECTION 3: INFORMATION SOIGNANT */}
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ color: '#00a896', borderLeft: '4px solid #00a896', paddingLeft: '10px', marginBottom: '15px' }}>
            Information du soignant
          </h3>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '150px' }}>
              <label style={labelStyle}>Service</label>
              <select value={service} onChange={e => setService(e.target.value)} style={inputStyle} disabled={loading}>
                <option>Ophtalmologie</option>
                <option>Chirurgie</option>
                <option>Urologie</option>
              </select>
            </div>
            <div style={{ flex: '1', minWidth: '150px' }}>
              <label style={labelStyle}>Centre <span style={{ color: 'red' }}>*</span></label>
              <input value={centre} onChange={e => setCentre(e.target.value)} placeholder="ex: CHU" style={inputStyle} disabled={loading} />
            </div>
            <div style={{ flex: '1.5', minWidth: '200px' }}>
              <label style={labelStyle}>Nom et Prénom(s) <span style={{ color: 'red' }}>*</span></label>
              <input value={doctor} onChange={e => setDoctor(e.target.value)} placeholder="Nom du soignant" style={inputStyle} disabled={loading} />
            </div>
            <div style={{ flex: '1', minWidth: '150px' }}>
              <label style={labelStyle}>Téléphone <span style={{ color: 'red' }}>*</span></label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+228..." style={inputStyle} disabled={loading} />
            </div>
          </div>
        </div>

        {/* BOUTONS */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
          <button 
            style={{ 
              padding: '10px 20px', 
              border: '1px solid #ccc', 
              borderRadius: '5px', 
              cursor: loading ? 'not-allowed' : 'pointer', 
              background: '#fff',
              opacity: loading ? 0.7 : 1
            }} 
            onClick={cancelForm}
            disabled={loading}
          >
            ✖ Annuler
          </button>
          <button 
            style={{ 
              padding: '10px 20px', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: loading ? 'not-allowed' : 'pointer', 
              background: loading ? '#9ca3af' : '#d6efff', 
              color: loading ? '#666' : '#007bff', 
              fontWeight: 'bold' 
            }} 
            onClick={saveExam}
            disabled={loading}
          >
            {loading ? '⏳ Enregistrement...' : '💾 Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );
}