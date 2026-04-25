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
function Ordonnance(): React.ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [consultationId, setConsultationId] = useState<number | null>(null);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [idsLoaded, setIdsLoaded] = useState(false);

  useEffect(() => {
    console.log('=== 🔍 DEBUG ORDONNANCE ===');
    console.log('location.state:', location.state);
    
    let cId = location.state?.consultationId;
    let pId = location.state?.patientId;
    console.log('📦 Depuis state:', { cId, pId });
    
    if (!cId) {
      const stored = localStorage.getItem('current_consultation_id');
      if (stored) {
        cId = Number(stored);
        console.log('📦 consultationId depuis localStorage:', cId);
      }
    }
    if (!pId) {
      const stored = localStorage.getItem('current_patient_id');
      if (stored) {
        pId = Number(stored);
        console.log('📦 patientId depuis localStorage:', pId);
      }
    }
    
    console.log('✅ IDs finaux:', { consultationId: cId, patientId: pId });
    
    if (!cId || !pId) {
      console.error('❌ IDs manquants!');
      showNotification(
        'error', 
        'Données manquantes', 
        'Impossible de trouver la consultation ou le patient.',
        [
          `consultationId: ${cId || '❌'}`,
          `patientId: ${pId || '❌'}`,
          '🔄 Redirection...'
        ]
      );
      
      setTimeout(() => {
        localStorage.removeItem('current_consultation_id');
        localStorage.removeItem('current_patient_id');
        navigate('/old-consultation');
      }, 3000);
      return;
    }
    
    setConsultationId(cId);
    setPatientId(pId);
    setIdsLoaded(true);
    
    localStorage.setItem('current_consultation_id', String(cId));
    localStorage.setItem('current_patient_id', String(pId));
    
    console.log('✅ IDs chargés avec succès');
    
  }, [location.state, navigate]);

  const [meds, setMeds] = useState<MedicamentRow[]>([
    { med: "", dose: "", quantite: "", duree: "" }
  ]);

  const [header, setHeader] = useState({
    service: "Chirurgie",
    centre: "",
    prescripteur: "",
    tel: "",
  });

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    show: false, type: 'info', title: '', message: '', details: []
  });

  const showNotification = (type: NotificationType, title: string, message: string, details?: string[]) => {
    setNotification({ show: true, type, title, message, details });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 7000);
  };

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
      maxWidth: '450px',
    };
  };

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

  const getAuthToken = (): string | null => {
    const token = localStorage.getItem('access_token');
    if (!token || token === 'null' || token === 'undefined') return null;
    return token;
  };

  const saveOrdonnance = async () => {
    if (!header.centre.trim() || !header.prescripteur.trim() || !header.tel.trim()) {
      showNotification('error', 'Champs obligatoires', 'Centre, prescripteur et téléphone requis.');
      return;
    }

    const validMeds = meds.filter(m => m.med?.trim() && m.dose?.trim());
    if (validMeds.length === 0) {
      showNotification('error', 'Médicaments incomplets', 'Ajoutez au moins un médicament avec désignation et posologie.');
      return;
    }

    if (!consultationId || !patientId) {
      showNotification('error', 'IDs manquants', 'Consultation ou patient non trouvé.');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      showNotification('error', 'Session expirée', 'Veuillez vous reconnecter.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    setLoading(true);
    
    try {
      const API_BASE = 'http://localhost:8000/api';
      
      console.log('📤 Création ordonnance:', { consultationId, patientId });
      console.log('💊 Médicaments à créer:', validMeds);

      // 1️⃣ Créer l'ordonnance (SANS médicaments)
      const ordResponse = await fetch(`${API_BASE}/ordonnances/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({ 
          consultation: consultationId,
          // PAS de champ "medicaments" ici
        }),
      });

      const ordText = await ordResponse.text();
      console.log(`📥 Ordonnance ${ordResponse.status}:`, ordText);

      if (ordResponse.status === 401) {
        throw new Error('Session expirée');
      }
      
      if (ordResponse.status === 400) {
        const errorData = JSON.parse(ordText);
        console.error('❌ Erreur 400:', errorData);
        throw new Error(Object.values(errorData).flat().join(', ') || 'Données invalides');
      }
      
      if (!ordResponse.ok) {
        throw new Error(ordText || `Erreur ${ordResponse.status}`);
      }

      const ordonnance = JSON.parse(ordText);
      const ordonnanceId = ordonnance.id;
     console.log('✅ Ordonnance réponse:', ordonnance);
console.log('🔢 ordonnanceId:', ordonnanceId, typeof ordonnanceId);

// ✅ VÉRIFICATION CRITIQUE
if (!ordonnanceId || typeof ordonnanceId !== 'number') {
  throw new Error(`ordonnanceId invalide: ${ordonnanceId} (type: ${typeof ordonnanceId})`);
}

console.log('✅ ordonnanceId valide, création des médicaments...');
      // 2️⃣ Créer les médicaments (un par un)
      console.log('💊 Création des médicaments...');
      const medPromises = validMeds.map((med, idx) => {
        console.log(`  Médicament ${idx + 1}:`, med);
        return fetch(`${API_BASE}/medicaments-prescrits/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`,
          },
          body: JSON.stringify({
            ordonnance: ordonnanceId,
            designation: med.med.trim(),
            posologie: med.dose.trim(),
            quantite: med.quantite?.trim() || null,
            duree: med.duree?.trim() || null,
          }),
        }).then(async res => {
          const text = await res.text();
          if (!res.ok) {
            console.error(`❌ Erreur médicament ${idx + 1}:`, text);
            throw new Error(text || `Erreur ${res.status}`);
          }
          console.log(`  ✅ Médicament ${idx + 1} créé`);
          return JSON.parse(text);
        });
      });

      await Promise.all(medPromises);
      console.log('✅ Tous les médicaments enregistrés');

      localStorage.setItem('current_ordonnance_id', String(ordonnanceId));
      localStorage.setItem('current_workflow_step', 'lab');

      showNotification(
        'success',
        'Ordonnance validée',
        `${validMeds.length} médicament(s) prescrit(s).`,
        [`🆔 #${ordonnanceId}`, `👨‍⚕️ ${header.prescripteur}`]
      );

      setMeds([{ med: "", dose: "", quantite: "", duree: "" }]);
      setHeader({ service: "Chirurgie", centre: "", prescripteur: "", tel: "" });

      setTimeout(() => {
        console.log('🚀 Navigation vers /chirurgie/labo');
        navigate('/chirurgie/labo', {
          state: {
            consultationId,
            patientId,
            ordonnanceId,
            step: 'lab',
            timestamp: new Date().toISOString()
          }
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
      setHeader({ service: "Chirurgie", centre: "", prescripteur: "", tel: "" });
    }
  };

  // =============================================================================
  // RENDER
  // =============================================================================
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f7f9", fontFamily: "'Segoe UI', sans-serif", padding: "40px" }}>
      
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
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "25px" }}>
            <Stethoscope size={24} color="#e74c3c" />
            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: '#e74c3c' }}>🔪 Ordonnance Chirurgie</h2>
          </div>
          
          {/* Debug IDs */}
          <div style={{ 
            background: consultationId && patientId ? '#f0fdf4' : '#fef2f2', 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            fontSize: '13px',
            border: `2px solid ${consultationId && patientId ? '#22c55e' : '#ef4444'}`
          }}>
            <div style={{ fontWeight: '600', marginBottom: '8px' }}>
              {consultationId && patientId ? '✅ IDs reçus' : '❌ IDs manquants'}
            </div>
            <div>Consultation: <strong>{consultationId || '❌'}</strong></div>
            <div>Patient: <strong>{patientId || '❌'}</strong></div>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "30px" }}>
            <InputGroup label="Service" value={header.service} readOnly />
            <InputGroup label="Centre *" value={header.centre} onChange={(e: any) => setHeader({...header, centre: e.target.value})} placeholder="Bloc Opératoire" />
            <InputGroup label="Chirurgien *" value={header.prescripteur} onChange={(e: any) => setHeader({...header, prescripteur: e.target.value})} placeholder="Dr. Nom" />
            <InputGroup label="Téléphone *" value={header.tel} onChange={(e: any) => setHeader({...header, tel: e.target.value})} placeholder="+228..." />
          </div>

          <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "16px", color: "#e74c3c", margin: 0 }}>Médicaments</h3>
            <button onClick={addRow} style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#e74c3c", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}>
              <Plus size={16} /> Ajouter
            </button>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
            <thead>
              <tr style={{ backgroundColor: "#7f1d1d", color: "white" }}>
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

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <button onClick={cancelForm} disabled={!idsLoaded || loading} style={{ padding: "10px 24px", backgroundColor: "#f1f5f9", border: "none", borderRadius: "6px", cursor: (!idsLoaded || loading) ? 'not-allowed' : 'pointer', opacity: (!idsLoaded || loading) ? 0.6 : 1 }}>Annuler</button>
            <button 
              onClick={saveOrdonnance} 
              disabled={!idsLoaded || loading} 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "8px", 
                padding: "10px 24px", 
                backgroundColor: (!idsLoaded || loading) ? "#94a3b8" : "#e74c3c", 
                color: "white", 
                border: "none", 
                borderRadius: "6px", 
                cursor: (!idsLoaded || loading) ? 'not-allowed' : 'pointer' 
              }}
            >
              {loading ? '⏳...' : <><Send size={16} /> Valider → Labo</>}
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
          border-color: #e74c3c;
          outline: none;
          box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
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
    <label style={{ fontSize: "13px", fontWeight: 600, color: "#e74c3c" }}>{label}</label>
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