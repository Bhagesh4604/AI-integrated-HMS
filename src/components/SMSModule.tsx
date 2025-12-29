import React, { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Users, DollarSign, Bed, Activity, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import apiUrl from '@/config/api';

const Modal = ({ children, onClose }) => (
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
                className="glass-panel rounded-3xl p-6 w-full max-w-lg border border-white/10 shadow-2xl relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative z-10">{children}</div>
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            </motion.div>
        </motion.div>
    </AnimatePresence>
);

const ReportCard = ({ title, icon: Icon, stats, onSend, color }) => {
    const { theme } = useTheme();
    return (
        <motion.div
            variants={{
                hidden: { y: 20, opacity: 0 },
                visible: { y: 0, opacity: 1 }
            }}
            whileHover={{ y: -5 }}
            className="glass-card rounded-3xl p-6 flex flex-col justify-between border border-white/10 relative overflow-hidden"
        >
            <div className={`absolute -right-4 -top-4 w-32 h-32 rounded-full ${color.replace('from-', 'bg-').split(' ')[0]}/10 blur-2xl pointer-events-none`} />

            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${color} shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
                </div>
                <div className="space-y-3">
                    {stats.map((stat, i) => (
                        <div key={i} className="flex items-baseline justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 transition-colors">
                            <span className="font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stat.label}</span>
                            <span className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</span>
                        </div>
                    ))}
                </div>
            </div>
            <button onClick={onSend} className={`mt-6 w-full bg-gradient-to-r ${color} text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 transform active:scale-95`}>
                <MessageSquare className="w-4 h-4" />
                Send Report via SMS
            </button>
        </motion.div>
    );
};

export default function SMSModule() {
    const { theme } = useTheme();
    const [summaries, setSummaries] = useState({
        patients: { total: 0, active: 0 },
        beds: { total: 0, occupied: 0 },
        receivables: { totalCollection: 0 }
    });
    const [showSmsModal, setShowSmsModal] = useState(false);
    const [smsState, setSmsState] = useState({ to: '', message: '' });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchSummaries();
    }, []);

    const fetchSummaries = async () => {
        try {
            const response = await fetch(apiUrl('/api/sms/summaries'));
            setSummaries(await response.json());
        } catch (error) { console.error("Failed to fetch summaries:", error); }
    };

    const handleSendSms = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            const response = await fetch(apiUrl('/api/sms/send'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(smsState),
            });
            const data = await response.json();
            if (data.success) {
                setShowSmsModal(false);
            } else {
                alert(`Failed to send SMS: ${data.error || data.message}`);
            }
        } catch (error) {
            console.error('Failed to connect to the server.', error);
            alert('Failed to connect to the server.');
        } finally {
            setIsLoading(false);
        }
    };

    const openSmsModalForReport = async (reportType) => {
        try {
            const response = await fetch(apiUrl(`/api/sms/report/${reportType}`));
            const data = await response.json();
            if (data.message) {
                setSmsState({ to: '', message: data.message });
                setShowSmsModal(true);
            } else {
                alert('Could not generate report.');
            }
        } catch (error) {
            console.error('Failed to fetch report data.', error);
            alert('Failed to fetch report data.');
        }
    };

    const summaryCards = [
        { title: 'Patient Summary', reportType: 'patients', icon: Users, color: 'from-pink-500 to-rose-500', stats: [{ label: 'Total Patients', value: summaries.patients.total }, { label: 'Active', value: summaries.patients.active }] },
        { title: 'OPD Cash Summary', reportType: 'opd', icon: DollarSign, color: 'from-emerald-500 to-green-600', stats: [{ label: 'Total Collection', value: `$${Number(summaries.receivables.totalCollection || 0).toLocaleString()}` }] },
        { title: 'Ward / Bed Status', reportType: 'ward-status', icon: Bed, color: 'from-orange-500 to-amber-500', stats: [{ label: 'Total Beds', value: summaries.beds.total }, { label: 'Occupied', value: summaries.beds.occupied }] },
        { title: 'Admissions Today', reportType: 'admit-discharge', icon: Activity, color: 'from-sky-500 to-blue-600', stats: [{ label: 'Admissions', value: '23' }, { label: 'Discharges', value: '18' }] },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    return (
        <div className="p-4 md:p-8 font-sans min-h-full">

            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">SMS & Reports</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Broadcast daily summaries and alerts.</p>
                    </div>
                </div>
            </motion.div>

            <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {summaryCards.map((summary) => (
                    <ReportCard
                        key={summary.title}
                        {...summary}
                        onSend={() => openSmsModalForReport(summary.reportType)}
                    />
                ))}
            </motion.div>

            {showSmsModal && (
                <Modal onClose={() => setShowSmsModal(false)}>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Send SMS Notification</h2>
                        <button onClick={() => setShowSmsModal(false)} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"><X size={24} /></button>
                    </div>
                    <form className="space-y-4" onSubmit={handleSendSms}>
                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">RECIPIENT NUMBER</label>
                            <input
                                placeholder="+919876543210"
                                className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 font-medium"
                                value={smsState.to}
                                onChange={(e) => setSmsState({ ...smsState, to: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">MESSAGE</label>
                            <textarea
                                className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 h-32 resize-none"
                                value={smsState.message}
                                onChange={(e) => setSmsState({ ...smsState, message: e.target.value })}
                                required
                            ></textarea>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => setShowSmsModal(false)} className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">Cancel</button>
                            <button type="submit" disabled={isLoading} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-400 transition-colors shadow-lg shadow-blue-500/30 flex items-center gap-2">
                                <MessageSquare size={18} /> {isLoading ? 'Sending...' : 'Send Message'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
