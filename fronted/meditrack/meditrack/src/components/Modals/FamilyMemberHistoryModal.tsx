// components/Modals/FamilyMemberHistoryModal.tsx
import React, { useState } from 'react';
import { FamilyMember, CarnetFormData } from '../../types/index';

export interface PaymentFormData {
    type: string;
    amount: string; 
    method: string;
    phoneNumber: string;
    description: string;
}

interface FamilyMemberHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: FamilyMember | null;
  onAddMedicalEntry: (memberId: string, data: CarnetFormData) => void;
  onDeleteMedicalEntry: (memberId: string, entryId: string) => void;
  onAddPayment: (memberId: string, data: PaymentFormData) => void;
}

type TabType = 'carnet' | 'paiement';
type PaymentStep = 'selection' | 'details' | 'phone' | 'secret' | 'confirm';

const centresHospitaliers = [
  { id: 'chu-sylvanus', nom: 'CHU Sylvanus Olympio', ville: 'Lomé' },
  { id: 'chu-campus', nom: 'CHU Campus', ville: 'Lomé' },
  { id: 'hopital-be', nom: 'Hôpital de Bè', ville: 'Lomé' },
  { id: 'hopital-agoenyive', nom: 'Hôpital Agoe-Nyivé', ville: 'Lomé' },
  { id: 'clinique-bon-samaritain', nom: 'Clinique du Bon Samaritain', ville: 'Lomé' },
  { id: 'hopital-kara', nom: 'CHR Kara', ville: 'Kara' },
  { id: 'hopital-sokode', nom: 'CHR Sokodé', ville: 'Sokodé' },
];

const servicesHospitaliers = [
  { id: 's1', nom: 'Médecine générale' },
  { id: 's2', nom: 'Pédiatrie' },
  { id: 's3', nom: 'Maternité / Obstétrique' },
  { id: 's5', nom: 'Cardiologie' },
  { id: 's21', nom: 'Urgences' },
  { id: 's22', nom: 'Laboratoire' },
];

