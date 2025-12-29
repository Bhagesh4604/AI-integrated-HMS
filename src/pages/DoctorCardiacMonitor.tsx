import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Activity, AlertTriangle, Phone, Video, CheckCircle, Search, Filter, ShieldAlert } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const apiUrl = (endpoint) => {
    const baseUrl = import.meta.env.VITE_API_BASE || 'http://localhost:8080';
    return `${baseUrl}${endpoint}`;
};

const DoctorCardiacMonitor = () => {
    const { isDarkMode } = useTheme();
    const [monitoredPatients, setMonitoredPatients] = useState<any[]>([]);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [filter, setFilter] = useState('all'); // all, critical, high

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [patientsRes, alertsRes] = await Promise.all([
                fetch(apiUrl('/api/monitoring/patients/monitored')),
                fetch(apiUrl('/api/monitoring/alerts/active'))
            ]);
            const patientsData = await patientsRes.json();
            const alertsData = await alertsRes.json();

            if (patientsData.success) setMonitoredPatients(patientsData.patients);
            if (alertsData.success) setAlerts(alertsData.alerts);
        } catch (err) {
            console.error("Error fetching monitoring data", err);
        }
    };

    const resolveAlert = async (alertId) => {
        try {
            await fetch(apiUrl('/api/monitoring/alerts/resolve'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ alert_id: alertId })
            });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const getRiskColor = (score) => {
        if (score > 80) return 'text-red-500 bg-red-500/10 border-red-500/50';
        if (score > 50) return 'text-orange-500 bg-orange-500/10 border-orange-500/50';
        return 'text-green-500 bg-green-500/10 border-green-500/50';
    };

    // Filter patients based on selection
    const filteredPatients = monitoredPatients.filter(p => {
        if (filter === 'critical') return p.current_risk > 80;
        if (filter === 'high') return p.current_risk > 50;
        return true;
    });

    return (
        <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-blue-50'} transition-colors duration-300`}>
            <div className="max-w-screen-2xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                            <Activity className="text-blue-500" /> Cardiac Command Center
                        </h1>
                        <p className="text-gray-500 font-medium">Real-time telemetry & AI Risk Triage</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex p-1 bg-white dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/10">
                            {['all', 'high', 'critical'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${filter === f ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                                >
                                    {f} Risk
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Active Alerts Section */}
                {alerts.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {alerts.map(alert => (
                            <motion.div
                                key={alert.alert_id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`p-4 rounded-2xl border flex items-start justify-between relative overflow-hidden backdrop-blur-xl ${alert.severity === 'Critical' ? 'bg-red-500/10 border-red-500/50' : 'bg-orange-500/10 border-orange-500/50'}`}
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <ShieldAlert size={64} className={alert.severity === 'Critical' ? 'text-red-500 animate-pulse' : 'text-orange-500'} />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle size={18} className={alert.severity === 'Critical' ? 'text-red-500' : 'text-orange-500'} />
                                        <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${alert.severity === 'Critical' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'}`}>
                                            {alert.severity} Alert
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-lg dark:text-white">{alert.firstName} {alert.lastName}</h3>
                                    <p className="text-sm font-medium opacity-80 dark:text-gray-300">{alert.message}</p>
                                    <p className="text-xs text-gray-500 mt-2">{new Date(alert.timestamp).toLocaleTimeString()}</p>
                                </div>
                                <div className="flex flex-col gap-2 relative z-10">
                                    <button onClick={() => resolveAlert(alert.alert_id)} className="p-2 bg-white/20 hover:bg-white/40 rounded-lg text-gray-700 dark:text-white transition-colors" title="Acknowledge">
                                        <CheckCircle size={20} />
                                    </button>
                                    <button className="p-2 bg-red-500 hover:bg-red-600 rounded-lg text-white shadow-lg animate-pulse" title="Emergency Call">
                                        <Phone size={20} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Patient Mosaic Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredPatients.map((patient) => (
                        <motion.div
                            layout
                            key={patient.id}
                            className={`relative rounded-3xl overflow-hidden backdrop-blur-xl border-2 transition-all hover:scale-[1.02] cursor-pointer ${getRiskColor(patient.current_risk)} ${isDarkMode ? 'bg-black/40' : 'bg-white/80'}`}
                            onClick={() => setSelectedPatient(patient)}
                        >
                            {/* Glass Header */}
                            <div className="p-4 flex items-center justify-between border-b border-gray-100/10 bg-white/5">
                                <div className="flex items-center gap-3">
                                    <img src={patient.profileImageUrl ? `${apiUrl('')}${patient.profileImageUrl}` : `https://ui-avatars.com/api/?name=${patient.firstName}+${patient.lastName}`} className="w-10 h-10 rounded-full border border-white/20" alt="" />
                                    <div>
                                        <h3 className="font-bold text-sm text-gray-900 dark:text-white">{patient.firstName} {patient.lastName}</h3>
                                        <p className="text-xs text-gray-500">MRN: {patient.patientId}</p>
                                    </div>
                                </div>
                                <div className={`text-xl font-black ${patient.current_risk > 50 ? 'text-red-500' : 'text-green-500'}`}>
                                    {patient.current_risk}%
                                </div>
                            </div>

                            {/* Vitals Body */}
                            <div className="p-6 text-center space-y-4">
                                <div className="flex justify-between items-center px-4">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-500 uppercase tracking-widest">Heart Rate</span>
                                        <span className="text-4xl font-black dark:text-white flex items-center gap-1 justify-center">
                                            {patient.current_hr} <Heart size={16} className="text-red-500 animate-pulse" fill="#ef4444" />
                                        </span>
                                    </div>
                                    <div className="w-px h-10 bg-gray-200 dark:bg-white/10"></div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-500 uppercase tracking-widest">SpO2</span>
                                        <span className="text-4xl font-black dark:text-white flex items-center gap-1 justify-center">
                                            98<span className="text-sm text-gray-400">%</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Mini Chart (Visual Decoration) */}
                                <div className="h-16 w-full opacity-50">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={[{ v: 60 }, { v: 65 }, { v: 70 }, { v: 68 }, { v: 72 }, { v: 75 }, { v: patient.current_hr }]}>
                                            <Line type="monotone" dataKey="v" stroke={patient.current_risk > 50 ? '#ef4444' : '#22c55e'} strokeWidth={3} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="p-3 bg-gray-50 dark:bg-black/20 flex gap-2">
                                <button className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors">
                                    <Video size={14} /> Video Call
                                </button>
                                <button className="flex-1 py-2 rounded-lg bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-300 transition-colors">
                                    Details
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {filteredPatients.length === 0 && (
                    <div className="text-center py-20 opacity-50">
                        <Activity size={64} className="mx-auto mb-4 text-gray-400" />
                        <p className="text-xl font-bold dark:text-white">No patients currently monitored.</p>
                        <p className="text-sm text-gray-500">Waiting for device telemetry events...</p>
                    </div>
                )}

            </div>
        </div>
    );
};

export default DoctorCardiacMonitor;
