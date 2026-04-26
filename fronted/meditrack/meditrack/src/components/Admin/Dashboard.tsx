import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaUsers, FaUserMd, FaHospital, FaChartLine, FaClipboardList,
  FaPills, FaFlask, FaXRay, FaMoneyBillWave, FaSync, FaExclamationTriangle
} from 'react-icons/fa';

// =============================================================================
// TYPES
// =============================================================================
interface DashboardStats {
  totalDoctors: number;
  totalPatients: number;
  totalConsultations: number;
  consultationsToday: number;
  pendingPayments: number;
  lowStockProducts: number;
  loading: boolean;
  error: string | null;
}

interface MenuItem {
  title: string;
  icon: React.ReactNode;
  color: string;
  route: string;
  count: number | null;
  description: string;
  endpoint?: string; // Pour fetch dynamique si besoin
}

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================
const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalDoctors: 0,
    totalPatients: 0,
    totalConsultations: 0,
    consultationsToday: 0,
    pendingPayments: 0,
    lowStockProducts: 0,
    loading: true,
    error: null,
  });

  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // 🔐 Récupérer le token avec vérification
  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('access_token');
    if (!token || token === 'null' || token === 'undefined') {
      navigate('/admin/login');
      return {};
    }
    return {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    };
  };

  // 📊 Fetch toutes les statistiques
  const fetchAllStats = async () => {
    setStats(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const headers = getAuthHeaders();
      if (Object.keys(headers).length === 0) return;

      // Fetch parallèle de toutes les données
      const [
        doctorsRes,
        patientsRes,
        consultationsRes,
        statsRes,
        productsRes,
      ] = await Promise.allSettled([
        fetch('http://localhost:8000/api/admin/doctors/', { headers }),
        fetch('http://localhost:8000/api/patients/?page=1', { headers }),
        fetch('http://localhost:8000/api/consultations/?page=1', { headers }),
        fetch('http://localhost:8000/api/stats/?period=day', { headers }),
        fetch('http://localhost:8000/api/produits/?alerte_stock=true', { headers }),
      ]);

      // Traitement des réponses
      const doctors = doctorsRes.status === 'fulfilled' && doctorsRes.value.ok 
        ? await doctorsRes.value.json() 
        : [];
      
      const patients = patientsRes.status === 'fulfilled' && patientsRes.value.ok 
        ? await patientsRes.value.json() 
        : { count: 0, results: [] };
      
      const consultations = consultationsRes.status === 'fulfilled' && consultationsRes.value.ok 
        ? await consultationsRes.value.json() 
        : { count: 0, results: [] };
      
      const statsData = statsRes.status === 'fulfilled' && statsRes.value.ok 
        ? await statsRes.value.json() 
        : null;
      
      const lowStock = productsRes.status === 'fulfilled' && productsRes.value.ok 
        ? await productsRes.value.json() 
        : { count: 0 };

      // Mise à jour des stats
      setStats({
        totalDoctors: Array.isArray(doctors) ? doctors.length : 0,
        totalPatients: patients.count || patients.results?.length || 0,
        totalConsultations: consultations.count || consultations.results?.length || 0,
        consultationsToday: statsData?.total_consultations || 0,
        pendingPayments: 0, // À implémenter avec un endpoint dédié
        lowStockProducts: lowStock.count || 0,
        loading: false,
        error: null,
      });
      
      setLastUpdate(new Date());
      
    } catch (err) {
      console.error('❌ Erreur fetch stats:', err);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: 'Impossible de charger les statistiques. Veuillez réessayer.'
      }));
    }
  };

  // ✅ Chargement initial + auto-refresh toutes les 30 secondes
  useEffect(() => {
    fetchAllStats();
    
    // Auto-refresh
    const interval = setInterval(fetchAllStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // 🔄 Rafraîchissement manuel
  const handleRefresh = () => {
    fetchAllStats();
  };

  // 🚪 Déconnexion
  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/admin/login');
  };

  // 📋 Menu items avec données dynamiques
  const menuItems: MenuItem[] = [
    {
      title: 'Gestion des Médecins',
      icon: <FaUserMd size={32} />,
      color: '#3498db',
      route: '/admin/doctors',
      count: stats.totalDoctors,
      description: 'Créer, modifier, supprimer des médecins'
    },
    {
      title: 'Gestion des Patients',
      icon: <FaUsers size={32} />,
      color: '#2ecc71',
      route: '/admin/patients',
      count: stats.totalPatients,
      description: 'Voir et gérer tous les patients'
    },
    {
      title: 'Consultations',
      icon: <FaHospital size={32} />,
      color: '#e74c3c',
      route: '/admin/consultations',
      count: stats.totalConsultations,
      description: 'Historique et suivi des consultations'
    },
    {
      title: 'Ordonnances',
      icon: <FaPills size={32} />,
      color: '#9b59b6',
      route: '/admin/ordonnances',
      count: null,
      description: 'Gestion des prescriptions médicales'
    },
    {
      title: 'Analyses Labo',
      icon: <FaFlask size={32} />,
      color: '#1abc9c',
      route: '/admin/analyses-labo',
      count: null,
      description: 'Résultats et suivi des analyses'
    },
    {
      title: 'Imagerie Radio',
      icon: <FaXRay size={32} />,
      color: '#34495e',
      route: '/admin/analyses-radio',
      count: null,
      description: 'Examens radiologiques et rapports'
    },
    {
      title: 'Paiements',
      icon: <FaMoneyBillWave size={32} />,
      color: '#f39c12',
      route: '/admin/paiements',
      count: stats.pendingPayments > 0 ? stats.pendingPayments : null,
      description: 'Suivi des paiements et facturation'
    },
    {
      title: 'Stock & Pharmacie',
      icon: <FaClipboardList size={32} />,
      color: '#e67e22',
      route: '/admin/stock',
      count: stats.lowStockProducts > 0 ? stats.lowStockProducts : null,
      description: stats.lowStockProducts > 0 
        ? `⚠️ ${stats.lowStockProducts} produit(s) en alerte stock`
        : 'Gestion des produits et stocks'
    },
    {
      title: 'Statistiques',
      icon: <FaChartLine size={32} />,
      color: '#8e44ad',
      route: '/admin/statistics',
      count: null,
      description: 'Rapports, graphiques et analyses'
    },
  ];

  // =============================================================================
  // STYLES
  // =============================================================================
  const styles: Record<string, React.CSSProperties> = {
    page: {
      minHeight: '100vh',
      background: '#f8fafc',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      padding: '20px',
    },
    header: {
      background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
      color: 'white',
      padding: '20px 30px',
      borderRadius: '12px',
      marginBottom: '30px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 4px 20px rgba(13, 148, 136, 0.3)',
    },
    headerTitle: {
      margin: 0,
      fontSize: '1.8rem',
      fontWeight: '700',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    headerActions: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    refreshBtn: {
      background: 'rgba(255,255,255,0.2)',
      color: 'white',
      border: 'none',
      padding: '10px 15px',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '14px',
      transition: 'background 0.2s',
    },
    logoutBtn: {
      background: '#ef4444',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'background 0.2s',
    },
    lastUpdate: {
      fontSize: '12px',
      opacity: 0.9,
      marginTop: '4px',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '30px',
    },
    statCard: {
      background: 'white',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'pointer',
    },
    statIcon: {
      padding: '15px',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    statValue: {
      fontSize: '2rem',
      fontWeight: '700',
      color: '#1e293b',
      lineHeight: 1,
    },
    statLabel: {
      color: '#64748b',
      fontSize: '0.9rem',
    },
    menuGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '20px',
    },
    menuItem: {
      background: 'white',
      padding: '25px',
      borderRadius: '12px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      border: '2px solid transparent',
    },
    menuItemHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      marginBottom: '12px',
    },
    menuItemTitle: {
      margin: 0,
      color: '#1e293b',
      fontSize: '1.2rem',
      fontWeight: '600',
    },
    menuItemDesc: {
      color: '#64748b',
      marginBottom: '15px',
      fontSize: '0.95rem',
      lineHeight: 1.4,
    },
    menuItemCount: {
      padding: '6px 14px',
      borderRadius: '20px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      fontWeight: '600',
      fontSize: '0.85rem',
    },
    loadingOverlay: {
      position: 'fixed' as const,
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(255,255,255,0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    errorBox: {
      background: '#fef2f2',
      border: '2px solid #ef4444',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      color: '#991b1b',
    },
  };

  // =============================================================================
  // RENDER
  // =============================================================================
  return (
    <div style={styles.page}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0,0,0,0.12) !important; }
        .menu-item:hover { transform: translateY(-5px); box-shadow: 0 12px 30px rgba(0,0,0,0.15) !important; }
      `}</style>

      {/* Loading Overlay */}
      {stats.loading && (
        <div style={styles.loadingOverlay}>
          <div style={{ textAlign: 'center' }}>
            <FaSync size={48} style={{ animation: 'spin 1s linear infinite', color: '#0d9488', marginBottom: '16px' }} />
            <div style={{ color: '#64748b', fontSize: '1rem' }}>Chargement des données...</div>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>
            🏥 Panel Administrateur
          </h1>
          {lastUpdate && (
            <div style={styles.lastUpdate}>
              Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
            </div>
          )}
        </div>
        
        <div style={styles.headerActions}>
          <button
            onClick={handleRefresh}
            disabled={stats.loading}
            style={{
              ...styles.refreshBtn,
              opacity: stats.loading ? 0.7 : 1,
              cursor: stats.loading ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => { if (!stats.loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.3)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.2)'; }}
          >
            <FaSync size={14} style={stats.loading ? { animation: 'spin 1s linear infinite' } : {}} /> 
            {stats.loading ? '...' : 'Actualiser'}
          </button>
          
          <button
            onClick={handleLogout}
            style={styles.logoutBtn}
            onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#dc2626'}
            onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ef4444'}
          >
            Déconnexion
          </button>
        </div>
      </header>

      {/* Error Message */}
      {stats.error && (
        <div style={styles.errorBox}>
          <FaExclamationTriangle size={20} />
          <div>
            <strong>Erreur de chargement</strong>
            <div style={{ fontSize: '14px', marginTop: '4px' }}>{stats.error}</div>
            <button 
              onClick={handleRefresh}
              style={{ 
                marginTop: '8px', 
                padding: '6px 12px', 
                background: '#ef4444', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Réessayer
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        {/* Médecins */}
        <div 
          style={{ ...styles.statCard, backgroundColor: '#fff' }} 
          className="stat-card"
          onClick={() => navigate('/admin/doctors')}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#3498db'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent'; }}
        >
          <div style={{ ...styles.statIcon, backgroundColor: '#3498db20', color: '#3498db' }}>
            <FaUserMd size={24} />
          </div>
          <div>
            <div style={styles.statValue}>{stats.totalDoctors}</div>
            <div style={styles.statLabel}>Médecins</div>
          </div>
        </div>

        {/* Patients */}
        <div 
          style={{ ...styles.statCard, backgroundColor: '#fff' }} 
          className="stat-card"
          onClick={() => navigate('/admin/patients')}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#2ecc71'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent'; }}
        >
          <div style={{ ...styles.statIcon, backgroundColor: '#2ecc7120', color: '#2ecc71' }}>
            <FaUsers size={24} />
          </div>
          <div>
            <div style={styles.statValue}>{stats.totalPatients}</div>
            <div style={styles.statLabel}>Patients</div>
          </div>
        </div>

        {/* Consultations */}
        <div 
          style={{ ...styles.statCard, backgroundColor: '#fff' }} 
          className="stat-card"
          onClick={() => navigate('/admin/consultations')}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e74c3c'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent'; }}
        >
          <div style={{ ...styles.statIcon, backgroundColor: '#e74c3c20', color: '#e74c3c' }}>
            <FaHospital size={24} />
          </div>
          <div>
            <div style={styles.statValue}>{stats.totalConsultations}</div>
            <div style={styles.statLabel}>Consultations</div>
          </div>
        </div>

        {/* Consultations Aujourd'hui */}
        <div style={{ ...styles.statCard, backgroundColor: '#fff' }} className="stat-card">
          <div style={{ ...styles.statIcon, backgroundColor: '#f59e0b20', color: '#f59e0b' }}>
            <FaClipboardList size={24} />
          </div>
          <div>
            <div style={styles.statValue}>{stats.consultationsToday}</div>
            <div style={styles.statLabel}>Aujourd'hui</div>
          </div>
        </div>

        {/* Alertes Stock */}
        <div 
          style={{ ...styles.statCard, backgroundColor: '#fff' }} 
          className="stat-card"
          onClick={() => navigate('/admin/stock')}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e67e22'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent'; }}
        >
          <div style={{ ...styles.statIcon, backgroundColor: '#e67e2220', color: '#e67e22' }}>
            <FaClipboardList size={24} />
          </div>
          <div>
            <div style={{ ...styles.statValue, color: stats.lowStockProducts > 0 ? '#ef4444' : '#1e293b' }}>
              {stats.lowStockProducts}
            </div>
            <div style={styles.statLabel}>Alertes Stock</div>
          </div>
        </div>

        {/* Paiements en Attente */}
        <div style={{ ...styles.statCard, backgroundColor: '#fff' }} className="stat-card">
          <div style={{ ...styles.statIcon, backgroundColor: '#f39c1220', color: '#f39c12' }}>
            <FaMoneyBillWave size={24} />
          </div>
          <div>
            <div style={styles.statValue}>{stats.pendingPayments}</div>
            <div style={styles.statLabel}>Paiements</div>
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div style={styles.menuGrid}>
        {menuItems.map((item, index) => (
          <div
            key={index}
            onClick={() => navigate(item.route)}
            style={{
              ...styles.menuItem,
              borderColor: 'transparent',
            }}
            className="menu-item"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-5px)';
              (e.currentTarget as HTMLDivElement).style.borderColor = item.color;
              (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 30px ${item.color}30`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)';
            }}
          >
            <div style={styles.menuItemHeader}>
              <div style={{ color: item.color }}>{item.icon}</div>
              <h3 style={styles.menuItemTitle}>{item.title}</h3>
            </div>
            <p style={styles.menuItemDesc}>{item.description}</p>
            {item.count !== null && (
              <div style={{
                ...styles.menuItemCount,
                backgroundColor: `${item.color}15`,
                color: item.count > 0 && item.title.includes('Alerte') ? '#ef4444' : item.color,
              }}>
                {item.count > 0 && item.title.includes('Alerte') && <FaExclamationTriangle size={12} />}
                {item.count} {item.count === 1 ? 'élément' : 'éléments'}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div style={{ 
        marginTop: '40px', 
        textAlign: 'center', 
        color: '#64748b', 
        fontSize: '0.85rem',
        padding: '20px',
        borderTop: '1px solid #e2e8f0'
      }}>
        <div>Panel Administrateur • Système de Gestion Médicale</div>
        <div style={{ marginTop: '4px', opacity: 0.7 }}>
          Connecté en tant qu'administrateur • Données en temps réel
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;