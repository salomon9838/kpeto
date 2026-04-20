import { useState } from "react";

export default function OphtalmoAnalyseStep() {
  // Stockage structuré pour respecter le format "CATÉGORIE: Examen"
  const [selectedAnalyses, setSelectedAnalyses] = useState<Record<string, string[]>>({});
  const [motif, setMotif] = useState("");
  const [centre, setCentre] = useState("");
  const [doctor, setDoctor] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("Ophtalmologie");

  const categories = {
    "EXAMENS FONCTIONNELS": ["CHAMP VISUEL AUTOMATISÉ"],
    "MESURES": ["PIO", "PACHYMÉTRIE", "AR", "AR SOUS CYCLO"],
    "IMAGE": ["OCT de la mascula", "OCT de la papille", "Rétinographie"]
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

  // Formatage du texte pour le textarea
  const formatAnalysesText = () => {
    return Object.entries(selectedAnalyses)
      .map(([cat, items]) => `${cat}: ${items.join(", ")}`)
      .join("\n");
  };

  // Styles réutilisables pour la cohérence
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
          🔬 Examens Ophtalmologiques
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
                placeholder="Clinique Ophtalmologique" 
                style={inputStyle} 
              />
            </div>

            <div style={{ flex: '1.5', minWidth: '200px' }}>
              <label style={labelStyle}>Nom du soignant <span style={{ color: 'red' }}>*</span></label>
              <input 
                value={doctor} 
                onChange={e => setDoctor(e.target.value)} 
                placeholder="Dr. Nom Prénom" 
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

        {/* SECTION 2: TYPE D'ANALYSE RAPIDE */}
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ color: '#00a896', borderLeft: '4px solid #00a896', paddingLeft: '10px', marginBottom: '15px' }}>
            TYPE D'EXAMEN (Cliquer pour ajouter) :
          </h3>
          {Object.entries(categories).map(([cat, tags]) => (
            <div key={cat} style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '5px 0', fontSize: '13px', color: '#666', fontWeight: 'bold' }}>{cat}</h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {tags.map(tag => (
                  <button 
                    key={tag} 
                    onClick={() => addTag(cat, tag)}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: '#e6f7f4',
                      border: '1px solid #00a896',
                      color: '#00a896',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* SECTION 3: RÉSULTAT ET MOTIF */}
        <div style={{ marginBottom: '25px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={labelStyle}>Examens demandés <span style={{ color: 'red' }}>*</span></label>
            <textarea
              rows={5}
              value={formatAnalysesText()}
              readOnly
              placeholder="Sélectionnez les examens ci-dessus..."
              style={{ ...inputStyle, backgroundColor: '#f9f9f9', cursor: 'default' }}
            />
          </div>

          <div>
            <label style={labelStyle}>Motif de l'examen</label>
            <textarea
              rows={2}
              value={motif}
              onChange={e => setMotif(e.target.value)}
              placeholder="Précisez le motif si nécessaire..."
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
        </div>

        {/* BOUTON D'ENVOI */}
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