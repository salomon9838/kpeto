import { useState } from "react";

export default function LabStep() {
  // On stocke les analyses sous forme d'objet { CATEGORIE: [examens] }
  const [selectedAnalyses, setSelectedAnalyses] = useState<Record<string, string[]>>({});
  const [motif, setMotif] = useState("");
  const [centre, setCentre] = useState("");
  const [doctor, setDoctor] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("Ophtalmologie");

  const categories = {
    "PARASITOLOGIE & BACTÉRIOLOGIE": ["GE", "SELLES KOP", "SCOTCH TEST", "BCE", "Culot urinaire", "PV", "ECBU"],
    "SÉROLOGIE": ["SRV", "Ag HBs", "TPHA-VDRL", "CRP", "Toxoplasmose"],
    "HÉMATOLOGIE": ["NFS", "VS", "NB-TH", "Groupage", "Electrophorèse"],
    "BIOCHIMIE": ["Urée", "Glycémie", "Créatininémie", "ASAT", "ALAT", "GGT", "PAL"]
  };

  const addTag = (cat: string, val: string) => {
    setSelectedAnalyses(prev => {
      const currentCatItems = prev[cat] || [];
      if (currentCatItems.includes(val)) return prev; // Évite les doublons
      return {
        ...prev,
        [cat]: [...currentCatItems, val]
      };
    });
  };

  // Convertit l'objet en texte formaté pour le textarea
  const formatAnalysesText = () => {
    return Object.entries(selectedAnalyses)
      .map(([cat, items]) => `${cat}: ${items.join(", ")}`)
      .join("\n");
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

  return (
    <div className="container" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div className="card active" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#2c3e50', borderBottom: '2px solid #00a896', paddingBottom: '10px' }}>
          🔬 Analyses Laboratoire
        </h2>

        {/* SECTION 1: INFORMATION DU SOIGNANT (ALIGNÉE EN PARALLÈLE) */}
        <div style={{ marginBottom: '30px' }}>
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
                placeholder="Laboratoire National" 
                style={inputStyle} 
              />
            </div>

            <div style={{ flex: '1.5', minWidth: '200px' }}>
              <label style={labelStyle}>Nom du soignant <span style={{ color: 'red' }}>*</span></label>
              <input 
                value={doctor} 
                onChange={e => setDoctor(e.target.value)} 
                placeholder="Infirmier(e) de garde" 
                style={inputStyle} 
              />
            </div>

            <div style={{ flex: '1', minWidth: '150px' }}>
              <label style={labelStyle}>Téléphone <span style={{ color: 'red' }}>*</span></label>
              <input 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                placeholder="+228 91 00 00 00" 
                style={inputStyle} 
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: TAGS PAR CATÉGORIE */}
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ color: '#00a896', borderLeft: '4px solid #00a896', paddingLeft: '10px', marginBottom: '15px' }}>
            TYPE D'ANALYSE RAPIDE (Cliquer pour ajouter) :
          </h3>
          {Object.entries(categories).map(([cat, tags]) => (
            <div key={cat} style={{ marginBottom: '15px' }}>
              <h4 style={{ margin: '5px 0', fontSize: '13px', color: '#666' }}>{cat}</h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {tags.map(tag => (
                  <button 
                    key={tag} 
                    onClick={() => addTag(cat, tag)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#f0f4f8',
                      border: '1px solid #d1d9e0',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f0f4f8'}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* SECTION 3: RÉSULTAT FORMATÉ */}
        <div style={{ marginBottom: '25px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={labelStyle}>Analyses demandées <span style={{ color: 'red' }}>*</span></label>
            <textarea
              rows={6}
              value={formatAnalysesText()}
              readOnly
              placeholder="Les analyses s'afficheront ici par catégorie..."
              style={{ ...inputStyle, backgroundColor: '#f9f9f9', cursor: 'not-allowed' }}
            />
          </div>

          <div>
            <label style={labelStyle}>Motif</label>
            <textarea
              rows={2}
              value={motif}
              onChange={e => setMotif(e.target.value)}
              placeholder="Saisir ici le motif..."
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
        </div>

        {/* BOUTON ENVOYER */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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