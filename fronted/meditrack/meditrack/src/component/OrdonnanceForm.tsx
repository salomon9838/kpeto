import { useState } from "react";

export default function OrdonnanceForm() {
    const [rows, setRows] = useState([
        { med: "", poso: "", qty: "", duree: "" }
    ]);

    const addRow = () => {
        setRows([...rows, { med: "", poso: "", qty: "", duree: "" }]);
    };

    const update = (index: number, field: string, value: string) => {
        const updated = [...rows];
        updated[index][field] = value;
        setRows(updated);
    };

    const removeRow = (i: number) => {
        setRows(rows.filter((_, index) => index !== i));
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        alert("Envoyé au patient");
        setRows([{ med: "", poso: "", qty: "", duree: "" }]);
    };

    return (
        <form onSubmit={submit}>
            <h2>Ordonnance Médicale</h2>
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
                            <option>urologie</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Centre<span className="star">*</span></label>
                        <input required placeholder="Hôpital Central" />
                    </div>

                    <div className="form-group">
                        <label>Nom du Médecin<span className="star">*</span></label>
                        <input required placeholder="Dr. Kouassi" />
                    </div>

                    <div className="form-group">
                        <label>Contact<span className="star">*</span></label>
                        <input required placeholder="+228 90 00 00 00" />
                    </div>
                </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
                <h3>Liste des Médicaments</h3>
                <button type="button" className="btn" onClick={addRow}>
                    ➕ Ajouter
                </button>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Médicament</th>
                        <th>Posologie</th>
                        <th>Quantité</th>
                        <th>Durée</th>
                        <th>Action</th>
                    </tr>
                </thead>

                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i}>
                            <td>
                                <input
                                    style={{ width: "100%" }}
                                    value={row.med}
                                    onChange={(e) => update(i, "med", e.target.value)}
                                    placeholder="paracétamol 500mg"
                                />
                            </td>

                            <td>
                                <input
                                    style={{ width: "100%" }}
                                    value={row.poso}
                                    onChange={(e) => update(i, "poso", e.target.value)}
                                    placeholder="1 comp matin/soir"
                                />
                            </td>

                            <td>
                                <input
                                    style={{ width: "100%" }}
                                    value={row.qty}
                                    onChange={(e) => update(i, "qty", e.target.value)}
                                    placeholder="2 boîtes"
                                />
                            </td>

                            <td>
                                <input
                                    style={{ width: "100%" }}
                                    value={row.duree}
                                    onChange={(e) => update(i, "duree", e.target.value)}
                                    placeholder="5 jours"
                                />
                            </td>

                            <td>
                                <button
                                    type="button"
                                    className="btn-delete"
                                    onClick={() => removeRow(i)}
                                >
                                    ✖
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="btn-group">
                <button type="submit" className="btn">
                    👥 Envoyer au patient
                </button>
            </div>
        </form>
    );
}
