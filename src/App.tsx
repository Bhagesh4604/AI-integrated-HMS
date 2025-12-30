import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// --- MODULE IMPORTS ---
import PatientManagement from './components/PatientManagement';
import MedicalRecordsModule from './components/MedicalRecordsModule';
import PharmacyManagement from './components/PharmacyManagement';
import LaboratoryModule from './components/LaboratoryModule';
import SurgicalModule from './components/SurgicalModule';
import EmployeeManagement from './components/EmployeeManagement';
import AccountingModule from './components/AccountingModule';
import PayrollModule from './components/PayrollModule';
import VendorModule from './components/VendorModule';
import InventoryModule from './components/InventoryModule';
import SMSModule from './components/SMSModule';
import ImmunizationModule from './components/ImmunizationModule';
import BillingModule from './components/BillingModule';
import TelemedicineModule from './components/TelemedicineModule';
import PatientDashboard from './components/patient/PatientDashboard';
import BookAmbulance from './pages/patient/BookAmbulance';
import TrackAmbulance from './pages/patient/TrackAmbulance';
import AppointmentsView from './components/AppointmentsView';
import Dashboard from './components/Dashboard';
import NewSidebar from './components/NewSidebar';
import DoctorScheduleModule from './components/DoctorScheduleModule';
import LandingPage from './pages/LandingPage';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import Profile from './components/Profile';
import BedManagement from './components/BedManagement';
import FleetManagementDashboard from './pages/FleetManagementDashboard'; // New EMS Dashboard
import ParamedicMode from './pages/ParamedicMode'; // New Paramedic Mode
import ERDashboard from './pages/ERDashboard'; // New ER Dashboard
import EmsLayout from './components/ems/EmsLayout'; // New EMS Layout
import DoctorCardiacMonitor from './pages/DoctorCardiacMonitor'; // New Cardiac Monitor
import OncologyScreening from './components/OncologyScreening'; // New Oncology Module

// --- AUTH & ROUTING IMPORTS ---
import StaffLogin from './components/auth/StaffLogin';
import PatientAuthPage from './pages/PatientAuthPage';
import PatientRegister from './components/auth/PatientRegister';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import ProtectedRoute from './components/auth/ProtectedRoute';

// --- THEME IMPORTS ---
import { useTheme } from './context/ThemeContext';
import { Button } from './components/ui/button';
import { Sun, Moon } from 'lucide-react';

// --- Main Staff Application Structure ---
const MainApplication = ({ user, onLogout, updateUser }) => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { toggleTheme } = useTheme();

  const handleModuleChange = (module) => {
    if (module !== activeModule) {
      setActiveModule(module);
    }
  };

  // Listen for Voice Commands
  useEffect(() => {
    const handleVoiceNav = (e: any) => {
      if (e.detail) setActiveModule(e.detail);
    };
    window.addEventListener('switch-module', handleVoiceNav);
    return () => window.removeEventListener('switch-module', handleVoiceNav);
  }, []);

  const renderModule = () => {
    const isAdmin = user.role === 'admin';
    const isDoctor = user.role === 'doctor';

    switch (activeModule) {
      case 'dashboard': return <Dashboard setActiveModule={handleModuleChange} />;
      case 'patients': return <PatientManagement />;
      case 'pharmacy': return <PharmacyManagement />;
      case 'laboratory': return <LaboratoryModule />;
      case 'medical-records': return <MedicalRecordsModule />;
      case 'surgical': return <SurgicalModule />;
      case 'telemedicine': return isDoctor ? <TelemedicineModule user={user} /> : <div className="p-8 text-red-500">Access Denied</div>;
      case 'appointments': return <AppointmentsView user={user} />;
      case 'cardiac-monitor': return <DoctorCardiacMonitor />; // New Module
      case 'oncology-screening': return <OncologyScreening />; // New Module
      case 'my-schedule': return isDoctor ? <DoctorScheduleModule user={user} /> : <div className="p-8 text-red-500">Access Denied</div>;
      case 'analytics': return isAdmin ? <AnalyticsDashboard /> : <div className="p-8 text-red-500">Access Denied</div>;
      case 'bed-management': return isAdmin ? <BedManagement /> : <div className="p-8 text-red-500">Access Denied</div>;
      case 'employees': return isAdmin ? <EmployeeManagement /> : <div className="p-8 text-red-500">Access Denied</div>;
      case 'accounting': return isAdmin ? <AccountingModule /> : <div className="p-8 text-red-500">Access Denied</div>;
      case 'billing': return isAdmin ? <BillingModule /> : <div className="p-8 text-red-500">Access Denied</div>;
      case 'payroll': return isAdmin ? <PayrollModule /> : <div className="p-8 text-red-500">Access Denied</div>;
      case 'vendors': return isAdmin ? <VendorModule /> : <div className="p-8 text-red-500">Access Denied</div>;
      case 'inventory': return isAdmin ? <InventoryModule /> : <div className="p-8 text-red-500">Access Denied</div>;
      case 'immunizations': return <ImmunizationModule />;
      case 'sms': return isAdmin ? <SMSModule /> : <div className="p-8 text-red-500">Access Denied</div>;
      case 'profile': return <Profile user={user} updateUser={updateUser} />;
      default: return <Dashboard setActiveModule={handleModuleChange} />;
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      <NewSidebar activeModule={activeModule} setActiveModule={handleModuleChange} userType={user.role} onLogout={onLogout} user={user} isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 shadow-md pt-6">
          <div className="flex justify-between items-center p-4">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Shree Medicare</h1>
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </header>
        <main className="relative flex-1 overflow-y-auto bg-background">
          <div className="relative z-10 bg-transparent">
            {renderModule()}
          </div>
        </main>
      </div>
    </div>
  );
};

