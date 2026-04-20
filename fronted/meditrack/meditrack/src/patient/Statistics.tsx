import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUsers,
  FaFileMedical,
  FaAmbulance,
  FaChartLine,
  FaArrowLeft,
  FaCalendarAlt,
  FaSync,
  FaExclamationTriangle,
} from 'react-icons/fa';

// =============================================================================
// TYPES
// =============================================================================
interface DoctorStat {
  medecin__username: string;
  patients: number;
  consultations: number;
}

interface ServiceStat {
  service: string;
  patients: number;
  consultations: number;
}

interface StatsData {
  total_patients: number;
  total_consultations: number;
  consultations_urgences: number;
  maladies_distinctes: number;
  par_doctor: DoctorStat[];
  par_service: ServiceStat[];
}

type PeriodType = 'day' | 'month' | 'year' | 'all';

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================
export default function Statistics(): React.ReactElement {
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<StatsData | null>(null);
  const [period, setPeriod] = useState<PeriodType>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // 📊 Fonction de récupération des statistiques
  const fetchStatistics = async () => {
    console.log('📊 Fetching statistics for period:', period);
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      console.log('🔑 Token:', token ? 'Present' : 'Absent');

      if (!token) {
        throw new Error('Token manquant. Veuillez vous connecter.');
      }

      // Appel API vers le backend Django
      const response = await fetch(`http://localhost:8000/api/stats?period=${period}`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📥 Response status:', response.status);

      if (response.status === 401) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

      if (response.status === 404) {
        throw new Error('Endpoint /api/stats/ non trouvé. Vérifiez le backend Django.');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: StatsData = await response.json();
      console.log('✅ Data received:', data);
      
      setStats(data);
      
    } catch (err: any) {
      console.error('❌ Error fetching stats:', err);
      setError(err.message || 'Erreur de connexion au serveur');
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Déclencher le chargement au montage et quand la période change
  useEffect(() => {
    fetchStatistics();
  }, [period]);

  // 🏷️ Helper pour le libellé de la période
  const getPeriodLabel = (p: PeriodType): string => {
    const labels: Record<PeriodType, string> = {
      day: "Aujourd'hui",
      month: "Ce mois-ci",
      year: "Cette année",
      all: "Tout temps"
    };
    return labels[p];
  };

  // =============================================================================
  // STYLES
  // =============================================================================
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#f0f4f8',
    padding: '20px',
    fontFamily: "'Inter', sans-serif"
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '15px'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  };

  const filterContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexWrap: 'wrap'
  };

  const getFilterBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: active ? '#3b82f6' : '#e2e8f0',
    color: active ? 'white' : '#64748b',
    cursor: active ? 'default' : 'pointer',
    fontWeight: 600,
    fontSize: '14px',
    transition: 'all 0.2s',
  });

  const statsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  };

  const statCardStyle: React.CSSProperties = {
    padding: '25px',
    borderRadius: '12px',
    backgroundColor: 'white',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    textAlign: 'center'
  };

  const statIconStyle: React.CSSProperties = {
    fontSize: '32px',
    marginBottom: '10px'
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: 600,
    marginBottom: '5px'
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: '36px',
    fontWeight: '800',
    color: '#1e293b'
  };

  const sectionStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '25px',
    marginBottom: '30px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse'
  };

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '12px',
    borderBottom: '2px solid #e2e8f0',
    color: '#64748b',
    fontWeight: 700,
    fontSize: '13px',
    textTransform: 'uppercase'
  };

  const tdStyle: React.CSSProperties = {
    padding: '12px',
    borderBottom: '1px solid #f1f5f9',
    color: '#334155',
    fontSize: '14px'
  };

  const backBtnStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: 'white',
    border: 'none',
    borderRadius: '8px',
    color: '#3b82f6',
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  };

  const errorStyle: React.CSSProperties = {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#b91c1c',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  };

  const loadingStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#64748b'
  };

  const spinnerStyle: React.CSSProperties = {
    animation: 'spin 1s linear infinite',
    fontSize: '32px',
    display: 'inline-block',
    marginBottom: '15px'
  };

  // =============================================================================
  // RENDER
  // =============================================================================
  return (
    <div style={containerStyle}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Bouton Retour */}
      <button 
        style={backBtnStyle}
        onClick={() => navigate('/patient')}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#eff6ff';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'white';
        }}
      >
        <FaArrowLeft /> Retour au tableau de bord
      </button>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={headerStyle}>
          <h1 style={titleStyle}>
            <FaChartLine /> Statistiques Médicales
          </h1>
          
          <div style={filterContainerStyle}>
            <FaCalendarAlt color="#64748b" />
            {(['day', 'month', 'year', 'all'] as const).map((p) => (
              <button
                key={p}
                style={getFilterBtnStyle(period === p)}
                onClick={() => setPeriod(p)}
                disabled={loading}
              >
                {p === 'day' ? "Aujourd'hui" : p === 'month' ? "Mois" : p === 'year' ? "Année" : "Total"}
              </button>
            ))}
            <button
              style={{
                ...getFilterBtnStyle(false),
                marginLeft: '10px',
                opacity: loading ? 0.6 : 1
              }}
              onClick={() => fetchStatistics()}
              disabled={loading}
              title="Actualiser"
            >
              <FaSync style={loading ? spinnerStyle : undefined} /> Actualiser
            </button>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div style={errorStyle}>
            <FaExclamationTriangle />
            <div>
              <strong>Erreur de chargement</strong>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>{error}</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div style={loadingStyle}>
            <div style={spinnerStyle}>🔄</div>
            <p style={{ fontSize: '16px', fontWeight: 600 }}>Chargement des statistiques...</p>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>Période : {getPeriodLabel(period)}</p>
          </div>
        ) : stats ? (
          <>
            {/* Cartes indicateurs */}
            <div style={statsGridStyle}>
              <div style={statCardStyle}>
                <div style={{ ...statIconStyle, color: '#16a34a' }}>
                  <FaUsers />
                </div>
                <div style={statLabelStyle}>Nouveaux Patients</div>
                <div style={{ ...statValueStyle, color: '#16a34a' }}>{stats.total_patients}</div>
              </div>

              <div style={statCardStyle}>
                <div style={{ ...statIconStyle, color: '#3b82f6' }}>
                  <FaFileMedical />
                </div>
                <div style={statLabelStyle}>Consultations</div>
                <div style={{ ...statValueStyle, color: '#3b82f6' }}>{stats.total_consultations}</div>
              </div>

              <div style={statCardStyle}>
                <div style={{ ...statIconStyle, color: '#ef4444' }}>
                  <FaAmbulance />
                </div>
                <div style={statLabelStyle}>Urgences</div>
                <div style={{ ...statValueStyle, color: '#ef4444' }}>{stats.consultations_urgences}</div>
              </div>

              <div style={statCardStyle}>
                <div style={{ ...statIconStyle, color: '#8b5cf6' }}>
                  <FaChartLine />
                </div>
                <div style={statLabelStyle}>Cas Distincts</div>
                <div style={{ ...statValueStyle, color: '#8b5cf6' }}>{stats.maladies_distinctes}</div>
              </div>
            </div>

            {/* Tableau Médecins */}
            <div style={sectionStyle}>
              <h2 style={sectionTitleStyle}>
                <FaUsers /> Performance par Médecin
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Médecin</th>
                      <th style={thStyle}>Patients</th>
                      <th style={thStyle}>Consultations</th>
                      <th style={thStyle}>Moyenne/Patient</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.par_doctor.length > 0 ? (
                      stats.par_doctor.map((item, index) => {
                        const avg = item.patients > 0 ? (item.consultations / item.patients).toFixed(1) : '0';
                        return (
                          <tr key={index}>
                            <td style={{ ...tdStyle, fontWeight: 600 }}>Dr. {item.medecin__username}</td>
                            <td style={tdStyle}>
                              <span style={{
                                backgroundColor: '#dbeafe',
                                color: '#1e40af',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '13px',
                                fontWeight: 600
                              }}>
                                {item.patients}
                              </span>
                            </td>
                            <td style={tdStyle}>
                              <span style={{
                                backgroundColor: '#dcfce7',
                                color: '#166534',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '13px',
                                fontWeight: 600
                              }}>
                                {item.consultations}
                              </span>
                            </td>
                            <td style={tdStyle}>{avg}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                          Aucune donnée disponible
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tableau Services */}
            <div style={sectionStyle}>
              <h2 style={sectionTitleStyle}>
                <FaFileMedical /> Répartition par Service
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Service</th>
                      <th style={thStyle}>Patients</th>
                      <th style={thStyle}>Activités</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.par_service.length > 0 ? (
                      stats.par_service.map((item, index) => (
                        <tr key={index}>
                          <td style={{ ...tdStyle, fontWeight: 600, textTransform: 'capitalize' }}>
                            {item.service}
                          </td>
                          <td style={tdStyle}>
                            <span style={{
                              backgroundColor: '#fef3c7',
                              color: '#92400e',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '13px',
                              fontWeight: 600
                            }}>
                              {item.patients}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <span style={{
                              backgroundColor: '#ede9fe',
                              color: '#6d28d9',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '13px',
                              fontWeight: 600
                            }}>
                              {item.consultations}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                          Aucune donnée disponible
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div style={loadingStyle}>
            <p style={{ fontSize: '16px' }}>Aucune statistique disponible</p>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>Sélectionnez une période et cliquez sur Actualiser</p>
          </div>
        )}
      </div>
    </div>
  );
}