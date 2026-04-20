import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  Plus, Trash2, Send, Stethoscope, CheckCircle, AlertTriangle, Info 
} from "lucide-react";

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

interface MedicamentRow {
  med: string;
  dose: string;
  quantite: string;
  duree: string;
}

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================
function Ordonnance() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 🔍 Récupérer consultationId avec fallback
  const [consultationId, setConsultationId] = useState<number | null>(null);

  useEffect(() => {
    // Vérifier au montage du composant
    const id = location.state?.consultationId;
    console.log('🔍 consultationId reçu:', id);
    
    if (!id) {
      // Essayer de récupérer depuis localStorage (fallback)
      const storedId = localStorage.getItem('current_consultation_id');
      if (storedId) {
        console.log('📦 Récupéré depuis localStorage:', storedId);
        setConsultationId(Number(storedId));
      } else {
        showNotification(
          'error', 
          'Consultation manquante', 
          'Veuillez créer un examen clinique d\'abord.',
          ['Redirection dans 3 secondes...']
        );
        setTimeout(() => navigate('/doctor/exam'), 3000);
      }
    } else {
      setConsultationId(Number(id));
      // Stocker en localStorage pour sécurité
      localStorage.setItem('current_consultation_id', String(id));
    }
  }, [location.state, navigate]);

  const [meds, setMeds] = useState<MedicamentRow[]>([
    { med: "", dose: "", quantite: "", duree: "" }
  ]);

  const [header, setHeader] = useState({
    service: "Médecine Générale",
    centre: "",
    prescripteur: "",
    tel: "",
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
  const getNotificationStyles = (): React.CSSProperties => {
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

  // 📝 Mise à jour médicaments
  const updateMed = (index: number, field: keyof MedicamentRow, value: string) => {
    setMeds(prev => {
      const newMeds = [...prev];
      newMeds[index] = { ...newMeds[index], [field]: value };
      return newMeds;
    });
  };

  const addRow = () => setMeds([...meds, { med: "", dose: "", quantite: "", duree: "" }]);

  const removeRow = (index: number) => {
    if (meds.length > 1) setMeds(meds.filter((_, i) => i !== index));
  };

  // 🔐 Vérif auth + récupération token
  const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('access_token');
    if (!token || token === 'null' || token === 'undefined') return null;
    return token;
  };

  // 💾 Sauvegarde ordonnance + médicaments
  const saveOrdonnance = async () => {
    // Validation header
    if (!header.centre.trim() || !header.prescripteur.trim() || !header.tel.trim()) {
      showNotification('error', 'Champs obligatoires', 'Veuillez remplir le centre, le prescripteur et le téléphone.');
      return;
    }

    // ✅ Validation médicaments
    const validMeds = meds.filter(m => {
      const medOk = m.med?.trim()?.length > 0;
      const doseOk = m.dose?.trim()?.length > 0;
      return medOk && doseOk;
    });

    if (validMeds.length === 0) {
      showNotification(
        'error', 
        'Médicaments incomplets', 
        'Chaque médicament doit avoir une désignation ET une posologie.',
        ['Ajoutez au moins un médicament complet.']
      );
      return;
    }

    // 🔴 Vérification consultationId
    if (!consultationId) {
      showNotification(
        'error', 
        'Consultation manquante', 
        'Aucune consultation liée.',
        ['Veuillez créer un examen clinique d\'abord.', 'Redirection...']
      );
      setTimeout(() => navigate('/doctor/exam'), 3000);
      return;
    }

    const token = getAuthToken();
    if (!token) {
      showNotification('error', 'Session expirée', 'Veuillez vous reconnecter.');
      localStorage.removeItem('access_token');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    setLoading(true);
    
    try {
      const API_BASE = 'http://localhost:8000/api';
      
      console.log('📤 Création ordonnance pour consultation:', consultationId);

      // 1️⃣ Créer l'ordonnance
      const ordonnanceResponse = await fetch(`${API_BASE}/ordonnances/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({
          consultation: consultationId,
        }),
      });

      const ordonnanceText = await ordonnanceResponse.text();
      console.log(`📥 Ordonnance ${ordonnanceResponse.status}:`, ordonnanceText);

      if (ordonnanceResponse.status === 401) {
        throw new Error('Session expirée');
      }

      if (!ordonnanceResponse.ok) {
        throw new Error(ordonnanceText || `Erreur ${ordonnanceResponse.status}`);
      }

      const ordonnance = JSON.parse(ordonnanceText);
      console.log('✅ Ordonnance créée ID:', ordonnance.id);

      // 2️⃣ Créer les médicaments
      const medPromises = validMeds.map(med => 
        fetch(`${API_BASE}/medicaments-prescrits/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`,
          },
          body: JSON.stringify({
            ordonnance: ordonnance.id,
            designation: med.med.trim(),
            posologie: med.dose.trim(),
            quantite: med.quantite?.trim() || null,
            duree: med.duree?.trim() || null,
          }),
        }).then(async (res) => {
          const text = await res.text();
          if (!res.ok) throw new Error(text);
          return JSON.parse(text);
        })
      );

      await Promise.all(medPromises);
      console.log('✅ Médicaments enregistrés');

      showNotification(
        'success',
        'Ordonnance validée',
        `${validMeds.length} médicament(s) prescrit(s).`,
        [`👨‍⚕️ ${header.prescripteur}`, `🏥 ${header.centre}`]
      );

      // Reset
      setMeds([{ med: "", dose: "", quantite: "", duree: "" }]);
      setHeader({ service: "Médecine Générale", centre: "", prescripteur: "", tel: "" });

      // Redirection vers laboratoire
      setTimeout(() => {
        navigate('/doctor/lab', {
          state: { consultationId: consultationId }
        });
      }, 1500);

    } catch (err: any) {
      console.error('❌ Erreur:', err);
      showNotification('error', 'Échec', err.message || 'Erreur serveur');
    } finally {
      setLoading(false);
    }
  };

  const cancelForm = () => {
    if (confirm("Annuler ?")) {
      setMeds([{ med: "", dose: "", quantite: "", duree: "" }]);
      setHeader({ service: "Médecine Générale", centre: "", prescripteur: "", tel: "" });
    }
  };

  // =============================================================================
  // RENDER
  // =============================================================================
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f7f9", fontFamily: "'Segoe UI', sans-serif", padding: "40px" }}>
      
      {/* Notification */}
      {notification.show && (
        <div style={getNotificationStyles()}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div>{notification.type === 'error' ? '⚠️' : notification.type === 'success' ? '✅' : 'ℹ️'}</div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{notification.title}</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>{notification.message}</p>
              {notification.details?.map((d, i) => (
                <div key={i} style={{ fontSize: '12px', marginTop: '2px' }}>• {d}</div>
              ))}
            </div>
            <button onClick={() => setNotification(p => ({ ...p, show: false }))} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>×</button>
          </div>
        </div>
      )}

      <main style={{ maxWidth: "1250px", margin: "0 auto" }}>
        <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "30px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "25px" }}>
            <Stethoscope size={24} color="#0d9488" />
            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>Nouvelle Ordonnance</h2>
          </div>
          
          {/* Infos */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "30px" }}>
            <InputGroup label="Service" value={header.service} readOnly />
            <InputGroup label="Centre *" value={header.centre} onChange={(e: any) => setHeader({...header, centre: e.target.value})} placeholder="Clinique" />
            <InputGroup label="Prescripteur *" value={header.prescripteur} onChange={(e: any) => setHeader({...header, prescripteur: e.target.value})} placeholder="Dr. Nom" />
            <InputGroup label="Téléphone *" value={header.tel} onChange={(e: any) => setHeader({...header, tel: e.target.value})} placeholder="+228..." />
          </div>

          {/* Tableau médicaments */}
          <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "16px", color: "#0d9488", margin: 0 }}>Médicaments</h3>
            <button onClick={addRow} style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#0d9488", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}>
              <Plus size={16} /> Ajouter
            </button>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
            <thead>
              <tr style={{ backgroundColor: "#1e4d6b", color: "white" }}>
                <th style={{ padding: "12px", textAlign: "left" }}>Désignation</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Posologie</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Quantité</th>
                <th style={{ padding: "12px", textAlign: "left" }}>Durée</th>
                <th style={{ padding: "12px" }}></th>
              </tr>
            </thead>
            <tbody>
              {meds.map((med, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "8px" }}><input className="med-input" value={med.med} onChange={(e) => updateMed(i, "med", e.target.value)} placeholder="Médicament" /></td>
                  <td style={{ padding: "8px" }}><input className="med-input" value={med.dose} onChange={(e) => updateMed(i, "dose", e.target.value)} placeholder="Posologie" /></td>
                  <td style={{ padding: "8px" }}><input className="med-input" value={med.quantite} onChange={(e) => updateMed(i, "quantite", e.target.value)} placeholder="Qté" /></td>
                  <td style={{ padding: "8px" }}><input className="med-input" value={med.duree} onChange={(e) => updateMed(i, "duree", e.target.value)} placeholder="Durée" /></td>
                  <td style={{ padding: "8px", textAlign: "center" }}>
                    <button onClick={() => removeRow(i)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Boutons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <button onClick={cancelForm} style={{ padding: "10px 24px", backgroundColor: "#f1f5f9", border: "none", borderRadius: "6px", cursor: "pointer" }}>Annuler</button>
            <button onClick={saveOrdonnance} disabled={loading} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 24px", backgroundColor: loading ? "#94a3b8" : "#1e4d6b", color: "white", border: "none", borderRadius: "6px", cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? '⏳...' : <><Send size={16} /> Valider</>}
            </button>
          </div>
        </div>
      </main>

      <style>{`
        .med-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 14px;
        }
        .med-input:focus {
          border-color: #0d9488;
          outline: none;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// InputGroup Component
// =============================================================================
interface InputGroupProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const InputGroup = ({ label, ...props }: InputGroupProps) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
    <label style={{ fontSize: "13px", fontWeight: 600, color: "#0d9488" }}>{label}</label>
    <input 
      style={{ 
        padding: "10px 14px", 
        border: "1px solid #e2e8f0", 
        borderRadius: "8px", 
        fontSize: "14px",
        backgroundColor: props.readOnly ? "#f8fafc" : "white",
      }} 
      {...props} 
    />
  </div>
);

export default Ordonnance;