import VoiceController from './components/VoiceController';

// --- Root App Component ---
function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const navigateToDashboard = useCallback((user) => {
    switch (user.role) {
      case 'patient':
        navigate('/patient-dashboard');
        break;
      case 'admin':
        navigate('/staff-dashboard');
        break;
      case 'ROLE_DISPATCHER':
        navigate('/fleet-management');
        break;
      case 'ROLE_PARAMEDIC':
        navigate('/paramedic-mode');
        break;
      case 'ROLE_ER_STAFF':
        navigate('/er-dashboard');
        break;
      case 'doctor':
      default:
        navigate('/staff-dashboard');
        break;
    }
  }, [navigate]);

  const handleLogin = (user) => {
    const userWithRole = user.role ? user : { ...user, role: 'patient' };
    localStorage.setItem('loggedInUser', JSON.stringify(userWithRole));
    setLoggedInUser(userWithRole);
  };

  useEffect(() => {
    if (loggedInUser && location.pathname.includes('/login')) {
      navigateToDashboard(loggedInUser);
    }
  }, [loggedInUser, location.pathname, navigateToDashboard]);

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    setLoggedInUser(null);
    navigate('/');
  };

  const updateLoggedInUser = (updatedData) => {
    const updatedUser = { ...loggedInUser, ...updatedData };
    localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
    setLoggedInUser(updatedUser);
  };

  return (
    <>
      <VoiceController />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={loggedInUser ? <Navigate to="/staff-dashboard" /> : <LandingPage />} />
        <Route path="/login/staff" element={<StaffLogin onLogin={handleLogin} />} />
        <Route path="/login/patient" element={<PatientAuthPage onLogin={handleLogin} />} />
        <Route path="/register/patient" element={<PatientRegister />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Routes */}
        <Route
          path="/staff-dashboard"
          element={
            <ProtectedRoute user={loggedInUser} allowedRoles={['admin', 'doctor']}>
              <MainApplication user={loggedInUser} onLogout={handleLogout} updateUser={updateLoggedInUser} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient-dashboard"
          element={
            <ProtectedRoute user={loggedInUser} allowedRoles={['patient']}>
              <PatientDashboard patient={loggedInUser} onLogout={handleLogout} updateUser={updateLoggedInUser} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/book-ambulance"
          element={
            <ProtectedRoute user={loggedInUser} allowedRoles={['patient']}>
              <BookAmbulance user={loggedInUser} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/track-ambulance/:tripId"
          element={
            <ProtectedRoute user={loggedInUser} allowedRoles={['patient']}>
              <TrackAmbulance user={loggedInUser} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fleet-management"
          element={
            <ProtectedRoute user={loggedInUser} allowedRoles={['ROLE_DISPATCHER', 'admin']}>
              <EmsLayout user={loggedInUser} onLogout={handleLogout}>
                <FleetManagementDashboard />
              </EmsLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/paramedic-mode"
          element={
            <ProtectedRoute user={loggedInUser} allowedRoles={['ROLE_PARAMEDIC']}>
              <EmsLayout user={loggedInUser} onLogout={handleLogout}>
                <ParamedicMode user={loggedInUser} />
              </EmsLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/er-dashboard"
          element={
            <ProtectedRoute user={loggedInUser} allowedRoles={['ROLE_ER_STAFF', 'admin']}>
              <EmsLayout user={loggedInUser} onLogout={handleLogout}>
                <ERDashboard />
              </EmsLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;