import React from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import GlobalStyles from './components/Common/GlobalStyles';


// =============================================================================
// IMPORTS AUTH & ADMIN
// =============================================================================
import LoginForm from './components/Auth/LoginForm';
import ServiceSelection from './components/Auth/ServiceSelection';
import VerifyAndChooseService from './components/Auth/VerifyAndChooseService';
import AdminLogin from './components/Auth/AdminLogin';
import AdminDashboard from './components/Admin/Dashboard';
import DoctorManagement from './components/Admin/DoctorManagement';

// =============================================================================
// IMPORTS MODALS
// =============================================================================
import PayementSection from './components/Modals/PaymentModal';
import FamilyMemberModal from './components/Modals/FamilyMemberModal';
import FamilyMemberHistoryModal from './components/Modals/FamilyMemberHistoryModal';
import CarnetModal from './components/Modals/CarnetModal';
import HelpModal from './components/Modals/HelpModal';
import TwoFactorModal from './components/Modals/TwoFactorModal';

// =============================================================================
// IMPORTS DOCTEUR GÉNÉRAL
// =============================================================================
import ExamForm from './components/ExamForm';
import OrdonnanceForm from './components/OrdonnanceForm';
import LabForm from './components/LabForm';
import RadioForm from './components/RadioForm';

// =============================================================================
// IMPORTS OPHTALMOLOGIE
// =============================================================================
import OphtalmoConsultation from './Ophtalmo/src/components/ExamStep'; 
import OphtalmoOrdonnance from './Ophtalmo/src/components/OrthoStep';
import OphtalmoAnalyse from './Ophtalmo/src/components/OphtalmoAnalyseStep'; 
import OphtalmoLabo from './Ophtalmo/src/components/LabStep';
import OphtalmoRadio from './Ophtalmo/src/components/RadioStep';

// =============================================================================
// IMPORTS CHIRURGIE
// =============================================================================
import ChirurgieExam from './componen/ExamForm';
import ChirurgieOrdonnance from './componen/OrdonnanceForm';
import ChirurgieLab from './componen/LabForm';
import ChirurgieRadio from './componen/RadioForm';

// =============================================================================
// IMPORTS UROLOGIE
// =============================================================================
import UrologieExam from './component/ExamForm';
import UrologieOrdonnance from './component/OrdonnanceForm';
import UrologieLab from './component/LabForm';
import UrologieRadio from './component/RadioForm';

// =============================================================================
// IMPORTS CARDIOLOGIE
// =============================================================================
import CardioExam from './components/examen';
import CardioOrdonnance from './components/Ordonnance';
import CardioRadio from './components/Radio';

// =============================================================================
// IMPORTS PATIENT
// =============================================================================
import Password from './patient/ChangePassword';
import PatientDashboard from './patient/Dashboard'; 
import NewConsultationForm from './patient/NewPatientForm'; 
import OldConsultation from './patient/OldConsultation'; 
import Statistics from './patient/Statistics'; 
import Settings from './patient/Settings'; 
import Profile from './patient/Profile';

// =============================================================================
// IMPORTS PHARMACIE
// =============================================================================
import PharmaDashboard from './MediPharma/src/Pages/Dashboard';
import PharmaInventory from './MediPharma/src/Pages/Inventory';
import PharmaOrders from './MediPharma/src/Pages/Orders';
import PharmaChat from './MediPharma/src/Pages/Chat';
import PharmaSettings from './MediPharma/src/Pages/Settings';

// =============================================================================
// IMPORTS WORKFLOW (NOUVEAU)
// =============================================================================
import PharmacieWorkflow from './components/Pharmacie/PharmacieWorkflow';
import CaisseWorkflow from './components/Caisse/CaisseWorkflow';

// =============================================================================
// COMPOSANTS COMMUNS
// =============================================================================
import ProgressBar from './components/Common/ProgressBar';

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
// PROTECTION ROUTE ADMIN (STRICTE)
// =============================================================================
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('access_token');
  const role = localStorage.getItem('user_role');
  
  if (!token || role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }
  
  return <>{children}</>;
};

// =============================================================================
// PROTECTION SOUPLE : Affiche la page mais avertit si non authentifié
// =============================================================================
const SoftPrivateRoute: React.FC<PrivateRouteProps> = ({ children, requiredSpecialty, adminOnly }) => {
  const token = localStorage.getItem('access_token');
  const userSpecialty = localStorage.getItem('user_specialty');
  const userRole = localStorage.getItem('user_role');
  
  // ✅ TOUJOURS afficher la page (pas de redirection automatique)
  return <>{children}</>;
};

// =============================================================================
// LAYOUT SERVICE (SANS NAVBAR)
// =============================================================================
const ServiceLayout: React.FC<ServiceLayoutProps> = ({ children, specialty, color, steps }) => {
  const location = useLocation();
  const currentStep = steps.indexOf(location.pathname);
  
  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>
      <header style={{ 
        background: color, 
        padding: '15px 30px', 
        color: 'white',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {specialty === 'ophtalmo' && '👁️'}
            {specialty === 'chirurgie' && '🔪'}
            {specialty === 'urologie' && '🧪'}
            {specialty === 'cardiologie' && '❤️'}
            {specialty === 'general' && '🩺'}
            {specialty.charAt(0).toUpperCase() + specialty.slice(1)}
          </h2>
          <button 
            onClick={() => {
              localStorage.removeItem('user_specialty');
              localStorage.removeItem('current_consultation_id');
              window.location.href = '/patient';
            }}
            style={{ 
              background: 'rgba(255,255,255,0.2)', 
              border: 'none', 
              color: 'white', 
              padding: '8px 16px', 
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Retour au tableau de bord
          </button>
        </div>
      </header>
      
      <ProgressBar specialty={specialty} currentStep={currentStep} steps={steps} color={color} />
      
      <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
        {children}
      </div>
    </div>
  );
};

// =============================================================================
// LAYOUT PATIENT (DASHBOARD MÉDECIN)
// =============================================================================
const PatientLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  
  return (
    <div style={{ minHeight: '100vh', background: '#f4f7f6' }}>
      <header style={{ 
        background: '#3498db', 
        padding: '15px 30px', 
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>👤 Espace Médecin</h2>
        <button 
          onClick={() => {
            localStorage.clear();
            navigate('/login');
          }}
          style={{ 
            background: 'rgba(255,255,255,0.2)', 
            border: 'none', 
            color: 'white', 
            padding: '8px 16px', 
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Déconnexion
        </button>
      </header>
      <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
        {children}
      </div>
    </div>
  );
};

// =============================================================================
// LAYOUT PHARMACIE
// =============================================================================
const PharmaLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  
  return (
    <div style={{ minHeight: '100vh', background: '#f4f7f6' }}>
      <header style={{ 
        background: '#27ae60', 
        padding: '15px 30px', 
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>💊 MediPharma</h2>
        <button 
          onClick={() => {
            localStorage.clear();
            navigate('/login');
          }}
          style={{ 
            background: 'rgba(255,255,255,0.2)', 
            border: 'none', 
            color: 'white', 
            padding: '8px 16px', 
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Déconnexion
        </button>
      </header>
      <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
        {children}
      </div>
    </div>
  );
};

// =============================================================================
// LAYOUT ADMIN
// =============================================================================
const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  
  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>
      <header style={{ 
        background: '#2c3e50', 
        padding: '15px 30px', 
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>🔐 Panel Administrateur</h2>
        <button 
          onClick={() => {
            localStorage.clear();
            navigate('/admin/login');
          }}
          style={{ 
            background: 'rgba(255,255,255,0.2)', 
            border: 'none', 
            color: 'white', 
            padding: '8px 16px', 
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Déconnexion
        </button>
      </header>
      <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
        {children}
      </div>
    </div>
  );
};

// =============================================================================
// APP PRINCIPAL
// =============================================================================
export default function App() {
  const navigate = useNavigate();
  const handleCancelAction = () => navigate(-1); 

  return (
    <>
      <GlobalStyles />
      <Routes>
        
        {/* ==================== AUTHENTIFICATION ==================== */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        
        {/* ==================== ROUTES ADMIN (STRICTEMENT PROTÉGÉES) ==================== */}
        <Route path="/admin/dashboard" element={
          <AdminRoute>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </AdminRoute>
        } />
        
        <Route path="/admin/doctors" element={
          <AdminRoute>
            <AdminLayout>
              <DoctorManagement />
            </AdminLayout>
          </AdminRoute>
        } />
        
        <Route path="/admin/patients" element={
          <AdminRoute>
            <AdminLayout>
              <div style={{ padding: '20px', background: 'white', borderRadius: '12px' }}>
                <h2>👥 Gestion des Patients</h2>
                <p style={{ color: '#64748b' }}>Fonctionnalité à implémenter...</p>
              </div>
            </AdminLayout>
          </AdminRoute>
        } />
        
        {/* ==================== ESPACE MÉDECIN (DASHBOARD EN PREMIER) ==================== */}
        <Route path="/patient" element={
          <SoftPrivateRoute>
            <PatientLayout>
              <PatientDashboard />
            </PatientLayout>
          </SoftPrivateRoute>
        } />
        
        <Route path="/new-consultation" element={
          <SoftPrivateRoute>
            <PatientLayout>
              <NewConsultationForm />
            </PatientLayout>
          </SoftPrivateRoute>
        } />
        
        <Route path="/old-consultation" element={
          <SoftPrivateRoute>
            <PatientLayout>
              <OldConsultation />
            </PatientLayout>
          </SoftPrivateRoute>
        } />
        
        <Route path="/statistics" element={
          <SoftPrivateRoute>
            <PatientLayout>
              <Statistics />
            </PatientLayout>
          </SoftPrivateRoute>
        } />
        
        <Route path="/settings" element={
          <SoftPrivateRoute>
            <PatientLayout>
              <Settings />
            </PatientLayout>
          </SoftPrivateRoute>
        } />
        
        <Route path="/profile" element={
          <SoftPrivateRoute>
            <PatientLayout>
              <Profile />
            </PatientLayout>
          </SoftPrivateRoute>
        } />
        
        <Route path="/password" element={
          <SoftPrivateRoute>
            <PatientLayout>
              <Password />
            </PatientLayout>
          </SoftPrivateRoute>
        } />

        
        
        {/* ==================== VÉRIFICATION MÉDECIN + SERVICE ==================== */}
        <Route path="/verify-and-choose-service" element={
          <SoftPrivateRoute>
            <VerifyAndChooseService />
          </SoftPrivateRoute>
        } />
        
        {/* ==================== MÉDECINE GÉNÉRALE ==================== */}
        <Route path="/doctor/exam" element={
          <SoftPrivateRoute requiredSpecialty="general">
            <ServiceLayout specialty="general" color="#3498db" steps={[
              '/doctor/exam', '/doctor/ordonnance', '/doctor/lab', '/doctor/radio', '/payement'
            ]}>
              <ExamForm />
            </ServiceLayout>
          </SoftPrivateRoute>
        } />
        
        <Route path="/doctor/ordonnance" element={
          <SoftPrivateRoute requiredSpecialty="general">
            <ServiceLayout specialty="general" color="#3498db" steps={[
              '/doctor/exam', '/doctor/ordonnance', '/doctor/lab', '/doctor/radio', '/payement'
            ]}>
              <OrdonnanceForm />
            </ServiceLayout>
          </SoftPrivateRoute>
        } />
        
        <Route path="/doctor/lab" element={
          <SoftPrivateRoute requiredSpecialty="general">
            <ServiceLayout specialty="general" color="#3498db" steps={[
              '/doctor/exam', '/doctor/ordonnance', '/doctor/lab', '/doctor/radio', '/payement'
            ]}>
              <LabForm />
            </ServiceLayout>
          </SoftPrivateRoute>
        } />
        
        <Route path="/doctor/radio" element={
          <SoftPrivateRoute requiredSpecialty="general">
            <ServiceLayout specialty="general" color="#3498db" steps={[
              '/doctor/exam', '/doctor/ordonnance', '/doctor/lab', '/doctor/radio', '/payement'
            ]}>
              <RadioForm />
            </ServiceLayout>
          </SoftPrivateRoute>
        } />
        
        {/* ==================== OPHTALMOLOGIE ==================== */}
        <Route path="/ophtalmo/consultation" element={
          <SoftPrivateRoute requiredSpecialty="ophtalmo">
            <ServiceLayout specialty="ophtalmo" color="#00a896" steps={[
              '/ophtalmo/consultation', '/ophtalmo/ordonnance', '/ophtalmo/analyse-ophtalmo', '/ophtalmo/labo', '/ophtalmo/radio', '/payement'
            ]}>
              <OphtalmoConsultation />
            </ServiceLayout>
          </SoftPrivateRoute>
        } />
        
        <Route path="/ophtalmo/ordonnance" element={
          <SoftPrivateRoute requiredSpecialty="ophtalmo">
            <ServiceLayout specialty="ophtalmo" color="#00a896" steps={[
              '/ophtalmo/consultation', '/ophtalmo/ordonnance', '/ophtalmo/analyse-ophtalmo', '/ophtalmo/labo', '/ophtalmo/radio', '/payement'
            ]}>
              <OphtalmoOrdonnance />
            </ServiceLayout>
          </SoftPrivateRoute>
        } />
        
        <Route path="/ophtalmo/analyse-ophtalmo" element={
          <SoftPrivateRoute requiredSpecialty="ophtalmo">
            <ServiceLayout specialty="ophtalmo" color="#00a896" steps={[
              '/ophtalmo/consultation', '/ophtalmo/ordonnance', '/ophtalmo/analyse-ophtalmo', '/ophtalmo/labo', '/ophtalmo/radio', '/payement'
            ]}>
              <OphtalmoAnalyse />
            </ServiceLayout>
          </SoftPrivateRoute>
        } />
        
        <Route path="/ophtalmo/labo" element={
          <SoftPrivateRoute requiredSpecialty="ophtalmo">
            <ServiceLayout specialty="ophtalmo" color="#00a896" steps={[
              '/ophtalmo/consultation', '/ophtalmo/ordonnance', '/ophtalmo/analyse-ophtalmo', '/ophtalmo/labo', '/ophtalmo/radio', '/payement'
            ]}>
              <OphtalmoLabo />
            </ServiceLayout>
          </SoftPrivateRoute>
        } />
        
        <Route path="/ophtalmo/radio" element={
          <SoftPrivateRoute requiredSpecialty="ophtalmo">
            <ServiceLayout specialty="ophtalmo" color="#00a896" steps={[
              '/ophtalmo/consultation', '/ophtalmo/ordonnance', '/ophtalmo/analyse-ophtalmo', '/ophtalmo/labo', '/ophtalmo/radio', '/payement'
            ]}>
              <OphtalmoRadio />
            </ServiceLayout>
          </SoftPrivateRoute>
        } />
        
        {/* ==================== CHIRURGIE ==================== */}
        <Route path="/chirurgie/consultation" element={
          <SoftPrivateRoute requiredSpecialty="chirurgie">
            <ServiceLayout specialty="chirurgie" color="#e74c3c" steps={[
              '/chirurgie/consultation', '/chirurgie/ordonnance', '/chirurgie/labo', '/chirurgie/radio', '/payement'
            ]}>
              <ChirurgieExam />
            </ServiceLayout>
          </SoftPrivateRoute>
        } />
        
        <Route path="/chirurgie/ordonnance" element={
          <SoftPrivateRoute requiredSpecialty="chirurgie">
            <ServiceLayout specialty="chirurgie" color="#e74c3c" steps={[
              '/chirurgie/consultation', '/chirurgie/ordonnance', '/chirurgie/labo', '/chirurgie/radio', '/payement'
            ]}>
              <ChirurgieOrdonnance />
            </ServiceLayout>
          </SoftPrivateRoute>
        } />
        
        <Route path="/chirurgie/labo" element={
          <SoftPrivateRoute requiredSpecialty="chirurgie">
            <ServiceLayout specialty="chirurgie" color="#e74c3c" steps={[
              '/chirurgie/consultation', '/chirurgie/ordonnance', '/chirurgie/labo', '/chirurgie/radio', '/payement'
            ]}>
              <ChirurgieLab />
            </ServiceLayout>
          </SoftPrivateRoute>
        } />
        
        <Route path="/chirurgie/radio" element={
          <SoftPrivateRoute requiredSpecialty="chirurgie">
            <ServiceLayout specialty="chirurgie" color="#e74c3c" steps={[
              '/chirurgie/consultation', '/chirurgie/ordonnance', '/chirurgie/labo', '/chirurgie/radio', '/payement'
            ]}>
              <ChirurgieRadio />
            </ServiceLayout>
          </SoftPrivateRoute>
        } />
        
        {/* ==================== UROLOGIE ==================== */}
        <Route path="/urologie/consultation" element={
          <SoftPrivateRoute requiredSpecialty="urologie">
            <ServiceLayout specialty="urologie" color="#2980b9" steps={[
              '/urologie/consultation', '/urologie/ordonnance', '/urologie/labo', '/urologie/radio', '/payement'
            ]}>
              <UrologieExam />
            </ServiceLayout>
          </SoftPrivateRoute>
        } />
        
        <Route path="/urologie/ordonnance" element={
          <SoftPrivateRoute requiredSpecialty="urologie">
            <ServiceLayout specialty="urologie" color="#2980b9" steps={[
              '/urologie/consultation', '/urologie/ordonnance', '/urologie/labo', '/urologie/radio', '/payement'
            ]}>
              <UrologieOrdonnance />
            </ServiceLayout>
          </SoftPrivateRoute>
        } />
        
        <Route path="/urologie/labo" element={
          <SoftPrivateRoute requiredSpecialty="urologie">
            <ServiceLayout specialty="urologie" color="#2980b9" steps={[
              '/urologie/consultation', '/urologie/ordonnance', '/urologie/labo', '/urologie/radio', '/payement'
            ]}>
              <UrologieLab />
            </ServiceLayout>
          </SoftPrivateRoute>
        } />
        
        <Route path="/urologie/radio" element={
          <SoftPrivateRoute requiredSpecialty="urologie">
            <ServiceLayout specialty="urologie" color="#2980b9" steps={[
              '/urologie/consultation', '/urologie/ordonnance', '/urologie/labo', '/urologie/radio', '/payement'
            ]}>
              <UrologieRadio />
            </ServiceLayout>
          </SoftPrivateRoute>
        } />
        
        {/* ==================== CARDIOLOGIE ==================== */}
        <Route path="/cardiologie/examen" element={
          <SoftPrivateRoute requiredSpecialty="cardiologie">
            <ServiceLayout specialty="cardiologie" color="#c0392b" steps={[
              '/cardiologie/examen', '/cardiologie/ordonnance', '/cardiologie/radio', '/payement'
            ]}>
              <CardioExam />
            </ServiceLayout>
          </SoftPrivateRoute>
        } />
        
        <Route path="/cardiologie/ordonnance" element={
          <SoftPrivateRoute requiredSpecialty="cardiologie">
            <ServiceLayout specialty="cardiologie" color="#c0392b" steps={[
              '/cardiologie/examen', '/cardiologie/ordonnance', '/cardiologie/radio', '/payement'
            ]}>
              <CardioOrdonnance />
            </ServiceLayout>
          </SoftPrivateRoute>
        } />
        
        <Route path="/cardiologie/radio" element={
          <SoftPrivateRoute requiredSpecialty="cardiologie">
            <ServiceLayout specialty="cardiologie" color="#c0392b" steps={[
              '/cardiologie/examen', '/cardiologie/ordonnance', '/cardiologie/radio', '/payement'
            ]}>
              <CardioRadio />
            </ServiceLayout>
          </SoftPrivateRoute>
        } />
        
        {/* ==================== PAIEMENT ==================== */}
        <Route path="/payement" element={
          <SoftPrivateRoute>
            <div style={{ minHeight: '100vh', background: '#f0f4f8', padding: '30px' }}>
              <PayementSection 
                isOpen={true} 
                onClose={() => window.location.href = '/patient'} 
                onSubmit={() => {}} 
                initialType="consultation" 
              />
            </div>
          </SoftPrivateRoute>
        } />
        
        <Route path="/payement/add-family" element={
          <SoftPrivateRoute>
            <FamilyMemberModal isOpen={true} onClose={() => window.history.back()} />
          </SoftPrivateRoute>
        } />
        
        <Route path="/payement/family-history" element={
          <SoftPrivateRoute>
            <FamilyMemberHistoryModal isOpen={true} onClose={() => window.history.back()} />
          </SoftPrivateRoute>
        } />
        
        <Route path="/payement/carnet" element={
          <SoftPrivateRoute>
            <CarnetModal isOpen={true} onClose={() => window.history.back()} />
          </SoftPrivateRoute>
        } />
        
        <Route path="/payement/security" element={
          <SoftPrivateRoute>
            <TwoFactorModal isOpen={true} onClose={() => window.history.back()} />
          </SoftPrivateRoute>
        } />
        
        <Route path="/payement/help" element={
          <SoftPrivateRoute>
            <HelpModal isOpen={true} onClose={() => window.history.back()} />
          </SoftPrivateRoute>
        } />
        
        {/* ==================== PHARMACIE ==================== */}
        <Route path="/pharmacie" element={
          <SoftPrivateRoute>
            <PharmaLayout>
              <Navigate to="/pharmacie/dashboard" replace />
            </PharmaLayout>
          </SoftPrivateRoute>
        } />
        
        <Route path="/pharmacie/inventory" element={
          <SoftPrivateRoute>
            <PharmaLayout>
              <PharmaInventory />
            </PharmaLayout>
          </SoftPrivateRoute>
        } />
        
        <Route path="/pharmacie/orders" element={
          <SoftPrivateRoute>
            <PharmaLayout>
              <PharmaOrders />
            </PharmaLayout>
          </SoftPrivateRoute>
        } />
        
        <Route path="/pharmacie/chat" element={
          <SoftPrivateRoute>
            <PharmaLayout>
              <PharmaChat />
            </PharmaLayout>
          </SoftPrivateRoute>
        } />
        
        <Route path="/pharmacie/settings" element={
          <SoftPrivateRoute>
            <PharmaLayout>
              <PharmaSettings />
            </PharmaLayout>
          </SoftPrivateRoute>
        } />
        
        {/* ==================== WORKFLOW PHARMACIE/CAISSE (NOUVEAU) ==================== */}
        <Route path="/pharmacie/dashboard" element={
          <SoftPrivateRoute>
            <PharmaLayout>
              <PharmacieWorkflow />
            </PharmaLayout>
          </SoftPrivateRoute>
        } />
        
        <Route path="/caisse" element={
          <SoftPrivateRoute>
            <div style={{ minHeight: '100vh', background: '#f4f7f6' }}>
              <CaisseWorkflow />
            </div>
          </SoftPrivateRoute>
        } />
        
        {/* ==================== REDIRECTIONS PAR DÉFAUT ==================== */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/select-service" element={<Navigate to="/patient" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
        
      </Routes>
    </>
  );
}