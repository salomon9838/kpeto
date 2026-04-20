import React from 'react';
import { 
  User, 
  Stethoscope, 
  Activity, 
  Weight, 
  Ruler, 
  Thermometer, 
  Heart, 
  Phone, 
  Building,
  FileText
} from 'lucide-react'; // Installez lucide-react ou adaptez avec vos icônes

function Exam({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  
  // Style local pour l'en-tête de section (peut être déplacé en CSS)
  const sectionHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#f0f7ff',
    padding: '10px 15px',
    borderRadius: '8px',
    color: '#2563eb',
    fontWeight: '600',
    marginBottom: '20px',
    marginTop: '10px',
    borderLeft: '4px solid #2563eb'
  };

  return (
    <div className="card active" style={{ maxWidth: '900px', margin: '0 auto', padding: '30px' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.8rem', color: '#0f172a', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
          <Stethoscope size={32} /> Examen Clinique Cardiologique
        </h2>
        <p style={{ color: '#64748b' }}>Saisie des données vitales et observations du patient</p>
      </div>

      {/* --- SECTION 1 : INFORMATIONS SOIGNANT --- */}
      <div style={sectionHeaderStyle}>
        <User size={20} /> <span>Informations du soignant</span>
      </div>
      
      <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div className="mb-3">
          <label htmlFor="service" style={{ fontWeight: '500', marginBottom: '8px', display: 'block' }}>Service</label>
          <div style={{ position: 'relative' }}>
            <input id="service" value="Cardiologie" readOnly style={{ backgroundColor: '#f8fafc', cursor: 'not-allowed', width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 'bold' }} />
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="centre" style={{ fontWeight: '500', marginBottom: '8px', display: 'block' }}>Centre Médical <span style={{ color: '#e11d48' }}>*</span></label>
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
             <Building size={18} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
             <input id="centre" placeholder="Nom de l'établissement" style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="patient" style={{ fontWeight: '500', marginBottom: '8px', display: 'block' }}>Nom du Médecin <span style={{ color: '#e11d48' }}>*</span></label>
          <input id="patient" placeholder="Dr. Nom Prénom" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
        </div>

        <div className="mb-3">
          <label htmlFor="age" style={{ fontWeight: '500', marginBottom: '8px', display: 'block' }}>Téléphone <span style={{ color: '#e11d48' }}>*</span></label>
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
             <Phone size={18} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
             <input id="age" placeholder="+228 90 00 00 00" style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
          </div>
        </div>
      </div>

      {/* --- SECTION 2 : PARAMÈTRES VITAUX --- */}
      <div style={sectionHeaderStyle}>
        <Activity size={20} /> <span>Paramètres Vitaux</span>
      </div>

      <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '30px' }}>
        <div className="mb-3">
          <label htmlFor="poidd" style={{ fontSize: '0.9rem' }}><Weight size={14} /> Poids (kg)</label>
          <input id="poidd" type="number" placeholder="0.0" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '5px' }} />
        </div>
        <div className="mb-3">
          <label htmlFor="taille" style={{ fontSize: '0.9rem' }}><Ruler size={14} /> Taille (cm)</label>
          <input id="taille" type="number" placeholder="170" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '5px' }} />
        </div>
        <div className="mb-3">
          <label htmlFor="temperature" style={{ fontSize: '0.9rem' }}><Thermometer size={14} /> Température (°C)</label>
          <input id="temperature" type="number" placeholder="37.5" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '5px' }} />
        </div>
        <div className="mb-3">
          <label htmlFor="ta_gauche" style={{ fontSize: '0.9rem' }}><Heart size={14} color="#e11d48" /> TA bras gauche</label>
          <input id="ta_gauche" placeholder="12/8" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '5px' }} />
        </div>
        <div className="mb-3">
          <label htmlFor="ta_droit" style={{ fontSize: '0.9rem' }}><Heart size={14} color="#e11d48" /> TA bras droit</label>
          <input id="ta_droit" placeholder="12/8" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '5px' }} />
        </div>
        <div className="mb-3">
          <label htmlFor="pouls" style={{ fontSize: '0.9rem' }}><Activity size={14} /> Pouls (bpm)</label>
          <input id="pouls" type="number" placeholder="75" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '5px' }} />
        </div>
      </div>

      {/* --- SECTION 3 : OBSERVATIONS --- */}
      <div style={sectionHeaderStyle}>
        <FileText size={20} /> <span>Observations Cliniques</span>
      </div>

      <textarea 
        rows={5} 
        placeholder="Décrivez ici l'état clinique détaillé du patient..." 
        style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', fontFamily: 'inherit', fontSize: '1rem', resize: 'vertical', marginBottom: '30px' }}
      />

      <div className="btn-group" style={{ textAlign: 'right' }}>
        <button 
          className="btn" 
          onClick={() => setActiveTab("ordonnance")}
          style={{ 
            backgroundColor: '#2563eb', 
            color: 'white', 
            padding: '14px 40px', 
            borderRadius: '10px', 
            border: 'none', 
            fontWeight: 'bold', 
            fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.4)',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
        >
          Enregistrer et continuer
        </button>
      </div>
    </div>
  );
}

export default Exam;