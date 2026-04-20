import { useState } from "react";
import "./FormStyle.css"; // <-- fichier CSS externe

function TransfusionForm() {
  const [formData, setFormData] = useState({
    service: "",
    centre: "",
    nomSoignant: "",
    telSoignant: "",
    poids: "",
    taille: "",
    temperature: "",
    taGauche: "",
    taDroite: "",
    pouls: "",
    observations: "",
    typeDon: "",
    prochainRDV: "",
    antecedents: "",
    maladiesChroniques: "",
    anemie: "",
    chirurgies: "",
    hospitalisations: "",
    sang: "",
    ist: "",
    tatouage: "",
    exposition: "",
    patientApte: "",
    consentement: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Données du formulaire :", formData);
    alert("Formulaire de transfusion enregistré !");
  };

  const handleCancel = () => {
    if (window.confirm("Êtes-vous sûr de vouloir annuler ? Les modifications non sauvegardées seront perdues.")) {
      setFormData({
        service: "",
        centre: "",
        nomSoignant: "",
        telSoignant: "",
        poids: "",
        taille: "",
        temperature: "",
        taGauche: "",
        taDroite: "",
        pouls: "",
        observations: "",
        typeDon: "",
        prochainRDV: "",
        antecedents: "",
        maladiesChroniques: "",
        anemie: "",
        chirurgies: "",
        hospitalisations: "",
        sang: "",
        ist: "",
        tatouage: "",
        exposition: "",
        patientApte: "",
        consentement: "",
      });
    }
  };

  return (
    <div className="form-container">
      <h1>Formulaire de Transfusion</h1>

      <form onSubmit={handleSubmit}>
        {/* Partie 1 : Infos du soignant */}
        <h2>Information du soignant</h2>
        <div className="form-grid-4">
          <div>
            <label>Service</label>
                    <select>
                        <option>Transfusion sanguine</option>
                    </select>
          <div>
            </div>
            <label className="required">Centre médical</label>
            <input type="text" name="centre" value={formData.centre} onChange={handleChange} required placeholder="Centre médical" />
          </div>
          <div>
            <label className="required">Nom du soignant</label>
            <input type="text" name="nomSoignant" value={formData.nomSoignant} onChange={handleChange} required placeholder="Nom du soignant" />
          </div>
          <div>
            <label className="required">Téléphone du soignant</label>
            <input type="text" name="telSoignant" value={formData.telSoignant} onChange={handleChange} required placeholder="+228........" />
          </div>
        </div>

        {/* Partie 2 : Paramètres vitaux */}
        <h2>Paramètres vitaux</h2>
        <div className="flex-line">
          <div>
            <label className="required">Poids (Kg)</label>
            <input type="text" name="poids" value={formData.poids} onChange={handleChange} required placeholder="50 Kg" />
          </div>
          <div>
            <label className="required">Taille (m)</label>
            <input type="text" name="taille" value={formData.taille} onChange={handleChange} required placeholder="1,15 m" />
          </div>
          <div>
            <label className="required">Température (°C)</label>
            <input type="text" name="temperature" value={formData.temperature} onChange={handleChange} required placeholder="37°C"/>
          </div>
        </div>
        <div className="flex-line">
          <div>
            <label className="required">TA Bras gauche (mmHg)</label>
            <input type="text" name="taGauche" value={formData.taGauche} onChange={handleChange} required placeholder=""/>
          </div>
          <div>
            <label className="required">TA Bras droit (mmHg)</label>
            <input type="text" name="taDroite" value={formData.taDroite} onChange={handleChange} required />
          </div>
          <div>
            <label className="required">Pouls (bpm)</label>
            <input type="text" name="pouls" value={formData.pouls} onChange={handleChange} required />
          </div>
        </div>


        {/* Partie 3 : Observations cliniques */}
        <h2>Observations cliniques</h2>
        <textarea
          name="observations"
          placeholder="Observations cliniques détaillées..."
          value={formData.observations}
          onChange={handleChange}
        />

        {/* Partie 4 : Entretien médical */}
        <h2>Entretien médical</h2>
        <div className="table-container">
          <table className="medical-table">
            <thead>
              <tr>
                <th>Question</th>
                <th>Oui</th>
                <th>Non</th>
              </tr>
            </thead>
            <tbody>
              {[
                "Antécédents médicaux",
                "Maladies chroniques",
                "Anémie connue",
                "Chirurgies récentes",
                "Hospitalisations récentes",
                "A déjà reçu du sang",
                "IST connue",
                "Tatouage/piercing",
                "Exposition accidentelle au sang",
                "Patient apte",
                "Consentement libre et éclairé",
              ].map((q) => (
                <tr key={q}>
                  <td>{q}</td>
                  <td className="radio-cell">
                    <input type="radio" name={q} value="Oui" onChange={handleChange} />
                  </td>
                  <td className="radio-cell">
                    <input type="radio" name={q} value="Non" onChange={handleChange} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>


        {/* Partie 5 : Type de don */}
        <h2>Type de don</h2>
        <div className="radio-group">
          <label className="radio-label">
            <input type="radio" name="typeDon" value="Sang total" onChange={handleChange} />
            <span>Sang total</span>
          </label>
          <label className="radio-label">
            <input type="radio" name="typeDon" value="Plaquettes" onChange={handleChange} />
            <span>Plaquettes</span>
          </label>
        </div>

        {/* Partie 6 : Prochain rendez-vous */}
        <h2>Prochain rendez-vous</h2>
        <div className="center">
          <label>Date du prochain rendez-vous</label>
          <input type="date" name="prochainRDV" value={formData.prochainRDV} onChange={handleChange} />
        </div>

        {/* Boutons */}
        <div className="form-actions">
          <button type="button" className="cancel" onClick={handleCancel}>
            Annuler
          </button>
          <button type="submit" className="save">
            Sauvegarder
          </button>
        </div>
      </form>
    </div>
  );
}

export default TransfusionForm;
