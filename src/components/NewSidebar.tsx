// src/components/NewSidebar.tsx (Glassmorphic)

import React from 'react';
import {
  LayoutDashboard, Users, UserCog, Pill, DollarSign, Activity,
  FileText, Scissors, CreditCard, Package, MessageSquare,
  LogOut, Calendar, Sun, Moon, Clock, BarChartHorizontal, BedDouble, Syringe, Video, MapPin, HeartPulse, Microscope
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

interface SidebarItemProps {
  item: {
    id: string;
    label: string;
    icon: any;
    action?: () => void;
  };
  isActive: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ item, isActive, onClick }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 relative group overflow-hidden ${isActive ? 'text-white shadow-lg shadow-blue-500/20' : 'text-gray-500 dark:text-gray-400 hover:bg-white/5 hover:text-blue-400'}`}
    >
      {isActive && (
        <motion.div
          layoutId="active-pill"
          className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500"
          style={{ borderRadius: 12 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      {/* Hover Glow Effect */}
      {!isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}

      <span className="relative z-10"><item.icon size={20} className={isActive ? "text-white" : "group-hover:text-blue-400 transition-colors"} strokeWidth={isActive ? 2.5 : 2} /></span>
      <span className={`relative z-10 font-medium tracking-wide ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
    </motion.button>
  );
};

interface NewSidebarProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
  userType: string;
  onLogout: () => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  user: any;
}

export default function NewSidebar({ activeModule, setActiveModule, userType, onLogout, isSidebarOpen, setSidebarOpen, user }: NewSidebarProps) {
  const { theme, toggleTheme } = useTheme();

  const hospitalAddress = '96GF+GMJ, Tolnoor, Maharashtra 413227';
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(hospitalAddress)}`;

  const directionsMenuItem = {
    id: 'directions',
    label: 'Directions',
    icon: MapPin,
    action: () => window.open(googleMapsUrl, '_blank')
  };

  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChartHorizontal },
    { id: 'bed-management', label: 'Bed Management', icon: BedDouble },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'employees', label: 'Employees', icon: UserCog },
    { id: 'pharmacy', label: 'Pharmacy', icon: Pill },
    { id: 'accounting', label: 'Accounting', icon: DollarSign },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'laboratory', label: 'Laboratory', icon: Activity },
    { id: 'medical-records', label: 'Medical Records', icon: FileText },
    { id: 'immunizations', label: 'Immunizations', icon: Syringe },
    { id: 'surgical', label: 'Surgical', icon: Scissors }, // Updated from Scissor
    { id: 'payroll', label: 'Payroll', icon: CreditCard },
    { id: 'vendors', label: 'Vendors', icon: Package },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'sms', label: 'SMS & Reports', icon: MessageSquare },
    directionsMenuItem,
  ];

  const doctorMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'cardiac-monitor', label: 'Heart Monitor', icon: Activity },
    { id: 'oncology-screening', label: 'Oncology AI', icon: Microscope }, // New Module
    { id: 'my-schedule', label: 'My Schedule', icon: Clock },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'telemedicine', label: 'Telemedicine', icon: Video },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'pharmacy', label: 'Pharmacy', icon: Pill },
    { id: 'laboratory', label: 'Laboratory', icon: Activity },
    { id: 'medical-records', label: 'Medical Records', icon: FileText },
    { id: 'surgical', label: 'Surgical', icon: Scissors }, // Updated from Scissor
    directionsMenuItem,
  ];

  const patientMenuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'appointments', label: 'My Visits', icon: Calendar },
    { id: 'records', label: 'History', icon: FileText },
    { id: 'prescriptions', label: 'Meds', icon: Pill },
    { id: 'heart-health', label: 'Heart Health', icon: HeartPulse }, // New Module
    { id: 'lab_results', label: 'Labs', icon: Activity },
    { id: 'billing', label: 'Payments', icon: DollarSign },
    { id: 'medications', label: 'Tracker', icon: Clock },
    { id: 'timeline', label: 'Timeline', icon: BarChartHorizontal },
    directionsMenuItem,
  ];

  const menuItems = userType === 'admin' ? adminMenuItems : userType === 'doctor' ? doctorMenuItems : patientMenuItems;

  const sidebarVariants = {
    closed: { x: "-100%", opacity: 0 },
    open: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.div
        className={`fixed top-0 left-0 h-full z-50 flex flex-col
                    transition-all duration-300 ease-in-out lg:bg-transparent perspective-1000
                    lg:relative lg:translate-x-0
                    ${isSidebarOpen ? 'translate-x-0 w-72 lg:w-64 px-4 lg:px-6' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:px-0'}
                    overflow-hidden shadow-2xl lg:shadow-none`}
      >
        {/* Glassmorphism Background (Desktop only usually, but aiming for premium everywhere) */}
        <div className="absolute inset-0 bg-white/60 dark:bg-black/40 backdrop-blur-2xl border-r border-white/20 dark:border-white/5 shadow-[20px_0_50px_rgba(0,0,0,0.1)] lg:rounded-r-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">

          {/* Header */}
          <div className="flex items-center gap-3 px-2 mb-8 mt-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <HeartPulse className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                Shree Medicare
              </h1>
              <p className="text-xs text-blue-500 font-medium tracking-wider uppercase">Health Portal</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto pr-2 scrollbar-hide">
            {menuItems.map((item) => (
              <SidebarItem
                key={item.id}
                item={item}
                isActive={activeModule === item.id}
                onClick={() => {
                  const itemWithAction = item as { action?: () => void; id: string };
                  if (itemWithAction.action) itemWithAction.action();
                  else setActiveModule(item.id);
                  // Only auto-close on mobile
                  if (window.innerWidth < 1024) {
                    setSidebarOpen(false);
                  }
                }}
              />
            ))}
          </nav>

          {/* Footer / Profile */}
          <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-100/50 dark:bg-white/5 border border-white/10">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Theme</span>
              <button onClick={toggleTheme} className="p-1.5 rounded-lg bg-white dark:bg-black/40 text-gray-600 dark:text-gray-300 shadow-sm hover:scale-105 transition-transform">
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>

            <button
              onClick={() => setActiveModule('profile')}
              className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 transition-colors group"
            >
              <img
                src={user.profileImageUrl || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=0EA5E9&color=fff`}
                className="w-10 h-10 rounded-full border-2 border-white/20 shadow-md group-hover:scale-105 transition-transform"
                alt="Profile"
              />
              <div className="text-left overflow-hidden">
                <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate capitalize">{userType}</p>
              </div>
            </button>

            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 font-medium transition-colors"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}