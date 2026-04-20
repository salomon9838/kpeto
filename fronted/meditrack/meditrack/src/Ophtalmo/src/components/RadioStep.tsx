import { useState } from "react";

export default function RadioStep() {
  const [typeAnalyse, setTypeAnalyse] = useState("");
  const [region, setRegion] = useState("");
  const [motif, setMotif] = useState("");
  const [centre, setCentre] = useState("");
  const [doctor, setDoctor] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("Ophtalmologie");

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

  return (
    <div className="container" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div className="card active" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#2c3e50', borderBottom: '2px solid #00a896', paddingBottom: '10px' }}>
          📋 Analyse Radio
        </h2>

        {/* SECTION 1: INFORMATION DU SOIGNANT (ALIGNÉE EN PARALLÈLE) */}
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
              <input 
                value={centre} 
                onChange={e => setCentre(e.target.value)} 
                placeholder="ex: CHU" 
                style={inputStyle} 
              />
            </div>

            <div style={{ flex: '1.5', minWidth: '200px' }}>
              <label style={labelStyle}>Nom et Prénom(s) <span style={{ color: 'red' }}>*</span></label>
              <input 
                value={doctor} 
                onChange={e => setDoctor(e.target.value)} 
                placeholder="Nom du soignant" 
                style={inputStyle} 
              />
            </div>

            <div style={{ flex: '1', minWidth: '150px' }}>
              <label style={labelStyle}>Téléphone <span style={{ color: 'red' }}>*</span></label>
              <input 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                placeholder="+228..." 
                style={inputStyle} 
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: DÉTAILS DE L'EXAMEN */}
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ color: '#00a896', borderLeft: '4px solid #00a896', paddingLeft: '10px', marginBottom: '15px' }}>
            Détails de l'examen
          </h3>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Type d'analyse <span style={{ color: 'red' }}>*</span></label>
            <textarea 
              rows={2} 
              value={typeAnalyse}
              onChange={(e) => setTypeAnalyse(e.target.value)}
              placeholder="ex: IRM, Échographie, Scanner..." 
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Région à examiner <span style={{ color: 'red' }}>*</span></label>
            <input 
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="ex: Oeil, Orbite" 
              style={inputStyle} 
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Motif <span style={{ color: 'red' }}>*</span></label>
            <textarea 
              rows={3} 
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Saisir ici le motif de l'examen..." 
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
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