import React, { useState, useEffect, useCallback, CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import debounce from 'lodash.debounce';
import { FaArrowLeft, FaFolderOpen, FaSearch, FaUser, FaPhone, FaCalendar, FaFileMedical } from 'react-icons/fa';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface Patient {
  id: number;
  code_patient?: string;
  nom: string;
  prenoms: string; 
  sexe: 'M' | 'F';
  age: number;
  telephone: string;
  adresse?: string;
  est_assure?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ConsultationHistory {
  id: number;
  date_consultation: string;
  service: string;
  service_display?: string;
  centre_medical: string;
  nom_soignant: string;
  motif_consultation: string;
  observations_cliniques?: string;
}

type NotificationType = 'success' | 'error' | 'info';

interface NotificationState {
  show: boolean;
  type: NotificationType;
  title: string;
  message: string;
  details?: string[];
}

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

export default function PatientSearch(): React.ReactElement {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<NotificationState>({
    show: false, type: 'info', title: '', message: '', details: []
  });
  const [isAuthenticatedState, setIsAuthenticatedState] = useState<boolean>(true);
  
  // ✅ État pour l'historique des consultations
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [consultationHistory, setConsultationHistory] = useState<ConsultationHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  // 🎯 Afficher une notification professionnelle
  const showNotification = (type: NotificationType, title: string, message: string, details?: string[]) => {
    setNotification({ show: true, type, title, message, details });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 6000);
  };

  // 🎨 Styles dynamiques pour la notification
  const getNotificationStyles = (): CSSProperties => {
    const colors: Record<NotificationType, { bg: string; border: string; text: string }> = {
      success: { bg: '#f0fdf4', border: '#22c55e', text: '#166534' },
      error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
      info: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
    };
    const c = colors[notification.type];
    return {
      position: 'fixed', top: '16px', right: '16px', zIndex: 9999,
      padding: '16px 20px', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
      borderLeft: `4px solid ${c.border}`, backgroundColor: c.bg, color: c.text,
      maxWidth: '450px', transition: 'all 0.3s ease',
      opacity: notification.show ? 1 : 0,
      transform: notification.show ? 'translateX(0)' : 'translateX(100%)',
    };
  };

  // 🔐 Vérifier si l'utilisateur est authentifié (TOKEN ≥ 40 CARACTÈRES)
  const checkAuth = (): boolean => {
    if (typeof window === 'undefined') return false;
    
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role');
    
    // ✅ Authentifié si token présent ET taille ≥ 40 caractères
    const hasValidToken = token && token.length >= 40 && token !== 'null' && token !== 'undefined';
    
    return hasValidToken;
  };

  // 🔍 Fonction de recherche avec debounce
  const fetchPatients = useCallback(
    debounce(async (query: string): Promise<void> => {
      if (query.trim().length < 2) {
        setPatients([]);
        return;
      }

      const token = localStorage.getItem('access_token');
      
      // ✅ Vérifier auth : token ≥ 40 caractères
      if (!token || token === 'null' || token === 'undefined' || token.length < 40) {
        setIsAuthenticatedState(false);
        showNotification(
          'error', 
          'Authentification requise', 
          'Veuillez vous connecter pour rechercher des patients.',
          ['Cliquez sur "Se connecter" pour continuer']
        );
        setLoading(false);
        return;
      }

      setIsAuthenticatedState(true);
      setLoading(true);

      try {
        const response = await fetch(`http://localhost:8000/api/patients?search=${encodeURIComponent(query)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`,
          },
        });

        if (response.status === 401) {
          setIsAuthenticatedState(false);
          showNotification(
            'error', 
            'Session expirée', 
            'Votre session a expiré. Veuillez vous reconnecter.',
            ['Cliquez sur "Se connecter" pour continuer']
          );
          setLoading(false);
          return;
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const results = data.results || data || [];
        setPatients(results);

        if (results.length > 0) {
          showNotification('info', 'Recherche effectuée', `${results.length} patient(s) trouvé(s)`);
        }
        
      } catch (err: any) {
        setIsAuthenticatedState(false);
        showNotification(
          'error', 
          'Erreur de recherche', 
          'Impossible de récupérer les patients.',
          [err.message || 'Vérifiez la console (F12) pour plus de détails']
        );
        setPatients([]);
      } finally {
        setLoading(false);
      }
    }, 500),
    [navigate]
  );

  // ✅ Fonction pour récupérer l'historique des consultations
  const fetchConsultationHistory = useCallback(async (patientId: number): Promise<void> => {
    const token = localStorage.getItem('access_token');
    
    if (!token || token === 'null' || token === 'undefined' || token.length < 40) {
      showNotification('error', 'Session requise', 'Veuillez vous reconnecter.');
      return;
    }

    setHistoryLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/patients/${patientId}/consultations/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        showNotification('error', 'Session expirée', 'Veuillez vous reconnecter.');
        setHistoryLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const history = Array.isArray(data) ? data : (data.results || []);
      
      setConsultationHistory(history);
      
      if (history.length > 0) {
        showNotification('info', 'Historique chargé', `${history.length} consultation(s) trouvée(s)`);
      }
    } catch (err: any) {
      setConsultationHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // 🔁 Déclencher la recherche quand searchQuery change
  useEffect(() => {
    fetchPatients(searchQuery);
  }, [searchQuery, fetchPatients]);

  // ✅ Vérifier auth au montage du composant
  useEffect(() => {
    const isAuth = checkAuth();
    setIsAuthenticatedState(isAuth);
  }, []);

  // 🧹 Nettoyer le debounce au démontage
  useEffect(() => {
    return () => { fetchPatients.cancel(); };
  }, [fetchPatients]);

  // ✅ Fonction pour sélectionner un patient (REDIRECTION AUTO)
  const handleSelectPatient = (patient: Patient) => {
    const token = localStorage.getItem('access_token');
    
    if (!token || token === 'null' || token === 'undefined' || token.length < 40) {
      showNotification('error', 'Session requise', 'Veuillez vous reconnecter pour sélectionner un patient.');
      return;
    }

    // 💾 Sauvegarder l'ID du patient pour la session
    localStorage.setItem('current_patient_id', patient.id.toString());
    localStorage.setItem('current_patient_name', `${patient.nom} ${patient.prenoms}`);
    
    // ✅ Sélectionner le patient pour afficher son historique
    setSelectedPatient(patient);
    
    // 🔔 Notification de confirmation
    showNotification(
      'success',
      'Patient sélectionné',
      `Redirection vers le service médical pour ${patient.nom} ${patient.prenoms}...`,
      [`🆔 ID: ${patient.id}`, `📞 ${patient.telephone}`]
    );
    
    // 📋 Charger l'historique des consultations (en arrière-plan)
    fetchConsultationHistory(patient.id);
    
    // 🔄 REDIRECTION AUTOMATIQUE vers la sélection du service médecin
    setTimeout(() => {
      navigate('/verify-and-choose-service', {
        state: {
          patientId: patient.id,
          patientName: `${patient.nom} ${patient.prenoms}`,
          patientCode: patient.code_patient
        }
      });
    }, 1500); // Attendre 1.5 secondes pour que la notification s'affiche
  };

  // ✅ Fonction pour consulter directement (bouton "Consulter" dans l'historique)
  const handleConsultNow = (patient: Patient) => {
    const token = localStorage.getItem('access_token');
    
    if (!token || token === 'null' || token === 'undefined' || token.length < 40) {
      showNotification('error', 'Session requise', 'Veuillez vous reconnecter.');
      return;
    }

    // 💾 Sauvegarder le contexte patient
    localStorage.setItem('current_patient_id', patient.id.toString());
    localStorage.setItem('current_patient_name', `${patient.nom} ${patient.prenoms}`);
    
    // 🔄 Redirection vers la sélection du service médecin
    navigate('/verify-and-choose-service', {
      state: {
        patientId: patient.id,
        patientName: `${patient.nom} ${patient.prenoms}`,
        patientCode: patient.code_patient
      }
    });
  };

  // =============================================================================
  // STYLES
  // =============================================================================
  const styles: Record<string, CSSProperties> = {
    main: { 
      minHeight: '100vh', backgroundColor: '#D6EFFF', padding: '40px 20px', 
      fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center' 
    },
    container: { 
      backgroundColor: '#ffffff', width: '100%', maxWidth: '1100px', borderRadius: '20px', 
      padding: '40px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', position: 'relative' 
    },
    header: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px', borderBottom: '2px solid #f1f5f9', paddingBottom: '20px' },
    title: { fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: 0 },
    sectionHeader: { color: '#16a34a', fontSize: '14px', fontWeight: '800', borderLeft: '4px solid #16a34a', paddingLeft: '12px', margin: '25px 0 20px 0', textTransform: 'uppercase' },
    searchBox: { marginBottom: '35px', position: 'relative' },
    label: { display: 'block', fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '10px' },
    input: { width: '100%', padding: '14px 20px 14px 45px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '16px', outline: 'none', color: '#0f172a', transition: 'border-color 0.2s', boxSizing: 'border-box' },
    searchIcon: { position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '18px', pointerEvents: 'none' },
    table: { width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' },
    th: { textAlign: 'left', padding: '12px 15px', color: '#dc2626', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' },
    td: { padding: '15px', backgroundColor: '#f8fafc', color: '#334155', fontSize: '15px', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' },
    refBadge: { backgroundColor: '#e0f2fe', color: '#0369a1', padding: '6px 10px', borderRadius: '6px', fontWeight: '700', fontSize: '13px', fontFamily: 'monospace' },
    backBtn: { alignSelf: 'flex-start', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#1e40af', padding: '8px 16px', borderRadius: '10px', transition: 'background-color 0.2s' },
    continueBtn: { backgroundColor: '#16a34a', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700', transition: 'background-color 0.2s' },
    consultBtn: { backgroundColor: '#059669', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600' },
    statusText: { textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '15px' },
    emptyState: { textAlign: 'center', padding: '40px 20px', color: '#94a3b8' },
    authWarning: { 
      background: '#fff7ed', border: '1px solid #fdba74', color: '#c2410c', 
      padding: '12px 16px', borderRadius: '8px', marginBottom: '20px',
      display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px'
    },
    historySection: {
      marginTop: '40px',
      paddingTop: '25px',
      borderTop: '2px solid #e2e8f0',
    },
    historyCard: {
      backgroundColor: '#f8fafc',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '15px',
      borderLeft: '4px solid #3b82f6',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    },
    historyHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '12px',
      flexWrap: 'wrap',
      gap: '10px',
    },
    historyDate: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '13px',
      color: '#64748b',
      fontWeight: '600',
    },
    historyService: {
      backgroundColor: '#dbeafe',
      color: '#1e40af',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
    },
    historyContent: {
      fontSize: '14px',
      color: '#334155',
      lineHeight: '1.5',
    },
    historyDoctor: {
      fontSize: '13px',
      color: '#64748b',
      marginTop: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    historyActions: {
      display: 'flex',
      gap: '10px',
      marginTop: '15px',
      justifyContent: 'flex-end',
    },
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <main style={styles.main}>
      {/* 🔔 Notification */}
      {notification.show && (
        <div style={getNotificationStyles()} role="alert">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ fontSize: '20px', marginTop: '2px' }}>
              {notification.type === 'success' && '✅'}
              {notification.type === 'error' && '⚠️'}
              {notification.type === 'info' && '🔍'}
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{notification.title}</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.9 }}>{notification.message}</p>
              {notification.details?.map((detail, idx) => (
                <li key={idx} style={{ margin: '4px 0 0 16px', fontSize: '12px' }}>{detail}</li>
              ))}
            </div>
            <button onClick={() => setNotification(prev => ({ ...prev, show: false }))}
              style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', opacity: 0.6 }}>×</button>
          </div>
        </div>
      )}

      <button style={styles.backBtn} onClick={() => navigate('/patient')}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
        <FaArrowLeft /> Retour au tableau de bord
      </button>

      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>🔍 Gestion des Dossiers Patients</h2>
        </div>

        {/* ⚠️ Avertissement si non authentifié */}
        {!isAuthenticatedState && (
          <div style={styles.authWarning}>
            <span>⚠️</span>
            <div>
              <strong>Session non authentifiée</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
                La recherche est désactivée. <button 
                  onClick={() => navigate('/login')}
                  style={{ background: 'none', border: 'none', color: '#c2410c', textDecoration: 'underline', cursor: 'pointer', fontWeight: '600' }}
                >
                  Se connecter
                </button> pour accéder à toutes les fonctionnalités.
              </p>
            </div>
          </div>
        )}

        {/* 🔍 Zone de recherche */}
        <div style={styles.sectionHeader}>Rechercher un dossier</div>
        <div style={styles.searchBox}>
          <label style={styles.label}>Nom, Prénom ou Code PAT...</label>
          <span style={styles.searchIcon}><FaSearch /></span>
          <input 
            style={{
              ...styles.input,
              opacity: !isAuthenticatedState ? 0.6 : 1,
              cursor: !isAuthenticatedState ? 'not-allowed' : 'text'
            }} 
            type="text" 
            placeholder="Ex: Salomon ou PAT-2026..."
            value={searchQuery} 
            onChange={(e) => isAuthenticatedState && setSearchQuery(e.target.value)} 
            disabled={loading || !isAuthenticatedState} 
          />
        </div>

        {loading && (
          <div style={styles.statusText}>
            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: '8px' }}>🔄</span>
            Recherche en cours...
          </div>
        )}

        {/* 📋 Résultats de recherche */}
        {patients.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Réf.</th>
                  <th style={styles.th}>Nom & Prénoms</th>
                  <th style={styles.th}>Sexe/Âge</th>
                  <th style={styles.th}>Téléphone</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id} style={{ transition: 'background-color 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ ...styles.td, borderRadius: '12px 0 0 12px' }}>
                      <span style={styles.refBadge}>{p.code_patient || `PAT-${String(p.id).padStart(6, '0')}`}</span>
                    </td>
                    <td style={{ ...styles.td, fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FaUser style={{ color: '#94a3b8', fontSize: '14px' }} /> {p.nom} {p.prenoms}
                    </td>
                    <td style={styles.td}>
                      <span style={{ 
                        backgroundColor: p.sexe === 'M' ? '#dbeafe' : '#fce7f3',
                        color: p.sexe === 'M' ? '#1e40af' : '#9d174d',
                        padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600'
                      }}>{p.sexe === 'M' ? 'M' : 'F'}</span> {p.age} ans
                    </td>
                    <td style={{ ...styles.td, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaPhone style={{ color: '#94a3b8', fontSize: '12px' }} /> {p.telephone}
                    </td>
                    <td style={{ ...styles.td, borderRadius: '0 12px 12px 0' }}>
                      <button 
                        style={{
                          ...styles.continueBtn,
                          opacity: !isAuthenticatedState ? 0.6 : 1,
                          cursor: !isAuthenticatedState ? 'not-allowed' : 'pointer'
                        }} 
                        onClick={() => isAuthenticatedState && handleSelectPatient(p)}
                        onMouseEnter={(e) => {
                          if (isAuthenticatedState) {
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#15803d';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (isAuthenticatedState) {
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#16a34a';
                          }
                        }}
                        disabled={!isAuthenticatedState}
                      >
                        <FaFolderOpen /> Consulter
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : !loading && searchQuery.length >= 2 ? (
          <div style={styles.emptyState}>
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>📭 Aucun patient trouvé pour "{searchQuery}"</p>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>Vérifiez l'orthographe ou essayez un autre terme.</p>
          </div>
        ) : !loading && patients.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>Tapez au moins 2 caractères pour rechercher.</p>
          </div>
        ) : null}

        {/* ✅ Section Historique des Consultations (en bas) */}
        {selectedPatient && (
          <div style={styles.historySection}>
            <div style={styles.sectionHeader}>
              <FaFileMedical /> Historique de {selectedPatient.nom} {selectedPatient.prenoms}
            </div>

            {historyLoading ? (
              <div style={styles.statusText}>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: '8px' }}>🔄</span>
                Chargement de l'historique...
              </div>
            ) : consultationHistory.length > 0 ? (
              <div>
                {consultationHistory.map((consult) => (
                  <div key={consult.id} style={styles.historyCard}>
                    <div style={styles.historyHeader}>
                      <div style={styles.historyDate}>
                        <FaCalendar /> {new Date(consult.date_consultation).toLocaleDateString('fr-FR', {
                          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                      <span style={styles.historyService}>
                        {consult.service_display || consult.service}
                      </span>
                    </div>
                    
                    <div style={styles.historyContent}>
                      <strong>Motif :</strong> {consult.motif_consultation}
                      {consult.observations_cliniques && (
                        <>
                          <br /><strong>Observations :</strong> {consult.observations_cliniques.slice(0, 150)}
                          {consult.observations_cliniques.length > 150 && '...'}
                        </>
                      )}
                    </div>
                    
                    <div style={styles.historyDoctor}>
                      <FaUser /> {consult.nom_soignant} • {consult.centre_medical}
                    </div>
                    
                    <div style={styles.historyActions}>
                      <button 
                        style={styles.consultBtn}
                        onClick={() => handleConsultNow(selectedPatient)}
                        onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#047857'}
                        onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#059669'}
                      >
                        <FaFolderOpen /> Consulter maintenant
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.emptyState}>
                <p style={{ fontSize: '14px', color: '#94a3b8' }}>
                  Aucune consultation enregistrée pour ce patient.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}