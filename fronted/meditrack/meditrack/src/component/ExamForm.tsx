import { useState } from "react";

export default function ExamForm() {
    const [form, setForm] = useState({
        service: "urologie",
        centre: "",
        doc: "",
        tel: "",
        poids: "",
        taille: "",
        temperature: "",
        tabg: "",
        tabd: "",
        pouls: "",
        obs: "",
    });

    const update = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        setForm({ ...form, [e.target.id]: e.target.value });
    };

    const saveExam = () => {
        if (!form.doc || !form.centre) {
            alert("Veuillez remplir les champs obligatoires (Centre et Nom du soignant).");
            return;
        }
        alert("Examen clinique sauvegardé avec succès !");

        setForm({
            service: "urologie",
            centre: "",
            doc: "",
            tel: "",
            poids: "",
            taille: "",
            temperature: "",
            tabg: "",
            tabd: "",
            pouls: "",
            obs: "",
        });
    };

    const cancelExam = () => {
        if (confirm("Voulez-vous vraiment annuler ? Tous les champs seront effacés.")) {
            setForm({
                service: "urologie",
                centre: "",
                doc: "",
                tel: "",
                poids: "",
                taille: "",
                temperature: "",
                tabg: "",
                tabd: "",
                pouls: "",
                obs: "",
            });
        }
    };

    return (
        <>
            <h2>💧Examen Clinique</h2>

            <div className="form-group" style={{ marginTop: 25 }}>
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
                            <select id="service" value={form.service} onChange={update}>
                                <option>urologie</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>
                                Centre <span className="star">*</span>
                            </label>
                            <input
                                id="centre"
                                value={form.centre}
                                onChange={update}
                                placeholder="Centre médical"
                            />
                        </div>

                        <div className="form-group">
                            <label>
                                Nom du soignant <span className="star">*</span>
                            </label>
                            <input
                                id="doc"
                                value={form.doc}
                                onChange={update}
                                placeholder="Dr Nom Prénom"
                            />
                        </div>

                        <div className="form-group">
                            <label>
                                Téléphone soignant <span className="star">*</span>
                            </label>
                            <input
                                id="tel"
                                value={form.tel}
                                onChange={update}
                                placeholder="+228 ..."
                            />
                        </div>
                    </div>
                </div>
            </div>

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
                        Paramètre
                    </label>

                <div className="form-grid">
                    <div className="form-group">
                        <label>Poids (kg)</label>
                        <input id="poids" value={form.poids} onChange={update} placeholder="70" />
                    </div>

                    <div className="form-group">
                        <label>Taille (m)</label>
                        <input id="taille" value={form.taille} onChange={update} placeholder="1.75" />
                    </div>

                    <div className="form-group">
                        <label>Température (°C)</label>
                        <input id="temperature" value={form.temperature} onChange={update} placeholder="37.5" />
                    </div>

                    <div className="form-group">
                        <label>TA - Bras Gauche(mmHg)</label>
                        <input id="tabg" value={form.tabg} onChange={update} placeholder="12/8" />
                    </div>

                    <div className="form-group">
                        <label>TA - Bras Droit(mmHg)</label>
                        <input id="tabd" value={form.tabd} onChange={update} placeholder="12/7" />
                    </div>

                    <div className="form-group">
                        <label>Pouls (bpm)</label>
                        <input id="pouls" value={form.pouls} onChange={update} placeholder="80" />
                    </div>
                </div>
            </div>

            <textarea
                id="obs"
                rows={5}
                value={form.obs}
                onChange={update}
                placeholder="Observations cliniques détaillées..."
                style={{ width: "100%", marginTop: 15 }}
            ></textarea>

            <div className="btn-group">
                <button className="btn" onClick={cancelExam}>
                    ✖ Annuler
                </button>
                <button className="btn" onClick={saveExam}>
                    💾 Sauvegarder
                </button>
            </div>
        </>
    );
}
