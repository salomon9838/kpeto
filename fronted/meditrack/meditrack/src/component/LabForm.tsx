import { useState } from "react";

export default function LabForm() {
    const [service, setService] = useState("urologie");
    const [centre, setCentre] = useState("");
    const [doc, setDoc] = useState("");
    const [tel, setTel] = useState("");
    const [labText, setLabText] = useState("");
    const [motif, setMotif] = useState("");

    const addTag = (category: string, val: string) => {
        let text = labText;

        if (text.includes(category + " :")) {
            const regex = new RegExp("(" + category + " : .*)");
            text = text.replace(regex, "$1, " + val);
        } else {
            const prefix = text.length > 0 ? "\n" : "";
            text = text + prefix + category + " : " + val;
        }

        setLabText(text);
    };

    const submitForm = (e: React.FormEvent) => {
        e.preventDefault();
        alert("Envoyé au patient");

        setCentre("");
        setDoc("");
        setTel("");
        setLabText("");
        setMotif("");
    };

    return (
        <form onSubmit={submitForm}>
            <h2>Analyses Laboratoire</h2>
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
                        <select value={service} onChange={(e) => setService(e.target.value)}>
                            <option>urologie</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>
                            Centre<span className="star">*</span>
                        </label>
                        <input
                            required
                            value={centre}
                            placeholder="Laboratoire National"
                            onChange={(e) => setCentre(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            Nom du soignant<span className="star">*</span>
                        </label>
                        <input
                            required
                            value={doc}
                            placeholder="Infirmier(e) de garde"
                            onChange={(e) => setDoc(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            Téléphone<span className="star">*</span>
                        </label>
                        <input
                            required
                            value={tel}
                            placeholder="+228 91 00 00 00"
                            onChange={(e) => setTel(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* BLOC DES ANALYSES (AVEC SCROLL) */}
            <div
                style={{
                    marginTop: 25,
                    maxHeight: 450,
                    overflowY: "auto",
                    border: "1px solid #eee",
                    padding: 15,
                    borderRadius: 8,
                    background: "#fafafa",
                }}
            >
                <label
                    style={{
                        display: "block",
                        marginBottom: 10,
                        fontWeight: "bold",
                        color: "var(--primary-teal)",
                    }}
                >
                    TYPE D'ANALYSE RAPIDE (Cliquer pour ajouter) :
                </label>

                {/* PARASITOLOGIE & BACTÉRIOLOGIE */}
                <p
                    style={{
                        fontSize: 13,
                        color: "red",
                        fontWeight: "normal",
                        marginTop: 20,
                        textDecoration: "underline",
                    }}
                >
                    PARASITOLOGIE & BACTÉRIOLOGIE
                </p>

                <div className="tag-row">
                    <button type="button" className="tag-lab" onClick={() => addTag("PARASITOLOGIE", "GE")}>GE</button>
                    <button type="button" className="tag-lab" onClick={() => addTag("PARASITOLOGIE", "SELLES KOP")}>SELLES KOP</button>
                    <button type="button" className="tag-lab" onClick={() => addTag("PARASITOLOGIE", "SCOTCH TEST")}>SCOTCH TEST</button>

                    <button type="button" className="tag-lab" onClick={() => addTag("BACTÉRIOLOGIE", "BCE")}>BCE</button>
                    <button type="button" className="tag-lab" onClick={() => addTag("BACTÉRIOLOGIE", "Culot urinaire")}>Culot urinaire</button>
                    <button type="button" className="tag-lab" onClick={() => addTag("BACTÉRIOLOGIE", "Crachat BAAR")}>Crachat BAAR</button>
                    <button type="button" className="tag-lab" onClick={() => addTag("BACTÉRIOLOGIE", "PV")}>PV</button>
                    <button type="button" className="tag-lab" onClick={() => addTag("BACTÉRIOLOGIE", "ECBU")}>ECBU</button>
                    <button type="button" className="tag-lab" onClick={() => addTag("BACTÉRIOLOGIE", "Coproculture")}>Coproculture</button>
                    <button type="button" className="tag-lab" onClick={() => addTag("BACTÉRIOLOGIE", "Spermogramme/Spermoculture")}>
                        Spermogramme/Spermoculture
                    </button>
                </div>

                {/* SÉROLOGIE */}
                <p
                    style={{
                        fontSize: 13,
                        color: "red",
                        fontWeight: "normal",
                        marginTop: 20,
                        textDecoration: "underline",
                    }}
                >
                    SÉROLOGIE
                </p>

                <div className="tag-row">
                    <button type="button" className="tag-lab" onClick={() => addTag("SÉROLOGIE", "SRV")}>SRV</button>
                    <button type="button" className="tag-lab" onClick={() => addTag("SÉROLOGIE", "Ag HBs")}>Ag HBs</button>
                    <button type="button" className="tag-lab" onClick={() => addTag("SÉROLOGIE", "TPHA-VDRL")}>TPHA-VDRL</button>
                    <button type="button" className="tag-lab" onClick={() => addTag("SÉROLOGIE", "CRP")}>CRP</button>
                    <button type="button" className="tag-lab" onClick={() => addTag("SÉROLOGIE", "Toxoplasmose")}>Toxoplasmose</button>
                    <button type="button" className="tag-lab" onClick={() => addTag("SÉROLOGIE", "Hépatite C (HCV)")}>Hépatite C (HCV)</button>
                    <button type="button" className="tag-lab" onClick={() => addTag("SÉROLOGIE", "Rubéole")}>Rubéole</button>
                </div>

                {/* HÉMATOLOGIE */}
                <p
                    style={{
                        fontSize: 13,
                        color: "red",
                        fontWeight: "normal",
                        marginTop: 20,
                        textDecoration: "underline",
                    }}
                >
                    HÉMATOLOGIE
                </p>

                <div className="tag-row">
                    <button type="button" className="tag-lab" onClick={() => addTag("HÉMATOLOGIE", "NFS")}>NFS</button>
                    <button type="button" className="tag-lab" onClick={() => addTag("HÉMATOLOGIE", "VS")}>VS</button>
                    <button type="button" className="tag-lab" onClick={() => addTag("HÉMATOLOGIE", "NB-TH")}>NB-TH</button>
                    <button type="button" className="tag-lab" onClick={() => addTag("HÉMATOLOGIE", "Groupage")}>Groupage</button>
                    <button type="button" className="tag-lab" onClick={() => addTag("HÉMATOLOGIE", "Electrophorèse")}>Electrophorèse</button>
                </div>

                {/* BIOCHIMIE */}
                <p
                    style={{
                        fontSize: 13,
                        color: "red",
                        fontWeight: "normal",
                        marginTop: 20,
                        textDecoration: "underline",
                    }}
                >
                    BIOCHIMIE
                </p>

                <div className="tag-row">
                    {[
                        "Urée",
                        "Glycémie",
                        "Créatininémie",
                        "ASAT",
                        "ALAT",
                        "GGT",
                        "PAL",
                        "Uricémie",
                        "Bilirubine T",
                        "Bilirubine D",
                        "Phosphore",
                        "HbA1C",
                        "Cholesterol total",
                        "HDL-Cholesterol",
                        "LDL-Cholesterol",
                        "Triglycérides",
                        "Calcémie",
                        "Magnésiemie",
                        "TSHU",
                        "T3",
                        "T4",
                        "Ionogramme S.",
                    ].map((v, i) => (
                        <button
                            key={i}
                            type="button"
                            className="tag-lab"
                            onClick={() => addTag("BIOCHIMIE", v)}
                        >
                            {v}
                        </button>
                    ))}
                </div>
            </div>

            {/* ANALYSES DEMANDÉES */}
            <div style={{ marginTop: 20 }}>
                <label>
                    Analyses demandées<span className="star">*</span>
                </label>

                <textarea
                    required
                    rows={5}
                    style={{ width: "100%", marginTop: 8 }}
                    value={labText}
                    onChange={(e) => setLabText(e.target.value)}
                    placeholder="Les analyses s'afficheront ici..."
                ></textarea>
            </div>

            {/* MOTIF */}
            <div style={{ marginTop: 20 }}>
                <label>Motif</label>

                <textarea
                    rows={3}
                    style={{ width: "100%", marginTop: 8 }}
                    value={motif}
                    onChange={(e) => setMotif(e.target.value)}
                    placeholder="Saisir ici le motif..."
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
