import React from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import GlobalStyles from './components/Common/GlobalStyles';

// =============================================================================
// AUTH & ADMIN
// =============================================================================
import LoginForm from './components/Auth/LoginForm';
import ServiceSelection from './components/Auth/ServiceSelection';
import VerifyAndChooseService from './components/Auth/VerifyAndChooseService';
import AdminLogin from './components/Auth/AdminLogin';
import AdminDashboard from './components/Admin/Dashboard';
import DoctorManagement from './components/Admin/DoctorManagement';

// =============================================================================
// MODALS & NOTIFICATIONS
// =============================================================================
import PaymentSection from './components/Modals/PaymentModal';
import FamilyMemberModal from './components/Modals/FamilyMemberModal';
import FamilyMemberHistoryModal from './components/Modals/FamilyMemberHistoryModal';
import CarnetModal from './components/Modals/CarnetModal';
import HelpModal from './components/Modals/HelpModal';
import TwoFactorModal from './components/Modals/TwoFactorModal';
import NotificationPanel from './components/Common/NotificationPanel';

// =============================================================================
// MEDECINE GENERALE
// =============================================================================
import ExamForm from './components/ExamForm';
import OrdonnanceForm from './components/OrdonnanceForm';
import LabForm from './components/LabForm';
import RadioForm from './components/RadioForm';

// =============================================================================
// OPHTALMOLOGIE
// =============================================================================
import OphtalmoConsultation from './Ophtalmo/src/components/ExamStep';
import OphtalmoOrdonnance from './Ophtalmo/src/components/OrthoStep';
import OphtalmoAnalyse from './Ophtalmo/src/components/OphtalmoAnalyseStep';
import OphtalmoLabo from './Ophtalmo/src/components/LabStep';
import OphtalmoRadio from './Ophtalmo/src/components/RadioStep';

// =============================================================================
// CHIRURGIE
// =============================================================================
import ChirurgieExam from './componen/ExamForm';
import ChirurgieOrdonnance from './componen/OrdonnanceForm';
import ChirurgieLab from './componen/LabForm';
import ChirurgieRadio from './componen/RadioForm';
import ChirurgieIntervention from './componen/InterventionForm';

// =============================================================================
// UROLOGIE
// =============================================================================
import UrologieExam from './component/ExamForm';
import UrologieOrdonnance from './component/OrdonnanceForm';
import UrologieLab from './component/LabForm';
import UrologieRadio from './component/RadioForm';
import UrologieSpecial from './component/UrologieSpecialForm';

// =============================================================================
// CARDIOLOGIE
// =============================================================================
import CardioExam from './components/examen';
import CardioOrdonnance from './components/Ordonnance';
import CardioRadio from './components/Radio';
import CardioECG from './components/CardioECG';
import CardioEcho from './components/CardioEcho';

// =============================================================================
// PATIENT & SUIVI
// =============================================================================
import Password from './patient/ChangePassword';
import PatientDashboard from './patient/Dashboard';
import NewConsultationForm from './patient/NewPatientForm';
import OldConsultation from './patient/OldConsultation';
import Statistics from './patient/Statistics';
import Settings from './patient/Settings';
import Profile from './patient/Profile';
import PatientResults from './patient/ResultsView';
import PatientPrescriptions from './patient/PrescriptionsView';
import PatientAppointments from './patient/AppointmentsView';

// =============================================================================
// PHARMACIE
// =============================================================================
import PharmaDashboard from './MediPharma/src/Pages/Dashboard';
import PharmaInventory from './MediPharma/src/Pages/Inventory';
import PharmaOrders from './MediPharma/src/Pages/Orders';
import PharmaChat from './MediPharma/src/Pages/Chat';
import PharmaSettings from './MediPharma/src/Pages/Settings';
import PharmaDispensation from './MediPharma/src/Pages/Dispensation';

