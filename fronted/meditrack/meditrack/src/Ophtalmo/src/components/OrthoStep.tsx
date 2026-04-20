import { useState } from "react";

interface Med {
  medicament: string;
  posologie: string;
  quantite: string;
  duree: string;
}

export default function OrthoStep() {
  const [meds, setMeds] = useState<Med[]>([
    { medicament: "", posologie: "", quantite: "", duree: "" }
  ]);
  const [centre, setCentre] = useState("");
  const [doctor, setDoctor] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("Ophtalmologie");

  const addRow = () =>
    setMeds([...meds, { medicament: "", posologie: "", quantite: "", duree: "" }]);

  const removeRow = (index: number) => {
    if (meds.length > 1) {
      setMeds(meds.filter((_, i) => i !== index));
    }
  };

  const updateMed = (index: number, field: keyof Med, value: string) => {
    const newMeds = [...meds];
    newMeds[index][field] = value;
    setMeds(newMeds);
  };

  // Styles réutilisables
  const inputStyle = {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    marginTop: '5px'
  };

  const labelStyle: React.CSSProperties = {
    fontWeight: 'bold',
    fontSize: '14px',
    color: '#555',
    display: 'block'
  };

  const tableHeaderStyle: React.CSSProperties = {
    padding: '12px',
    textAlign: 'left',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    border: '1px solid #008f80'
  };

  return (
    <div className="container" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div className="card active" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#2c3e50', borderBottom: '2px solid #00a896', paddingBottom: '10px' }}>
          💊 Ordonnance Médicale
        </h2>

        {/* SECTION 1: INFORMATION DU SOIGNANT (EN PARALLÈLE) */}
        <div style={{ marginBottom: '30px', marginTop: '20px' }}>
          <h3 style={{ color: '#00a896', borderLeft: '4px solid #00a896', paddingLeft: '10px', marginBottom: '15px' }}>
            Information du soignant
          </h3>
          <div style={{ 
            display: 'flex', 
            gap: '15px', 
            alignItems: 'flex-start',
            flexWrap: 'wrap' 
          }}>
            <div style={{ flex: '1', minWidth: '150px' }}>
              <label style={labelStyle}>Service</label>
              <select value={service} onChange={e => setService(e.target.value)} style={inputStyle}>
                <option>Ophtalmologie</option>
                <option>Chirurgie</option>
                <option>Urologie</option>
              </select>
            </div>
            <div style={{ flex: '1', minWidth: '150px' }}>
              <label style={labelStyle}>Centre <span style={{ color: 'red' }}>*</span></label>
              <input value={centre} onChange={e => setCentre(e.target.value)} placeholder="Hôpital Central" style={inputStyle} />
            </div>
            <div style={{ flex: '1.5', minWidth: '200px' }}>
              <label style={labelStyle}>Nom du Médecin <span style={{ color: 'red' }}>*</span></label>
              <input value={doctor} onChange={e => setDoctor(e.target.value)} placeholder="Dr. Kouassi" style={inputStyle} />
            </div>
            <div style={{ flex: '1', minWidth: '150px' }}>
              <label style={labelStyle}>Contact <span style={{ color: 'red' }}>*</span></label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+228 90 00 00 00" style={inputStyle} />
            </div>
          </div>
        </div>

        {/* SECTION 2: LISTE DES MÉDICAMENTS */}
        <div style={{ marginBottom: '25px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ color: '#00a896', borderLeft: '4px solid #00a896', paddingLeft: '10px' }}>Liste des Médicaments</h3>
            <button 
              onClick={addRow}
              style={{ padding: '8px 15px', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <span>➕</span> Ajouter
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#00a896' }}>
                <th style={tableHeaderStyle}>Médicament</th>
                <th style={tableHeaderStyle}>Posologie</th>
                <th style={tableHeaderStyle}>Quantité</th>
                <th style={tableHeaderStyle}>Durée</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {meds.map((med, i) => (
                <tr key={i}>
                  <td style={tableCellStyle}><input style={inputStyle} value={med.medicament} onChange={e => updateMed(i, 'medicament', e.target.value)} placeholder="Paracétamol 500mg" /></td>
                  <td style={tableCellStyle}><input style={inputStyle} value={med.posologie} onChange={e => updateMed(i, 'posologie', e.target.value)} placeholder="1 comp matin/soir" /></td>
                  <td style={tableCellStyle}><input style={inputStyle} value={med.quantite} onChange={e => updateMed(i, 'quantite', e.target.value)} placeholder="QSP 1 boîte" /></td>
                  <td style={tableCellStyle}><input style={inputStyle} value={med.duree} onChange={e => updateMed(i, 'duree', e.target.value)} placeholder="5 jours" /></td>
                  <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                    <button 
                      onClick={() => removeRow(i)}
                      style={{ background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: '4px', width: '30px', height: '30px', cursor: 'pointer' }}
                    >
                      ✖
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* BOUTON D'ENVOI */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px' }}>
          <button style={{ 
            padding: '12px 25px', 
            backgroundColor: '#00a896', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '6px', 
            fontWeight: 'bold', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '18px' }}>👥</span> Envoyer au patient
          </button>
        </div>
      </div>
    </div>
  );
}

const tableCellStyle: React.CSSProperties = {
  border: '1px solid #eee',
  padding: '8px'
};