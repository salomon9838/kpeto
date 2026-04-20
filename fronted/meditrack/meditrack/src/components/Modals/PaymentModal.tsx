import React, { useState, useEffect } from 'react';

// --- INTERFACES ---
interface Payment {
  id: string;
  type: string;
  date: string;
  montant: number;
  methode: string;
  patient: string;
  statut: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
  isInline?: boolean;
  paymentHistory?: Payment[];
}

// --- DONNÉES STATIQUES ---
const centresHospitaliers = [
  { id: 'chu-sylvanus', nom: 'CHU Sylvanus Olympio', ville: 'Lomé' },
  { id: 'chu-campus', nom: 'CHU Campus', ville: 'Lomé' },
  { id: 'hopital-be', nom: 'Hôpital de Bè', ville: 'Lomé' },
  { id: 'hopital-kara', nom: 'CHR Kara', ville: 'Kara' },
  { id: 'hopital-sokode', nom: 'CHR Sokodé', ville: 'Sokodé' },
];

const servicesHospitaliers = [
  { id: 's1', nom: 'Médecine générale' },
  { id: 's2', nom: 'Pédiatrie' },
  { id: 's5', nom: 'Cardiologie' },
  { id: 's6', nom: 'Ophtalmologie' },
  { id: 's22', nom: 'Laboratoire' },
];

const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isInline = false,
  paymentHistory = [] 
}) => {
  // --- ÉTATS ---
  const [step, setStep] = useState<'home' | 'config' | 'payment' | 'pin' | 'confirm'>('home');
  const [selectedType, setSelectedType] = useState<'consultation' | 'analyse' | null>(null);
  const [selectedCentreId, setSelectedCentreId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'moov' | 'tmoney' | ''>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep('home');
      setSelectedType(null);
      setMethod('');
      setPin('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedCentre = centresHospitaliers.find(c => c.id === selectedCentreId);
  const selectedService = servicesHospitaliers.find(s => s.id === selectedServiceId);

  const handleBack = () => {
    if (step === 'home') onClose();
    else if (step === 'config') setStep('home');
    else if (step === 'payment') setStep('config');
    else if (step === 'pin') setStep('payment');
    else setStep('pin');
  };

  const handleFinalSubmit = () => {
    const payload = {
      type: selectedType,
      centre: selectedCentre?.nom,
      service: selectedService?.nom,
      montant: amount,
      methode: method,
      telephone: phoneNumber
    };
    if (onSubmit) onSubmit(payload);
    alert("Transaction en cours... Un message de confirmation vous sera envoyé.");
    onClose();
  };

  // --- STYLES ---
  const modalContainerStyle: React.CSSProperties = isInline ? {
    width: '100%',
    maxWidth: '600px', // Taille MOYENNE
    margin: '0 auto',
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #e0e0e0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
  } : {
    width: '95%',
    maxWidth: '600px', // Taille MOYENNE
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 20px 25px rgba(0,0,0,0.15)',
    zIndex: 2001,
    position: 'relative'
  };

  const overlayStyle: React.CSSProperties = isInline ? {} : {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
  };

  // --- ÉTAPES DE RENDU ---

  // ÉTAPE 1: ACCUEIL
  const renderHome = () => (
    <div style={{ padding: '30px' }}>
      <h3 style={titleStyle}>💳 Effectuer un Paiement</h3>
      <p style={subTitleStyle}>Veuillez choisir le service à régler pour continuer.</p>
      <div style={typeButtonStyle} onClick={() => { setSelectedType('consultation'); setStep('config'); }}>
        <span style={iconBoxStyle}>🏥</span>
        <span style={buttonTextStyle}>Consultation médicale</span>
        <span style={arrowStyle}>›</span>
      </div>
      <div style={typeButtonStyle} onClick={() => { setSelectedType('analyse'); setStep('config'); }}>
        <span style={{ ...iconBoxStyle, backgroundColor: '#8E24AA' }}>🔬</span>
        <span style={buttonTextStyle}>Analyse laboratoire</span>
        <span style={arrowStyle}>›</span>
      </div>
      
      {paymentHistory.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h4 style={{...titleStyle, fontSize: '15px'}}>📄 Dernières transactions</h4>
          {paymentHistory.slice(0, 2).map(p => (
            <div key={p.id} style={historyItemStyle}>
              <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{p.type}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>{p.date} • {p.montant} FCFA</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ÉTAPE 2: CONFIGURATION
  const renderConfig = () => (
    <div style={{ padding: '30px' }}>
      <h3 style={titleStyle}>{selectedType === 'consultation' ? '🏥 Détails Consultation' : '🔬 Détails Analyse'}</h3>
      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Centre Hospitalier</label>
        <select style={inputStyle} value={selectedCentreId} onChange={e => setSelectedCentreId(e.target.value)}>
          <option value="">Sélectionnez un centre</option>
          {centresHospitaliers.map(c => <option key={c.id} value={c.id}>{c.nom} ({c.ville})</option>)}
        </select>
      </div>
      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Service concerné</label>
        <select style={inputStyle} value={selectedServiceId} onChange={e => setSelectedServiceId(e.target.value)} disabled={!selectedCentreId}>
          <option value="">Sélectionnez un service</option>
          {servicesHospitaliers.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
        </select>
      </div>
      <button 
        style={{ ...primaryBtnStyle, opacity: (selectedCentreId && selectedServiceId) ? 1 : 0.5 }} 
        disabled={!(selectedCentreId && selectedServiceId)}
        onClick={() => setStep('payment')}
      >
        Suivant
      </button>
    </div>
  );

  // ÉTAPE 3: INFOS PAIEMENT
  const renderPayment = () => (
    <div style={{ padding: '30px' }}>
      <h3 style={titleStyle}>💰 Informations de facturation</h3>
      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Montant (FCFA)</label>
        <input type="number" placeholder="Ex: 5000" style={inputStyle} value={amount} onChange={e => setAmount(e.target.value)} />
      </div>
      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Opérateur Mobile</label>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button style={{ ...methodBtn, backgroundColor: method === 'moov' ? '#E0F2FE' : 'white', borderColor: method === 'moov' ? '#00A1E4' : '#ddd' }} onClick={() => setMethod('moov')}>Moov Money</button>
          <button style={{ ...methodBtn, backgroundColor: method === 'tmoney' ? '#FFFBEB' : 'white', borderColor: method === 'tmoney' ? '#FFCC00' : '#ddd' }} onClick={() => setMethod('tmoney')}>TMoney</button>
        </div>
      </div>
      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Numéro de téléphone</label>
        <input type="tel" placeholder="90 00 00 00" style={inputStyle} value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
      </div>
      <button 
        style={{ ...primaryBtnStyle, opacity: (amount && method && phoneNumber) ? 1 : 0.5 }} 
        disabled={!(amount && method && phoneNumber)}
        onClick={() => setStep('pin')}
      >
        Continuer vers la validation
      </button>
    </div>
  );

  // ÉTAPE 4: CODE SECRET
  const renderPin = () => (
    <div style={{ padding: '30px', textAlign: 'center' }}>
      <div style={{ fontSize: '40px', marginBottom: '10px' }}>🔐</div>
      <h3 style={titleStyle}>Validation Sécurisée</h3>
      <p style={{...subTitleStyle, marginBottom: '20px'}}>Saisissez votre code secret pour valider le prélèvement de <strong>{amount} FCFA</strong>.</p>
      
      <div style={fieldGroupStyle}>
        <input 
          type="password" 
          placeholder="****" 
          maxLength={4}
          style={{ ...inputStyle, textAlign: 'center', fontSize: '24px', letterSpacing: '10px', width: '150px', margin: '0 auto' }} 
          value={pin} 
          onChange={e => setPin(e.target.value)} 
        />
      </div>
      
      <button 
        style={{ ...primaryBtnStyle, backgroundColor: '#16a34a', opacity: pin.length >= 4 ? 1 : 0.5 }} 
        disabled={pin.length < 4}
        onClick={handleFinalSubmit}
      >
        Confirmer le paiement
      </button>
    </div>
  );

  return (
    <div style={overlayStyle}>
      <div style={modalContainerStyle}>
        {/* HEADER */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={handleBack} style={backButtonStyle}>←</button>
            <span style={{ fontWeight: 'bold', color: '#2C5F7C', fontSize: '18px' }}>MÉDI-TRACK PAY</span>
          </div>
          {!isInline && <button onClick={onClose} style={closeXStyle}>×</button>}
        </div>

        {/* CONTENU DYNAMIQUE */}
        <div style={{ minHeight: '350px' }}>
          {step === 'home' && renderHome()}
          {step === 'config' && renderConfig()}
          {step === 'payment' && renderPayment()}
          {step === 'pin' && renderPin()}
        </div>

        {/* FOOTER */}
        <div style={{ padding: '0 30px 30px', textAlign: 'center' }}>
          <button onClick={onClose} style={cancelLinkStyle}>Abandonner l'opération</button>
        </div>
      </div>
    </div>
  );
};

// --- STYLES ---
const headerStyle: React.CSSProperties = {
  padding: '20px 30px',
  borderBottom: '1px solid #f1f5f9',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: '#fff'
};
const titleStyle: React.CSSProperties = { margin: '0 0 8px 0', fontSize: '19px', color: '#1e293b', fontWeight: '700' };
const subTitleStyle: React.CSSProperties = { fontSize: '14px', color: '#64748b', marginBottom: '25px' };
const typeButtonStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '12px',
  padding: '18px', marginBottom: '12px', cursor: 'pointer', backgroundColor: '#fff',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transition: 'all 0.2s'
};
const iconBoxStyle: React.CSSProperties = {
  backgroundColor: '#3498db', color: 'white', borderRadius: '8px', width: '38px', height: '38px',
  display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '15px', fontSize: '20px'
};
const buttonTextStyle: React.CSSProperties = { flex: 1, fontWeight: '600', color: '#334155' };
const arrowStyle: React.CSSProperties = { color: '#94a3b8', fontSize: '20px' };
const fieldGroupStyle: React.CSSProperties = { marginBottom: '20px' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '8px' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' };
const primaryBtnStyle: React.CSSProperties = { 
  width: '100%', padding: '15px', backgroundColor: '#2C5F7C', color: 'white', border: 'none', 
  borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px', fontSize: '16px' 
};
const backButtonStyle: React.CSSProperties = { background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#64748b' };
const closeXStyle: React.CSSProperties = { background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#cbd5e1' };
const methodBtn: React.CSSProperties = { flex: 1, padding: '12px', background: 'white', border: '2px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', transition: '0.2s' };
const cancelLinkStyle: React.CSSProperties = { background: 'none', border: 'none', color: '#94a3b8', textDecoration: 'underline', fontSize: '13px', cursor: 'pointer', marginTop: '10px' };
const historyItemStyle: React.CSSProperties = { padding: '12px', borderLeft: '4px solid #3498db', background: '#f8fafc', marginBottom: '10px', borderRadius: '6px' };

export default PaymentModal;