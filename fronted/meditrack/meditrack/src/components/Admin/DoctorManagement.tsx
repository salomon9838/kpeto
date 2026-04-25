import React, { useState, useEffect, CSSProperties } from 'react';
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaKey, FaSearch, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes, FaRedo, FaLock } from 'react-icons/fa';

// =============================================================================
// TYPES
// =============================================================================
interface Doctor {
  id: number;
  username: string;
  full_name: string;
  email: string;
  matricule: string;
  specialty: string;
  is_active: boolean;
  phone: string;
}

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationState {
  show: boolean;
  type: NotificationType;
  title: string;
  message: string;
  details?: string[];
}

interface FormData {
  username: string;
  password: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  specialty: string;
  matricule: string;
}

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================
const DoctorManagement: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState<string>('');

  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    specialty: '',
    matricule: '',
  });

  const [notification, setNotification] = useState<NotificationState>({
    show: false, type: 'info', title: '', message: '', details: []
  });

  // 🎯 Fonction notification
  const showNotification = (type: NotificationType, title: string, message: string, details?: string[]) => {
    setNotification({ show: true, type, title, message, details });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 6000);
  };

  // 🎨 Styles notification
  const getNotificationStyles = (): CSSProperties => {
    const colors: Record<NotificationType, { bg: string; border: string; text: string }> = {
      success: { bg: '#f0fdf4', border: '#22c55e', text: '#166534' },
      error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
      info: { bg: '#eff6ff', border: '#0d9488', text: '#1e40af' },
      warning: { bg: '#fff7ed', border: '#f97316', text: '#9a3412' },
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

  // 🔐 Récupérer le token ET vérifier le rôle
  const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role');
    
    if (!token || token === 'null' || token === 'undefined') {
      return null;
    }
    
    // Vérifier si l'utilisateur est admin
    if (role !== 'admin') {
      showNotification(
        'error', 
        'Accès refusé', 
        'Vous devez être administrateur pour accéder à cette page.',
        ['Votre rôle actuel: ' + (role || 'non défini')]
      );
      return null;
    }
    
    return token;
  };

  // 🔍 Fonction utilitaire pour parser les réponses
  const parseApiResponse = async (response: Response) => {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        throw new Error(`Réponse inattendue: ${text.substring(0, 200)}`);
      }
    }
  };

  // ✅ Vérifier les permissions au montage
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role');
    setUserRole(role || '');
    
    if (!token) {
      showNotification(
        'error', 
        'Non authentifié', 
        'Veuillez vous connecter en tant qu\'administrateur.',
        ['Redirection vers la page de connexion...']
      );
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return;
    }
    
    if (role !== 'admin') {
      showNotification(
        'error', 
        'Permission refusée', 
        'Seuls les administrateurs peuvent accéder à cette page.',
        [`Votre rôle: ${role || 'inconnu'}`, 'Rôle requis: admin']
      );
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 3000);
      return;
    }
    
    // Charger les médecins
    fetchDoctors();
  }, []);

  // ✅ Charger la liste des médecins
  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        showNotification('error', 'Session expirée', 'Veuillez vous reconnecter.');
        return;
      }

      console.log('📡 Requête GET /api/admin/doctors/ avec token:', token.substring(0, 20) + '...');

      const response = await fetch('http://localhost:8000/api/admin/doctors/', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📥 Réponse status:', response.status);

      if (response.ok) {
        const data = await parseApiResponse(response);
        console.log('✅ Médecins récupérés:', data.length);
        setDoctors(Array.isArray(data) ? data : []);
      } else if (response.status === 401) {
        showNotification('error', 'Session expirée', 'Veuillez vous reconnecter.');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_role');
        setTimeout(() => window.location.href = '/login', 2000);
      } else if (response.status === 403) {
        const errorData = await parseApiResponse(response).catch(() => ({}));
        showNotification(
          'error', 
          'Permission refusée', 
          errorData.detail || 'Vous n\'avez pas la permission d\'accéder à cette ressource.',
          ['Vérifiez que vous êtes connecté en tant qu\'administrateur']
        );
      } else {
        const errorData = await parseApiResponse(response).catch(() => ({}));
        console.error('❌ Erreur API:', errorData);
        showNotification('error', 'Erreur de chargement', errorData.detail || errorData.error || 'Impossible de récupérer la liste des médecins.');
      }
    } catch (err: any) {
      console.error('❌ Erreur fetch doctors:', err);
      showNotification('error', 'Erreur réseau', err.message || 'Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Soumettre le formulaire (Créer/Modifier)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const token = localStorage.getItem('access_token');
    if (!token) {
      showNotification('error', 'Session expirée', 'Veuillez vous reconnecter.');
      return;
    }

    // Validation
    if (!formData.username.trim() || !formData.email.trim() || !formData.specialty.trim() || !formData.matricule.trim()) {
      showNotification('error', 'Champs obligatoires', 'Veuillez remplir tous les champs marqués d\'une étoile.');
      return;
    }

    if (!editingDoctor && formData.password.length < 8) {
      showNotification('error', 'Mot de passe faible', 'Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    const headers = {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json'
    };

    let url, method, payload;

    if (editingDoctor) {
      url = `http://localhost:8000/api/admin/doctors/${editingDoctor.id}/`;
      method = 'PATCH';
      payload = {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        specialty: formData.specialty,
      };
    } else {
      url = 'http://localhost:8000/api/auth/register/doctor/';
      method = 'POST';
      payload = {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        matricule: formData.matricule,
        specialty: formData.specialty,
      };
    }

    try {
      console.log(`📤 ${method} ${url}`, payload);
      
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      console.log('📥 Réponse status:', response.status);

      if (response.ok) {
        const data = await parseApiResponse(response);
        await fetchDoctors();
        closeModal();
        showNotification(
          'success',
          editingDoctor ? 'Médecin modifié' : 'Médecin créé',
          data.message || (editingDoctor 
            ? `✅ ${formData.first_name} ${formData.last_name} a été mis à jour.`
            : `✅ ${formData.username} a été ajouté avec succès.`)
        );
      } else if (response.status === 401) {
        showNotification('error', 'Session expirée', 'Veuillez vous reconnecter.');
        localStorage.removeItem('access_token');
        setTimeout(() => window.location.href = '/login', 2000);
      } else if (response.status === 403) {
        showNotification('error', 'Permission refusée', 'Vous n\'avez pas la permission d\'effectuer cette action.');
      } else {
        const errorData = await parseApiResponse(response).catch(() => ({}));
        const errorMsg = errorData.error || errorData.detail || errorData.non_field_errors?.[0] || JSON.stringify(errorData);
        console.error('❌ Erreur:', errorData);
        showNotification('error', 'Échec de l\'opération', errorMsg);
      }
    } catch (err: any) {
      console.error('❌ Erreur réseau:', err);
      showNotification('error', 'Erreur réseau', err.message || 'Impossible de contacter le serveur.');
    }
  };

  // ✅ Supprimer un médecin
  const handleDelete = async (id: number, doctorName: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le médecin "${doctorName}" ?`)) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      showNotification('error', 'Session expirée', 'Veuillez vous reconnecter.');
      return;
    }

    setActionLoading(id);
    try {
      const response = await fetch(`http://localhost:8000/api/admin/doctors/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` }
      });

      if (response.ok) {
        const data = await parseApiResponse(response);
        await fetchDoctors();
        showNotification('success', 'Médecin supprimé', data.message || `✅ ${doctorName} a été supprimé.`);
      } else if (response.status === 401) {
        showNotification('error', 'Session expirée', 'Veuillez vous reconnecter.');
        localStorage.removeItem('access_token');
        setTimeout(() => window.location.href = '/login', 2000);
      } else if (response.status === 403) {
        showNotification('error', 'Permission refusée', 'Vous n\'avez pas la permission de supprimer ce médecin.');
      } else {
        const errorData = await parseApiResponse(response).catch(() => ({}));
        showNotification('error', 'Échec de la suppression', errorData.error || errorData.detail || 'Impossible de supprimer ce médecin.');
      }
    } catch (err: any) {
      console.error('❌ Erreur delete:', err);
      showNotification('error', 'Erreur réseau', err.message || 'Impossible de contacter le serveur.');
    } finally {
      setActionLoading(null);
    }
  };

  // ✅ Toggle actif/inactif
  const handleToggleActive = async (doctor: Doctor) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      showNotification('error', 'Session expirée', 'Veuillez vous reconnecter.');
      return;
    }

    setActionLoading(doctor.id);
    try {
      const response = await fetch(
        `http://localhost:8000/api/admin/doctors/${doctor.id}/toggle_active/`,
        { 
          method: 'PATCH', 
          headers: { 
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      if (response.ok) {
        const data = await parseApiResponse(response);
        await fetchDoctors();
        showNotification(
          'success',
          data.message || (doctor.is_active ? 'Médecin désactivé' : 'Médecin activé'),
          data.message || `✅ ${doctor.full_name} est maintenant ${doctor.is_active ? 'inactif' : 'actif'}.`
        );
      } else if (response.status === 401) {
        showNotification('error', 'Session expirée', 'Veuillez vous reconnecter.');
        localStorage.removeItem('access_token');
        setTimeout(() => window.location.href = '/login', 2000);
      } else if (response.status === 403) {
        showNotification('error', 'Permission refusée', 'Vous n\'avez pas la permission de modifier ce médecin.');
      } else {
        const errorData = await parseApiResponse(response).catch(() => ({}));
        showNotification('error', 'Échec', errorData.error || errorData.detail || 'Impossible de modifier le statut.');
      }
    } catch (err: any) {
      console.error('❌ Erreur toggle:', err);
      showNotification('error', 'Erreur réseau', err.message || 'Impossible de contacter le serveur.');
    } finally {
      setActionLoading(null);
    }
  };

  // ✅ Changer le mot de passe
  const handleChangePassword = async () => {
    if (!selectedDoctorId || newPassword.length < 8) {
      showNotification('error', 'Mot de passe faible', 'Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      showNotification('error', 'Session expirée', 'Veuillez vous reconnecter.');
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/api/admin/doctors/${selectedDoctorId}/change_password/`,
        {
          method: 'PATCH',
          headers: { 
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ new_password: newPassword }),
        }
      );

      if (response.ok) {
        const data = await parseApiResponse(response);
        setShowPasswordModal(false);
        setNewPassword('');
        setSelectedDoctorId(null);
        showNotification('success', data.message || 'Mot de passe changé', data.message || '✅ Le mot de passe a été mis à jour avec succès.');
      } else if (response.status === 401) {
        showNotification('error', 'Session expirée', 'Veuillez vous reconnecter.');
        localStorage.removeItem('access_token');
        setTimeout(() => window.location.href = '/login', 2000);
      } else if (response.status === 403) {
        showNotification('error', 'Permission refusée', 'Vous n\'avez pas la permission de changer ce mot de passe.');
      } else {
        const errorData = await parseApiResponse(response).catch(() => ({}));
        showNotification('error', 'Échec', errorData.error || errorData.detail || 'Impossible de changer le mot de passe.');
      }
    } catch (err: any) {
      console.error('❌ Erreur password:', err);
      showNotification('error', 'Erreur réseau', err.message || 'Impossible de contacter le serveur.');
    }
  };

  // ✅ Ouvrir/Fermer modal
  const openModal = (doctor?: Doctor) => {
    if (doctor) {
      setEditingDoctor(doctor);
      const nameParts = doctor.full_name.split(' ');
      setFormData({
        username: doctor.username,
        password: '',
        email: doctor.email,
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
        phone: doctor.phone || '',
        specialty: doctor.specialty,
        matricule: doctor.matricule,
      });
    } else {
      setEditingDoctor(null);
      setFormData({
        username: '', password: '', email: '', first_name: '', last_name: '',
        phone: '', specialty: '', matricule: '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDoctor(null);
    setFormData({
      username: '', password: '', email: '', first_name: '', last_name: '',
      phone: '', specialty: '', matricule: '',
    });
  };

  // ✅ Labels de spécialités
  const specialtyLabels: Record<string, string> = {
    ophtalmo: '👁️ Ophtalmologie',
    chirurgie: '🔪 Chirurgie',
    urologie: '🧪 Urologie',
    cardiologie: '❤️ Cardiologie',
    general: '🩺 Médecine Générale',
  };

  // 🔍 Filtrage
  const filteredDoctors = doctors.filter(doc => 
    doc.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // =============================================================================
  // STYLES (inchangés - voir code précédent)
  // =============================================================================
  const styles: Record<string, CSSProperties> = {
    page: { minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', system-ui, -apple-system, sans-serif", padding: '20px' },
    header: { background: '#0d9488', color: 'white', padding: '20px 30px', borderRadius: '12px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
    headerTitle: { margin: 0, fontSize: '24px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' },
    backBtn: { background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', transition: 'background 0.2s' },
    searchContainer: { marginBottom: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' },
    searchInput: { padding: '10px 15px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', width: '300px', transition: 'border-color 0.2s' },
    addBtn: { background: '#0d9488', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s' },
    card: { background: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { padding: '15px', textAlign: 'left' as const, borderBottom: '2px solid #e2e8f0', background: '#f8fafc', fontWeight: '600', color: '#475569', fontSize: '13px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
    td: { padding: '15px', borderBottom: '1px solid #f1f5f9', color: '#334155' },
    actionBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '5px', borderRadius: '4px', transition: 'background 0.2s', marginRight: '8px' },
    modalOverlay: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalContent: { background: 'white', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
    modalTitle: { marginBottom: '20px', fontSize: '20px', fontWeight: '700', color: '#1e293b' },
    formGroup: { display: 'flex', flexDirection: 'column' as const, gap: '6px', marginBottom: '15px' },
    label: { fontWeight: '600', fontSize: '14px', color: '#475569' },
    input: { padding: '12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s', width: '100%', boxSizing: 'border-box' as const },
    select: { padding: '12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: 'white', transition: 'border-color 0.2s', width: '100%', boxSizing: 'border-box' as const },
    buttonGroup: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' },
    btnCancel: { background: '#f1f5f9', color: '#64748b', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
    btnSave: { background: '#0d9488', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
    notification: { position: 'fixed' as const, top: '20px', right: '20px', zIndex: 9999, padding: '16px 20px', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', borderLeft: '5px solid', backgroundColor: 'white', maxWidth: '450px', minWidth: '350px', display: 'flex', alignItems: 'flex-start', gap: '12px', animation: 'slideIn 0.3s ease-out' },
  };

  // =============================================================================
  // RENDER
  // =============================================================================
  return (
    <div style={styles.page}>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input:focus, select:focus { border-color: #0d9488 !important; box-shadow: 0 0 0 4px rgba(13, 148, 136, 0.1) !important; }
        tr:hover { background-color: #f8fafc !important; }
        .action-btn:hover { background-color: #f1f5f9 !important; }
      `}</style>

      {/* 🔔 Notification */}
      {notification.show && (
        <div style={getNotificationStyles()} role="alert">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ fontSize: '18px', marginTop: '1px', color: notification.type === 'error' ? '#ef4444' : notification.type === 'success' ? '#22c55e' : notification.type === 'warning' ? '#f97316' : '#0d9488' }}>
              {notification.type === 'success' && <FaCheckCircle size={18} />}
              {notification.type === 'error' && <FaExclamationTriangle size={18} />}
              {notification.type === 'warning' && <FaLock size={18} />}
              {notification.type === 'info' && <FaInfoCircle size={18} />}
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{notification.title}</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.9 }}>{notification.message}</p>
              {notification.details?.map((d, i) => (
                <div key={i} style={{ margin: '2px 0 0 0', fontSize: '12px' }}>• {d}</div>
              ))}
            </div>
            <button onClick={() => setNotification(p => ({ ...p, show: false }))} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', opacity: 0.6, color: 'inherit' }}>
              <FaTimes size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>
          🔒 Panel Administrateur
        </h1>
        <button
          onClick={() => window.history.back()}
          style={styles.backBtn}
          onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.3)'}
          onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.2)'}
        >
          ← Retour
        </button>
      </header>

      {/* Contenu principal */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ background: '#0d9488', color: 'white', padding: '20px 30px', borderRadius: '12px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            👨‍⚕️ Gestion des Médecins
          </h2>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            {userRole === 'admin' ? '✅ Administrateur' : `⚠️ Rôle: ${userRole || 'Inconnu'}`}
          </div>
        </div>

        {/* Barre de recherche + Bouton Ajouter */}
        <div style={styles.searchContainer}>
          <div style={{ position: 'relative', width: '300px' }}>
            <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Rechercher un médecin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ ...styles.searchInput, paddingLeft: '38px' }}
            />
          </div>
          <button
            onClick={() => openModal()}
            style={styles.addBtn}
            onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0f766e'}
            onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0d9488'}
          >
            <FaPlus /> Ajouter un médecin
          </button>
        </div>

        {/* Tableau */}
        <div style={styles.card}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              <FaRedo size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '10px' }} />
              Chargement...
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              {searchTerm ? `Aucun résultat pour "${searchTerm}"` : 'Aucun médecin trouvé.'}
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} style={{ ...styles.btnCancel, marginTop: '10px' }}>
                  Effacer la recherche
                </button>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Nom Complet</th>
                    <th style={styles.th}>Matricule</th>
                    <th style={styles.th}>Spécialité</th>
                    <th style={styles.th}>Téléphone</th>
                    <th style={styles.th}>Statut</th>
                    <th style={{ ...styles.th, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDoctors.map((doctor) => (
                    <tr key={doctor.id}>
                      <td style={styles.td}>{doctor.id}</td>
                      <td style={styles.td}>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{doctor.full_name}</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{doctor.username}</div>
                      </td>
                      <td style={styles.td}>{doctor.matricule}</td>
                      <td style={styles.td}>{specialtyLabels[doctor.specialty] || doctor.specialty}</td>
                      <td style={styles.td}>{doctor.phone || '-'}</td>
                      <td style={styles.td}>
                        <button
                          onClick={() => handleToggleActive(doctor)}
                          disabled={actionLoading === doctor.id}
                          style={{
                            ...styles.actionBtn,
                            color: doctor.is_active ? '#22c55e' : '#ef4444',
                            opacity: actionLoading === doctor.id ? 0.5 : 1,
                            cursor: actionLoading === doctor.id ? 'not-allowed' : 'pointer',
                          }}
                          className="action-btn"
                          title={doctor.is_active ? 'Désactiver' : 'Activer'}
                        >
                          {actionLoading === doctor.id ? (
                            <FaRedo size={18} style={{ animation: 'spin 1s linear infinite' }} />
                          ) : doctor.is_active ? (
                            <FaToggleOn size={24} />
                          ) : (
                            <FaToggleOff size={24} />
                          )}
                        </button>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <button onClick={() => openModal(doctor)} disabled={actionLoading === doctor.id} style={{ ...styles.actionBtn, color: '#f59e0b' }} className="action-btn" title="Modifier">
                          <FaEdit />
                        </button>
                        <button onClick={() => { setSelectedDoctorId(doctor.id); setShowPasswordModal(true); }} disabled={actionLoading === doctor.id} style={{ ...styles.actionBtn, color: '#8b5cf6' }} className="action-btn" title="Changer mot de passe">
                          <FaKey />
                        </button>
                        <button onClick={() => handleDelete(doctor.id, doctor.full_name)} disabled={actionLoading === doctor.id} style={{ ...styles.actionBtn, color: '#ef4444' }} className="action-btn" title="Supprimer">
                          {actionLoading === doctor.id ? (
                            <FaRedo size={18} style={{ animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <FaTrash />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals (Ajouter/Modifier + Password) - Code identique au précédent */}
      {/* ... (mêmes modals que précédemment) ... */}
      
      {/* Modal Ajouter/Modifier */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>{editingDoctor ? '✏️ Modifier le médecin' : '➕ Ajouter un médecin'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nom d'utilisateur <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required style={styles.input} disabled={loading} />
              </div>
              {!editingDoctor && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Mot de passe <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="password" placeholder="Min. 8 caractères" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required style={styles.input} disabled={loading} />
                </div>
              )}
              <div style={styles.formGroup}>
                <label style={styles.label}>Email <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required style={styles.input} disabled={loading} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Prénom <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required style={styles.input} disabled={loading} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nom <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} required style={styles.input} disabled={loading} />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Téléphone</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} style={styles.input} disabled={loading} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Matricule <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" value={formData.matricule} onChange={(e) => setFormData({ ...formData, matricule: e.target.value })} required style={styles.input} disabled={loading} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Spécialité <span style={{ color: '#ef4444' }}>*</span></label>
                <select value={formData.specialty} onChange={(e) => setFormData({ ...formData, specialty: e.target.value })} required style={styles.select} disabled={loading}>
                  <option value="">Sélectionnez une spécialité</option>
                  <option value="ophtalmo">👁️ Ophtalmologie</option>
                  <option value="chirurgie">🔪 Chirurgie</option>
                  <option value="urologie">🧪 Urologie</option>
                  <option value="cardiologie">❤️ Cardiologie</option>
                  <option value="general">🩺 Médecine Générale</option>
                </select>
              </div>
              <div style={styles.buttonGroup}>
                <button type="button" onClick={closeModal} disabled={loading} style={{ ...styles.btnCancel, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>Annuler</button>
                <button type="submit" disabled={loading} style={{ ...styles.btnSave, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? (<><FaRedo size={16} style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} /> Traitement...</>) : (<>{editingDoctor ? '✏️ Modifier' : '➕ Créer'}</>)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Changer Mot de Passe */}
      {showPasswordModal && (
        <div style={styles.modalOverlay} onClick={() => setShowPasswordModal(false)}>
          <div style={{ ...styles.modalContent, maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>🔑 Changer le mot de passe</h3>
            <div style={styles.formGroup}>
              <label style={styles.label}>Nouveau mot de passe <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="password" placeholder="Min. 8 caractères" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={styles.input} disabled={loading} />
            </div>
            <div style={styles.buttonGroup}>
              <button onClick={() => { setShowPasswordModal(false); setNewPassword(''); setSelectedDoctorId(null); }} disabled={loading} style={{ ...styles.btnCancel, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>Annuler</button>
              <button onClick={handleChangePassword} disabled={loading || newPassword.length < 8} style={{ ...styles.btnSave, backgroundColor: '#8b5cf6', opacity: (loading || newPassword.length < 8) ? 0.7 : 1, cursor: (loading || newPassword.length < 8) ? 'not-allowed' : 'pointer' }}>
                {loading ? (<><FaRedo size={16} style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} /> Traitement...</>) : ('💾 Changer')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorManagement;