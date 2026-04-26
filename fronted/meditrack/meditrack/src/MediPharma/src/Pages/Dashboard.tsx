import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  TrendingUp, 
  ShoppingCart, 
  AlertTriangle, 
  Package,
  MessageSquare,
  Search,
  Bell,
  User,
  RefreshCw,
  CheckCircle,
  X
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

// =============================================================================
// TYPES & INTERFACES
// =============================================================================
type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationState {
  show: boolean;
  type: NotificationType;
  title: string;
  message: string;
  details?: string[];
}

interface Medicine {
  id: number;
  name: string;
  code: string;
  stockQuantity: number;
  minStock: number;
  price: number;
  category: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  lastUpdated: string;
}

interface Order {
  id: number;
  orderNumber: string;
  patientName: string;
  consultationId?: number;
  patientId?: number;
  items: Array<{ medicine: string; quantity: number; price: number }>;
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  orderType: 'retrait' | 'livraison';
  createdAt: string;
}

interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  lowStockCount: number;
  activeChats: number;
  pendingOrders: number;
  totalPatients: number;
}

interface SalesDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

interface OrderTypeData {
  name: string;
  value: number;
  color: string;
}

interface WorkflowIds {
  consultationId: number | null;
  patientId: number | null;
}

// =============================================================================
// API UTILS
// =============================================================================
const API_BASE = 'http://localhost:8000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Authorization': `Token ${token}`,
    'Content-Type': 'application/json',
  };
};

