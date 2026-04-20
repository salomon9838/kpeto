// src/pages/Inventory.tsx
import { useState } from "react";
import { mockMedicines } from "../Data/mockData";
import { type Medicine, StockStatus } from "../Types";

const Inventory = () => {
  const [medicines] = useState<Medicine[]>(mockMedicines);

  return (
    <div>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "1rem" }}>
        📦 Inventaire
      </h1>
      <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f3f4f6" }}>
            <th style={{ padding: "0.75rem", textAlign: "left" }}>Nom</th>
            <th style={{ padding: "0.75rem", textAlign: "left" }}>Quantité</th>
            <th style={{ padding: "0.75rem", textAlign: "left" }}>Prix</th>
            <th style={{ padding: "0.75rem", textAlign: "left" }}>Statut</th>
          </tr>
        </thead>
        <tbody>
          {medicines.map((med) => (
            <tr key={med.id}>
              <td style={{ padding: "0.75rem" }}>{med.name}</td>
              <td>{med.quantity}</td>
              <td>{med.price} €</td>
              <td>
                {med.status === StockStatus.EN_STOCK && <span className="status-pret">En stock</span>}
                {med.status === StockStatus.FAIBLE && <span className="status-attente">Stock faible</span>}
                {med.status === StockStatus.RUPTURE && <span className="status-livre">Rupture</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Inventory;
