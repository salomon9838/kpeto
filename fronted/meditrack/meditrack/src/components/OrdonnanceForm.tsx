import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  Plus, Trash2, Send, Stethoscope, CheckCircle, AlertTriangle, Info, RefreshCw, User, Phone, MapPin 
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
// COMPOSANT PRINCIPAL — ORDONNANCE (PROFESSIONNEL + API + IDs ROBUSTES)
// =============================================================================
function Ordonnance() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 🔍 Récupération ROBUSTE des IDs (state + localStorage + fallback)
  const getIds = () => {
    const cIdState = location.state?.consultationId;
    const pIdState = location.state?.patientId;
    const cIdStore = localStorage.getItem('current_consultation_id');
    const pIdStore = localStorage.getItem('current_patient_id');
    
    const cId = cIdState || (cIdStore && cIdStore !== 'undefined' ? Number(cIdStore) : null);
    const pId = pIdState || (pIdStore && pIdStore !== 'undefined' ? Number(pIdStore) : null);
    
    console.log('🔍 Ordonnance - IDs:', { fromState: { cIdState, pIdState }, fromStorage: { cIdStore, pIdStore }, resolved: { cId, pId } });
    return { cId, pId };
  };

  const [consultationId, setConsultationId] = useState<number | null>(null);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [idsReady, setIdsReady] = useState(false);

  // ✅ Chargement des IDs au montage
  useEffect(() => {
    const { cId, pId } = getIds();
    if (cId && pId) {
      setConsultationId(cId);
      setPatientId(pId);
      setIdsReady(true);
      // Re-stocker pour sécurité
      localStorage.setItem('current_consultation_id', String(cId));
      localStorage.setItem('current_patient_id', String(pId));
      console.log('✅ Ordonnance - IDs chargés:', { cId, pId });
    } else {
      console.warn('⚠️ Ordonnance - IDs manquants');
      showNotification('error', 'Données manquantes', 'Veuillez recommencer depuis la consultation.', ['Redirection...']);
      setTimeout(() => navigate('/old-consultation'), 2500);
    }
  }, []);

  // === VOS ÉTATS EXISTANTS (inchangés) ===
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

  // 🎯 Votre fonction notification (préservée + améliorée)
  const showNotification = (type: NotificationType, title: string, message: string, details?: string[]) => {
    setNotification({ show: true, type, title, message, details });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 6000);
  };

  // 🎨 Styles notification (harmonisés avec design pro)
  const getNotificationStyles = (): React.CSSProperties => {
    const colors: Record<NotificationType, { bg: string; border: string; text: string }> = {
      success: { bg: '#f0fdf4', border: '#22c55e', text: '#166534' },
      error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
      info: { bg: '#eff6ff', border: '#0d9488', text: '#1e40af' }, // ← Teal professionnel
    };
    const c = colors[notification.type];
    return {
      position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
      padding: '16px 20px', borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
      borderLeft: `5px solid ${c.border}`,
      backgroundColor: c.bg, color: c.text,
      maxWidth: '450px', minWidth: '350px',
      display: 'flex', alignItems: 'flex-start', gap: '12px',
      animation: 'slideIn 0.3s ease-out',
    };
  };

  // 📝 Vos fonctions médicaments (préservées)
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

  // 🔐 Token auth (préservé)
  const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('access_token');
    if (!token || token === 'null' || token === 'undefined') return null;
    return token;
  };

  // 💾 Votre fonction saveOrdonnance (ENRICHIE avec IDs robustes + navigation complète)
  const saveOrdonnance = async () => {
    // ✅ Vérification IDs AVANT tout
    if (!consultationId || !patientId) {
      showNotification('error', 'IDs manquants', 'Veuillez recharger la page ou recommencer depuis la consultation.');
      return;
    }

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
        consultation: consultationId, // ← ID robuste
      };

      console.log('📤 Création ordonnance:', ordonnancePayload);

      const ordonnanceResponse = await fetch(`${API_BASE}/ordonnances/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify(ordonnancePayload),
      });

      const ordonnanceText = await ordonnanceResponse.text();
      console.log(`📥 Ordonnance ${ordonnanceResponse.status}:`, ordonnanceText);

      // Détection réponse HTML Django (erreur serveur)
      if (ordonnanceText.trim().startsWith('<!DOCTYPE') || ordonnanceText.trim().startsWith('<html')) {
        throw new Error('Erreur serveur Django. Consultez les logs backend.');
      }

      if (ordonnanceResponse.status === 401) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

      if (!ordonnanceResponse.ok) {
        try {
          const err = JSON.parse(ordonnanceText);
          const errorMsg = Object.values(err).flat?.().join(', ') || ordonnanceText;
          throw new Error(errorMsg);
        } catch {
          throw new Error(ordonnanceText || `Erreur ${ordonnanceResponse.status}`);
        }
      }

      const ordonnance = JSON.parse(ordonnanceText);
      const ordonnanceId = ordonnance.id;
      
      if (!ordonnanceId) {
        throw new Error('L\'API n\'a pas retourné d\'ID d\'ordonnance');
      }
      
      console.log('✅ Ordonnance créée:', ordonnanceId);

      // 2️⃣ Créer chaque médicament prescrit
      const medPromises = validMeds.map(med => 
        fetch(`${API_BASE}/medicaments-prescrits/`, {
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
        }).then(async (res) => {
          const text = await res.text();
          if (!res.ok) {
            if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
              throw new Error('Erreur serveur Django (réponse HTML)');
            }
            try {
              const err = JSON.parse(text);
              throw new Error(Object.values(err).flat?.().join(', ') || text);
            } catch {
              throw new Error(text || `Erreur ${res.status} pour médicament`);
            }
          }
          return JSON.parse(text);
        })
      );

      const savedMeds = await Promise.all(medPromises);
      console.log('✅ Médicaments enregistrés:', savedMeds);

      // ✅ Stockage des IDs pour le workflow
      localStorage.setItem('current_ordonnance_id', String(ordonnanceId));
      localStorage.setItem('current_workflow_step', 'lab');

      // ✅ Notification succès
      showNotification(
        'success',
        'Ordonnance validée',
        `${validMeds.length} médicament(s) prescrit(s) avec succès.`,
        [`👨‍⚕️ ${header.prescripteur}`, `🏥 ${header.centre}`]
      );

      // Reset formulaire (votre logique)
      setMeds([{ med: "", dose: "", quantite: "", duree: "" }]);
      setHeader({ service: "Médecine Générale", centre: "", prescripteur: "", tel: "" });

      // ✅✅✅ REDIRECTION AUTOMATIQUE VERS LABORATOIRE avec TOUS les IDs
      setTimeout(() => {
        console.log('🚀 Navigation vers /doctor/lab avec IDs:', {
          consultationId,
          patientId,
          ordonnanceId
        });
        navigate('/doctor/lab', {
          state: {
            consultationId,
            patientId,      // ← AJOUTÉ : propagation du patientId
            ordonnanceId,   // ← AJOUTÉ : propagation de l'ordonnanceId
            step: 'lab'
          }
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
  // STYLES PROFESSIONNELS (Harmonisés avec style chirurgie)
  // =============================================================================
  const styles: Record<string, React.CSSProperties> = {
    page: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      padding: '40px',
    },
    header: {
      backgroundColor: '#0d9488', // ← Teal professionnel (style chirurgie)
      padding: '20px 30px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginBottom: '30px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
    },
    backBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 20px',
      backgroundColor: 'rgba(255,255,255,0.2)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'background 0.2s',
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      color: 'white',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    container: {
      maxWidth: '1250px',
      margin: '0 auto',
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      border: '1px solid #e2e8f0',
      overflow: 'hidden',
      marginBottom: '24px',
      transition: 'box-shadow 0.2s ease',
    },
    cardHeader: {
      padding: '30px',
      borderBottom: '1px solid #edf2f7',
    },
    cardBody: {
      padding: '30px',
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#1e293b',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    debugBox: {
      background: idsReady ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
      border: `2px solid ${idsReady ? '#22c55e' : '#f97316'}`,
      borderRadius: '12px',
      padding: '16px 20px',
      marginBottom: '24px',
      fontSize: '14px',
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '20px',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '6px',
    },
    label: {
      fontSize: '13px',
      fontWeight: '700',
      color: '#0d9488',
      marginLeft: '2px',
    },
    required: { color: '#ef4444' },
    input: {
      padding: '10px 14px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
      color: '#475569',
      backgroundColor: 'white',
      transition: 'all 0.2s',
      width: '100%',
      boxSizing: 'border-box' as const,
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
    },
    th: {
      padding: '12px 15px',
      textAlign: 'left' as const,
      backgroundColor: '#0d9488', // ← Teal professionnel
      color: 'white',
      fontSize: '13px',
      fontWeight: '600',
    },
    td: {
      padding: '12px 5px',
      borderBottom: '1px solid #f1f5f9',
    },
    btn: {
      padding: '10px 24px',
      borderRadius: '8px',
      border: 'none',
      fontWeight: '600',
      fontSize: '14px',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s',
    },
    btnAdd: {
      backgroundColor: '#0d9488',
      color: 'white',
    },
    btnDelete: {
      background: 'none',
      border: 'none',
      color: '#f87171',
      cursor: 'pointer',
      padding: '5px',
    },
    btnCancel: {
      backgroundColor: '#f1f5f9',
      color: '#64748b',
      border: '1px solid #e2e8f0',
    },
    btnSave: {
      backgroundColor: '#0d9488', // ← Teal professionnel
      color: 'white',
    },
    buttonGroup: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
      marginTop: '30px',
      paddingTop: '20px',
      borderTop: '2px solid #e2e8f0',
    },
    notification: {
      position: 'fixed' as const,
      top: '20px',
      right: '20px',
      zIndex: 9999,
      padding: '16px 20px',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
      borderLeft: '5px solid',
      backgroundColor: 'white',
      maxWidth: '450px',
      minWidth: '350px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      animation: 'slideIn 0.3s ease-out',
    },
  };

  // =============================================================================
  // RENDER
  // =============================================================================
  return (
    <div style={styles.page}>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .med-input:focus, .main-input:focus {
          border-color: #0d9488 !important;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1) !important;
        }
        .card-hover:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
          transform: translateY(-2px);
          transition: all 0.2s ease;
        }
        .disabled {
          opacity: 0.5;
          pointer-events: none;
          filter: grayscale(0.3);
        }
      `}</style>

      {/* 🔔 Notification */}
      {notification.show && (
        <div style={getNotificationStyles()} role="alert">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ fontSize: '18px', marginTop: '1px', color: notification.type === 'error' ? '#ef4444' : notification.type === 'success' ? '#22c55e' : '#0d9488' }}>
              {notification.type === 'success' && <CheckCircle size={18} />}
              {notification.type === 'error' && <AlertTriangle size={18} />}
              {notification.type === 'info' && <Info size={18} />}
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{notification.title}</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.9 }}>{notification.message}</p>
              {notification.details?.map((d, i) => (
                <div key={i} style={{ margin: '2px 0 0 0', fontSize: '12px' }}>• {d}</div>
              ))}
            </div>
            <button onClick={() => setNotification(p => ({ ...p, show: false }))} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', opacity: 0.6, color: 'inherit' }}>×</button>
          </div>
        </div>
      )}

      {/* Header avec bouton retour */}
      <header style={styles.header}>
        <button 
          style={styles.backBtn}
          onClick={() => navigate('/patient')}
          onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.3)'}
          onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.2)'}
        >
          ← Retour
        </button>
        <h1 style={styles.title}>
          <Stethoscope size={24} /> 💊 Nouvelle Ordonnance
        </h1>
        <div style={{ width: '100px' }} />
      </header>

      <main style={styles.container}>
        {/* Debug IDs */}
        <div style={styles.debugBox}>
          <div style={{ fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {idsReady ? <CheckCircle size={18} color="#22c55e" /> : <AlertTriangle size={18} color="#f97316" />}
            {idsReady ? '✅ IDs reçus' : '⚠️ IDs manquants'}
          </div>
          <div>Consultation: <strong style={{ color: consultationId ? '#22c55e' : '#ef4444' }}>{consultationId || '❌'}</strong></div>
          <div>Patient: <strong style={{ color: patientId ? '#22c55e' : '#ef4444' }}>{patientId || '❌'}</strong></div>
          {!idsReady && (
            <div style={{ marginTop: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button 
                onClick={() => { const { cId, pId } = getIds(); if (cId && pId) { setConsultationId(cId); setPatientId(pId); setIdsReady(true); } }}
                style={{ ...styles.btn, backgroundColor: '#f59e0b', color: 'white', padding: '6px 12px', fontSize: '12px' }}
              >
                <RefreshCw size={14} style={{ marginRight: '4px' }} /> Réessayer
              </button>
              <button 
                onClick={() => navigate('/old-consultation')}
                style={{ ...styles.btn, backgroundColor: '#ef4444', color: 'white', padding: '6px 12px', fontSize: '12px' }}
              >
                ← Retour consultation
              </button>
            </div>
          )}
        </div>

        {/* Formulaire désactivé si IDs non prêts */}
        <div className={!idsReady ? 'disabled' : ''}>
          <div style={styles.card} className="card-hover">
            {/* HEADER SECTION */}
            <div style={styles.cardHeader}>
              <h2 style={styles.sectionTitle}>
                <User size={22} color="#0d9488" /> Information du soignant
              </h2>
              
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Service</label>
                  <input 
                    value={header.service}
                    readOnly
                    style={{...styles.input, backgroundColor: '#f8fafc', cursor: 'not-allowed'}}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Centre <span style={styles.required}>*</span></label>
                  <input 
                    placeholder="Ex: Clinique du Lac"
                    value={header.centre}
                    onChange={(e) => setHeader({...header, centre: e.target.value})}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nom du prescripteur <span style={styles.required}>*</span></label>
                  <input 
                    placeholder="Dr. Salomon"
                    value={header.prescripteur}
                    onChange={(e) => setHeader({...header, prescripteur: e.target.value})}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Téléphone <span style={styles.required}>*</span></label>
                  <input 
                    placeholder="+228..."
                    value={header.tel}
                    onChange={(e) => setHeader({...header, tel: e.target.value})}
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            {/* TABLE SECTION */}
            <div style={styles.cardBody}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#0d9488", borderLeft: "4px solid #0d9488", paddingLeft: "12px" }}>
                  Médicaments prescrits
                </h3>
                <button 
                  onClick={addRow}
                  style={{ display: "flex", alignItems: "center", gap: "8px", ...styles.btn, ...styles.btnAdd }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0f766e'}
                  onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0d9488'}
                >
                  <Plus size={18} /> Ajouter
                </button>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{...styles.th, borderRadius: '8px 0 0 0'}}>Désignation</th>
                      <th style={styles.th}>Posologie</th>
                      <th style={styles.th}>Quantité</th>
                      <th style={styles.th}>Durée</th>
                      <th style={{...styles.th, width: '50px', borderRadius: '0 8px 0 0', textAlign: 'center'}}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {meds.map((med, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={styles.td}><input className="med-input" style={{...styles.input, padding: '8px 12px'}} placeholder="Médicament" value={med.med} onChange={(e) => updateMed(i, "med", e.target.value)} /></td>
                        <td style={styles.td}><input className="med-input" style={{...styles.input, padding: '8px 12px'}} placeholder="Fréquence" value={med.dose} onChange={(e) => updateMed(i, "dose", e.target.value)} /></td>
                        <td style={styles.td}><input className="med-input" style={{...styles.input, padding: '8px 12px'}} placeholder="Boîtes" value={med.quantite} onChange={(e) => updateMed(i, "quantite", e.target.value)} /></td>
                        <td style={styles.td}><input className="med-input" style={{...styles.input, padding: '8px 12px'}} placeholder="Jours" value={med.duree} onChange={(e) => updateMed(i, "duree", e.target.value)} /></td>
                        <td style={{ textAlign: "center", padding: "12px 5px" }}>
                          <button 
                            onClick={() => removeRow(i)} 
                            style={styles.btnDelete}
                            onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'}
                            onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.color = '#f87171'}
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
              <div style={styles.buttonGroup}>
                <button 
                  style={{ ...styles.btn, ...styles.btnCancel }} 
                  onClick={cancelForm}
                  disabled={loading || !idsReady}
                  onMouseEnter={(e) => { if (!loading && idsReady) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#e2e8f0'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f1f5f9'; }}
                >
                  Annuler
                </button>
                <button 
                  style={{ 
                    ...styles.btn, 
                    ...styles.btnSave,
                    opacity: (loading || !idsReady) ? 0.7 : 1,
                    cursor: (loading || !idsReady) ? 'not-allowed' : 'pointer'
                  }}
                  onClick={saveOrdonnance}
                  disabled={loading || !idsReady}
                  onMouseEnter={(e) => { if (!loading && idsReady) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0f766e'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0d9488'; }}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Enregistrement...
                    </>
                  ) : (
                    <><Send size={18} /> Valider l'ordonnance</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// =============================================================================
// COMPOSANT InputGroup (typé) — PRÉSERVÉ
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