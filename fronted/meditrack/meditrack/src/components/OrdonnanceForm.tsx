import React, { useState } from "react";
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
  
  // Récupérer consultationId depuis la navigation
  const consultationId = location.state?.consultationId;

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

  // 💾 Sauvegarde ordonnance + médicaments + REDIRECTION
  const saveOrdonnance = async () => {
    // Validation header
    if (!header.centre.trim() || !header.prescripteur.trim() || !header.tel.trim()) {
      showNotification('error', 'Champs obligatoires', 'Veuillez remplir le centre, le prescripteur et le téléphone.');
      return;
    }

    // ✅ Validation : au moins 1 médicament avec désignation ET posologie
    const validMeds = meds.filter(m => {
      const medOk = m.med?.trim()?.length > 0;
      const doseOk = m.dose?.trim()?.length > 0;
      return medOk && doseOk;
    });

    if (validMeds.length === 0) {
      const missingInfo: string[] = [];
      meds.forEach((m, i) => {
        const issues: string[] = [];
        if (!m.med?.trim()) issues.push('désignation');
        if (!m.dose?.trim()) issues.push('posologie');
        if (issues.length > 0) {
          missingInfo.push(`Ligne ${i + 1}: ${issues.join(', ')}`);
        }
      });

      showNotification(
        'error', 
        'Médicaments incomplets', 
        'Chaque médicament doit avoir une désignation ET une posologie.',
        missingInfo.length > 0 ? missingInfo : ['Ajoutez au moins un médicament complet.']
      );
      return;
    }

    // 🔴 Vérification consultationId
    if (!consultationId) {
      showNotification(
        'error', 
        'Consultation manquante', 
        'Aucune consultation liée. Retour à la page précédente...',
        ['Veuillez créer un examen clinique d\'abord.']
      );
      setTimeout(() => navigate('/doctor/exam'), 2500);
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
      
      // 1️⃣ Créer l'ordonnance (lié à la consultation)
      const ordonnancePayload = {
        consultation: Number(consultationId),
      };

      console.log('📤 Création ordonnance:', ordonnancePayload);

      const ordonnanceResponse = await fetch(`${API_BASE}/ordonnances/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,  // ← Format DRF Token (IMPORTANT!)
        },
        body: JSON.stringify(ordonnancePayload),
      });

      const ordonnanceText = await ordonnanceResponse.text();
      console.log(`📥 Ordonnance ${ordonnanceResponse.status}:`, ordonnanceText);

      if (ordonnanceResponse.status === 401) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

      if (!ordonnanceResponse.ok) {
        throw new Error(ordonnanceText || `Erreur ${ordonnanceResponse.status}`);
      }

      const ordonnance = JSON.parse(ordonnanceText);
      console.log('✅ Ordonnance créée:', ordonnance);

      // 2️⃣ Créer chaque médicament prescrit
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
          if (!res.ok) {
            throw new Error(text || `Erreur ${res.status} pour médicament`);
          }
          return JSON.parse(text);
        })
      );

      const savedMeds = await Promise.all(medPromises);
      console.log('✅ Médicaments enregistrés:', savedMeds);

      // ✅ Notification succès
      showNotification(
        'success',
        'Ordonnance validée',
        `${validMeds.length} médicament(s) prescrit(s) avec succès.`,
        [`👨‍⚕️ ${header.prescripteur}`, `🏥 ${header.centre}`]
      );

      // Reset formulaire
      setMeds([{ med: "", dose: "", quantite: "", duree: "" }]);
      setHeader({ service: "Médecine Générale", centre: "", prescripteur: "", tel: "" });

      // ✅✅✅ REDIRECTION AUTOMATIQUE VERS LABORATOIRE
      setTimeout(() => {
        navigate('/doctor/lab', {
          state: { consultationId: consultationId }
        });
      }, 1500);

    } catch (err: any) {
      console.error('❌ Erreur API:', err);
      
      let errorDetails: string[] = [];
      if (err.message) {
        try {
          const parsed = JSON.parse(err.message);
          errorDetails = Object.values(parsed).flat?.().join(', ') ? [Object.values(parsed).flat().join(', ')] : [err.message];
        } catch {
          errorDetails = [err.message];
        }
      }

      showNotification('error', 'Échec de l\'enregistrement', 'Le serveur a rejeté la demande.', errorDetails);
    } finally {
      setLoading(false);
    }
  };

  const cancelForm = () => {
    if (confirm("Voulez-vous vraiment annuler ? Tous les champs seront effacés.")) {
      setMeds([{ med: "", dose: "", quantite: "", duree: "" }]);
      setHeader({ service: "Médecine Générale", centre: "", prescripteur: "", tel: "" });
      showNotification('info', 'Formulaire annulé', 'Tous les champs ont été réinitialisés.');
    }
  };

  // =============================================================================
  // RENDER
  // =============================================================================
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f7f9", fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif", padding: "40px" }}>
      
      {/* 🔔 Notification professionnelle */}
      {notification.show && (
        <div style={getNotificationStyles()} role="alert">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ fontSize: '18px', marginTop: '1px', color: notification.type === 'error' ? '#ef4444' : notification.type === 'success' ? '#22c55e' : '#3b82f6' }}>
              {notification.type === 'success' && <CheckCircle size={18} />}
              {notification.type === 'error' && <AlertTriangle size={18} />}
              {notification.type === 'info' && <Info size={18} />}
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

      <main style={{ maxWidth: "1250px", margin: "0 auto" }}>
        
        <div style={{ backgroundColor: "white", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb", overflow: "hidden" }}>
          
          {/* HEADER SECTION */}
          <div style={{ padding: "30px", borderBottom: "1px solid #edf2f7" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "25px" }}>
              <Stethoscope size={24} color="#0d9488" />
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b", margin: 0 }}>Nouvelle Ordonnance</h2>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
              <InputGroup label="Service" value={header.service} readOnly onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHeader({...header, service: e.target.value})} />
              <InputGroup label="Centre *" placeholder="Ex: Clinique du Lac" value={header.centre} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHeader({...header, centre: e.target.value})} />
              <InputGroup label="Nom du prescripteur *" placeholder="Dr. Salomon" value={header.prescripteur} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHeader({...header, prescripteur: e.target.value})} />
              <InputGroup label="Téléphone *" placeholder="+228..." value={header.tel} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHeader({...header, tel: e.target.value})} />
            </div>
          </div>

          {/* TABLE SECTION */}
          <div style={{ padding: "30px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#0d9488", borderLeft: "4px solid #0d9488", paddingLeft: "12px" }}>
                Médicaments prescrits
              </h3>
              <button 
                onClick={addRow}
                style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#0d9488", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: 600, cursor: "pointer", transition: "background 0.2s" }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#0f766e")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#0d9488")}
              >
                <Plus size={18} /> Ajouter
              </button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", backgroundColor: "#1e4d6b", color: "white" }}>
                    <th style={{ padding: "12px 15px", borderRadius: "8px 0 0 0", fontSize: "13px" }}>Désignation</th>
                    <th style={{ padding: "12px 15px", fontSize: "13px" }}>Posologie</th>
                    <th style={{ padding: "12px 15px", fontSize: "13px" }}>Quantité</th>
                    <th style={{ padding: "12px 15px", fontSize: "13px" }}>Durée</th>
                    <th style={{ width: "50px", padding: "12px 15px", borderRadius: "0 8px 0 0" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {meds.map((med, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 5px" }}><input className="med-input" placeholder="Médicament" value={med.med} onChange={(e) => updateMed(i, "med", e.target.value)} /></td>
                      <td style={{ padding: "12px 5px" }}><input className="med-input" placeholder="Fréquence" value={med.dose} onChange={(e) => updateMed(i, "dose", e.target.value)} /></td>
                      <td style={{ padding: "12px 5px" }}><input className="med-input" placeholder="Boîtes" value={med.quantite} onChange={(e) => updateMed(i, "quantite", e.target.value)} /></td>
                      <td style={{ padding: "12px 5px" }}><input className="med-input" placeholder="Jours" value={med.duree} onChange={(e) => updateMed(i, "duree", e.target.value)} /></td>
                      <td style={{ textAlign: "center", padding: "12px 5px" }}>
                        <button 
                          onClick={() => removeRow(i)} 
                          style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", padding: "5px" }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* FOOTER */}
            <div style={{ marginTop: "30px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button 
                style={{ backgroundColor: "white", color: "#64748b", border: "1px solid #e2e8f0", padding: "10px 24px", borderRadius: "8px", fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }} 
                onClick={cancelForm}
                disabled={loading}
              >
                Annuler
              </button>
              <button 
                style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: loading ? "#94a3b8" : "#1e4d6b", color: "white", border: "none", padding: "10px 30px", borderRadius: "8px", fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
                onClick={saveOrdonnance}
                disabled={loading}
              >
                {loading ? '⏳ Enregistrement...' : <><Send size={18} /> Valider l'ordonnance</>}
              </button>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .med-input, .main-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 14px;
          outline: none;
          color: #334155;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .med-input:focus, .main-input:focus {
          border-color: #0d9488 !important;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// COMPOSANT InputGroup (typé)
// =============================================================================
interface InputGroupProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const InputGroup = ({ label, ...props }: InputGroupProps) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
    <label style={{ fontSize: "13px", fontWeight: 700, color: "#0d9488", marginLeft: "2px" }}>{label}</label>
    <input 
      style={{ 
        padding: "10px 14px", 
        border: "1px solid #e2e8f0", 
        borderRadius: "8px", 
        fontSize: "14px", 
        outline: "none", 
        color: "#475569",
        backgroundColor: props.readOnly ? "#f8fafc" : "white",
        transition: "all 0.2s"
      }} 
      className="main-input"
      {...props} 
    />
  </div>
);

export default Ordonnance;