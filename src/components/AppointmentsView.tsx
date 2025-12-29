import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns-tz';
import { Calendar, Clock, CheckCircle, Sparkles, X, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import apiUrl from '@/config/api';

const Modal = ({ children, onClose, width = "max-w-xl" }) => (
    <AnimatePresence>
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 font-sans p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20, opacity: 0 }}
                className={`glass-panel rounded-3xl p-8 w-full ${width} border border-white/10 shadow-2xl relative overflow-hidden text-gray-900 dark:text-white`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative z-10">{children}</div>
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            </motion.div>
        </motion.div>
    </AnimatePresence>
);

const StatCard = ({ title, value, icon: Icon, color }) => {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="glass-card p-6 rounded-3xl border border-white/20 relative overflow-hidden group"
        >
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
                <Icon size={80} />
            </div>
            <div className="relative z-10">
                <div className={`p-3 rounded-2xl w-fit mb-4 ${color.replace('text-', 'bg-')}/10 shadow-lg`}>
                    <Icon size={24} className={color} />
                </div>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
                <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{value}</p>
            </div>
        </motion.div>
    );
};

export default function AppointmentsView({ user }) {
    const { theme } = useTheme();
    const [appointments, setAppointments] = useState([]);
    const [view, setView] = useState('upcoming'); // 'upcoming', 'past', 'all'
    const [showSummaryModal, setShowSummaryModal] = useState(null);
    const [generatedSummary, setGeneratedSummary] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const isAdmin = user?.role === 'admin' || user?.role === 'doctor';

    const fetchAppointments = async () => {
        try {
            const endpoint = isAdmin ? '/api/appointments' : `/api/appointments?patientId=${user?.id}`;
            const res = await fetch(apiUrl('/api/appointments'));
            const data = await res.json();
            setAppointments(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch appointments:', err);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [user]);

    const handleGenerateSummary = async (appointment) => {
        setIsGenerating(true);
        try {
            const prompt = `Generate a pre-consultation summary for an appointment with ${appointment.patientName} on ${appointment.appointmentDate}. Department: ${appointment.departmentName}. Notes: ${appointment.notes || 'None'}.`;
            const res = await fetch(apiUrl('/api/ai/generate'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });
            const data = await res.json();
            setGeneratedSummary(data.text || "Summary generation simulation: Patient is scheduled for a regular checkup.");
        } catch (error) {
            setGeneratedSummary("Failed to generate summary. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const tabs = ['upcoming', 'past', 'all'];

    const filteredAppointments = useMemo(() => {
        const now = new Date();
        return appointments.filter(app => {
            const appDate = new Date(app.appointmentDate);
            if (view === 'upcoming') return appDate >= now;
            if (view === 'past') return appDate < now;
            return true;
        }).sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));
    }, [appointments, view]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="p-4 sm:p-8 font-sans min-h-screen">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 dark:from-purple-400 dark:to-pink-300">
                            {isAdmin ? 'All Appointments' : 'My Appointments'}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Manage your schedule with AI assistance.</p>
                    </div>
                </div>
            </motion.div>

            <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" variants={containerVariants} initial="hidden" animate="visible">
                <motion.div variants={itemVariants}><StatCard title="Total Appointments" value={appointments.length} icon={Calendar} color="text-blue-500" /></motion.div>
                <motion.div variants={itemVariants}><StatCard title="Upcoming Today" value={appointments.filter(a => a.appointmentDate && new Date(a.appointmentDate).toDateString() === new Date().toDateString() && new Date(a.appointmentDate) >= new Date()).length} icon={Clock} color="text-yellow-500" /></motion.div>
                <motion.div variants={itemVariants}><StatCard title="Completed This Week" value={appointments.filter(a => a.appointmentDate && a.status === 'completed' && new Date(a.appointmentDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length} icon={CheckCircle} color="text-green-500" /></motion.div>
            </motion.div>

            <div className="glass-panel rounded-3xl p-6 border border-white/20 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
                <div className="w-full max-w-lg mx-auto mb-8 bg-gray-100 dark:bg-black/30 p-1 rounded-xl relative">
                    <div className="grid grid-cols-3 relative z-10">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setView(tab)}
                                className={`py-3 text-sm font-bold rounded-lg transition-colors text-center ${view === tab ? 'text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                    <motion.div
                        className="absolute top-1 bottom-1 left-1 w-[calc(33.33%-0.5rem)] bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg shadow-lg z-0"
                        animate={{ x: `${tabs.indexOf(view) * 100}%` }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        style={{ width: 'calc(33.333% - 0.5rem)' }}
                    />
                </div>

                <AnimatePresence mode="wait">
                    <motion.div key={view} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1">
                        {filteredAppointments.length > 0 ? (
                            <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
                                {filteredAppointments.map(app => (
                                    <motion.div
                                        key={app.id}
                                        variants={itemVariants}
                                        className="bg-white/50 dark:bg-white/5 p-5 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-purple-500/30 transition-all flex flex-col sm:flex-row items-center justify-between gap-4 group"
                                    >
                                        <div className="flex items-center gap-4 w-full sm:w-auto">
                                            <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
                                                <User size={24} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white text-lg">{app.patientName}</p>
                                                <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-500 dark:text-gray-400 gap-1 sm:gap-3">
                                                    <span>{app.departmentName}</span>
                                                    <span className="hidden sm:inline">•</span>
                                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                                        {app.appointmentDate ? format(new Date(app.appointmentDate), 'PPpp', { timeZone: 'Asia/Kolkata' }) : 'No date'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                            <span className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider ${app.status === 'scheduled' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-white/5 text-gray-500'}`}>
                                                {app.status}
                                            </span>
                                            {view === 'upcoming' && (
                                                <button
                                                    onClick={() => { setShowSummaryModal(app); setGeneratedSummary(''); }}
                                                    className="p-3 bg-purple-600 text-white rounded-xl shadow-lg shadow-purple-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                                    title="Generate AI Summary"
                                                >
                                                    <Sparkles size={18} />
                                                    <span className="hidden sm:inline font-bold text-xs">AI Summary</span>
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                <div className="p-6 bg-gray-100 dark:bg-white/5 rounded-full mb-4">
                                    <Calendar className="w-12 h-12 text-gray-300 dark:text-white/20" />
                                </div>
                                <p className="font-medium">No {view} appointments found.</p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {showSummaryModal && (
                <Modal onClose={() => setShowSummaryModal(null)}>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Sparkles className="text-purple-500" /> AI Summary
                        </h2>
                        <button onClick={() => setShowSummaryModal(null)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-500"><X size={20} /></button>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 font-medium">Pre-consultation summary for <span className="text-gray-900 dark:text-white font-bold">{showSummaryModal.patientName}</span>.</p>

                    {!generatedSummary && !isGenerating && (
                        <button onClick={() => handleGenerateSummary(showSummaryModal)} className="w-full py-4 font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg shadow-purple-500/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                            <Sparkles size={20} /> Generate Summary
                        </button>
                    )}

                    {isGenerating && (
                        <div className="text-center py-10">
                            <Sparkles className="animate-spin text-purple-500 mx-auto mb-4" size={32} />
                            <p className="text-purple-500 font-bold animate-pulse">AI is analyzing patient records...</p>
                        </div>
                    )}

                    {generatedSummary && (
                        <div className="space-y-4">
                            <div className="p-5 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl text-gray-800 dark:text-gray-200 leading-relaxed max-h-[400px] overflow-y-auto">
                                {generatedSummary}
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button onClick={() => navigator.clipboard.writeText(generatedSummary)} className="px-6 py-2 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">Copy</button>
                                <button onClick={() => setShowSummaryModal(null)} className="px-6 py-2 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 shadow-lg shadow-green-500/30 transition-all">Done</button>
                            </div>
                        </div>
                    )}
                </Modal>
            )}
        </div>
    );
}
