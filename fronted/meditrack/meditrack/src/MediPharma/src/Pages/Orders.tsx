// src/pages/Orders.tsx
import { useState } from "react";
import { mockOrders as initialOrders } from "../Data/mockData";
import type { Order } from "../Types";
import { FileText, ClipboardList, CheckCircle, Truck, Package } from "lucide-react";

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [filter, setFilter] = useState<Order["status"] | "all">("all");

  // Filtrer les commandes selon le statut
  const filteredOrders = filter === "all" 
    ? orders 
    : orders.filter(order => order.status === filter);

  // Fonction pour mettre à jour le statut d'une commande
  const updateOrderStatus = (orderId: string, newStatus: Order["status"]) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  };

  // Configuration des badges de statut
  const getStatusBadge = (status: Order["status"]) => {
    const config = {
      pending: { label: "En attente", class: "badge-warning", color: "#f59e0b" },
      preparing: { label: "Préparation", class: "badge-info", color: "#3b82f6" },
      ready: { label: "Prêt", class: "badge-success", color: "#10b981" },
      delivered: { label: "Livré", class: "badge-neutral", color: "#6b7280" },
      cancelled: { label: "Annulé", class: "badge-error", color: "#ef4444" },
    };
    const item = config[status];
    return (
      <span className={`badge ${item.class}`} style={{ 
        padding: "4px 12px", 
        borderRadius: "20px", 
        fontSize: "0.75rem", 
        fontWeight: "bold",
        backgroundColor: `${item.color}20`,
        color: item.color,
        border: `1px solid ${item.color}`
      }}>
        {item.label}
      </span>
    );
  };

  return (
    <div style={{ padding: "20px", animation: "fadeInUp 0.5s ease-out", fontFamily: "Inter, sans-serif" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>
          📋 Gestion des commandes
        </h1>
        <p style={{ color: "#64748b" }}>Suivez et gérez les commandes officinales en temps réel.</p>
      </div>

      {/* Barre de Filtres */}
      <div style={{ 
        display: "flex", 
        gap: "0.75rem", 
        marginBottom: "2rem", 
        flexWrap: "wrap",
        backgroundColor: "#fff",
        padding: "10px",
        borderRadius: "12px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
      }}>
        {(["all", "pending", "preparing", "ready", "delivered", "cancelled"] as const).map(status => (
          <button 
            key={status}
            onClick={() => setFilter(status)}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              transition: "0.3s",
              backgroundColor: filter === status ? "#00a896" : "#f1f5f9",
              color: filter === status ? "#fff" : "#64748b",
            }}
          >
            {status === "all" ? "Toutes les commandes" : status.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Tableau des commandes */}
      <div style={{ 
        backgroundColor: "#fff", 
        borderRadius: "12px", 
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)", 
        overflow: "hidden" 
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #edf2f7" }}>
            <tr>
              <th style={{ padding: "16px" }}>N° Commande</th>
              <th style={{ padding: "16px" }}>Client</th>
              <th style={{ padding: "16px" }}>Détails</th>
              <th style={{ padding: "16px" }}>Montant</th>
              <th style={{ padding: "16px" }}>Statut</th>
              <th style={{ padding: "16px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map(order => (
                <tr key={order.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "0.2s" }}>
                  <td style={{ padding: "16px" }}>
                    <div style={{ fontWeight: 700, color: "#334155" }}>{order.orderNumber}</div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                      {new Date(order.createdAt).toLocaleString("fr-FR")}
                    </div>
                  </td>
                  <td style={{ padding: "16px" }}>
                    <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                    <div style={{ fontSize: "0.85rem", color: "#64748b" }}>{order.customerPhone}</div>
                  </td>
                  <td style={{ padding: "16px", color: "#64748b" }}>
                    <Package size={14} style={{ marginRight: "5px" }} />
                    {order.items.length} article(s)
                  </td>
                  <td style={{ padding: "16px", fontWeight: 700, color: "#00a896" }}>
                    {order.totalAmount.toLocaleString()} FCFA
                  </td>
                  <td style={{ padding: "16px" }}>{getStatusBadge(order.status)}</td>
                  <td style={{ padding: "16px" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                        <FileText size={14}/> Voir
                      </button>

                      {/* Actions dynamiques selon le statut */}
                      {order.status === "pending" && (
                        <button 
                          onClick={() => updateOrderStatus(order.id, "preparing")}
                          style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "#3b82f6", color: "#fff", cursor: "pointer", fontWeight: "bold" }}
                        >
                          Préparer
                        </button>
                      )}
                      {order.status === "preparing" && (
                        <button 
                          onClick={() => updateOrderStatus(order.id, "ready")}
                          style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "#10b981", color: "#fff", cursor: "pointer", fontWeight: "bold" }}
                        >
                          Marquer prêt
                        </button>
                      )}
                      {order.status === "ready" && (
                        <button 
                          onClick={() => updateOrderStatus(order.id, "delivered")}
                          style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "#00a896", color: "#fff", cursor: "pointer", fontWeight: "bold" }}
                        >
                          Livrer
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                  Aucune commande trouvée pour ce filtre.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;