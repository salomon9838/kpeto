import { useState } from "react";
import "./FormStyle.css"; // réutilise le même fichier CSS

function RadioForm() {
  const [formData, setFormData] = useState({
    service: "",
    typeExamen: "",
    examenDemande: "",
    regionExaminee: "",
    nomRadio: "",
    serviceRadio: "",
    centreRadio: "",
    telRadio: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Prescription Radio :", formData);
    alert("Prescription Radio enregistrée !");
  };

  const handleCancel = () => {
    if (window.confirm("Êtes-vous sûr de vouloir annuler ? Les modifications non sauvegardées seront perdues.")) {
      setFormData({
        service: "",
        typeExamen: "",
        examenDemande: "",
        regionExaminee: "",
        nomRadio: "",
        serviceRadio: "",
        centreRadio: "",
        telRadio: "",
      });
    }
  };

  return (
    <div className="form-container form-container-wide">
      <h1>Formulaire de Radio</h1>

      <form onSubmit={handleSubmit}>
        {/* Partie 1 : Service */}
        <h2>Service</h2>
        <div className="form-field-wide">
          <label className="required">Service</label>
                    <select>
                        <option>Radiologie</option>
                    </select>
          </div>

        {/* Partie 2 : Examen demandé */}
        <h2>Examen demandé</h2>
        <div className="form-field-wide">
          <label className="required" >Examen demandé</label>
          <input type="text" name="examenDemande" value={formData.examenDemande} onChange={handleChange} required placeholder="Examen demandé" />
        </div>

        {/* Partie 3 : Région examinée */}
        <h2>Région examinée</h2>
        <div className="form-field-wide">
          <label className="required">Région examinée</label>
          <input type="text" name="regionExaminee" value={formData.regionExaminee} onChange={handleChange} required placeholder="Région examinée" />
        </div>

        {/* Partie 4 : Infos du soignant Radio */}
        <h2>Information du soignant Radio</h2>
        <div className="form-grid-4">
          <div>
            <label className="required">Nom</label>
            <input type="text" name="nomRadio" value={formData.nomRadio} onChange={handleChange} required placeholder="Nom du soignant" />
          </div>
          <div>
            <label className="required">Service (Radio)</label>
            <input type="text" name="serviceRadio" value={formData.serviceRadio} onChange={handleChange} required placeholder="Service"/>
          </div>
          <div>
            <label className="required">Centre</label>
            <input type="text" name="centreRadio" value={formData.centreRadio} onChange={handleChange} required placeholder="Centre de radio"/>
          </div>
          <div>
            <label className="required">Téléphone</label>
            <input type="text" name="telRadio" value={formData.telRadio} onChange={handleChange} required placeholder="+228........"/>
          </div>
        </div>

        {/* Boutons */}
        <div className="form-actions">
          <button type="button" className="cancel" onClick={handleCancel}>
            Annuler
          </button>
          <button type="submit" className="save">
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}

export default RadioForm;