const FamilyMemberHistoryModal: React.FC<FamilyMemberHistoryModalProps> = ({
  isOpen, onClose, member, onAddPayment
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('carnet');
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('selection');
  const [paymentType, setPaymentType] = useState<'consultation' | 'analyse' | 'pharmacie'>('consultation');
  const [successMessage, setSuccessMessage] = useState(false);

  const [selectedCentreId, setSelectedCentreId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'moov' | 'yas'>('moov');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');

  if (!isOpen || !member) return null;

  const medicalHistory = (member as any).medicalHistory || [];

  const handleStartPayment = (type: 'consultation' | 'analyse') => {
    setPaymentType(type);
    resetPayment();
    setPaymentStep('details');
  };

  const handleContinue = () => {
    if (!selectedCentreId || !selectedServiceId || !amount) {
      alert('❌ Veuillez remplir tous les champs');
      return;
    }
    setPaymentStep('phone');
  };

  const handleConfirmPayment = () => {
    if (secretCode !== confirmCode) {
      alert('❌ Les codes secrets ne correspondent pas');
      return;
    }

    const paymentData: PaymentFormData = {
      type: paymentType,
      amount: amount.toString(),
      method: method,
      phoneNumber: phoneNumber,
      description: `Paiement pour ${centresHospitaliers.find(c => c.id === selectedCentreId)?.nom || 'centre inconnu'}`
    };

    onAddPayment(member.id.toString(), paymentData);
    
    setSuccessMessage(true);
    setTimeout(() => {
      setSuccessMessage(false);
      setPaymentStep('selection');
      resetPayment();
    }, 2500);
  };

  const resetPayment = () => {
    setSelectedCentreId('');
    setSelectedServiceId('');
    setAmount('');
    setPhoneNumber('');
    setSecretCode('');
    setConfirmCode('');
  };

  // --- Styles ---
  const btnPrimary: React.CSSProperties = {
    width: '100%', padding: '12px', backgroundColor: '#2C5F7C',
    color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, marginBottom: '10px'
  };
  const btnSecondary: React.CSSProperties = {
    width: '100%', padding: '12px', backgroundColor: '#e2e8f0',
    color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, marginBottom: '10px'
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '15px', boxSizing: 'border-box'
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header avec Bouton Retour Global */}
        <div style={{ padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
              onClick={onClose} 
              style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#2C5F7C', fontWeight: 'bold' }}
            >
              ←
            </button>
            <h2 style={{ fontSize: '18px', margin: 0, color: '#1e293b' }}>Historique : {member.name}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', backgroundColor: '#f8fafc' }}>
          {(['carnet', 'paiement'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setPaymentStep('selection'); // Reset l'étape si on change d'onglet
              }}
              style={{
                flex: 1, padding: '15px', border: 'none', cursor: 'pointer', fontWeight: 600,
                color: activeTab === tab ? '#2C5F7C' : '#64748b',
                borderBottom: activeTab === tab ? '3px solid #2C5F7C' : 'none',
                backgroundColor: activeTab === tab ? 'white' : 'transparent'
              }}
            >
              {tab === 'carnet' ? '📋 Carnet Médical' : '💳 Nouveau Paiement'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'carnet' && (
            <div>
              {medicalHistory.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>Aucun historique médical enregistré.</p>
              ) : (
                medicalHistory.map((entry: any) => (
                  <div key={entry.id} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '10px' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                        <span>{entry.service}</span>
                        <span style={{ color: '#64748b', fontSize: '12px' }}>{entry.date}</span>
                     </div>
                     <p style={{ fontSize: '14px', margin: '5px 0' }}>{entry.diagnostic}</p>
                  </div>
                ))
              )}
              <button onClick={onClose} style={{ ...btnSecondary, marginTop: '20px' }}>Fermer l'historique</button>
            </div>
          )}

          {activeTab === 'paiement' && (
            <div>
              {paymentStep === 'selection' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {successMessage && <div style={{ padding: '15px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '8px', textAlign: 'center', marginBottom: '10px' }}>✅ Paiement validé avec succès !</div>}
                  <button onClick={() => handleStartPayment('consultation')} style={{ ...btnPrimary, height: '80px', fontSize: '16px' }}>🩺 Payer une Consultation</button>
                  <button onClick={() => handleStartPayment('analyse')} style={{ ...btnPrimary, backgroundColor: '#0ea5e9', height: '80px', fontSize: '16px' }}>🔬 Payer une Analyse</button>
                  <button onClick={onClose} style={btnSecondary}>Retour à la liste</button>
                </div>
              )}

              {paymentStep === 'details' && (
                <div>
                  <label style={{ fontSize: '14px', fontWeight: 600 }}>Centre Hospitalier</label>
                  <select value={selectedCentreId} onChange={e => setSelectedCentreId(e.target.value)} style={inputStyle}>
                    <option value="">Choisir un centre...</option>
                    {centresHospitaliers.map(c => <option key={c.id} value={c.id}>{c.nom} ({c.ville})</option>)}
                  </select>

                  <label style={{ fontSize: '14px', fontWeight: 600 }}>Service médical</label>
                  <select value={selectedServiceId} onChange={e => setSelectedServiceId(e.target.value)} style={inputStyle}>
                    <option value="">Choisir un service...</option>
                    {servicesHospitaliers.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
                  </select>

                  <label style={{ fontSize: '14px', fontWeight: 600 }}>Montant (FCFA)</label>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Ex: 5000" style={inputStyle} />

                  <label style={{ fontSize: '14px', fontWeight: 600, display: 'block', marginBottom: '10px' }}>Mode de paiement</label>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <button onClick={() => setMethod('moov')} style={{ flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', backgroundColor: method === 'moov' ? '#f0f9ff' : 'white', border: method === 'moov' ? '2px solid #2C5F7C' : '1px solid #ddd' }}>Moov Money</button>
                    <button onClick={() => setMethod('yas')} style={{ flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', backgroundColor: method === 'yas' ? '#f0f9ff' : 'white', border: method === 'yas' ? '2px solid #2C5F7C' : '1px solid #ddd' }}>TMoney</button>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setPaymentStep('selection')} style={btnSecondary}>Annuler</button>
                    <button onClick={handleContinue} style={{ ...btnPrimary, flex: 2 }}>Continuer</button>
                  </div>
                </div>
              )}

              {paymentStep === 'phone' && (
                <div style={{ padding: '10px 0' }}>
                  <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Numéro de téléphone</h3>
                  <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="Ex: 90 00 00 00" style={inputStyle} />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setPaymentStep('details')} style={btnSecondary}>Retour</button>
                    <button onClick={() => setPaymentStep('secret')} style={{ ...btnPrimary, flex: 2 }}>Valider</button>
                  </div>
                </div>
              )}

              {(paymentStep === 'secret' || paymentStep === 'confirm') && (
                <div style={{ padding: '10px 0' }}>
                  <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>{paymentStep === 'secret' ? 'Code PIN' : 'Confirmation'}</h3>
                  <input 
                    type="password" 
                    value={paymentStep === 'secret' ? secretCode : confirmCode} 
                    onChange={e => paymentStep === 'secret' ? setSecretCode(e.target.value) : setConfirmCode(e.target.value)} 
                    placeholder="****" 
                    style={{ ...inputStyle, textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }} 
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setPaymentStep('phone')} style={btnSecondary}>Retour</button>
                    {paymentStep === 'secret' ? (
                        <button onClick={() => setPaymentStep('confirm')} style={{ ...btnPrimary, flex: 2 }}>Suivant</button>
                    ) : (
                        <button onClick={handleConfirmPayment} style={{ ...btnPrimary, backgroundColor: '#16a34a', flex: 2 }}>Confirmer ({amount} F)</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FamilyMemberHistoryModal;