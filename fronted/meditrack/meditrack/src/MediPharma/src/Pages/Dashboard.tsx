import React, { useState } from "react";
import { 
  TrendingUp, 
  ShoppingCart, 
  AlertTriangle, 
  Package,
  MessageSquare,
  Search,
  Bell,
  User,
  ChevronLeft
} from "lucide-react";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Importation des données mockées
import { dashboardStats, salesData, mockMedicines } from "../Data/mockData";

// Importation des composants de pages
import Orders from "./Orders";
import Inventory from "./Inventory";
import Settings from "./Settings";
import Chat from "./Chat";

const Dashboard = () => {
  // 1. État pour la navigation
  const [activeTab, setActiveTab] = useState("Dashboard");

  // --- Logique de Stock (Utilisée dans la vue Dashboard) ---
  const CRITICAL_THRESHOLD = 15;
  const criticalMedicines = mockMedicines.filter(
    (med) => med.stockQuantity <= CRITICAL_THRESHOLD || med.status === "out_of_stock"
  );

  const orderTypeData = [
    { name: "Retrait", value: 65, color: "#0284C7" },
    { name: "Livraison", value: 35, color: "#38BDF8" },
  ];

  // 2. Fonction de rendu conditionnel
  const renderContent = () => {
    switch (activeTab) {
      case "Dashboard":
        return <DashboardHome criticalMedicines={criticalMedicines} orderTypeData={orderTypeData} />;
      case "Commandes":
        return <Orders />;
      case "Inventaire":
        return <Inventory />;
      case "Messages":
        return <Chat />;
      case "Paramètres":
        return <Settings />;
      default:
        return <DashboardHome criticalMedicines={criticalMedicines} orderTypeData={orderTypeData} />;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#E2F1F8", fontFamily: "inherit" }}>
      
      {/* Sidebar Latérale */}
      <aside style={{ 
        width: "260px", 
        backgroundColor: "#0F4C75", 
        color: "white", 
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "fixed",
        height: "100vh"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "30px" }}>
            <div style={{ width: "40px", height: "40px", backgroundColor: "#38BDF8", borderRadius: "8px", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: "bold" }}>MP</div>
            <div>
              <div style={{ fontWeight: "bold", fontSize: "1.2rem" }}>MediPharma</div>
              <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>Dashboard Pro</div>
            </div>
          </div>
          
          <nav style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <NavItem 
              icon={<TrendingUp size={20}/>} 
              label="Dashboard" 
              active={activeTab === "Dashboard"} 
              onClick={() => setActiveTab("Dashboard")} 
            />
            <NavItem 
              icon={<ShoppingCart size={20}/>} 
              label="Commandes" 
              active={activeTab === "Commandes"} 
              onClick={() => setActiveTab("Commandes")} 
            />
            <NavItem 
              icon={<Package size={20}/>} 
              label="Inventaire" 
              active={activeTab === "Inventaire"} 
              onClick={() => setActiveTab("Inventaire")} 
            />
            <NavItem 
              icon={<MessageSquare size={20}/>} 
              label="Messages" 
              badge="2" 
              active={activeTab === "Messages"} 
              onClick={() => setActiveTab("Messages")} 
            />
            <NavItem 
              icon={<AlertTriangle size={20}/>} 
              label="Paramètres" 
              active={activeTab === "Paramètres"} 
              onClick={() => setActiveTab("Paramètres")} 
            />
          </nav>
        </div>

        {/* Profil utilisateur en bas de sidebar */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
             <div style={{ width: "35px", height: "35px", borderRadius: "50%", backgroundColor: "#38BDF8", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: "bold", fontSize: "0.8rem" }}>PK</div>
             <div>
                <div style={{ fontSize: "0.9rem", fontWeight: "600" }}>Pharmacien Kodjo</div>
                <div style={{ fontSize: "0.7rem", color: "#10B981" }}>● En ligne</div>
             </div>
          </div>
        </div>
      </aside>

      {/* Zone de contenu principale */}
      <main style={{ flex: 1, marginLeft: "260px", display: "flex", flexDirection: "column" }}>
        
        {/* Header persistant */}
        <header style={{ 
          height: "70px", 
          backgroundColor: "white", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          padding: "0 30px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          position: "sticky",
          top: 0,
          zIndex: 10
        }}>
          <div style={{ position: "relative", width: "400px" }}>
            <Search style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} size={18} />
            <input 
              type="text" 
              placeholder="Rechercher médicament, commande, patient..." 
              style={{ width: "100%", padding: "10px 10px 10px 40px", borderRadius: "8px", border: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <div style={{ position: "relative", padding: "8px", backgroundColor: "#F1F5F9", borderRadius: "50%", cursor: "pointer" }}>
              <Bell size={20} color="#64748b" />
              <div style={{ position: "absolute", top: "5px", right: "5px", width: "8px", height: "8px", backgroundColor: "#EF4444", borderRadius: "50%", border: "2px solid white" }}></div>
            </div>
            <div style={{ padding: "8px", backgroundColor: "#0284C7", borderRadius: "50%", color: "white", cursor: "pointer" }}>
              <User size={20} />
            </div>
            <div style={{ padding: "6px 15px", backgroundColor: "#DCFCE7", color: "#166534", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{ width: "8px", height: "8px", backgroundColor: "#22C55E", borderRadius: "50%" }}></div>
              En ligne
            </div>
          </div>
        </header>

        {/* Contenu dynamique */}
        <div style={{ flex: 1 }}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

// --- Composant interne : Vue Accueil du Dashboard ---
const DashboardHome = ({ criticalMedicines, orderTypeData }: any) => (
  <div style={{ padding: "30px" }}>
    <h2 style={{ marginBottom: "25px", color: "#0F4C75", fontWeight: "bold" }}>Tableau de bord Pharmacie</h2>

    {/* Grille de statistiques */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "30px" }}>
      <StatCard label="Commandes Jour" value={dashboardStats.todayOrders} icon={<ShoppingCart color="#0284C7"/>} trend="+12%" />
      <StatCard label="Revenus (FCFA)" value={dashboardStats.todayRevenue.toLocaleString()} icon={<TrendingUp color="#10B981"/>} trend="+18%" />
      <StatCard label="Alertes Stock" value={criticalMedicines.length} icon={<AlertTriangle color="#EF4444"/>} trend="Urgent" isWarning />
      <StatCard label="Messages" value={dashboardStats.activeChats} icon={<MessageSquare color="#8B5CF6"/>} trend="+1" />
    </div>

    {/* Graphiques */}
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "25px", marginBottom: "30px" }}>
      <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "15px", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
        <h3 style={{ fontSize: "1.1rem", marginBottom: "20px", color: "#334155" }}>Évolution des Ventes</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={salesData}>
            <defs>
              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284C7" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#0284C7" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
            <Tooltip />
            <Area type="monotone" dataKey="revenue" stroke="#0284C7" strokeWidth={3} fill="url(#colorRev)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "15px", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
        <h3 style={{ fontSize: "1.1rem", marginBottom: "20px", color: "#334155" }}>Types de Commandes</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={orderTypeData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
              {orderTypeData.map((entry: any, index: number) => <Cell key={index} fill={entry.color} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ marginTop: "15px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {orderTypeData.map((item: any) => (
            <div key={item.name} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
              <span style={{ color: "#64748b" }}>● {item.name}</span>
              <span style={{ fontWeight: "bold" }}>{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Alertes Stock */}
    <div style={{ backgroundColor: "white", padding: "25px", borderRadius: "15px", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <h3 style={{ fontSize: "1.1rem", color: "#334155", display: "flex", alignItems: "center", gap: "10px" }}>
          <AlertTriangle size={20} color="#EF4444" /> Alertes Stocks Critiques
        </h3>
        <button style={{ color: "#0284C7", border: "none", background: "none", fontWeight: "600", cursor: "pointer" }}>Voir tout</button>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "15px" }}>
        {criticalMedicines.slice(0, 3).map((med: any) => (
          <div key={med.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", borderRadius: "12px", backgroundColor: "#FFF5F5", border: "1px solid #FEE2E2" }}>
            <div>
              <div style={{ fontWeight: "bold", color: "#991B1B" }}>{med.name}</div>
              <div style={{ fontSize: "0.85rem", color: "#B91C1C" }}>Stock actuel: {med.stockQuantity} unités</div>
            </div>
            <button style={{ backgroundColor: "#0F4C75", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "0.8rem", cursor: "pointer" }}>Commander</button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// --- Sous-composants utilitaires ---

const NavItem = ({ icon, label, active = false, badge = null, onClick }: any) => (
  <div 
    onClick={onClick}
    style={{ 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "space-between",
      padding: "12px 15px", 
      borderRadius: "10px", 
      backgroundColor: active ? "#38BDF8" : "transparent",
      color: active ? "white" : "#cbd5e1",
      cursor: "pointer",
      transition: "0.3s",
      userSelect: "none"
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      {icon}
      <span style={{ fontWeight: "500" }}>{label}</span>
    </div>
    {badge && <span style={{ backgroundColor: "#EF4444", color: "white", padding: "2px 8px", borderRadius: "10px", fontSize: "0.7rem" }}>{badge}</span>}
  </div>
);

const StatCard = ({ label, value, icon, trend, isWarning = false }: any) => (
  <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "15px", display: "flex", justifyContent: "space-between", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
    <div>
      <div style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "10px" }}>{label}</div>
      <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1e293b" }}>{value}</div>
      <div style={{ color: isWarning ? "#EF4444" : "#10B981", fontSize: "0.8rem", marginTop: "5px", fontWeight: "bold" }}>{trend}</div>
    </div>
    <div style={{ width: "45px", height: "45px", backgroundColor: "#F1F5F9", borderRadius: "12px", display: "flex", justifyContent: "center", alignItems: "center" }}>
      {icon}
    </div>
  </div>
);

export default Dashboard;