// =============================================================================
// WORKFLOWS
// =============================================================================
import PharmacieWorkflow from './components/Pharmacie/PharmacieWorkflow';
import CaisseWorkflow from './components/Caisse/CaisseWorkflow';
import LaboWorkflow from './components/Labo/LaboWorkflow';
import RadioWorkflow from './components/Radio/RadioWorkflow';

// =============================================================================
// RAPPORTS & DOCUMENTS
// =============================================================================
import MedicalReport from './components/Reports/MedicalReport';
import PrescriptionPDF from './components/Reports/PrescriptionPDF';
import LabResultsPDF from './components/Reports/LabResultsPDF';
import RadioReportPDF from './components/Reports/RadioReportPDF';

// =============================================================================
// COMPOSANTS COMMUNS
// =============================================================================
import ProgressBar from './components/Common/ProgressBar';
import PatientTimeline from './components/Common/PatientTimeline';

// =============================================================================
// TYPES
// =============================================================================
interface PrivateRouteProps {
  children: React.ReactNode;
  requiredSpecialty?: string;
  adminOnly?: boolean;
}

interface ServiceLayoutProps {
  children: React.ReactNode;
  specialty: string;
  color: string;
  steps: string[];
}

// =============================================================================
// PROTECTIONS DE ROUTES
// =============================================================================
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('access_token');
  const role = localStorage.getItem('user_role');
  if (!token || role !== 'admin') return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
};

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, requiredSpecialty, adminOnly }) => {
  const token = localStorage.getItem('access_token');
  const userSpecialty = localStorage.getItem('user_specialty');
  const userRole = localStorage.getItem('user_role');
  
  if (!token) return <Navigate to="/login" replace />;
  if (adminOnly && userRole !== 'admin') return <Navigate to="/patient" replace />;
  if (requiredSpecialty && userSpecialty !== requiredSpecialty && userRole !== 'admin') {
    return <Navigate to="/patient" replace />;
  }
  return <>{children}</>;
};

