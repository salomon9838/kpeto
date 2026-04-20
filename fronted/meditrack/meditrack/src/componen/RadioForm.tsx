import { useState } from "react";

export default function RadioForm() {
    const [centre, setCentre] = useState("");
    const [nom, setNom] = useState("");
    const [tel, setTel] = useState("");
    const [typeAnalyse, setTypeAnalyse] = useState("");
    const [region, setRegion] = useState("");
    const [motif, setMotif] = useState("");

    const submitForm = (e: React.FormEvent) => {
        e.preventDefault();
        alert("Envoyé au patient");

        setCentre("");
        setNom("");
        setTel("");
        setTypeAnalyse("");
        setRegion("");
        setMotif("");
    };

    return (
        <form onSubmit={submitForm}>
            <h2>Analyse Radio</h2>

            <div className="box">
                <label
                    style={{
                        display: "block",
                        marginBottom: 10,
                        fontWeight: "bold",
                        fontSize: 15,
                        color: "var(--primary-teal)",
                    }}
                >
                    Information du soignant
                </label>

                <div className="form-grid">

                    <div className="form-group">
                        <label>Service</label>
                        <select>
                            <option>urgence chirurgicale</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Centre<span className="star">*</span></label>
                        <input
                            required
                            placeholder="ex: Centre de Radiologie"
                            value={centre}
                            onChange={(e) => setCentre(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Nom et Prénom(s)<span className="star">*</span></label>
                        <input
                            required
                            placeholder="Nom du soignant"
                            value={nom}
                            onChange={(e) => setNom(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Téléphone<span className="star">*</span></label>
                        <input
                            required
                            placeholder="+228..."
                            value={tel}
                            onChange={(e) => setTel(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div style={{ marginTop: 20 }}>
                <label>Type d'analyse<span className="star">*</span></label>
                <textarea
                    required
                    rows={3}
                    style={{ width: "100%", marginTop: 8 }}
                    placeholder="ex: Radiographie, Échographie, Scanner..."
                    value={typeAnalyse}
                    onChange={(e) => setTypeAnalyse(e.target.value)}
                ></textarea>
            </div>

            <div style={{ marginTop: 20 }}>
                <label>Région à examiner<span className="star">*</span></label>
                <input
                    required
                    style={{ width: "100%", marginTop: 8 }}
                    placeholder="ex: Rachis lombaire, Épaule droite..."
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                />
            </div>

            <div style={{ marginTop: 20 }}>
                <label>Motif<span className="star">*</span></label>
                <textarea
                    required
                    rows={3}
                    style={{ width: "100%", marginTop: 8 }}
                    placeholder="Saisir ici le motif de l'examen..."
                    value={motif}
                    onChange={(e) => setMotif(e.target.value)}
                ></textarea>
            </div>

            <div className="btn-group">
                <button type="submit" className="btn">
                    👥 Envoyer au patient
                </button>
            </div>
        </form>
    );
}
