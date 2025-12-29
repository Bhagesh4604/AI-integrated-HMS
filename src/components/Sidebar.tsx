// src/components/Sidebar.tsx (Corrected)

import React from 'react';
import {
  LayoutDashboard, Users, UserCog, Pill, DollarSign, Activity,
  FileText, Stethoscope, Scissors, CreditCard, Package, MessageSquare,
  LogOut, Calendar, Sun, Moon, Clock, BarChartHorizontal, BedDouble, Syringe, Video, Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import AboutModal from './AboutModal';

import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useState, useEffect } from 'react';

const SidebarItem = ({ item, isActive, onClick }) => {
  return (
    <motion.button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors duration-200 relative focus:outline-none focus:ring-2 focus:ring-blue-500 ${isActive ? 'text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      aria-label={`Navigate to ${item.label}`}
      aria-current={isActive ? 'page' : undefined}
    >
      {isActive && (
        <motion.div
          layoutId="active-pill"
          className="absolute inset-0 bg-blue-600 rounded-lg"
          style={{ borderRadius: 8 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        />
      )}
      <span className="relative z-10"><item.icon size={20} /></span>
      <span className="relative z-10 font-semibold">{item.label}</span>
    </motion.button>
  );
};

export default function Sidebar({ activeModule, setActiveModule, userType, onLogout, isSidebarOpen, setSidebarOpen }) {
  const { theme, toggleTheme } = useTheme();
  const { translate } = useLanguage();
  const [translatedLabels, setTranslatedLabels] = useState({});
  const [showAbout, setShowAbout] = useState(false);

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
    { id: 'surgical', label: 'Surgical', icon: Scissors },
    { id: 'payroll', label: 'Payroll', icon: CreditCard },
    { id: 'vendors', label: 'Vendors', icon: Package },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'sms', label: 'SMS & Reports', icon: MessageSquare },
  ];

  const doctorMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-schedule', label: 'My Schedule', icon: Clock },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'telemedicine', label: 'Telemedicine', icon: Video },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'pharmacy', label: 'Pharmacy', icon: Pill },
    { id: 'laboratory', label: 'Laboratory', icon: Activity },
    { id: 'medical-records', label: 'Medical Records', icon: FileText },
    { id: 'surgical', label: 'Surgical', icon: Scissors },
  ];

  const menuItems = userType === 'admin' ? adminMenuItems : doctorMenuItems;

  useEffect(() => {
    const translateMenuItems = async () => {
      const newLabels = {};
      for (const item of menuItems) {
        newLabels[item.id] = await translate(item.label);
      }
      setTranslatedLabels(newLabels);
    };
    translateMenuItems();
  }, [translate, userType]);


  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  return (
    <>
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden ${isSidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)}></div>
      <div className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-[#111111] border-r border-gray-200 dark:border-gray-800 flex flex-col font-sans transition-transform duration-300 ease-in-out z-50 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:relative lg:w-64`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <img src="/logo.svg" alt="Shree Medicare Logo" className="w-10 h-10 rounded-lg object-cover" />
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                Shree Medicare
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-500">HMS</p>
            </div>
          </div>
        </div>

        <motion.nav
          className="flex-1 p-4 space-y-1 overflow-y-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {menuItems.map((item) => (
            <motion.div key={item.id}>
              <SidebarItem
                item={{ ...item, label: translatedLabels[item.id] || item.label }}
                isActive={activeModule === item.id}
                onClick={() => {
                  setActiveModule(item.id);
                  setSidebarOpen(false);
                }}
              />
            </motion.div>
          ))}
        </motion.nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">

          <button
            onClick={() => setShowAbout(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Info size={20} />
            <span>About & Licenses</span>
          </button>

          <div className="flex items-center justify-between p-2 rounded-lg bg-gray-100 dark:bg-gray-800/50">
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Theme</span>
            <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white" aria-label="Toggle Theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-500 dark:text-red-400 font-semibold hover:bg-red-100 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="Logout"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
    </>
  );
}