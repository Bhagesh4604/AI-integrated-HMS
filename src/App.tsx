import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
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
import TelemedicineModule from './components/TelemedicineModule'; // New import // New import
import PatientDashboard from './components/patient/PatientDashboard';
import AppointmentsView from './components/AppointmentsView';
import Dashboard from './components/Dashboard';
import NewSidebar from './components/NewSidebar';
import DoctorScheduleModule from './components/DoctorScheduleModule';
import LandingPage from './pages/LandingPage';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import Profile from './components/Profile';
import BedManagement from './components/BedManagement';
import { ShaderAnimation } from './components/ui/shader-animation';

import StaffLogin from './components/auth/StaffLogin';
import PatientLogin from './components/auth/PatientLogin';
import PatientRegister from './components/auth/PatientRegister';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import VerifyEmail from './components/auth/VerifyEmail';


// --- THEME IMPORTS ---
import { useTheme } from './context/ThemeContext';

import { Button } from './components/ui/button';
import { Sun, Moon } from 'lucide-react';

// --- Main Application Structure ---

const MainApplication = ({ user, onLogout, updateUser }) => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [animationTrigger, setAnimationTrigger] = useState(0);
  const { theme, toggleTheme } = useTheme();

  const handleModuleChange = (module) => {
    if (module !== activeModule) {
      setActiveModule(module);
      setAnimationTrigger(c => c + 1); // Trigger the animation
    }
  };

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
}

// --- Root App Component ---

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  console.log('App: loggedInUser:', loggedInUser);
  const [loginPortal, setLoginPortal] = useState(null);
  console.log('App: loginPortal:', loginPortal);
  const [loginType, setLoginType] = useState(null);
  const [patientAuthMode, setPatientAuthMode] = useState('login');

  const handleLogin = (user) => {
    const userWithRole = user.role ? user : { ...user, role: 'patient' };
    setLoggedInUser(userWithRole);
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setLoginPortal(null);
    setPatientAuthMode('login');
  };

  const handlePortalSelect = (portal) => {
    setLoginPortal(portal);
  };

  const updateLoggedInUser = (updatedData) => {
    setLoggedInUser(prevUser => ({ ...prevUser, ...updatedData }));
  };

  return (
      <Routes>
            <Route path="/reset-password" element={<ResetPassword setAuthMode={setPatientAuthMode} />} />
            <Route path="/" element={(() => {
          if (!loggedInUser) {
            if (loginPortal === 'staff') {
              return <StaffLogin onLogin={handleLogin} setLoginPortal={setLoginPortal} />;
            }
            if (loginPortal === 'patient') {
              if (patientAuthMode === 'login') {
                return <PatientLogin onLogin={handleLogin} setAuthMode={setPatientAuthMode} setLoginPortal={setLoginPortal} />;
              }
              if (patientAuthMode === 'forgot_password') {
                return <ForgotPassword setAuthMode={setPatientAuthMode} />;
              }
              return <PatientRegister setAuthMode={setPatientAuthMode} setLoginPortal={setLoginPortal} />;
            }
            return <LandingPage setLoginPortal={handlePortalSelect} />;
          }

          if (loggedInUser.role === 'patient') {
            return <PatientDashboard patient={loggedInUser} onLogout={handleLogout} updateUser={updateLoggedInUser} />;
          }

          return <MainApplication user={loggedInUser} onLogout={handleLogout} updateUser={updateLoggedInUser} />;
        })()} />
    </Routes>
  );
}

export default App;
