import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaKey } from 'react-icons/fa';

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

const DoctorManagement: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    specialty: '',
    matricule: '',
  });

  // ✅ useEffect pour charger les médecins au montage
  useEffect(() => {
    fetchDoctors();
  }, []);

  // ✅ Fonction pour récupérer la liste des médecins
  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('http://localhost:8000/api/admin/doctors/', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // ✅ Mise à jour explicite du state pour forcer le re-render
        setDoctors([]); // Clear first
        setTimeout(() => setDoctors(Array.isArray(data) ? data : []), 0); // Then set
      }
    } catch (err) {
      console.error('Erreur fetch doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ handleSubmit CORRIGÉE : création + rafraîchissement immédiat
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('❌ Session expirée. Veuillez vous reconnecter.');
      return;
    }

    const headers = {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json'
    };

    let url, method, payload;

    if (editingDoctor) {
      // Modification
      url = `http://localhost:8000/api/admin/doctors/${editingDoctor.id}/`;
      method = 'PUT';
      payload = {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        specialty: formData.specialty,
      };
    } else {
      // ✅ CRÉATION : endpoint register-doctor
      url = 'http://localhost:8000/api/admin/register-doctor/';
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
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ RAFRAÎCHIR IMMÉDIATEMENT LA LISTE
        await fetchDoctors();
        closeModal();
        alert(editingDoctor ? '✅ Médecin modifié !' : '✅ Médecin créé avec succès !');
      } else {
        const errorMsg = data.error || data.detail || JSON.stringify(data);
        alert(`❌ Erreur : ${errorMsg}`);
      }
    } catch (err) {
      console.error('Erreur réseau:', err);
      alert('❌ Impossible de contacter le serveur.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce médecin ?')) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:8000/api/admin/doctors/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` }
      });

      if (response.ok) {
        await fetchDoctors(); // ✅ Rafraîchir après suppression
      }
    } catch (err) {
      console.error('Erreur delete doctor:', err);
    }
  };

  const handleToggleActive = async (doctor: Doctor) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/admin/doctors/${doctor.id}/toggle_active/`,
        { method: 'PATCH', headers: { 'Authorization': `Token ${token}` } }
      );

      if (response.ok) {
        await fetchDoctors(); // ✅ Rafraîchir après toggle
      }
    } catch (err) {
      console.error('Erreur toggle active:', err);
    }
  };

  const handleChangePassword = async () => {
    if (!selectedDoctorId || newPassword.length < 8) {
      alert('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) return;

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
        setShowPasswordModal(false);
        setNewPassword('');
        setSelectedDoctorId(null);
        alert('Mot de passe changé avec succès');
      }
    } catch (err) {
      console.error('Erreur change password:', err);
    }
  };

  const openModal = (doctor?: Doctor) => {
    if (doctor) {
      setEditingDoctor(doctor);
      setFormData({
        username: doctor.username,
        password: '',
        email: doctor.email,
        first_name: doctor.full_name.split(' ')[0] || '',
        last_name: doctor.full_name.split(' ').slice(1).join(' ') || '',
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

  const specialtyLabels: Record<string, string> = {
    ophtalmo: '👁️ Ophtalmologie',
    chirurgie: '🔪 Chirurgie',
    urologie: '🧪 Urologie',
    cardiologie: '❤️ Cardiologie',
    general: '🩺 Médecine Générale',
  };

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
        <h1 style={{ margin: 0 }}>👨‍⚕️ Gestion des Médecins</h1>
        <button
          onClick={() => window.history.back()}
          style={{
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          ← Retour
        </button>
      </header>

      {/* Bouton Ajouter */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => openModal()}
          style={{
            background: '#27ae60',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FaPlus /> Ajouter un médecin
        </button>
      </div>

      {/* Tableau */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Chargement...
          </div>
        ) : doctors.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Aucun médecin trouvé.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8f9fa' }}>
              <tr>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>ID</th>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Nom Complet</th>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Matricule</th>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Spécialité</th>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Téléphone</th>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Statut</th>
                <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doctor) => (
                <tr key={doctor.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '15px' }}>{doctor.id}</td>
                  <td style={{ padding: '15px' }}>
                    <div style={{ fontWeight: '600' }}>{doctor.full_name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{doctor.username}</div>
                  </td>
                  <td style={{ padding: '15px' }}>{doctor.matricule}</td>
                  <td style={{ padding: '15px' }}>{specialtyLabels[doctor.specialty] || doctor.specialty}</td>
                  <td style={{ padding: '15px' }}>{doctor.phone || '-'}</td>
                  <td style={{ padding: '15px' }}>
                    <button
                      onClick={() => handleToggleActive(doctor)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.5rem',
                        color: doctor.is_active ? '#27ae60' : '#e74c3c'
                      }}
                      title={doctor.is_active ? 'Actif' : 'Inactif'}
                    >
                      {doctor.is_active ? <FaToggleOn /> : <FaToggleOff />}
                    </button>
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <button
                      onClick={() => openModal(doctor)}
                      style={{ background: 'none', border: 'none', color: '#f39c12', cursor: 'pointer', marginRight: '10px' }}
                      title="Modifier"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => { setSelectedDoctorId(doctor.id); setShowPasswordModal(true); }}
                      style={{ background: 'none', border: 'none', color: '#9b59b6', cursor: 'pointer', marginRight: '10px' }}
                      title="Changer mot de passe"
                    >
                      <FaKey />
                    </button>
                    <button
                      onClick={() => handleDelete(doctor.id)}
                      style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer' }}
                      title="Supprimer"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Ajouter/Modifier */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginBottom: '20px' }}>
              {editingDoctor ? 'Modifier le médecin' : 'Ajouter un médecin'}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input
                type="text"
                placeholder="Nom d'utilisateur"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
              {!editingDoctor && (
                <input
                  type="password"
                  placeholder="Mot de passe (min 8 caractères)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              )}
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <input
                  type="text"
                  placeholder="Prénom"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                  style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
                <input
                  type="text"
                  placeholder="Nom"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                  style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>
              <input
                type="tel"
                placeholder="Téléphone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
              <input
                type="text"
                placeholder="Matricule"
                value={formData.matricule}
                onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                required
                style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
              <select
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                required
                style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              >
                <option value="">Sélectionnez une spécialité</option>
                <option value="ophtalmo">👁️ Ophtalmologie</option>
                <option value="chirurgie">🔪 Chirurgie</option>
                <option value="urologie">🧪 Urologie</option>
                <option value="cardiologie">❤️ Cardiologie</option>
                <option value="general">🩺 Médecine Générale</option>
              </select>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    background: '#94a3b8',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{
                    background: '#27ae60',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  {editingDoctor ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Changer Mot de Passe */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '400px'
          }}>
            <h3 style={{ marginBottom: '20px' }}>Changer le mot de passe</h3>
            <input
              type="password"
              placeholder="Nouveau mot de passe (min 8 caractères)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowPasswordModal(false); setNewPassword(''); setSelectedDoctorId(null); }}
                style={{ background: '#94a3b8', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                onClick={handleChangePassword}
                style={{ background: '#9b59b6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}
              >
                Changer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorManagement;