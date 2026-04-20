import React, { useState, useEffect, CSSProperties } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/api';
import {
  FaArrowLeft,
  FaCheckCircle,
  FaIdCard,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaBriefcase,
  FaUserShield,
  FaExclamationTriangle,
} from 'react-icons/fa';

// =============================================================================
// TYPES & INTERFACES (alignés sur le modèle Django Patient)
// =============================================================================

interface PatientFormData {
  code_patient: string;        // Django: code_patient (unique)
  nom: string;
  prenoms: string;
  age: string;
  sexe: 'M' | 'F';             // Django: choix 'M' ou 'F'
  telephone: string;
  email: string;
  adresse: string;
  profession: string;
  contact_urgence_nom: string; // Django: contact_urgence_nom
  contact_urgence_tel: string; // Django: contact_urgence_tel
  est_assure: boolean;
  type_assurance?: string;     // Optionnel (champ UI uniquement si pas dans le modèle)
}

interface PatientResponse {
  id: number;
  code_patient: string;
  nom: string;
  prenoms: string;
  age: number;
  sexe: 'M' | 'F';
  telephone: string;
  adresse: string;
  profession: string;
  est_assure: boolean;
  contact_urgence_nom: string;
  contact_urgence_tel: string;
  created_at?: string;
  updated_at?: string;
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

export default function NewConsultation(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Récupérer l'ID du patient depuis le state de navigation ou l'URL
  const patientId = location.state?.patientId || new URLSearchParams(location.search).get('id');
  
  const [formData, setFormData] = useState<PatientFormData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [notification, setNotification] = useState<NotificationState>({
    show: false, type: 'info', title: '', message: '', details: []
  });

  // 🎯 Afficher une notification professionnelle
  const showNotification = (type: NotificationType, title: string, message: string, details?: string[]) => {
    setNotification({ show: true, type, title, message, details });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 6000);
  };

  // 🎨 Styles dynamiques pour la notification
  const getNotificationStyles = (): CSSProperties => {
    const base: CSSProperties = {
      position: 'fixed', top: '16px', right: '16px', zIndex: 9999,
      padding: '16px 20px', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
      borderLeft: '4px solid', maxWidth: '450px', transition: 'all 0.3s ease',
      opacity: notification.show ? 1 : 0,
      transform: notification.show ? 'translateX(0)' : 'translateX(100%)',
    };
    const colors: Record<NotificationType, { bg: string; border: string; text: string }> = {
      success: { bg: '#f0fdf4', border: '#22c55e', text: '#166534' },
      error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
      info: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
    };
    const color = colors[notification.type];
    return { ...base, backgroundColor: color.bg, borderColor: color.border, color: color.text };
  };

  // 🔍 Charger les données du patient au montage
  useEffect(() => {
    const fetchPatient = async () => {
      if (!patientId) {
        showNotification('error', 'Patient non sélectionné', 'Veuillez sélectionner un patient depuis la liste.');
        setLoading(false);
        setTimeout(() => navigate('/patients'), 2000);
        return;
      }

      try {
        const patient = await apiFetch<PatientResponse>(`patients/${patientId}`);
        
        // Mapper les données Django vers le format du formulaire
        setFormData({
          code_patient: patient.code_patient,
          nom: patient.nom,
          prenoms: patient.prenoms,
          age: patient.age.toString(),
          sexe: patient.sexe,
          telephone: patient.telephone,
          email: '', // Email n'est pas dans le modèle Patient Django
          adresse: patient.adresse,
          profession: patient.profession,
          contact_urgence_nom: patient.contact_urgence_nom,
          contact_urgence_tel: patient.contact_urgence_tel,
          est_assure: patient.est_assure,
          type_assurance: '', // Champ UI uniquement
        });
      } catch (err: any) {
        console.error('Erreur chargement patient:', err);
        showNotification('error', 'Chargement échoué', err.message || 'Impossible de récupérer le patient.');
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [patientId, navigate]);

  // 📝 Gestion des changements dans les champs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };
    });
  };

  // 💾 Soumission du formulaire (mise à jour du patient)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!formData || !patientId) return;
    
    setSaving(true);

