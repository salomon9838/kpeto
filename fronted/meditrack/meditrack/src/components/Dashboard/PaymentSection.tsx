import React, { useState } from 'react';

// Interfaces pour la structure des données
interface Payment {
  id: string;
  type: string;
  date: string;
  montant: number;
  methode: string;
  patient: string;
  statut: string;
}

interface PaymentSectionProps {
  paymentHistory: Payment[];
  onStartPayment: (
    type: 'consultation' | 'analyse',
    centreId: string,
    serviceId: string,
    centreNom: string,
    centreVille: string,
    serviceNom: string,
  ) => void;
}

type PaymentType = 'consultation' | 'analyse' | null;
type Step = 'home' | 'form';

// Données statiques locales (Togo)
const centresHospitaliers = [
  { id: 'chu-sylvanus', nom: 'CHU Sylvanus Olympio', ville: 'Lomé' },
  { id: 'chu-campus', nom: 'CHU Campus', ville: 'Lomé' },
  { id: 'hopital-be', nom: 'Hôpital de Bè', ville: 'Lomé' },
  { id: 'hopital-agoenyive', nom: 'Hôpital Agoe-Nyivé', ville: 'Lomé' },
  { id: 'hopital-kara', nom: 'CHR Kara', ville: 'Kara' },
  { id: 'hopital-sokode', nom: 'CHR Sokodé', ville: 'Sokodé' },
  { id: 'hopital-atakpame', nom: 'CHR Atakpamé', ville: 'Atakpamé' },
  { id: 'hopital-dapaong', nom: 'CHR Dapaong', ville: 'Dapaong' },
];

const servicesHospitaliers = [
  { id: 's1', nom: 'Médecine générale' },
  { id: 's2', nom: 'Pédiatrie' },
  { id: 's5', nom: 'Cardiologie' },
  { id: 's6', nom: 'Ophtalmologie' },
  { id: 's21', nom: 'Urgences' },
  { id: 's22', nom: 'Laboratoire' },
];

const PaymentSection: React.FC<PaymentSectionProps> = ({ paymentHistory, onStartPayment }) => {
  const [step, setStep] = useState<Step>('home');
  const [selectedType, setSelectedType] = useState<PaymentType>(null);
  const [selectedCentreId, setSelectedCentreId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');

  const selectedCentre = centresHospitaliers.find(c => c.id === selectedCentreId);
  const selectedService = servicesHospitaliers.find(s => s.id === selectedServiceId);
  const canPay = !!(selectedCentreId && selectedServiceId);

  const handleTypeClick = (type: 'consultation' | 'analyse') => {
    setSelectedType(type);
    setSelectedCentreId('');
    setSelectedServiceId('');
    setStep('form');
  };

  const handlePay = () => {
    if (canPay && selectedType) {
      // On déclenche l'action de paiement passée en paramètre
      onStartPayment(
        selectedType,
        selectedCentreId,
        selectedServiceId,
        selectedCentre?.nom ?? '',
        selectedCentre?.ville ?? '',
        selectedService?.nom ?? '',
      );
      handleReset();
    }
  };

  const handleReset = () => {
    setStep('home');
    setSelectedType(null);
    setSelectedCentreId('');
    setSelectedServiceId('');
  };

  // ── VUE 1 : Accueil ─────────────────────────────────────────────────────────
  const renderHome = () => (
    <>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <span style={{ marginRight: '10px', fontSize: '20px' }}>💳</span>
          <h3 style={titleStyle}>Effectuer un Paiement</h3>
        </div>
        <p style={instructionStyle}>Choisissez le service à régler :</p>
        
        <div style={typeButtonStyle} onClick={() => handleTypeClick('consultation')}>
          <span style={iconBoxStyle}>🏥</span>
          <span style={buttonTextStyle}>Consultation médicale</span>
          <span style={arrowStyle}>›</span>
        </div>

        <div style={{ ...typeButtonStyle, marginBottom: 0 }} onClick={() => handleTypeClick('analyse')}>
          <span style={{ ...iconBoxStyle, backgroundColor: '#8E24AA' }}>🔬</span>
          <span style={buttonTextStyle}>Analyse laboratoire</span>
          <span style={arrowStyle}>›</span>
        </div>
      </div>
      {renderHistorique()}
    </>
  );

  // ── VUE 2 : Formulaire ──────────────────────────────────────────────────────
  const renderForm = () => (
    <div style={cardStyle}>
      <div style={formHeaderStyle}>
        <button style={backBtnStyle} onClick={handleReset}>← Retour</button>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '10px', fontSize: '20px' }}>
            {selectedType === 'consultation' ? '🏥' : '🔬'}
          </span>
          <h3 style={titleStyle}>
            {selectedType === 'consultation' ? 'Consultation médicale' : 'Analyse laboratoire'}
          </h3>
        </div>
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>🏥 Centre / Hôpital</label>
        <select
          style={selectStyle}
          value={selectedCentreId}
          onChange={e => {
            setSelectedCentreId(e.target.value);
            setSelectedServiceId('');
          }}
        >
          <option value="">— Sélectionnez un centre —</option>
          {centresHospitaliers.map(c => (
            <option key={c.id} value={c.id}>{c.nom} ({c.ville})</option>
          ))}
        </select>
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>🩺 Service / Spécialité</label>
        <select
          style={selectStyle}
          value={selectedServiceId}
          onChange={e => setSelectedServiceId(e.target.value)}
          disabled={!selectedCentreId}
        >
          <option value="">— Sélectionnez un service —</option>
          {servicesHospitaliers.map(s => (
            <option key={s.id} value={s.id}>{s.nom}</option>
          ))}
        </select>
      </div>

      {canPay && (
        <div style={summaryStyle}>
          <p style={summaryTitleStyle}>📋 Récapitulatif</p>
          <div style={summaryRowStyle}>
            <span style={summaryLabelStyle}>Centre</span>
            <span style={summaryValueStyle}>{selectedCentre?.nom}</span>
          </div>
          <div style={summaryRowStyle}>
            <span style={summaryLabelStyle}>Service</span>
            <span style={summaryValueStyle}>{selectedService?.nom}</span>
          </div>
        </div>
      )}

      <button
        style={{ ...payBtnStyle, opacity: canPay ? 1 : 0.4, cursor: canPay ? 'pointer' : 'not-allowed' }}
        disabled={!canPay}
        onClick={handlePay}
      >
        💳 Procéder au paiement
      </button>
    </div>
  );

  // ── Historique ───────────────────────────────────────────────────────────────
  const renderHistorique = () => (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <span style={{ marginRight: '10px', fontSize: '20px' }}>📄</span>
        <h3 style={titleStyle}>Historique des Paiements</h3>
      </div>
      {paymentHistory.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '10px', color: '#666' }}>
          Aucun paiement enregistré.
        </div>
      ) : (
        paymentHistory.map(payment => (
          <div key={payment.id} style={historyItemStyle}>
            <h4 style={{ color: '#2C5F7C', margin: '0 0 8px 0' }}>{payment.type}</h4>
            <p style={histTxtStyle}><strong>Date :</strong> {payment.date}</p>
            <p style={histTxtStyle}><strong>Montant :</strong> {payment.montant} FCFA</p>
            <p style={{ color: '#28a745', margin: 0, fontWeight: 600 }}>✅ {payment.statut}</p>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div style={{ padding: '30px', backgroundColor: '#D6EFFF', minHeight: '100vh' }}>
      {step === 'home' && renderHome()}
      {step === 'form' && renderForm()}
    </div>
  );
};

// ── Styles CSS-in-JS ──────────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  background: 'white', borderRadius: '12px', padding: '30px',
  marginBottom: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', border: '1px solid #e0e0e0',
};
const headerStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.1)',
  paddingBottom: '15px', marginBottom: '25px',
};
const formHeaderStyle: React.CSSProperties = {
  borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '15px', marginBottom: '25px',
};
const titleStyle: React.CSSProperties = { margin: 0, color: '#2C5F7C', fontSize: '18px', fontWeight: 600 };
const instructionStyle: React.CSSProperties = { color: '#555', fontSize: '14px', marginBottom: '20px' };
const typeButtonStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', border: '2px solid #B8D4E0', borderRadius: '8px',
  padding: '16px 18px', marginBottom: '12px', cursor: 'pointer', backgroundColor: '#E8F4F8',
};
const iconBoxStyle: React.CSSProperties = {
  backgroundColor: '#1E88E5', color: 'white', borderRadius: '4px', width: '30px', height: '30px',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: '14px',
};
const buttonTextStyle: React.CSSProperties = { color: '#2C5F7C', fontSize: '15px', fontWeight: 500, flex: 1 };
const arrowStyle: React.CSSProperties = { color: '#1E88E5', fontSize: '20px', fontWeight: 700 };
const backBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', color: '#1E88E5', cursor: 'pointer', fontWeight: 600, padding: '0 0 10px 0',
};
const fieldGroupStyle: React.CSSProperties = { marginBottom: '18px' };
const labelStyle: React.CSSProperties = { display: 'block', color: '#2C5F7C', fontWeight: 600, fontSize: '14px', marginBottom: '8px' };
const selectStyle: React.CSSProperties = {
  width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #B8D4E0', boxSizing: 'border-box',
};
const summaryStyle: React.CSSProperties = { backgroundColor: '#F0F8FF', border: '1px solid #B8D4E0', borderRadius: '8px', padding: '16px', marginBottom: '18px' };
const summaryTitleStyle: React.CSSProperties = { color: '#1E88E5', fontWeight: 700, fontSize: '13px', margin: '0 0 10px 0' };
const summaryRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', marginBottom: '5px' };
const summaryLabelStyle: React.CSSProperties = { color: '#666', fontSize: '13px' };
const summaryValueStyle: React.CSSProperties = { color: '#2C5F7C', fontSize: '13px', fontWeight: 600 };
const payBtnStyle: React.CSSProperties = {
  width: '100%', backgroundColor: '#1E88E5', color: 'white', border: 'none', borderRadius: '8px', padding: '14px', fontWeight: 700,
};
const historyItemStyle: React.CSSProperties = { background: '#f8f9fa', padding: '15px', borderLeft: '4px solid #2C5F7C', marginBottom: '15px', borderRadius: '5px' };
const histTxtStyle: React.CSSProperties = { color: '#666', marginBottom: '5px', fontSize: '14px' };

export default PaymentSection;