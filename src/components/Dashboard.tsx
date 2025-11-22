import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Stethoscope, Bed, DollarSign, TrendingUp, Scissors, Sun, Moon, Activity, Pill } from 'lucide-react';

import { useTheme } from '../context/ThemeContext';
import apiUrl from '@/config/api';

// --- Re-styled Stat Card Component ---
const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <motion.div
    className="p-4 rounded-2xl flex flex-col justify-between transition-colors duration-300 bg-card border border-border shadow-sm"
    whileHover={{ scale: 1.03, boxShadow: "0px 10px 30px rgba(0,0,0,0.1)" }}
    transition={{ type: 'spring', stiffness: 300 }}
  >
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
      <Icon className={`w-5 h-5 ${color}`} />
    </div>
    <div>
        <h3 className="text-3xl font-bold mt-2 text-foreground truncate">{value}</h3>
        {trend && (
          <div className="flex items-center text-green-500 text-xs mt-1">
            <TrendingUp className="w-3 h-3 mr-1" />
            <span className="truncate">{trend}</span>
          </div>
        )}
    </div>
  </motion.div>
);

// --- New Component for Quick Actions ---
const QuickAction = ({ label, icon: Icon, onClick }) => (
    <button onClick={onClick} className="flex items-center space-x-3 text-left w-full p-3 rounded-lg transition-colors bg-muted/50 hover:bg-muted text-foreground">
        <Icon className="w-5 h-5 text-muted-foreground"/>
        <span className="font-semibold">{label}</span>
    </button>
);



export default function Dashboard({ setActiveModule }) {
  const { theme } = useTheme();
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeStaff: 0,
    availableBeds: 0,
    revenue: 0,
  });
  const [agenda, setAgenda] = useState([]);
  const [timeOfDay, setTimeOfDay] = useState('Morning');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('Morning');
    else if (hour < 18) setTimeOfDay('Afternoon');
    else setTimeOfDay('Evening');

    setCurrentDate(new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }));

    fetchDashboardData();
  }, []);

    const fetchDashboardData = async () => {
    try {
      const statsResponse = await fetch(apiUrl('/api/dashboard/stats'));
      const statsData = await statsResponse.json();
      console.log("Dashboard stats data:", statsData);
      if (statsData) {
        setStats(statsData);
      }

      const agendaResponse = await fetch(apiUrl('/api/dashboard/agenda')); 
      const agendaData = await agendaResponse.json();
      console.log("Dashboard agenda data:", agendaData);
      if (Array.isArray(agendaData)) {
          setAgenda(agendaData);
      }

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  };

  const statCards = [
    { title: 'Total Patients', value: stats.totalPatients.toLocaleString(), icon: Users, color: 'text-pink-400', trend: "+5 this week" },
    { title: 'Active Staff', value: stats.activeStaff.toLocaleString(), icon: Stethoscope, color: 'text-blue-400' },
    { title: 'Available Beds', value: stats.availableBeds.toLocaleString(), icon: Bed, color: 'text-green-400' },
    { title: 'Today\'s Revenue', value: `$${Number(stats.revenue || 0).toLocaleString()}`, icon: DollarSign, color: 'text-teal-400', trend: "+$1.2k today" },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-8 font-sans transition-colors duration-300 bg-background text-foreground">
      <div>
        {/* --- HEADER --- */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
          <div>
            <p className="text-base sm:text-lg text-muted-foreground">{currentDate}</p>
            <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-3">
              Good {timeOfDay}
              {timeOfDay === 'Morning' ? <Sun className="text-yellow-400"/> : <Moon className="text-blue-300"/>}
            </h1>
          </div>
        </div>

        {/* --- MAIN GRID --- */}
        <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
            {/* Stat Cards */}
            {statCards.map((stat) => (
              <div key={stat.title}>
                <StatCard {...stat} />
              </div>
            ))}

            {/* Quick Actions */}
            <div className="sm:col-span-2 lg:col-span-1 p-6 rounded-2xl transition-colors duration-300 bg-card border border-border">
                 <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
                 <div className="space-y-3">
                    <QuickAction label="Admit New Patient" icon={Users} onClick={() => setActiveModule('patients')} />
                    <QuickAction label="Schedule Surgery" icon={Scissors} onClick={() => setActiveModule('surgical')} />
                    <QuickAction label="New Lab Test" icon={Activity} onClick={() => setActiveModule('laboratory')} />
                    <QuickAction label="Check Pharmacy Stock" icon={Pill} onClick={() => setActiveModule('pharmacy')} />
                 </div>
            </div>

            {/* Today's Agenda */}
            <div className="sm:col-span-2 lg:col-pan-3 p-4 rounded-2xl transition-colors duration-300 bg-card border border-border">
                <h3 className="font-bold text-lg mb-4">Today's Agenda</h3>
                <div className="space-y-3 overflow-x-auto">
                    {agenda.length > 0 ? agenda.map(item => (
                        <div key={item.id} className="flex items-center space-x-4 p-3 rounded-lg transition-colors duration-300 bg-muted/50 min-w-max">
                           <div className="w-1 h-10 rounded-full bg-primary"></div>
                           <div className="w-20 text-sm font-semibold text-muted-foreground">{new Date(item.appointmentDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                           <div className="flex-1">
                               <p className="font-semibold truncate text-foreground">{item.notes || 'Check-up'}</p>
                               <p className="text-xs text-muted-foreground truncate">{item.patientName}</p>
                           </div>
                           <span className="px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary">
                               {item.status}
                           </span>
                        </div>
                    )) : (
                        <p className="text-center text-muted-foreground py-10">No appointments scheduled for today.</p>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}