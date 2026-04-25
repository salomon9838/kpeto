import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Pill, User, Phone, MapPin, Send, AlertCircle, CheckCircle2, Info, Trash2, Plus, RefreshCw } from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================
interface MedicamentRow { med: string; poso: string; qty: string; duree: string; }
interface OrdonnancePayload { consultation: number; }
interface MedicamentPayload { ordonnance: number; designation: string; posologie: string; quantite: string | null; duree: string | null; }
type NotificationType = 'success' | 'error' | 'info';
interface NotificationState { show: boolean; type: NotificationType; title: string; message: string; details?: string[]; }

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================
export default function OrdonnanceForm(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 🔍 Récupération IMMÉDIATE des IDs
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

  // ✅ Chargement au montage
  useEffect(() => {
    const { cId, pId } = getIds();
    if (cId && pId) {
      setConsultationId(cId);
      setPatientId(pId);
      setIdsReady(true);
      localStorage.setItem('current_consultation_id', String(cId));
      localStorage.setItem('current_patient_id', String(pId));
      console.log('✅ IDs chargés:', { cId, pId });
    } else {
      console.warn('⚠️ IDs manquants');
    }
  }, []);

  // États du formulaire
  const [rows, setRows] = useState<MedicamentRow[]>([{ med: "", poso: "", qty: "", duree: "" }]);
  const [header, setHeader] = useState({ service: "urologie", centre: "", doc: "", tel: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({ show: false, type: 'info', title: '', message: '', details: [] });

  // 🎯 Fonctions utilitaires
  const update = (index: number, field: keyof MedicamentRow, value: string) => {
    setRows(prev => { const u = [...prev]; u[index] = { ...u[index], [field]: value }; return u; });
  };
  const addRow = () => setRows([...rows, { med: "", poso: "", qty: "", duree: "" }]);
  const removeRow = (i: number) => { if (rows.length > 1) setRows(rows.filter((_, idx) => idx !== i)); };

  const showNotification = (type: NotificationType, title: string, message: string, details?: string[]) => {
    setNotification({ show: true, type, title, message, details });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 6000);
  };

  const getNotificationStyles = (): React.CSSProperties => {
    const colors = { success: { bg: '#f0fdf4', border: '#22c55e', text: '#166534' }, error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' }, info: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' } };
    const c = colors[notification.type];
    return { position: 'fixed', top: '20px', right: '20px', zIndex: 9999, padding: '16px 20px', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', borderLeft: `5px solid ${c.border}`, backgroundColor: c.bg, color: c.text, maxWidth: '450px', display: 'flex', alignItems: 'flex-start', gap: '12px', animation: 'slideIn 0.3s ease-out' };
  };

  const getAuthToken = (): string | null => { const t = localStorage.getItem('access_token'); return (t && t !== 'null' && t !== 'undefined') ? t : null; };

  // 💾 Soumission
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 Soumission...', { consultationId, patientId });
    
    if (!consultationId || !patientId) { showNotification('error', 'IDs manquants', 'Recommencez depuis la consultation.'); return; }
    if (!header.centre.trim() || !header.doc.trim() || !header.tel.trim()) { showNotification('error', 'Champs obligatoires', ''); return; }
    
    const validRows = rows.filter(r => r.med.trim() && r.poso.trim());
    if (validRows.length === 0) { showNotification('error', 'Médicaments requis', ''); return; }

    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Session expirée');
      const API_BASE = 'http://localhost:8000/api';

      // 1️⃣ Créer ordonnance
      const ordResponse = await fetch(`${API_BASE}/ordonnances/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        body: JSON.stringify({ consultation: consultationId }),
      });
      const ordText = await ordResponse.text();
      console.log(`📥 Ordonnance ${ordResponse.status}:`, ordText);
      
      if (ordResponse.status === 401) throw new Error('Session expirée');
      if (!ordResponse.ok) throw new Error(ordText || `Erreur ${ordResponse.status}`);
      
      const ordonnance = JSON.parse(ordText);
      const ordonnanceId = ordonnance.id;
      if (!ordonnanceId) throw new Error('Pas d\'ID dans la réponse');
      console.log('✅ Ordonnance créée:', ordonnanceId);

      // 2️⃣ Créer médicaments
      const medPromises = validRows.map(row => fetch(`${API_BASE}/medicaments-prescrits/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        body: JSON.stringify({ ordonnance: ordonnanceId, designation: row.med.trim(), posologie: row.poso.trim(), quantite: row.qty.trim() || null, duree: row.duree.trim() || null }),
      }).then(async res => { const t = await res.text(); if (!res.ok) throw new Error(t); return JSON.parse(t); }));
      
      await Promise.all(medPromises);
      console.log('✅ Médicaments enregistrés');

      // ✅ Stockage & Navigation
      localStorage.setItem('current_ordonnance_id', String(ordonnanceId));
      localStorage.setItem('current_workflow_step', 'lab');
      showNotification('success', 'Ordonnance envoyée', `${validRows.length} médicament(s)`);
      
      setRows([{ med: "", poso: "", qty: "", duree: "" }]);
      setHeader({ service: "urologie", centre: "", doc: "", tel: "" });

      setTimeout(() => {
        console.log('🚀 Vers /urologie/labo');
        navigate('/urologie/labo', { state: { consultationId, patientId, ordonnanceId, step: 'lab' } });
      }, 1500);

    } catch (err: any) {
      console.error('❌ Erreur:', err);
      showNotification('error', 'Échec', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelForm = () => { if (window.confirm("Annuler ?")) { setRows([{ med: "", poso: "", qty: "", duree: "" }]); setHeader({ service: "urologie", centre: "", doc: "", tel: "" }); } };

  // =============================================================================
  // STYLES
  // =============================================================================
  const styles: Record<string, React.CSSProperties> = {
    page: { minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: "'Inter', sans-serif", paddingBottom: '60px' },
    header: { backgroundColor: '#0891b2', padding: '20px 30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '30px' },
    headerContent: { maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    title: { fontSize: '24px', fontWeight: '700', color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' },
    backBtn: { background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
    container: { maxWidth: '1200px', margin: '0 auto', padding: '0 30px' },
    card: { backgroundColor: 'white', borderRadius: '16px', padding: '30px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' },
    sectionTitle: { fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' },
    debugBox: { background: idsReady ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', border: `2px solid ${idsReady ? '#22c55e' : '#f97316'}`, borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', fontSize: '14px' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' },
    formGroup: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
    label: { fontSize: '14px', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' },
    required: { color: '#ef4444' },
    input: { padding: '12px 16px', borderRadius: '10px', border: '2px solid #e2e8f0', fontSize: '15px', outline: 'none', backgroundColor: '#f8fafc', width: '100%', boxSizing: 'border-box' as const },
    select: { padding: '12px 16px', borderRadius: '10px', border: '2px solid #e2e8f0', fontSize: '15px', outline: 'none', backgroundColor: '#f8fafc', cursor: 'pointer', width: '100%', boxSizing: 'border-box' as const },
    table: { width: '100%', borderCollapse: 'collapse' as const, marginTop: '16px', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden' },
    th: { padding: '12px 16px', textAlign: 'left' as const, backgroundColor: '#0891b2', color: 'white', fontWeight: '600', fontSize: '14px' },
    td: { padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontSize: '14px' },
    btn: { padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' },
    btnAdd: { backgroundColor: '#0891b2', color: 'white' },
    btnDelete: { backgroundColor: '#fef2f2', color: '#ef4444', padding: '8px 12px' },
    btnRefresh: { backgroundColor: '#f59e0b', color: 'white' },
    buttonGroup: { display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '32px', paddingTop: '24px', borderTop: '2px solid #e2e8f0' },
    btnCancel: { backgroundColor: '#f1f5f9', color: '#64748b' },
    btnSave: { backgroundColor: '#0891b2', color: 'white' },
  };

  // =============================================================================
  // RENDER
  // =============================================================================
  return (
    <div style={styles.page}>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        input:focus, select:focus { border-color: #0891b2 !important; background-color: white !important; box-shadow: 0 0 0 4px rgba(8, 145, 178, 0.1) !important; }
        tr:hover { background-color: #f8fafc; }
        .disabled { opacity: 0.5; pointer-events: none; filter: grayscale(0.3); }
      `}</style>

      {notification.show && (
        <div style={getNotificationStyles()}>
          <div>{notification.type === 'success' ? <CheckCircle2 size={20} color="#22c55e"/> : notification.type === 'error' ? <AlertCircle size={20} color="#ef4444"/> : <Info size={20} color="#3b82f6"/>}</div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>{notification.title}</h4>
            {notification.message && <p style={{ margin: '6px 0 0 0', fontSize: '14px' }}>{notification.message}</p>}
            {notification.details?.map((d, i) => <div key={i} style={{ fontSize: '13px', marginTop: '4px' }}>• {d}</div>)}
          </div>
          <button onClick={() => setNotification(p => ({ ...p, show: false }))} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', opacity: 0.6 }}>×</button>
        </div>
      )}

      <header style={styles.header}>
        <div style={styles.headerContent}>
          <button style={styles.backBtn} onClick={() => navigate('/patient')}>← Retour</button>
          <h1 style={styles.title}><Pill size={28} /> 💊 Ordonnance Urologie</h1>
          <div style={{ width: '100px' }} />
        </div>
      </header>

      <div style={styles.container}>
        {/* Debug IDs */}
        <div style={styles.debugBox}>
          <div style={{ fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {idsReady ? <><CheckCircle2 size={18} color="#22c55e" /> ✅ IDs reçus</> : <><AlertCircle size={18} color="#f97316" /> ⚠️ IDs manquants</>}
          </div>
          <div>Consultation: <strong style={{ color: consultationId ? '#22c55e' : '#ef4444' }}>{consultationId || '❌'}</strong></div>
          <div>Patient: <strong style={{ color: patientId ? '#22c55e' : '#ef4444' }}>{patientId || '❌'}</strong></div>
          {!idsReady && (
            <div style={{ marginTop: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button onClick={() => { const { cId, pId } = getIds(); if (cId && pId) { setConsultationId(cId); setPatientId(pId); setIdsReady(true); } }} style={{ ...styles.btn, ...styles.btnRefresh, padding: '6px 12px', fontSize: '12px' }}><RefreshCw size={14} /> Réessayer</button>
              <button onClick={() => navigate('/old-consultation')} style={{ ...styles.btn, backgroundColor: '#ef4444', color: 'white', padding: '6px 12px', fontSize: '12px' }}>← Retour</button>
            </div>
          )}
        </div>

        {/* Formulaire */}
        <div className={!idsReady ? 'disabled' : ''}>
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}><User size={22} color="#0891b2" /> Information du soignant</h2>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}><label style={styles.label}>Service</label><select value={header.service} onChange={(e) => setHeader({...header, service: e.target.value})} style={styles.select} disabled><option>urologie</option></select></div>
              <div style={styles.formGroup}><label style={styles.label}>Centre<span style={styles.required}>*</span></label><input required placeholder="Hôpital Central" value={header.centre} onChange={(e) => setHeader({...header, centre: e.target.value})} style={styles.input} /></div>
              <div style={styles.formGroup}><label style={styles.label}>Nom du Médecin<span style={styles.required}>*</span></label><input required placeholder="Dr. Kouassi" value={header.doc} onChange={(e) => setHeader({...header, doc: e.target.value})} style={styles.input} /></div>
              <div style={styles.formGroup}><label style={styles.label}>Contact<span style={styles.required}>*</span></label><input required placeholder="+228 90 00 00 00" value={header.tel} onChange={(e) => setHeader({...header, tel: e.target.value})} style={styles.input} /></div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, alignItems: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}><Pill size={20} color="#0891b2" /> Médicaments</h3>
            <button type="button" style={{...styles.btn, ...styles.btnAdd}} onClick={addRow}><Plus size={16} /> Ajouter</button>
          </div>

          <div style={{ overflowX: 'auto', marginTop: '16px' }}>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>Médicament</th><th style={styles.th}>Posologie</th><th style={styles.th}>Quantité</th><th style={styles.th}>Durée</th><th style={{...styles.th, textAlign: 'center' as const}}>Action</th></tr></thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    <td style={styles.td}><input style={{ width: "100%", ...styles.input, padding: '8px 12px' }} value={row.med} onChange={(e) => update(i, "med", e.target.value)} placeholder="paracétamol" /></td>
                    <td style={styles.td}><input style={{ width: "100%", ...styles.input, padding: '8px 12px' }} value={row.poso} onChange={(e) => update(i, "poso", e.target.value)} placeholder="1 comp matin/soir" /></td>
                    <td style={styles.td}><input style={{ width: "100%", ...styles.input, padding: '8px 12px' }} value={row.qty} onChange={(e) => update(i, "qty", e.target.value)} placeholder="2 boîtes" /></td>
                    <td style={styles.td}><input style={{ width: "100%", ...styles.input, padding: '8px 12px' }} value={row.duree} onChange={(e) => update(i, "duree", e.target.value)} placeholder="5 jours" /></td>
                    <td style={{...styles.td, textAlign: 'center' as const}}><button type="button" style={{...styles.btn, ...styles.btnDelete, padding: '6px 12px'}} onClick={() => removeRow(i)}><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="btn-group" style={styles.buttonGroup}>
            <button type="button" style={{ ...styles.btn, ...styles.btnCancel }} onClick={cancelForm} disabled={isSubmitting || !idsReady}>✖ Annuler</button>
            <button type="submit" style={{ ...styles.btn, ...styles.btnSave, opacity: (isSubmitting || !idsReady) ? 0.7 : 1, cursor: (isSubmitting || !idsReady) ? 'not-allowed' : 'pointer' }} onClick={submit} disabled={isSubmitting || !idsReady}>{isSubmitting ? '⏳ Envoi...' : <><Send size={16} /> Envoyer</>}</button>
          </div>
        </div>
      </div>
    </div>
  );
}