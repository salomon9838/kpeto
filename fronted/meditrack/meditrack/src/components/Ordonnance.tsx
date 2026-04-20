import { useState } from "react";
import { 
  Plus, 
  Trash2, 
  Send, 
  Pill, 
  User, 
  Building, 
  Phone, 
  ClipboardList 
} from "lucide-react"; // Pensez à installer lucide-react

function Ordonnance() {
  const [meds, setMeds] = useState([
    { med: "", dose: "", quantite: "", duree: "" }
  ]);

  const addRow = () => {
    setMeds([...meds, { med: "", dose: "", quantite: "", duree: "" }]);
  };

  const removeRow = (index: number) => {
    if (meds.length > 1) {
      setMeds(meds.filter((_, i) => i !== index));
    }
  };

  const updateMed = (index: number, field: string, value: string) => {
    const newMeds = [...meds];
    (newMeds[index] as any)[field] = value;
    setMeds(newMeds);
  };

  // Styles communs réutilisables
  const sectionHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#f0f7ff',
    padding: '12px 15px',
    borderRadius: '10px',
    color: '#2563eb',
    fontWeight: '600',
    marginBottom: '20px',
    borderLeft: '4px solid #2563eb'
  };

  return (
    <div className="card active" style={{ maxWidth: '1000px', margin: '0 auto', padding: '30px', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '2rem', color: '#0f172a', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
          <ClipboardList size={32} color="#2563eb" /> Ordonnance Médicale
        </h2>
        <p style={{ color: '#64748b' }}>Édition des prescriptions pour le service de Cardiologie</p>
      </div>

      {/* --- SECTION 1 : INFORMATIONS SOIGNANT --- */}
      <div style={sectionHeaderStyle}>
        <User size={20} /> <span>Informations de l'émetteur</span>
      </div>
      
      <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '35px' }}>
        <div className="mb-3">
          <label style={{ fontWeight: '500', color: '#475569', marginBottom: '8px', display: 'block' }}>Service</label>
          <input value="Cardiologie" readOnly style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#1e293b', fontWeight: '600' }} />
        </div>

        <div className="mb-3">
          <label style={{ fontWeight: '500', color: '#475569', marginBottom: '8px', display: 'block' }}>Centre <span style={{ color: '#ef4444' }}>*</span></label>
          <div style={{ position: 'relative' }}>
            <Building size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input placeholder="Ex: Centre Hospitalier..." style={{ width: '100%', padding: '12px 12px 12px 38px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
          </div>
        </div>

        <div className="mb-3">
          <label style={{ fontWeight: '500', color: '#475569', marginBottom: '8px', display: 'block' }}>Médecin <span style={{ color: '#ef4444' }}>*</span></label>
          <input placeholder="Dr. Salomon" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
        </div>

        <div className="mb-3">
          <label style={{ fontWeight: '500', color: '#475569', marginBottom: '8px', display: 'block' }}>Téléphone <span style={{ color: '#ef4444' }}>*</span></label>
          <div style={{ position: 'relative' }}>
            <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input placeholder="+228..." style={{ width: '100%', padding: '12px 12px 12px 38px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
          </div>
        </div>
      </div>

      {/* --- SECTION 2 : PRESCRIPTIONS --- */}
      <div style={{ ...sectionHeaderStyle, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Pill size={20} /> <span>Prescriptions Médicamenteuses</span>
        </div>
        <button 
          className="btn" 
          onClick={addRow}
          style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem' }}
        >
          <Plus size={16} /> Ajouter un médicament
        </button>
      </div>

      <div style={{ overflowX: 'auto', marginBottom: '30px' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: '#64748b', fontSize: '0.9rem' }}>
              <th style={{ padding: '0 15px' }}>Médicament</th>
              <th style={{ padding: '0 15px' }}>Posologie</th>
              <th style={{ padding: '0 15px' }}>Quantité</th>
              <th style={{ padding: '0 15px' }}>Durée</th>
              <th style={{ width: '50px' }}></th>
            </tr>
          </thead>
          <tbody>
            {meds.map((med, i) => (
              <tr key={i} style={{ backgroundColor: '#fcfcfd', transition: 'all 0.2s' }}>
                <td style={{ padding: '5px 10px' }}>
                  <input 
                    placeholder="Ex: Paracétamol" 
                    value={med.med} 
                    onChange={(e) => updateMed(i, "med", e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                  />
                </td>
                <td style={{ padding: '5px 10px' }}>
                  <input 
                    placeholder="1cp Matin/Soir" 
                    value={med.dose} 
                    onChange={(e) => updateMed(i, "dose", e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                  />
                </td>
                <td style={{ padding: '5px 10px' }}>
                  <input 
                    placeholder="2 boites" 
                    value={med.quantite} 
                    onChange={(e) => updateMed(i, "quantite", e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                  />
                </td>
                <td style={{ padding: '5px 10px' }}>
                  <input 
                    placeholder="7 jours" 
                    value={med.duree} 
                    onChange={(e) => updateMed(i, "duree", e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                  />
                </td>
                <td style={{ padding: '5px 10px', textAlign: 'center' }}>
                  <button 
                    onClick={() => removeRow(i)} 
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px' }}
                    title="Supprimer la ligne"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ textAlign: 'right', marginTop: '20px' }}>
        <button 
          className="btn" 
          style={{ 
            backgroundColor: '#10b981', 
            color: 'white', 
            padding: '14px 30px', 
            borderRadius: '10px', 
            border: 'none', 
            fontWeight: 'bold', 
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)'
          }}
        >
          <Send size={18} /> Envoyer l'ordonnance au patient
        </button>
      </div>
    </div>
  );
}

export default Ordonnance;