const apiFetch = async <T,>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  try {
    const response = await fetch(`${API_BASE}/${endpoint}`, {
      ...options,
      headers: { ...getAuthHeaders(), ...options.headers },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.detail || errorData.error || 'Erreur API');
      } catch {
        throw new Error(`Erreur ${response.status}: ${errorText.substring(0, 200)}`);
      }
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json() as T;
    }
    return {} as T;
  } catch (error) {
    console.error(`❌ apiFetch error on ${endpoint}:`, error);
    throw error;
  }
};

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 🔍 Workflow IDs propagation
  const getWorkflowIds = (): WorkflowIds => {
    const cIdState = location.state?.consultationId;
    const pIdState = location.state?.patientId;
    const cIdStore = localStorage.getItem('current_consultation_id');
    const pIdStore = localStorage.getItem('current_patient_id');
    
    return {
      consultationId: cIdState || (cIdStore ? Number(cIdStore) : null),
      patientId: pIdState || (pIdStore ? Number(pIdStore) : null),
    };
  };

  const [workflowIds] = useState<WorkflowIds>(getWorkflowIds());
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Données état
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0,
    todayRevenue: 0,
    lowStockCount: 0,
    activeChats: 0,
    pendingOrders: 0,
    totalPatients: 0,
  });
  
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [orderTypeData, setOrderTypeData] = useState<OrderTypeData[]>([
    { name: "Retrait", value: 65, color: "#c0392b" },
    { name: "Livraison", value: 35, color: "#e74c3c" },
  ]);
  
  // Notifications
  const [notification, setNotification] = useState<NotificationState>({
    show: false, type: 'info', title: '', message: '', details: []
  });

  // 🎯 Fonction notification
  const showNotification = useCallback((type: NotificationType, title: string, message: string, details?: string[]) => {
    setNotification({ show: true, type, title, message, details });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 6000);
  }, []);

  // 🎨 Styles notification
  const getNotificationStyles = (): React.CSSProperties => {
    const colors: Record<NotificationType, { bg: string; border: string; text: string }> = {
      success: { bg: '#f0fdf4', border: '#22c55e', text: '#166534' },
      error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
      info: { bg: '#eff6ff', border: '#c0392b', text: '#1e40af' },
      warning: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    };
    const c = colors[notification.type];
    return {
      position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
      padding: '16px 20px', borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
      borderLeft: `5px solid ${c.border}`,
      backgroundColor: c.bg, color: c.text,
      maxWidth: '450px', minWidth: '350px',
      display: 'flex', alignItems: 'flex-start', gap: '12px',
      animation: 'slideIn 0.3s ease-out',
    };
  };

  // 📥 Charger les statistiques du dashboard
  const fetchDashboardStats = useCallback(async () => {
    try {
      const data = await apiFetch<DashboardStats>('pharmacie/stats/');
      setStats(data);
    } catch (err: any) {
      console.error('❌ Erreur chargement stats:', err);
      // Fallback avec données mock si API échoue
      setStats({
        todayOrders: 24,
        todayRevenue: 125000,
        lowStockCount: 3,
        activeChats: 2,
        pendingOrders: 5,
        totalPatients: 156,
      });
    }
  }, []);

  // 📥 Charger les médicaments avec alertes stock
  const fetchMedicines = useCallback(async () => {
    try {
      const data = await apiFetch<Medicine[]>('pharmacie/medicines/?alerte_stock=true');
      setMedicines(data);
    } catch (err: any) {
      console.error('❌ Erreur chargement médicaments:', err);
      // Fallback mock
      setMedicines([
        { id: 1, name: "Paracétamol 1000mg", code: "PAR-1000", stockQuantity: 8, minStock: 20, price: 1500, category: "Antalgiques", status: "low_stock", lastUpdated: "2025-01-20" },
        { id: 2, name: "Amoxicilline 500mg", code: "AMX-500", stockQuantity: 0, minStock: 15, price: 2500, category: "Antibiotiques", status: "out_of_stock", lastUpdated: "2025-01-19" },
        { id: 3, name: "Ibuprofène 400mg", code: "IBU-400", stockQuantity: 12, minStock: 25, price: 1800, category: "Anti-inflammatoires", status: "low_stock", lastUpdated: "2025-01-20" },
      ]);
    }
  }, []);

  // 📥 Charger les commandes récentes
  const fetchOrders = useCallback(async () => {
    try {
      const data = await apiFetch<Order[]>('pharmacie/orders/?limit=10');
      setOrders(data);
    } catch (err: any) {
      console.error('❌ Erreur chargement commandes:', err);
      setOrders([]);
    }
  }, []);

  // 📥 Charger les données de ventes pour le graphique
  const fetchSalesData = useCallback(async () => {
    try {
      const data = await apiFetch<SalesDataPoint[]>('pharmacie/sales/?period=week');
      setSalesData(data);
    } catch (err: any) {
      console.error('❌ Erreur chargement ventes:', err);
      // Fallback mock
      setSalesData([
        { date: 'Lun', revenue: 85000, orders: 12 },
        { date: 'Mar', revenue: 120000, orders: 18 },
        { date: 'Mer', revenue: 95000, orders: 14 },
        { date: 'Jeu', revenue: 140000, orders: 22 },
        { date: 'Ven', revenue: 110000, orders: 16 },
        { date: 'Sam', revenue: 75000, orders: 10 },
        { date: 'Dim', revenue: 45000, orders: 6 },
      ]);
    }
  }, []);

  // 🔄 Rafraîchir toutes les données
  const refreshAllData = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchDashboardStats(),
        fetchMedicines(),
        fetchOrders(),
        fetchSalesData(),
      ]);
      showNotification('success', 'Données actualisées', 'Toutes les statistiques ont été mises à jour.');
    } catch (err: any) {
      showNotification('error', 'Erreur de rafraîchissement', err.message || 'Impossible de mettre à jour les données.');
    } finally {
      setRefreshing(false);
    }
  }, [fetchDashboardStats, fetchMedicines, fetchOrders, fetchSalesData, showNotification]);

  // 📤 Mettre à jour le stock d'un médicament
  const updateMedicineStock = async (medicineId: number, newQuantity: number) => {
    try {
      await apiFetch(`pharmacie/medicines/${medicineId}/update_stock/`, {
        method: 'PATCH',
        body: JSON.stringify({ stock_quantity: newQuantity }),
      });
      
      // Mettre à jour localement
      setMedicines(prev => prev.map(med => 
        med.id === medicineId 
          ? { ...med, stockQuantity: newQuantity, status: newQuantity <= med.minStock ? 'low_stock' : 'in_stock' }
          : med
      ));
      
      showNotification('success', 'Stock mis à jour', 'La quantité a été modifiée avec succès.');
    } catch (err: any) {
      showNotification('error', 'Échec', err.message || 'Impossible de mettre à jour le stock.');
    }
  };

  // 📤 Traiter une commande
  const processOrder = async (orderId: number, newStatus: Order['status']) => {
    try {
      await apiFetch(`pharmacie/orders/${orderId}/update_status/`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      showNotification('success', 'Commande mise à jour', `Statut: ${newStatus}`);
    } catch (err: any) {
      showNotification('error', 'Échec', err.message || 'Impossible de mettre à jour la commande.');
    }
  };

  // Chargement initial
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchDashboardStats(),
          fetchMedicines(),
          fetchOrders(),
          fetchSalesData(),
        ]);
      } catch (err) {
        console.error('❌ Erreur chargement initial:', err);
        showNotification('warning', 'Mode hors ligne', 'Affichage des données de secours.');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
    
    // Auto-refresh toutes les 60 secondes
    const interval = setInterval(() => {
      fetchDashboardStats();
      fetchMedicines();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [fetchDashboardStats, fetchMedicines, showNotification]);

  // Propager les IDs quand on change d'onglet
  useEffect(() => {
    if (workflowIds.consultationId) {
      localStorage.setItem('current_consultation_id', String(workflowIds.consultationId));
    }
    if (workflowIds.patientId) {
      localStorage.setItem('current_patient_id', String(workflowIds.patientId));
    }
  }, [workflowIds]);

  // Filtrage des médicaments critiques
  const CRITICAL_THRESHOLD = 15;
  const criticalMedicines = medicines.filter(
    (med) => med.stockQuantity <= CRITICAL_THRESHOLD || med.status === 'out_of_stock'
  );

  // =============================================================================
  // STYLES PROFESSIONNELS (Harmonisés avec #c0392b)
  // =============================================================================
  const styles: Record<string, React.CSSProperties> = {
    page: { display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "Inter, system-ui, sans-serif" },
    
    // Sidebar - Couleur harmonisée
    sidebar: { 
      width: "260px", 
      backgroundColor: "#c0392b",  // ← ← ← CHANGÉ de #0F4C75 à #c0392b
      color: "white", 
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      position: "fixed",
      height: "100vh",
      boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
    },
    
    sidebarLogo: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "30px" },
    logoBox: { width: "40px", height: "40px", backgroundColor: "#e74c3c", borderRadius: "8px", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: "bold" },
    logoText: { fontWeight: "bold", fontSize: "1.2rem" },
    logoSubtitle: { fontSize: "0.8rem", opacity: 0.8 },
    
    nav: { display: "flex", flexDirection: "column", gap: "8px" },
    
    main: { flex: 1, marginLeft: "260px", display: "flex", flexDirection: "column" },
    
    header: { 
      height: "70px", 
      backgroundColor: "white", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "space-between", 
      padding: "0 30px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      position: "sticky",
      top: 0,
      zIndex: 10,
    },
    
    searchContainer: { position: "relative", width: "400px" },
    searchIcon: { position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" },
    searchInput: { width: "100%", padding: "10px 10px 10px 40px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", outline: "none", transition: "border-color 0.2s" },
    
    headerActions: { display: "flex", alignItems: "center", gap: "15px" },
    iconBtn: { padding: "8px", backgroundColor: "#f1f5f9", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s", border: "none", color: "#64748b" },
    notificationDot: { position: "absolute", top: "5px", right: "5px", width: "8px", height: "8px", backgroundColor: "#ef4444", borderRadius: "50%", border: "2px solid white" },
    userBtn: { padding: "8px", backgroundColor: "#c0392b", borderRadius: "50%", color: "white", cursor: "pointer", border: "none", display: "flex", alignItems: "center", justifyContent: "center" },
    onlineBadge: { padding: "6px 15px", backgroundColor: "#dcfce7", color: "#166534", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "5px" },
    onlineDot: { width: "8px", height: "8px", backgroundColor: "#22c55e", borderRadius: "50%" },
    
    content: { flex: 1, padding: "30px" },
    pageTitle: { marginBottom: "25px", color: "#1e293b", fontWeight: "bold", fontSize: "1.5rem", display: "flex", alignItems: "center", gap: "10px" },
    
    statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "30px" },
    
    chartsGrid: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: "25px", marginBottom: "30px" },
    chartCard: { backgroundColor: "white", padding: "20px", borderRadius: "15px", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" },
    chartTitle: { fontSize: "1.1rem", marginBottom: "20px", color: "#334155" },
    
    alertsCard: { backgroundColor: "white", padding: "25px", borderRadius: "15px", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" },
    alertsHeader: { display: "flex", justifyContent: "space-between", marginBottom: "20px" },
    alertsTitle: { fontSize: "1.1rem", color: "#334155", display: "flex", alignItems: "center", gap: "10px" },
    viewAllBtn: { color: "#c0392b", border: "none", background: "none", fontWeight: "600", cursor: "pointer" },
    
    alertsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "15px" },
    alertItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", borderRadius: "12px", backgroundColor: "#fef2f2", border: "1px solid #fecaca" },
    alertInfo: { fontWeight: "bold", color: "#991b1b" },
    alertStock: { fontSize: "0.85rem", color: "#b91c1c" },
    orderBtn: { backgroundColor: "#c0392b", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "0.8rem", cursor: "pointer", transition: "background 0.2s" },
    
    sidebarProfile: { borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "20px" },
    profileInfo: { display: "flex", alignItems: "center", gap: "10px" },
    profileAvatar: { width: "35px", height: "35px", borderRadius: "50%", backgroundColor: "#e74c3c", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: "bold", fontSize: "0.8rem" },
    profileName: { fontSize: "0.9rem", fontWeight: "600" },
    profileStatus: { fontSize: "0.7rem", color: "#22c55e" },
    
    loadingOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 },
    
    notification: {
      position: 'fixed' as const,
      top: '20px',
      right: '20px',
      zIndex: 9999,
      padding: '16px 20px',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
      borderLeft: '5px solid',
      backgroundColor: 'white',
      maxWidth: '450px',
      minWidth: '350px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      animation: 'slideIn 0.3s ease-out',
    },
  };

  // =============================================================================
  // RENDER
  // =============================================================================
  return (
    <div style={styles.page}>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input:focus { border-color: #c0392b !important; box-shadow: 0 0 0 3px rgba(192, 57, 43, 0.1) !important; }
        .nav-item:hover { background-color: rgba(255,255,255,0.1) !important; }
        .icon-btn:hover { background-color: #e2e8f0 !important; }
        .order-btn:hover { background-color: #a93226 !important; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #c0392b; border-radius: 3px; }
      `}</style>

      {/* 🔔 Notification */}
      {notification.show && (
        <div style={getNotificationStyles()} role="alert">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ fontSize: '18px', color: notification.type === 'error' ? '#ef4444' : notification.type === 'success' ? '#22c55e' : notification.type === 'warning' ? '#f59e0b' : '#c0392b' }}>
              {notification.type === 'success' && <CheckCircle size={18} />}
              {notification.type === 'error' && <AlertTriangle size={18} />}
              {notification.type === 'warning' && <AlertTriangle size={18} />}
              {notification.type === 'info' && <Bell size={18} />}
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{notification.title}</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>{notification.message}</p>
              {notification.details?.map((d, i) => <div key={i} style={{ fontSize: '12px' }}>• {d}</div>)}
            </div>
            <button onClick={() => setNotification(p => ({ ...p, show: false }))} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer' }}><X size={16} /></button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div>
          <div style={styles.sidebarLogo}>
            <div style={styles.logoBox}>MP</div>
            <div>
              <div style={styles.logoText}>MediPharma</div>
              <div style={styles.logoSubtitle}>Dashboard Pro</div>
            </div>
          </div>
          
          <nav style={styles.nav}>
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
              onClick={() => { setActiveTab("Commandes"); if (workflowIds.consultationId) navigate('/pharmacie/orders', { state: workflowIds }); }}
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
              badge={stats.activeChats > 0 ? String(stats.activeChats) : undefined}
              active={activeTab === "Messages"} 
              onClick={() => { setActiveTab("Messages"); if (workflowIds.consultationId) navigate('/pharmacie/chat', { state: workflowIds }); }}
            />
            <NavItem 
              icon={<AlertTriangle size={20}/>} 
              label="Paramètres" 
              active={activeTab === "Paramètres"} 
              onClick={() => setActiveTab("Paramètres")} 
            />
          </nav>
        </div>

        {/* Profil */}
        <div style={styles.sidebarProfile}>
          <div style={styles.profileInfo}>
             <div style={styles.profileAvatar}>PK</div>
             <div>
                <div style={styles.profileName}>Pharmacien Kodjo</div>
                <div style={styles.profileStatus}>● En ligne</div>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={styles.main}>
        
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.searchContainer}>
            <Search size={18} style={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Rechercher médicament, commande, patient..." 
              style={styles.searchInput}
              onFocus={(e) => e.target.style.borderColor = '#c0392b'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          <div style={styles.headerActions}>
            <button 
              style={{...styles.iconBtn, position: 'relative'}} 
              className="icon-btn"
              onClick={refreshAllData}
              disabled={refreshing}
              title="Actualiser les données"
            >
              <RefreshCw size={20} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
            </button>
            <div style={{...styles.iconBtn, position: 'relative'}} className="icon-btn">
              <Bell size={20} />
              {stats.activeChats > 0 && <div style={styles.notificationDot}></div>}
            </div>
            <button style={styles.userBtn}>
              <User size={20} />
            </button>
            <div style={styles.onlineBadge}>
              <div style={styles.onlineDot}></div>
              En ligne
            </div>
          </div>
        </header>

        {/* Contenu dynamique */}
        <div style={styles.content}>
          {loading ? (
            <div style={{...styles.loadingOverlay, position: 'static', background: 'transparent', justifyContent: 'flex-start'}}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b' }}>
                <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', color: '#c0392b' }} />
                Chargement du tableau de bord...
              </div>
            </div>
          ) : (
            <>
              {activeTab === "Dashboard" && (
                <DashboardHome 
                  stats={stats}
                  criticalMedicines={criticalMedicines}
                  orderTypeData={orderTypeData}
                  salesData={salesData}
                  onRefresh={refreshAllData}
                  onOrderStock={updateMedicineStock}
                  onProcessOrder={processOrder}
                />
              )}
              {activeTab === "Commandes" && <Orders orders={orders} onProcessOrder={processOrder} workflowIds={workflowIds} />}
              {activeTab === "Inventaire" && <Inventory medicines={medicines} onUpdateStock={updateMedicineStock} />}
              {activeTab === "Messages" && <Chat workflowIds={workflowIds} />}
              {activeTab === "Paramètres" && <Settings />}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

// =============================================================================
// COMPOSANT: DashboardHome (Vue Accueil)
// =============================================================================
interface DashboardHomeProps {
  stats: DashboardStats;
  criticalMedicines: Medicine[];
  orderTypeData: OrderTypeData[];
  salesData: SalesDataPoint[];
  onRefresh: () => void;
  onOrderStock: (id: number, qty: number) => void;
  onProcessOrder: (id: number, status: Order['status']) => void;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ 
  stats, 
  criticalMedicines, 
  orderTypeData, 
  salesData,
  onRefresh,
  onOrderStock,
  onProcessOrder 
}) => (
  <>
    <h2 style={{ marginBottom: "25px", color: "#1e293b", fontWeight: "bold", fontSize: "1.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
      <TrendingUp size={24} color="#c0392b" /> Tableau de bord Pharmacie
    </h2>

    {/* Stats Cards */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "30px" }}>
      <StatCard label="Commandes Jour" value={stats.todayOrders} icon={<ShoppingCart color="#c0392b"/>} trend="+12%" />
      <StatCard label="Revenus (FCFA)" value={stats.todayRevenue.toLocaleString()} icon={<TrendingUp color="#c0392b"/>} trend="+18%" />
      <StatCard label="Alertes Stock" value={stats.lowStockCount} icon={<AlertTriangle color="#ef4444"/>} trend="Urgent" isWarning />
      <StatCard label="Messages" value={stats.activeChats} icon={<MessageSquare color="#c0392b"/>} trend={stats.activeChats > 0 ? `+${stats.activeChats}` : "Aucun"} />
    </div>

    {/* Charts */}
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "25px", marginBottom: "30px" }}>
      <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "15px", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
        <h3 style={{ fontSize: "1.1rem", marginBottom: "20px", color: "#334155" }}>Évolution des Ventes</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={salesData}>
            <defs>
              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#c0392b" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#c0392b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              labelStyle={{ color: '#1e293b', fontWeight: 600 }}
            />
            <Area type="monotone" dataKey="revenue" stroke="#c0392b" strokeWidth={3} fill="url(#colorRev)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "15px", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
        <h3 style={{ fontSize: "1.1rem", marginBottom: "20px", color: "#334155" }}>Types de Commandes</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={orderTypeData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
              {orderTypeData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ marginTop: "15px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {orderTypeData.map((item) => (
            <div key={item.name} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
              <span style={{ color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: item.color }}></span>
                {item.name}
              </span>
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
          <AlertTriangle size={20} color="#ef4444" /> Alertes Stocks Critiques
        </h3>
        <button style={styles.viewAllBtn} onClick={onRefresh}>🔄 Actualiser</button>
      </div>
      
      {criticalMedicines.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
          <CheckCircle size={48} style={{ marginBottom: "16px", color: "#22c55e" }} />
          <p>✅ Tous les stocks sont au niveau requis</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "15px" }}>
          {criticalMedicines.slice(0, 6).map((med) => (
            <div key={med.id} style={styles.alertItem}>
              <div>
                <div style={styles.alertInfo}>{med.name}</div>
                <div style={styles.alertStock}>
                  Stock: {med.stockQuantity} / Min: {med.minStock}
                  {med.status === 'out_of_stock' && <span style={{ marginLeft: '8px', color: '#ef4444', fontWeight: 'bold' }}>● Épuisé</span>}
                </div>
              </div>
              <button 
                style={styles.orderBtn}
                onClick={() => onOrderStock(med.id, med.minStock * 3)}
                onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#a93226'}
                onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#c0392b'}
              >
                Commander
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  </>
);

// =============================================================================
// SOUS-COMPOSANTS
// =============================================================================

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: string;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active = false, badge, onClick }) => (
  <div 
    onClick={onClick}
    className="nav-item"
    style={{ 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "space-between",
      padding: "12px 15px", 
      borderRadius: "10px", 
      backgroundColor: active ? "#e74c3c" : "transparent",  // ← ← ← CHANGÉ
      color: active ? "white" : "#cbd5e1",
      cursor: "pointer",
      transition: "0.2s",
      userSelect: "none"
    }}
    onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
    onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'; }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      {icon}
      <span style={{ fontWeight: "500" }}>{label}</span>
    </div>
    {badge && <span style={{ backgroundColor: "#ef4444", color: "white", padding: "2px 8px", borderRadius: "10px", fontSize: "0.7rem" }}>{badge}</span>}
  </div>
);

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  trend: string;
  isWarning?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend, isWarning = false }) => (
  <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "15px", display: "flex", justifyContent: "space-between", boxShadow: "0 4px 6px rgba(0,0,0,0.02)", transition: "transform 0.2s" }}
    onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'}
    onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'}
  >
    <div>
      <div style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "10px" }}>{label}</div>
      <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1e293b" }}>{value}</div>
      <div style={{ color: isWarning ? "#ef4444" : "#22c55e", fontSize: "0.8rem", marginTop: "5px", fontWeight: "bold" }}>{trend}</div>
    </div>
    <div style={{ width: "45px", height: "45px", backgroundColor: "#fef2f2", borderRadius: "12px", display: "flex", justifyContent: "center", alignItems: "center" }}>
      {icon}
    </div>
  </div>
);

// =============================================================================
// COMPOSANTS PAGES (Stubs - à remplacer par vos fichiers existants)
// =============================================================================

const Orders: React.FC<{ orders: Order[]; onProcessOrder: (id: number, status: Order['status']) => void; workflowIds: WorkflowIds }> = ({ orders, onProcessOrder, workflowIds }) => (
  <div style={{ padding: "20px" }}>
    <h3 style={{ color: "#1e293b", marginBottom: "20px" }}>📦 Gestion des Commandes</h3>
    <p style={{ color: "#64748b" }}>Liste des commandes en cours...</p>
    {/* Intégrez ici votre composant Orders existant */}
  </div>
);

const Inventory: React.FC<{ medicines: Medicine[]; onUpdateStock: (id: number, qty: number) => void }> = ({ medicines, onUpdateStock }) => (
  <div style={{ padding: "20px" }}>
    <h3 style={{ color: "#1e293b", marginBottom: "20px" }}>📦 Gestion de l'Inventaire</h3>
    <p style={{ color: "#64748b" }}>Liste des médicaments et stocks...</p>
    {/* Intégrez ici votre composant Inventory existant */}
  </div>
);

const Chat: React.FC<{ workflowIds: WorkflowIds }> = ({ workflowIds }) => (
  <div style={{ padding: "20px" }}>
    <h3 style={{ color: "#1e293b", marginBottom: "20px" }}>💬 Messagerie</h3>
    <p style={{ color: "#64748b" }}>Conversation avec les patients...</p>
    {/* Importez votre composant Chat existant ici */}
  </div>
);

const Settings: React.FC = () => (
  <div style={{ padding: "20px" }}>
    <h3 style={{ color: "#1e293b", marginBottom: "20px" }}>⚙️ Paramètres</h3>
    <p style={{ color: "#64748b" }}>Configuration de la pharmacie...</p>
  </div>
);

export default Dashboard;