    try {
      // ✅ Mapper le formulaire vers le format Django attendu par l'API
      const payload = {
        nom: formData.nom.trim().toUpperCase(),
        prenoms: formData.prenoms.trim(),
        age: parseInt(formData.age, 10),
        sexe: formData.sexe,
        telephone: formData.telephone.trim(),
        adresse: formData.adresse.trim(),
        profession: formData.profession.trim() || '',
        contact_urgence_nom: formData.contact_urgence_nom.trim(),
        contact_urgence_tel: formData.contact_urgence_tel.trim(),
        est_assure: formData.est_assure,
        // code_patient est en lecture seule (unique), on ne l'envoie pas en update
      };

      console.log('📤 Mise à jour patient:', payload);

      // ✅ Appel API PATCH via l'utilitaire centralisé
      const updatedPatient = await apiFetch<PatientResponse>(`patients/${patientId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      console.log('✅ Patient mis à jour:', updatedPatient);

      showNotification(
        'success',
        'Modifications enregistrées',
        'Les informations du patient ont été mises à jour avec succès.',
        [`🆔 ${updatedPatient.code_patient}`, `👤 ${updatedPatient.nom} ${updatedPatient.prenoms}`]
      );

      // Redirection optionnelle après succès
      setTimeout(() => {
        navigate('/patients', { state: { refreshed: true } });
      }, 2000);

    } catch (err: any) {
      console.error('❌ Erreur mise à jour:', err);
      
      // Gestion des erreurs de validation Django
      let errorDetails: string[] = [];
      const rawErrors = err.validationErrors || {};
      const fieldLabels: Record<string, string> = {
        nom: 'Nom',
        prenoms: 'Prénoms',
        age: 'Âge',
        sexe: 'Sexe',
        telephone: 'Téléphone',
        adresse: 'Adresse',
        contact_urgence_nom: 'Contact urgence',
        contact_urgence_tel: 'Tél urgence',
      };

      for (const [field, messages] of Object.entries(rawErrors)) {
        const label = fieldLabels[field] || field.replace(/_/g, ' ');
        const msg = Array.isArray(messages) ? messages.join(' • ') : messages;
        errorDetails.push(`• ${label}: ${msg}`);
      }

      if (errorDetails.length === 0) {
        errorDetails = [err.message || 'Erreur inconnue du serveur'];
      }

      showNotification('error', 'Échec de la mise à jour', 'Le serveur a rejeté les modifications.', errorDetails);
    } finally {
      setSaving(false);
    }
  };

  // =============================================================================
  // STYLES
  // =============================================================================
  const styles: Record<string, CSSProperties> = {
    main: { minHeight: '100vh', backgroundColor: '#D6EFFF', padding: '40px 20px', fontFamily: "'Segoe UI', sans-serif" },
    container: { backgroundColor: '#ffffff', maxWidth: '900px', margin: '0 auto', borderRadius: '20px', padding: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', position: 'relative' },
    header: { marginBottom: '30px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' },
    label: { fontWeight: '700', fontSize: '12px', color: '#475569', textTransform: 'uppercase' },
    input: { padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s' },
    sectionTitle: { fontSize: '16px', fontWeight: '800', color: '#1e40af', margin: '20px 0 15px 0', display: 'flex', alignItems: 'center', gap: '10px' },
    submitBtn: {
      backgroundColor: saving ? '#9ca3af' : '#16a34a', color: 'white', padding: '16px', borderRadius: '12px', border: 'none',
      fontWeight: 'bold', cursor: saving ? 'not-allowed' : 'pointer', width: '100%', marginTop: '20px', fontSize: '16px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'background-color 0.2s'
    },
    refBadge: { backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: '800', marginTop: '5px', display: 'inline-block' },
    backBtn: { background: 'none', border: 'none', color: '#1e40af', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '20px', padding: '8px 16px', borderRadius: '10px' },
    loadingState: { textAlign: 'center', padding: '60px 20px', color: '#64748b' },
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  // État de chargement initial
  if (loading) {
    return (
      <main style={styles.main}>
        <div style={styles.container}>
          <div style={styles.loadingState}>
            <p style={{ fontSize: '18px', marginBottom: '10px' }}>⏳ Chargement du dossier patient...</p>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>Veuillez patienter</p>
          </div>
        </div>
      </main>
    );
  }

  // État : patient non trouvé
  if (!formData) {
    return (
      <main style={styles.main}>
        <div style={styles.container}>
          <div style={{ ...styles.loadingState, color: '#dc2626' }}>
            <FaExclamationTriangle style={{ fontSize: '32px', marginBottom: '10px' }} />
            <p style={{ fontWeight: '600' }}>Patient introuvable</p>
            <button 
              onClick={() => navigate('/patients')}
              style={{ ...styles.backBtn, marginTop: '20px', backgroundColor: '#f1f5f9' }}
            >
              <FaArrowLeft /> Retour à la liste
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.main}>
      {/* 🔔 Notification professionnelle */}
      {notification.show && (
        <div style={getNotificationStyles()} role="alert">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ fontSize: '20px', marginTop: '2px' }}>
              {notification.type === 'success' && '✅'}
              {notification.type === 'error' && <FaExclamationTriangle style={{ color: '#ef4444' }} />}
              {notification.type === 'info' && 'ℹ️'}
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{notification.title}</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.9 }}>{notification.message}</p>
              {notification.details && notification.details.length > 0 && (
                <ul style={{ margin: '8px 0 0 0', padding: '0 0 0 16px', fontSize: '12px', opacity: 0.85 }}>
                  {notification.details.map((detail, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>{detail}</li>
                  ))}
                </ul>
              )}
            </div>
            <button 
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
              style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', opacity: 0.6, padding: 0, lineHeight: 1 }}
              aria-label="Fermer"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div style={styles.container}>
        <button
          style={styles.backBtn}
          onClick={() => navigate(-1)}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <FaArrowLeft /> Annuler et retour
        </button>

        <div style={styles.header}>
          <h2 style={{ margin: 0, color: '#0f172a' }}>
            Dossier de {formData.nom} {formData.prenoms}
          </h2>
          <div style={styles.refBadge}>Réf: {formData.code_patient}</div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Section Identité */}
          <div style={styles.sectionTitle}><FaIdCard /> Informations Personnelles</div>
          <div style={styles.grid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Nom *</label>
              <input 
                style={styles.input} 
                type="text" 
                name="nom" 
                value={formData.nom} 
                onChange={handleChange} 
                required 
                placeholder="Ex: KONAN"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Prénoms *</label>
              <input 
                style={styles.input} 
                type="text" 
                name="prenoms" 
                value={formData.prenoms} 
                onChange={handleChange} 
                required 
                placeholder="Ex: Jean Pierre"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Âge *</label>
              <input 
                style={styles.input} 
                type="number" 
                name="age" 
                value={formData.age} 
                onChange={handleChange} 
                required 
                min="0" 
                max="120"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Sexe *</label>
              <select 
                style={styles.input} 
                name="sexe" 
                value={formData.sexe} 
                onChange={handleChange}
                required
              >
                <option value="">Sélectionner</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
          </div>

          {/* Section Coordonnées */}
          <div style={styles.sectionTitle}><FaPhoneAlt /> Coordonnées</div>
          <div style={styles.grid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Téléphone *</label>
              <input 
                style={styles.input} 
                type="tel" 
                name="telephone" 
                value={formData.telephone} 
                onChange={handleChange} 
                required 
                placeholder="+228 90 12 34 56"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email (optionnel)</label>
              <input 
                style={styles.input} 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                placeholder="patient@email.com"
              />
            </div>
            <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
              <label style={styles.label}><FaMapMarkerAlt style={{ marginRight: '4px' }}/> Adresse *</label>
              <input 
                style={styles.input} 
                type="text" 
                name="adresse" 
                value={formData.adresse} 
                onChange={handleChange} 
                required 
                placeholder="Ex: Lomé, Quartier Tokoin"
              />
            </div>
          </div>

          {/* Section Profession & Assurance */}
          <div style={styles.sectionTitle}><FaBriefcase /> Profession & Assurance</div>
          <div style={styles.grid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Profession</label>
              <input 
                style={styles.input} 
                type="text" 
                name="profession" 
                value={formData.profession} 
                onChange={handleChange} 
                placeholder="Ex: Enseignant, Commerçant..."
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Assuré ?</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                <input 
                  type="checkbox" 
                  id="est_assure"
                  name="est_assure" 
                  checked={formData.est_assure} 
                  onChange={handleChange} 
                />
                <label htmlFor="est_assure" style={{ fontSize: '14px', cursor: 'pointer' }}>
                  Patient couvert par une assurance
                </label>
              </div>
            </div>
          </div>

          {/* Section Contact d'urgence */}
          <div style={styles.sectionTitle}><FaUserShield /> Contact d'urgence</div>
          <div style={styles.grid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Nom du contact *</label>
              <input 
                style={styles.input} 
                type="text" 
                name="contact_urgence_nom" 
                value={formData.contact_urgence_nom} 
                onChange={handleChange} 
                required 
                placeholder="Ex: Marie KONAN"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Tél. du contact *</label>
              <input 
                style={styles.input} 
                type="tel" 
                name="contact_urgence_tel" 
                value={formData.contact_urgence_tel} 
                onChange={handleChange} 
                required 
                placeholder="+228 70 12 34 56"
              />
            </div>
          </div>

          <button type="submit" style={styles.submitBtn} disabled={saving}>
            <FaCheckCircle /> {saving ? 'ENREGISTREMENT...' : 'ENREGISTRER LES MODIFICATIONS'}
          </button>
        </form>
      </div>
    </main>
  );
}