import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaUserMd, FaHospital, FaChartLine } from 'react-icons/fa';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalPatients: 0,
    totalConsultations: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const headers = { 'Authorization': `Token ${token}` };
      
      const [doctorsRes, patientsRes] = await Promise.all([
        fetch('http://localhost:8000/api/admin/doctors/', { headers }),
        fetch('http://localhost:8000/api/admin/patients/', { headers }),
      ]);

      if (doctorsRes.ok && patientsRes.ok) {
        const doctors = await doctorsRes.json();
        const patients = await patientsRes.json();
        
        setStats({
          totalDoctors: doctors.length || 0,
          totalPatients: patients.count || patients.length || 0,
          totalConsultations: 0, // À implémenter
        });
      }
    } catch (err) {
      console.error('Erreur fetch stats:', err);
    }
  };

  const menuItems = [
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
      description: 'Historique des consultations'
    },
    {
      title: 'Statistiques',
      icon: <FaChartLine size={32} />,
      color: '#9b59b6',
      route: '/admin/statistics',
      count: null,
      description: 'Rapports et analyses'
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', padding: '20px' }}>
      {/* Header */}
      <header style={{
        background: '#2c3e50',
        color: 'white',
        padding: '20px 30px',
        borderRadius: '12px',
        marginBottom: '30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>🏥 Panel Administrateur</h1>
        <button
          onClick={() => {
            localStorage.clear();
            navigate('/admin/login');
          }}
          style={{
            background: '#e74c3c',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Déconnexion
        </button>
      </header>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <div style={{ background: '#3498db20', padding: '15px', borderRadius: '10px', color: '#3498db' }}>
            <FaUserMd size={28} />
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#2c3e50' }}>{stats.totalDoctors}</div>
            <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>Médecins</div>
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <div style={{ background: '#2ecc7120', padding: '15px', borderRadius: '10px', color: '#2ecc71' }}>
            <FaUsers size={28} />
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#2c3e50' }}>{stats.totalPatients}</div>
            <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>Patients</div>
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {menuItems.map((item, index) => (
          <div
            key={index}
            onClick={() => navigate(item.route)}
            style={{
              background: 'white',
              padding: '30px',
              borderRadius: '12px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              border: `2px solid transparent`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.borderColor = item.color;
              e.currentTarget.style.boxShadow = `0 8px 25px ${item.color}30`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
              <div style={{ color: item.color }}>{item.icon}</div>
              <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '1.3rem' }}>{item.title}</h3>
            </div>
            <p style={{ color: '#7f8c8d', marginBottom: '15px' }}>{item.description}</p>
            {item.count !== null && (
              <div style={{
                background: `${item.color}15`,
                color: item.color,
                padding: '8px 16px',
                borderRadius: '20px',
                display: 'inline-block',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}>
                {item.count} éléments
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;