// =============================================================================
// LAYOUTS
// =============================================================================
const ServiceLayout: React.FC<ServiceLayoutProps> = ({ children, specialty, color, steps }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentStep = steps.findIndex(step => location.pathname.includes(step));
  
  const handleExit = () => {
    if (window.confirm('Quitter ce workflow ? Les données non sauvegardées seront perdues.')) {
      localStorage.removeItem('current_consultation_id');
      localStorage.removeItem('current_patient_id');
      localStorage.removeItem('current_workflow_step');
      navigate('/patient');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>
      <header style={{ background: color, padding: '15px 30px', color: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {specialty === 'ophtalmo' && '👁️'}
              {specialty === 'chirurgie' && '🔪'}
              {specialty === 'urologie' && '🧪'}
              {specialty === 'cardiologie' && '❤️'}
              {specialty === 'general' && '🩺'}
              {specialty.charAt(0).toUpperCase() + specialty.slice(1)}
            </h2>
            <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '4px' }}>
              Workflow • Patient: {localStorage.getItem('current_patient_id') || 'N/A'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => navigate('/patient/notifications')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>🔔</button>
            <button onClick={handleExit} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Quitter</button>
          </div>
        </div>
      </header>
      <ProgressBar specialty={specialty} currentStep={currentStep} steps={steps} color={color} />
      <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>{children}</div>
    </div>
  );
};

const PatientLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: '#f4f7f6' }}>
      <header style={{ background: '#3498db', padding: '15px 30px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>👤 Espace Médecin</h2>
          <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Spécialité: {localStorage.getItem('user_specialty') || 'Non définie'}</div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate('/patient/notifications')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>🔔</button>
          <button onClick={() => { localStorage.clear(); navigate('/login'); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Déconnexion</button>
        </div>
      </header>
      <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>{children}</div>
    </div>
  );
};

const PharmaLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: '#f4f7f6' }}>
      <header style={{ background: '#27ae60', padding: '15px 30px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>💊 MediPharma</h2>
        <button onClick={() => { localStorage.clear(); navigate('/login'); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Déconnexion</button>
      </header>
      <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>{children}</div>
    </div>
  );
};

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>
      <header style={{ background: '#2c3e50', padding: '15px 30px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>🔐 Panel Admin</h2>
        <button onClick={() => { localStorage.clear(); navigate('/admin/login'); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Déconnexion</button>
      </header>
      <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>{children}</div>
    </div>
  );
};

const PatientPortalLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '15px 30px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>🏥 MediTrack Patient</h2>
        <button onClick={() => { localStorage.clear(); navigate('/login'); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Déconnexion</button>
      </header>
      <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>{children}</div>
    </div>
  );
};

// =============================================================================
// APP PRINCIPALE
// =============================================================================
export default function App() {
  const navigate = useNavigate();

  return (
    <>
      <GlobalStyles />
      <Routes>
        
        {/* AUTH */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/select-service" element={<ServiceSelection />} />

        {/* ADMIN */}
        <Route path="/admin/dashboard" element={<AdminRoute><AdminLayout><AdminDashboard /></AdminLayout></AdminRoute>} />
        <Route path="/admin/doctors" element={<AdminRoute><AdminLayout><DoctorManagement /></AdminLayout></AdminRoute>} />
        <Route path="/admin/patients" element={<AdminRoute><AdminLayout><div style={{padding:'20px',background:'white',borderRadius:'12px'}}><h2>👥 Gestion Patients</h2><p style={{color:'#64748b'}}>Fonctionnalité à venir...</p></div></AdminLayout></AdminRoute>} />
        <Route path="/admin/statistics" element={<AdminRoute><AdminLayout><div style={{padding:'20px',background:'white',borderRadius:'12px'}}><h2>📊 Statistiques</h2><p style={{color:'#64748b'}}>Fonctionnalité à venir...</p></div></AdminLayout></AdminRoute>} />

        {/* PATIENT / DOCTOR */}
        <Route path="/patient" element={<PrivateRoute><PatientLayout><PatientDashboard /></PatientLayout></PrivateRoute>} />
        <Route path="/new-consultation" element={<PrivateRoute><PatientLayout><NewConsultationForm /></PatientLayout></PrivateRoute>} />
        <Route path="/old-consultation" element={<PrivateRoute><PatientLayout><OldConsultation /></PatientLayout></PrivateRoute>} />
        <Route path="/patient/results" element={<PrivateRoute><PatientLayout><PatientResults /></PatientLayout></PrivateRoute>} />
        <Route path="/patient/prescriptions" element={<PrivateRoute><PatientLayout><PatientPrescriptions /></PatientLayout></PrivateRoute>} />
        <Route path="/patient/appointments" element={<PrivateRoute><PatientLayout><PatientAppointments /></PatientLayout></PrivateRoute>} />
        <Route path="/patient/notifications" element={<PrivateRoute><PatientLayout><NotificationPanel isOpen={true} onClose={() => navigate('/patient')} /></PatientLayout></PrivateRoute>} />
        <Route path="/statistics" element={<PrivateRoute><PatientLayout><Statistics /></PatientLayout></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><PatientLayout><Settings /></PatientLayout></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><PatientLayout><Profile /></PatientLayout></PrivateRoute>} />
        <Route path="/password" element={<PrivateRoute><PatientLayout><Password /></PatientLayout></PrivateRoute>} />
        <Route path="/verify-and-choose-service" element={<PrivateRoute><VerifyAndChooseService /></PrivateRoute>} />

        {/* MEDECINE GENERALE */}
        <Route path="/doctor/exam" element={<PrivateRoute requiredSpecialty="general"><ServiceLayout specialty="general" color="#3498db" steps={['Examen','Ordonnance','Labo','Radio','Paiement']}><ExamForm /></ServiceLayout></PrivateRoute>} />
        <Route path="/doctor/ordonnance" element={<PrivateRoute requiredSpecialty="general"><ServiceLayout specialty="general" color="#3498db" steps={['Examen','Ordonnance','Labo','Radio','Paiement']}><OrdonnanceForm /></ServiceLayout></PrivateRoute>} />
        <Route path="/doctor/lab" element={<PrivateRoute requiredSpecialty="general"><ServiceLayout specialty="general" color="#3498db" steps={['Examen','Ordonnance','Labo','Radio','Paiement']}><LabForm /></ServiceLayout></PrivateRoute>} />
        <Route path="/doctor/radio" element={<PrivateRoute requiredSpecialty="general"><ServiceLayout specialty="general" color="#3498db" steps={['Examen','Ordonnance','Labo','Radio','Paiement']}><RadioForm /></ServiceLayout></PrivateRoute>} />

        {/* OPHTALMOLOGIE */}
        <Route path="/ophtalmo/consultation" element={<PrivateRoute requiredSpecialty="ophtalmo"><ServiceLayout specialty="ophtalmo" color="#00a896" steps={['Consultation','Ordonnance','Analyses','Labo','Radio','Paiement']}><OphtalmoConsultation /></ServiceLayout></PrivateRoute>} />
        <Route path="/ophtalmo/ordonnance" element={<PrivateRoute requiredSpecialty="ophtalmo"><ServiceLayout specialty="ophtalmo" color="#00a896" steps={['Consultation','Ordonnance','Analyses','Labo','Radio','Paiement']}><OphtalmoOrdonnance /></ServiceLayout></PrivateRoute>} />
        <Route path="/ophtalmo/analyse-ophtalmo" element={<PrivateRoute requiredSpecialty="ophtalmo"><ServiceLayout specialty="ophtalmo" color="#00a896" steps={['Consultation','Ordonnance','Analyses','Labo','Radio','Paiement']}><OphtalmoAnalyse /></ServiceLayout></PrivateRoute>} />
        <Route path="/ophtalmo/labo" element={<PrivateRoute requiredSpecialty="ophtalmo"><ServiceLayout specialty="ophtalmo" color="#00a896" steps={['Consultation','Ordonnance','Analyses','Labo','Radio','Paiement']}><OphtalmoLabo /></ServiceLayout></PrivateRoute>} />
        <Route path="/ophtalmo/radio" element={<PrivateRoute requiredSpecialty="ophtalmo"><ServiceLayout specialty="ophtalmo" color="#00a896" steps={['Consultation','Ordonnance','Analyses','Labo','Radio','Paiement']}><OphtalmoRadio /></ServiceLayout></PrivateRoute>} />

        {/* CHIRURGIE */}
        <Route path="/chirurgie/consultation" element={<PrivateRoute requiredSpecialty="chirurgie"><ServiceLayout specialty="chirurgie" color="#e74c3c" steps={['Consultation','Ordonnance','Labo','Radio','Intervention','Paiement']}><ChirurgieExam /></ServiceLayout></PrivateRoute>} />
        <Route path="/chirurgie/ordonnance" element={<PrivateRoute requiredSpecialty="chirurgie"><ServiceLayout specialty="chirurgie" color="#e74c3c" steps={['Consultation','Ordonnance','Labo','Radio','Intervention','Paiement']}><ChirurgieOrdonnance /></ServiceLayout></PrivateRoute>} />
        <Route path="/chirurgie/labo" element={<PrivateRoute requiredSpecialty="chirurgie"><ServiceLayout specialty="chirurgie" color="#e74c3c" steps={['Consultation','Ordonnance','Labo','Radio','Intervention','Paiement']}><ChirurgieLab /></ServiceLayout></PrivateRoute>} />
        <Route path="/chirurgie/radio" element={<PrivateRoute requiredSpecialty="chirurgie"><ServiceLayout specialty="chirurgie" color="#e74c3c" steps={['Consultation','Ordonnance','Labo','Radio','Intervention','Paiement']}><ChirurgieRadio /></ServiceLayout></PrivateRoute>} />
        <Route path="/chirurgie/intervention" element={<PrivateRoute requiredSpecialty="chirurgie"><ServiceLayout specialty="chirurgie" color="#e74c3c" steps={['Consultation','Ordonnance','Labo','Radio','Intervention','Paiement']}><ChirurgieIntervention /></ServiceLayout></PrivateRoute>} />

        {/* UROLOGIE */}
        <Route path="/urologie/consultation" element={<PrivateRoute requiredSpecialty="urologie"><ServiceLayout specialty="urologie" color="#2980b9" steps={['Consultation','Ordonnance','Labo','Radio','Examens Spéciaux','Paiement']}><UrologieExam /></ServiceLayout></PrivateRoute>} />
        <Route path="/urologie/ordonnance" element={<PrivateRoute requiredSpecialty="urologie"><ServiceLayout specialty="urologie" color="#2980b9" steps={['Consultation','Ordonnance','Labo','Radio','Examens Spéciaux','Paiement']}><UrologieOrdonnance /></ServiceLayout></PrivateRoute>} />
        <Route path="/urologie/labo" element={<PrivateRoute requiredSpecialty="urologie"><ServiceLayout specialty="urologie" color="#2980b9" steps={['Consultation','Ordonnance','Labo','Radio','Examens Spéciaux','Paiement']}><UrologieLab /></ServiceLayout></PrivateRoute>} />
        <Route path="/urologie/radio" element={<PrivateRoute requiredSpecialty="urologie"><ServiceLayout specialty="urologie" color="#2980b9" steps={['Consultation','Ordonnance','Labo','Radio','Examens Spéciaux','Paiement']}><UrologieRadio /></ServiceLayout></PrivateRoute>} />
        <Route path="/urologie/special" element={<PrivateRoute requiredSpecialty="urologie"><ServiceLayout specialty="urologie" color="#2980b9" steps={['Consultation','Ordonnance','Labo','Radio','Examens Spéciaux','Paiement']}><UrologieSpecial /></ServiceLayout></PrivateRoute>} />

        {/* CARDIOLOGIE */}
        <Route path="/cardiologie/examen" element={<PrivateRoute requiredSpecialty="cardiologie"><ServiceLayout specialty="cardiologie" color="#c0392b" steps={['Examen','Ordonnance','ECG','Écho','Radio','Paiement']}><CardioExam /></ServiceLayout></PrivateRoute>} />
        <Route path="/cardiologie/ordonnance" element={<PrivateRoute requiredSpecialty="cardiologie"><ServiceLayout specialty="cardiologie" color="#c0392b" steps={['Examen','Ordonnance','ECG','Écho','Radio','Paiement']}><CardioOrdonnance /></ServiceLayout></PrivateRoute>} />
        <Route path="/cardiologie/ecg" element={<PrivateRoute requiredSpecialty="cardiologie"><ServiceLayout specialty="cardiologie" color="#c0392b" steps={['Examen','Ordonnance','ECG','Écho','Radio','Paiement']}><CardioECG /></ServiceLayout></PrivateRoute>} />
        <Route path="/cardiologie/echo" element={<PrivateRoute requiredSpecialty="cardiologie"><ServiceLayout specialty="cardiologie" color="#c0392b" steps={['Examen','Ordonnance','ECG','Écho','Radio','Paiement']}><CardioEcho /></ServiceLayout></PrivateRoute>} />
        <Route path="/cardiologie/radio" element={<PrivateRoute requiredSpecialty="cardiologie"><ServiceLayout specialty="cardiologie" color="#c0392b" steps={['Examen','Ordonnance','ECG','Écho','Radio','Paiement']}><CardioRadio /></ServiceLayout></PrivateRoute>} />

        {/* PAIEMENT & MODALS */}
        <Route path="/payement" element={<PrivateRoute><div style={{minHeight:'100vh',background:'#f0f4f8',padding:'30px'}}><PaymentSection isOpen={true} onClose={() => navigate('/patient')} onSubmit={() => {}} initialType="consultation" /></div></PrivateRoute>} />
        <Route path="/payement/add-family" element={<PrivateRoute><FamilyMemberModal isOpen={true} onClose={() => navigate(-1)} /></PrivateRoute>} />
        <Route path="/payement/family-history" element={<PrivateRoute><FamilyMemberHistoryModal isOpen={true} onClose={() => navigate(-1)} /></PrivateRoute>} />
        <Route path="/payement/carnet" element={<PrivateRoute><CarnetModal isOpen={true} onClose={() => navigate(-1)} /></PrivateRoute>} />
        <Route path="/payement/security" element={<PrivateRoute><TwoFactorModal isOpen={true} onClose={() => navigate(-1)} /></PrivateRoute>} />
        <Route path="/payement/help" element={<PrivateRoute><HelpModal isOpen={true} onClose={() => navigate(-1)} /></PrivateRoute>} />

        {/* PHARMACIE */}
        <Route path="/pharmacie" element={<PrivateRoute><PharmaLayout><Navigate to="/pharmacie/dashboard" replace /></PharmaLayout></PrivateRoute>} />
        <Route path="/pharmacie/dashboard" element={<PrivateRoute><PharmaLayout><PharmaDashboard /></PharmaLayout></PrivateRoute>} />
        <Route path="/pharmacie/inventory" element={<PrivateRoute><PharmaLayout><PharmaInventory /></PharmaLayout></PrivateRoute>} />
        <Route path="/pharmacie/orders" element={<PrivateRoute><PharmaLayout><PharmaOrders /></PharmaLayout></PrivateRoute>} />
        <Route path="/pharmacie/chat" element={<PrivateRoute><PharmaLayout><PharmaChat /></PharmaLayout></PrivateRoute>} />
        <Route path="/pharmacie/settings" element={<PrivateRoute><PharmaLayout><PharmaSettings /></PharmaLayout></PrivateRoute>} />
        <Route path="/pharmacie/dispensation" element={<PrivateRoute><PharmaLayout><PharmaDispensation /></PharmaLayout></PrivateRoute>} />

        {/* WORKFLOWS */}
        <Route path="/pharmacie/workflow" element={<PrivateRoute><PharmaLayout><PharmacieWorkflow /></PharmaLayout></PrivateRoute>} />
        <Route path="/labo/workflow" element={<PrivateRoute><PharmaLayout><LaboWorkflow /></PharmaLayout></PrivateRoute>} />
        <Route path="/radio/workflow" element={<PrivateRoute><PharmaLayout><RadioWorkflow /></PharmaLayout></PrivateRoute>} />
        <Route path="/caisse" element={<PrivateRoute><CaisseWorkflow /></PrivateRoute>} />

        {/* PATIENT PORTAL */}
        <Route path="/patient-portal/results" element={<PrivateRoute><PatientPortalLayout><PatientResults /></PatientPortalLayout></PrivateRoute>} />
        <Route path="/patient-portal/prescriptions" element={<PrivateRoute><PatientPortalLayout><PatientPrescriptions /></PatientPortalLayout></PrivateRoute>} />

        {/* RAPPORTS PDF */}
        <Route path="/reports/medical/:consultationId" element={<PrivateRoute><MedicalReport /></PrivateRoute>} />
        <Route path="/reports/prescription/:ordonnanceId" element={<PrivateRoute><PrescriptionPDF /></PrivateRoute>} />
        <Route path="/reports/lab/:labId" element={<PrivateRoute><LabResultsPDF /></PrivateRoute>} />
        <Route path="/reports/radio/:radioId" element={<PrivateRoute><RadioReportPDF /></PrivateRoute>} />

        {/* REDIRECTIONS */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </>
  );
}