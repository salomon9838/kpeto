import { useState } from "react";
import "./FormStyle.css"; // réutilise le même fichier CSS

function KinesitherapieForm() {
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
    traitement: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Formulaire kinésithérapie :", formData);
    alert("Formulaire de kinésithérapie enregistré !");
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
        traitement: "",
      });
    }
  };

  return (
    <div className="form-container">
      <h1>Formulaire de Kinésithérapie</h1>

      <form onSubmit={handleSubmit}>
        {/* Partie 1 : Infos du soignant */}
        <h2>Information du soignant</h2>
        <div className="form-grid-4">
          <div>
            <label className="required">Service</label>
            <input type="text" name="service" value={formData.service} onChange={handleChange} required />
          </div>
          <div>
            <label className="required">Centre médical</label>
            <input type="text" name="centre" value={formData.centre} onChange={handleChange} required />
          </div>
          <div>
            <label className="required">Nom du soignant</label>
            <input type="text" name="nomSoignant" value={formData.nomSoignant} onChange={handleChange} required />
          </div>
          <div>
            <label className="required">Téléphone du soignant</label>
            <input type="text" name="telSoignant" value={formData.telSoignant} onChange={handleChange} required />
          </div>
        </div>

        {/* Partie 2 : Paramètres vitaux */}
        <h2>Paramètres vitaux</h2>
        <div className="flex-line">
          <div>
            <label>Poids (Kg)</label>
            <input type="text" name="poids" value={formData.poids} onChange={handleChange} />
          </div>
          <div>
            <label>Taille (cm)</label>
            <input type="text" name="taille" value={formData.taille} onChange={handleChange} />
          </div>
          <div>
            <label>Température (°C)</label>
            <input type="text" name="temperature" value={formData.temperature} onChange={handleChange} />
          </div>
        </div>
        <div className="flex-line">
          <div>
            <label>TA Bras gauche (mmHg)</label>
            <input type="text" name="taGauche" value={formData.taGauche} onChange={handleChange} />
          </div>
          <div>
            <label>TA Bras droit (mmHg)</label>
            <input type="text" name="taDroite" value={formData.taDroite} onChange={handleChange} />
          </div>
          <div>
            <label>Pouls (bpm)</label>
            <input type="text" name="pouls" value={formData.pouls} onChange={handleChange} />
          </div>
        </div>

        {/* Partie 3 : Plan de traitement */}
        <h2>Plan de traitement kinésithérapique</h2>
        <textarea
          name="traitement"
          placeholder="Décrire le plan de traitement kinésithérapique..."
          value={formData.traitement}
          onChange={handleChange}
        />

        {/* Partie 4 : Observations cliniques */}
        <h2>Observations cliniques</h2>
        <textarea
          name="observations"
          placeholder="Observations cliniques détaillées..."
          value={formData.observations}
          onChange={handleChange}
        />

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

export default KinesitherapieForm;
