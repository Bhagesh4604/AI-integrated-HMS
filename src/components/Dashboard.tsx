import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Stethoscope, Bed, DollarSign, TrendingUp, Scissors, Sun, Moon, Activity, Pill, Clock } from 'lucide-react';

import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import EmergencyAlertWidget from './EmergencyAlertWidget';
import apiUrl from '@/config/api';

// --- 3D Stat Card Component ---
interface StatCardProps {
  title: string;
  value: string;
  icon: any;
  color: string;
  trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, trend }) => {
  // Random delay for stagger effect
  const delay = Math.random() * 0.5;

  return (
    <motion.div
      className="relative p-6 rounded-3xl overflow-hidden glass-card group perspective-1000"
      initial={{ opacity: 0, y: 50, rotateX: 10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay, duration: 0.6, type: "spring" }}
      whileHover={{ y: -10, rotateX: 5, z: 50, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
    >
      {/* 3D Reflection Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10" />

      {/* Background Glow */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${color.replace('text-', 'bg-')}/20 blur-2xl group-hover:scale-150 transition-transform duration-700`} />

      <div className="relative z-20 flex flex-col h-full justify-between preserve-3d">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-2xl ${color.replace('text-', 'bg-')}/10 backdrop-blur-md shadow-inner`}>
            <Icon className={`w-6 h-6 ${color} drop-shadow-md`} />
          </div>
          {trend && (
            <span className="flex items-center text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
              <TrendingUp className="w-3 h-3 mr-1" />
              {trend}
            </span>
          )}
        </div>

        <div>
          <h3 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 tracking-tight">
            {value}
          </h3>
          <p className="text-sm font-medium text-muted-foreground mt-1 tracking-wide uppercase opacity-80">{title}</p>
        </div>
      </div>
    </motion.div>
  );
};

interface QuickActionProps {
  label: string;
  icon: any;
  onClick: () => void;
}

const QuickAction: React.FC<QuickActionProps> = ({ label, icon: Icon, onClick }) => (
  <button onClick={onClick} className="flex items-center space-x-3 text-left w-full p-3 rounded-lg transition-colors bg-muted/50 hover:bg-muted text-foreground">
    <Icon className="w-5 h-5 text-muted-foreground" />
    <span className="font-semibold">{label}</span>
  </button>
);

interface AgendaItem {
  id: string;
  appointmentDate: string;
  notes: string;
  patientName: string;
  status: string;
}

interface DashboardProps {
  setActiveModule: (module: string) => void;
}

export default function Dashboard({ setActiveModule }: DashboardProps) {
  const { theme } = useTheme();
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeStaff: 0,
    availableBeds: 0,
    revenue: 0,
  });
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [timeOfDay, setTimeOfDay] = useState('Morning');
  const { translate } = useLanguage() as any; // Temporary fix if translate type is unknown
  const [currentDate, setCurrentDate] = useState('');
  const [waitTime, setWaitTime] = useState(0);

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

      // Fetch Predicted Wait Time
      const waitTimeResponse = await fetch(apiUrl('/api/analytics/predict-wait-time'));
      const waitTimeData = await waitTimeResponse.json();
      if (waitTimeData.success) {
        setWaitTime(waitTimeData.waitTimeMinutes);
      }

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  };

  // --- Dynamic Translations ---
  const [translatedTexts, setTranslatedTexts] = useState({
    totalPatients: 'Total Patients',
    activeStaff: 'Active Staff',
    availableBeds: 'Available Beds',
    estWaitTime: 'Est. Wait Time',
    todaysRevenue: 'Today\'s Revenue',
    quickActions: 'Quick Actions',
    todaysAgenda: 'Today\'s Agenda',
    goodMorning: 'Good Morning',
    goodAfternoon: 'Good Afternoon',
    goodEvening: 'Good Evening'
  });

  useEffect(() => {
    const updateTranslations = async () => {
      const texts = {
        totalPatients: await translate('Total Patients'),
        activeStaff: await translate('Active Staff'),
        availableBeds: await translate('Available Beds'),
        estWaitTime: await translate('Est. Wait Time'),
        todaysRevenue: await translate('Today\'s Revenue'),
        quickActions: await translate('Quick Actions'),
        todaysAgenda: await translate('Today\'s Agenda'),
        goodMorning: await translate('Good Morning'),
        goodAfternoon: await translate('Good Afternoon'),
        goodEvening: await translate('Good Evening')
      };
      setTranslatedTexts(texts);
    };
    updateTranslations();
  }, [translate]); // Depend on translate function (which changes with language)

  const getGreeting = () => {
    if (timeOfDay === 'Morning') return translatedTexts.goodMorning;
    if (timeOfDay === 'Afternoon') return translatedTexts.goodAfternoon;
    return translatedTexts.goodEvening;
  };

  const statCards = [
    { title: translatedTexts.totalPatients, value: stats.totalPatients.toLocaleString(), icon: Users, color: 'text-pink-500', trend: "+12%" },
    { title: translatedTexts.activeStaff, value: stats.activeStaff.toLocaleString(), icon: Stethoscope, color: 'text-cyan-500' },
    { title: translatedTexts.availableBeds, value: stats.availableBeds.toLocaleString(), icon: Bed, color: 'text-emerald-500' },
    { title: translatedTexts.estWaitTime, value: `${waitTime}m`, icon: Clock, color: 'text-orange-500', trend: "AI Optimized" },
    { title: translatedTexts.todaysRevenue, value: `$${Number(stats.revenue || 0).toLocaleString()}`, icon: DollarSign, color: 'text-violet-500', trend: "+8.4%" },
  ];

  // --- IoT Simulation State ---
  const [heartRate, setHeartRate] = useState(72);
  const [oxygenLevel, setOxygenLevel] = useState(98);
  const [ecgData, setEcgData] = useState(new Array(20).fill(50));

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate Heart Rate (60-100)
      setHeartRate(prev => {
        const change = Math.floor(Math.random() * 5) - 2;
        const newVal = prev + change;
        return newVal > 100 ? 100 : newVal < 60 ? 60 : newVal;
      });

      // Simulate Oxygen (95-100)
      setOxygenLevel(prev => {
        const change = Math.floor(Math.random() * 3) - 1;
        const newVal = prev + change;
        return newVal > 100 ? 100 : newVal < 95 ? 95 : newVal;
      });

      // Simulate ECG Waveform
      setEcgData(prev => {
        const newData = [...prev.slice(1), Math.random() * 40 + 30];
        return newData;
      });

    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen p-4 sm:p-8 font-sans transition-colors duration-300 bg-background text-foreground">
      <EmergencyAlertWidget />
      <div>
        {/* --- HEADER --- */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
          <div>
            <div className="text-sm font-semibold text-primary mb-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-3">
              {getGreeting()}
              {parseInt(new Date().getHours().toString()) < 12 ? <Sun className="text-yellow-500 w-8 h-8" /> : parseInt(new Date().getHours().toString()) < 18 ? <Sun className="text-orange-500 w-8 h-8" /> : <Moon className="text-blue-400 w-8 h-8" />}
            </h1>
          </div>
          <LanguageSwitcher />
        </div>

        {/* --- IoT LIVE VITALS (INNOVATION) --- */}
        {/* --- IoT LIVE VITALS (INNOVATION) --- */}
        <motion.div
          className="mb-8 glass-panel from-blue-900/40 to-purple-900/40 p-1 rounded-3xl relative overflow-hidden group border-0 ring-1 ring-white/10"
          initial={{ opacity: 0, scale: 0.95, rotateX: 10 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Inner Content Container */}
          <div className="bg-black/40 backdrop-blur-md rounded-[20px] p-6 lg:p-8 h-full w-full relative z-10">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Activity size={120} />
            </div>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-200 dark:to-white drop-shadow-sm">
                  Live ICU Monitoring
                </span>
              </h2>
              <div className="text-xs px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-blue-600 dark:text-blue-200 font-mono">
                ID: ICU-WARD-01
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Heart Rate 3D Module */}
              <div className="relative bg-white/50 dark:bg-gradient-to-b dark:from-gray-800/50 dark:to-gray-900/80 p-5 rounded-2xl border border-black/5 dark:border-white/5 shadow-inner">
                <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-widest mb-2 font-semibold">Heart Rate</p>
                <div className="flex items-end gap-3">
                  <span className="text-5xl font-black text-gray-900 dark:text-white drop-shadow-sm dark:drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">{heartRate}</span>
                  <span className="text-sm text-red-500 dark:text-red-400 mb-2 font-bold">BPM</span>
                </div>
                {/* Dynamic ECG Canvas */}
                <div className="w-full h-16 mt-4 flex items-end justify-between gap-1 opacity-80">
                  {ecgData.map((val, i) => (
                    <div key={i} className="w-full bg-gradient-to-t from-red-600 to-red-400 rounded-t-sm shadow-sm"
                      style={{ height: `${val}%`, opacity: (i / ecgData.length) + 0.2 }}></div>
                  ))}
                </div>
              </div>

              {/* Oxygen 3D Module */}
              <div className="relative bg-white/50 dark:bg-gradient-to-b dark:from-gray-800/50 dark:to-gray-900/80 p-5 rounded-2xl border border-black/5 dark:border-white/5 shadow-inner">
                <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-widest mb-2 font-semibold">Oxygen Saturation</p>
                <div className="flex items-end gap-3">
                  <span className="text-5xl font-black text-gray-900 dark:text-white drop-shadow-sm dark:drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">{oxygenLevel}</span>
                  <span className="text-sm text-blue-500 dark:text-blue-400 mb-2 font-bold">% SpO2</span>
                </div>
                {/* Liquid Gauge Simulation */}
                <div className="w-full bg-gray-200 dark:bg-gray-700/50 h-3 rounded-full mt-8 overflow-hidden border border-black/5 dark:border-white/5 relative">
                  <div className="absolute inset-0 bg-blue-500/20 animate-pulse"></div>
                  <div className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full transition-all duration-700 shadow-[0_0_15px_rgba(34,211,238,0.6)]"
                    style={{ width: `${oxygenLevel}%` }}></div>
                </div>
              </div>

              {/* Status 3D Module */}
              <div className="relative bg-white/50 dark:bg-gradient-to-b dark:from-gray-800/50 dark:to-gray-900/80 p-5 rounded-2xl border border-black/5 dark:border-white/5 shadow-inner flex flex-col justify-center items-center">
                <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(34,197,94,0.2)] animate-pulse">
                  <Activity className="text-green-600 dark:text-green-400 w-10 h-10" />
                </div>
                <span className="text-green-700 dark:text-green-300 font-bold tracking-wider text-sm">SYSTEM STABLE</span>
                <span className="text-xs text-green-600/70 dark:text-green-500/60 mt-1 font-mono">Uptime: 99.9%</span>
              </div>
            </div>
          </div>
        </motion.div>

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
            <h3 className="font-bold text-lg mb-4">{translatedTexts.quickActions}</h3>
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
                  <div className="w-20 text-sm font-semibold text-muted-foreground">{new Date(item.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
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
      {/* --- SOS FLOATING BUTTON (INNOVATION) --- */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9, rotate: 0 }}
        onClick={async () => {
          if (!confirm("Are you sure you want to trigger an Emergency SOS?")) return;

          const patientId = 1; // Demo ID
          const lat = 12.9716; // Demo Lat (Bangalore)
          const lng = 77.5946; // Demo Lng

          try {
            // Use the new AI Auto-Dispatch Endpoint
            const response = await fetch(apiUrl('/api/ems/patient/book-ambulance'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ patientId, lat, lng })
            });
            const data = await response.json();
            if (data.success) {
              alert(`SOS SENT! 🚨\nAssigned: ${data.vehicle}\nETA: ${data.eta} mins`);
            } else {
              alert("Failed to send SOS: " + data.message);
            }
          } catch (e) {
            alert("Connection Error");
          }
        }}
        className="fixed bottom-8 right-8 bg-gradient-to-br from-red-600 to-red-800 text-white w-20 h-20 rounded-full shadow-[0_10px_30px_rgba(220,38,38,0.5)] flex items-center justify-center z-50 animate-pulse border-4 border-red-400/50 backdrop-blur-sm perspective-1000"
      >
        <span className="font-black text-2xl drop-shadow-md">SOS</span>
      </motion.button>
    </div>
  );
}