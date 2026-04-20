import React from 'react';
import { 
  FileSearch, 
  Stethoscope, 
  Building, 
  Phone, 
  User, 
  Send, 
  Focus, 
  HeartPulse,
  ClipboardCheck
} from 'lucide-react'; // Installez lucide-react

function Radio() {
  
  const sectionHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#f0f9ff',
    padding: '12px 15px',
    borderRadius: '10px',
    color: '#0369a1',
    fontWeight: '600',
    marginBottom: '20px',
    marginTop: '10px',
    borderLeft: '4px solid #0ea5e9'
  };

  const inputGroupStyle: React.CSSProperties = {
    display: 'flex', 
    flexDirection: 'column', 
    gap: '8px'
  };

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '0.95rem',
    minHeight: '100px',
    fontFamily: 'inherit',
    resize: 'vertical'
  };

  return (
    <div className="card active" style={{ maxWidth: '900px', margin: '0 auto', padding: '30px', backgroundColor: '#fff', borderRadius: '15px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '35px' }}>
        <h2 style={{ fontSize: '1.8rem', color: '#0f172a', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
          <FileSearch size={32} color="#0ea5e9" /> Demande d'Examen Radiologique
        </h2>
        <p style={{ color: '#64748b' }}>Prescription d'imagerie médicale et diagnostics spécialisés</p>
      </div>

      {/* --- SECTION 1 : ÉMETTEUR --- */}
      <div style={sectionHeaderStyle}>
        <User size={20} /> <span>Informations du prescripteur</span>
      </div>

      <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={inputGroupStyle}>
          <label style={{ fontWeight: '500', fontSize: '0.9rem' }}>Service</label>
          <input value="Cardiologie" readOnly style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#64748b', fontWeight: 'bold' }} />
        </div>

        <div style={inputGroupStyle}>
          <label style={{ fontWeight: '500', fontSize: '0.9rem' }}>Centre <span style={{ color: '#ef4444' }}>*</span></label>
          <div style={{ position: 'relative' }}>
            <Building size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input placeholder="Ex: Clinique de l'Espoir" style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
          </div>
        </div>

        <div style={inputGroupStyle}>
          <label style={{ fontWeight: '500', fontSize: '0.9rem' }}>Médecin <span style={{ color: '#ef4444' }}>*</span></label>
          <div style={{ position: 'relative' }}>
            <Stethoscope size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input placeholder="Dr. Salomon" style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
          </div>
        </div>

        <div style={inputGroupStyle}>
          <label style={{ fontWeight: '500', fontSize: '0.9rem' }}>Téléphone <span style={{ color: '#ef4444' }}>*</span></label>
          <div style={{ position: 'relative' }}>
            <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input placeholder="+228..." style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
          </div>
        </div>
      </div>

      {/* --- SECTION 2 : DETAILS EXAMEN --- */}
      <div style={sectionHeaderStyle}>
        <Focus size={20} /> <span>Détails de l'analyse</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '30px' }}>
        <div style={inputGroupStyle}>
          <label style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '5px' }}>
             <HeartPulse size={16} color="#0ea5e9" /> Type d'analyse
          </label>
          <textarea 
            placeholder="Ex: Échographie Doppler Cardiaque, ECG, Radio Thoracique..." 
            style={textareaStyle} 
          />
        </div>

        <div style={inputGroupStyle}>
          <label style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '5px' }}>
             <Focus size={16} color="#0ea5e9" /> Région à examiner
          </label>
          <textarea 
            placeholder="Ex: Région précordiale, thorax de face..." 
            style={textareaStyle} 
          />
        </div>

        <div style={inputGroupStyle}>
          <label style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '5px' }}>
             <ClipboardCheck size={16} color="#0ea5e9" /> Motif de l'examen
          </label>
          <textarea 
            placeholder="Ex: Suspicion d'insuffisance mitrale, essoufflement à l'effort..." 
            style={textareaStyle} 
          />
        </div>
      </div>

      <div className="btn-group" style={{ textAlign: 'right' }}>
        <button 
          className="btn" 
          style={{ 
            backgroundColor: '#0ea5e9', 
            color: 'white', 
            padding: '14px 45px', 
            borderRadius: '12px', 
            border: 'none', 
            fontWeight: 'bold', 
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 4px 14px rgba(14, 165, 233, 0.4)',
            transition: 'transform 0.2s, background-color 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#0284c7';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#0ea5e9';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <Send size={18} /> Transmettre la demande
        </button>
      </div>
      
    </div>
  );
}

export default Radio;