import React, { useState, useEffect, useRef } from 'react';
import { Calendar, FileText, DollarSign, LogOut, Plus, X, User, Clock, Bell, Pill, Edit, Beaker, Sparkles, Download, ArrowRight, BookUser, ShieldCheck, HeartPulse, Sun, Moon, LayoutGrid, ArrowLeft, Ambulance, Globe, Languages, Search, Video, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { zonedTimeToUtc, format } from 'date-fns-tz';
import { useNavigate } from 'react-router-dom';

import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/button';
import apiUrl from '../../config/api';
import TriageChatModal from '../TriageChatModal';
import HealthTimeline from './HealthTimeline';
import MedicationTracker from './MedicationTracker';
import HeartHealthDashboard from '../../pages/HeartHealthDashboard'; // Import new module
import UploadReport from '../UploadReport';

import NewSidebar from '../NewSidebar';

// --- ANIMATIONS & STYLES ---
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 100 }
    }
};

const GlassCard = ({ children, className = "", onClick }) => (
    <motion.div
        variants={itemVariants}
        whileHover={onClick ? { scale: 1.02 } : {}}
        whileTap={onClick ? { scale: 0.98 } : {}}
        onClick={onClick}
        className={`relative overflow-hidden rounded-2xl bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-lg ${className}`}
    >
        {children}
    </motion.div>
);

const StatCard = ({ title, value, icon: Icon, colorClass = "text-blue-500", bgClass = "bg-blue-500/10" }) => (
    <GlassCard className="p-6 flex items-center justify-between group">
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white group-hover:bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-500 transition-all">{value}</p>
        </div>
        <div className={`p-4 rounded-xl ${bgClass} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`${colorClass}`} size={24} />
        </div>
    </GlassCard>
);


export default function PatientDashboard({ patient, onLogout, updateUser }) {
    const { theme, toggleTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [appointments, setAppointments] = useState([]);
    const [records, setRecords] = useState([]);
    const [billing, setBilling] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [labResults, setLabResults] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [showModal, setShowModal] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const navigate = useNavigate();

    // Refactored state for appointment booking
    const [newAppointment, setNewAppointment] = useState({ doctorId: '', notes: '', consultationType: 'in-person' });
    const [bookingDate, setBookingDate] = useState('');
    const [bookingSlot, setBookingSlot] = useState('');

    const fileInputRef = useRef(null);

    const handleUploadSuccess = (data) => {
        // Mock saving to local state for instant feedback
        const newRecord = {
            recordId: Date.now(),
            diagnosis: "Uploaded Report",
            doctorName: "AI Analysis",
            recordDate: new Date().toISOString(),
            treatment: data.healthPlan?.summary || "Report analyzed by AI",
            notes: "Uploaded via Patient Portal"
        };
        setRecords([newRecord, ...records]);
        setShowUploadModal(false);
        alert("Report uploaded and analyzed successfully!");
    };
    const [showTriageModal, setShowTriageModal] = useState(false);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [summaryContent, setSummaryContent] = useState('');
    const [isSummarizing, setIsSummarizing] = useState(false);

    // Language & Explain Features
    const [language, setLanguage] = useState('English');
    const languages = ['English', 'Spanish', 'French', 'Hindi', 'German', 'Chinese'];
    const [explainTerm, setExplainTerm] = useState('');
    const [explanation, setExplanation] = useState('');
    const [isExplaining, setIsExplaining] = useState(false);

    const handleExplainTerm = async (e) => {
        e.preventDefault();
        if (!explainTerm) return;

        setIsExplaining(true);
        setExplanation('');

        const systemPrompt = `You are a helpful medical translator and simplifier. 
        Explain the medical term provided by the user in simple, easy-to-understand ${language}. 
        Keep the explanation concise (2-3 sentences). 
        If the term is not medical, politely say you can only explain medical terms.`;

        try {
            const res = await fetch(apiUrl('/api/ai/ask'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: explainTerm }] }),
            });
            const data = await res.json();
            setExplanation(data.reply || "Could not generate explanation.");
        } catch (err) {
            setExplanation('Error: Could not connect to the AI service.');
        } finally {
            setIsExplaining(false);
        }
    };

    const fetchAllData = () => {
        if (!patient || !patient.id) return;
        const patientId = patient.id;
        Promise.all([
            fetch(apiUrl(`/api/portal/my-appointments/${patientId}`)).then(res => res.json()),
            fetch(apiUrl(`/api/portal/my-records/${patientId}`)).then(res => res.json()),
            fetch(apiUrl(`/api/portal/my-billing/${patientId}`)).then(res => res.json()),
            fetch(apiUrl(`/api/portal/my-lab-results/${patientId}`)).then(res => res.json()),
            fetch(apiUrl(`/api/portal/my-prescriptions/${patientId}`)).then(res => res.json()),
            fetch(apiUrl('/api/employees')).then(res => res.json())
        ]).then(([appointmentsData, recordsData, billingData, labData, prescData, doctorsData]) => {
            console.log('Appointments Data:', JSON.stringify(appointmentsData, null, 2));
            setAppointments(appointmentsData || []);
            setRecords(recordsData || []);
            setBilling(billingData || []);
            setLabResults(labData || []);
            setPrescriptions(prescData || []);
            setDoctors(doctorsData.filter(emp => emp.role === 'doctor') || []);
        }).catch(error => { console.error("Failed to fetch patient data:", error); });
    };

    useEffect(() => {
        if (patient && patient.id) {
            fetchAllData();
        }
    }, [patient]);

    const handlePhotoUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('profilePhoto', file);
        try {
            const response = await fetch(apiUrl(`/api/patients/${patient.id}/upload-photo`), {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (data.success) {
                updateUser({ profileImageUrl: data.profileImageUrl });
            }
        } catch (error) {
            console.error('Upload error:', error);
        }
    };

    const [availableSlots, setAvailableSlots] = useState([]);

    const fetchAvailableSlots = async (doctorId, date) => {
        if (!doctorId || !date) {
            setAvailableSlots([]);
            return;
        }
        try {
            const response = await fetch(apiUrl(`/api/schedules/available-slots/${doctorId}/${date}`));
            setAvailableSlots(await response.json());
        } catch (error) {
            console.error("Failed to fetch available slots:", error);
            setAvailableSlots([]);
        }
    };

    const handleBookAppointment = async (e) => {
        e.preventDefault();
        if (!bookingSlot) {
            alert("Please select an available time slot.");
            return;
        }
        const timeZone = 'Asia/Kolkata';
        const utcAppointmentDate = zonedTimeToUtc(bookingSlot, timeZone);
        try {
            const response = await fetch(apiUrl('/api/portal/book-appointment'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newAppointment, patientId: patient.id, appointmentDate: utcAppointmentDate }),
            });
            const data = await response.json();
            if (data.success) {
                setShowModal(null);
                setNewAppointment({ doctorId: '', notes: '' });
                setBookingDate('');
                setBookingSlot('');
                setAvailableSlots([]);
                fetchAllData();
            } else {
                alert(data.message || 'Failed to book appointment.');
            }
        } catch (error) { console.error(error); }
    };

    const handleSummarizeHistory = async () => {
        setIsSummarizing(true);
        setShowSummaryModal(true);
        setSummaryContent('');

        const historyText = records.map(r => `On ${new Date(r.recordDate).toLocaleDateString()}, Dr. ${r.doctorName} diagnosed '${r.diagnosis}' and prescribed the following treatment: ${r.treatment}`).join('\n');
        const systemPrompt = `You are a helpful medical assistant. Your task is to summarize the provided medical history for a patient in simple, easy-to-understand ${language}. Organize it chronologically if possible. Do not provide new medical advice. Start by saying 'Here is a summary of your medical history (in ${language}):'.`;
        const userQuery = `Please summarize the following medical records:\n\n${historyText}`;

        try {
            const res = await fetch(apiUrl('/api/ai/ask'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userQuery }] }),
            });
            const data = await res.json();
            setSummaryContent(data.reply || "Could not generate summary.");
        } catch (err) {
            setSummaryContent('Error: Could not connect to the AI service.');
        } finally {
            setIsSummarizing(false);
        }
    };

    useEffect(() => {
        if (newAppointment.doctorId && bookingDate) {
            fetchAvailableSlots(newAppointment.doctorId, bookingDate);
        }
    }, [newAppointment.doctorId, bookingDate]);

    const nextAppointment = appointments.find(a => new Date(a.appointmentDate) > new Date() && a.status === 'scheduled');


    // --- ANIMATIONS & STYLES --- (Moved outside)

    const dashboardJSX = (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
            {/* Wellness Greeting */}
            <motion.div variants={itemVariants} className="relative p-8 rounded-3xl overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-bold mb-2">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {patient?.firstName}!</h1>
                    <p className="text-indigo-100 text-lg max-w-2xl">Your health journey is looking great. Currently, you have <span className="font-bold text-white">{appointments.filter(a => new Date(a.appointmentDate) > new Date()).length} upcoming appointments</span>.</p>
                </div>
            </motion.div>

            {/* Top Row: Language Selector for Desktop (Floating) */}
            <div className="hidden lg:flex justify-end mb-4">
                <div className="flex items-center gap-2 bg-white/40 dark:bg-black/40 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-white/20">
                    <Globe size={16} className="text-indigo-600 dark:text-indigo-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-300 mr-2">Language:</span>
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="bg-transparent text-sm font-bold text-gray-900 dark:text-white focus:outline-none cursor-pointer"
                    >
                        {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Next Appointment Card */}
                <GlassCard className="flex flex-col h-full bg-gradient-to-br from-white/80 to-blue-50/50 dark:from-gray-900/80 dark:to-blue-900/20">
                    <div className="p-6 flex-1">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-500/10 rounded-lg"><Calendar className="text-blue-500" size={20} /></div>
                            <h3 className="font-bold text-xl text-gray-900 dark:text-white">Next Visit</h3>
                        </div>

                        {nextAppointment ? (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{new Date(nextAppointment.appointmentDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</p>
                                    <p className="text-lg text-gray-600 dark:text-gray-300">{new Date(nextAppointment.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <div className="flex items-center gap-3 bg-white/50 dark:bg-black/20 p-3 rounded-xl">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg">👨‍⚕️</div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">Dr. {nextAppointment.doctorName}</p>
                                        <p className="text-xs text-gray-500">General Physician</p>
                                    </div>
                                </div>
                                {nextAppointment.consultationType === 'virtual' && nextAppointment.roomUrl && (
                                    <button onClick={() => window.open(nextAppointment.roomUrl, '_blank')} className="w-full mt-2 bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2">
                                        <Video size={18} /> Join Consultation
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-48 text-center">
                                <p className="text-gray-400 mb-4">No upcoming visits scheduled.</p>
                                <button onClick={() => setActiveTab('appointments')} className="px-6 py-2 bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300 rounded-full font-semibold text-sm hover:scale-105 transition-transform">Book Now</button>
                            </div>
                        )}
                    </div>
                </GlassCard>

                {/* Medical Explainer & Language Tool */}
                <GlassCard className="flex flex-col h-full bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><Languages size={64} /></div>
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-indigo-500/10 rounded-lg"><Sparkles className="text-indigo-500" size={20} /></div>
                            <h3 className="font-bold text-xl text-gray-900 dark:text-white">Medical Translator</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">Don't understand a term? Ask me!</p>

                        <form onSubmit={handleExplainTerm} className="relative mb-4">
                            <input
                                type="text"
                                placeholder="e.g. Hypertension"
                                value={explainTerm}
                                onChange={(e) => setExplainTerm(e.target.value)}
                                className="w-full pl-4 pr-10 py-3 rounded-xl bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500"
                            />
                            <button type="submit" disabled={isExplaining || !explainTerm} className="absolute right-2 top-2 p-1.5 bg-indigo-600 rounded-lg text-white disabled:opacity-50 hover:bg-indigo-700">
                                {isExplaining ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={16} />}
                            </button>
                        </form>

                        {explanation && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-white/60 dark:bg-black/40 rounded-xl text-sm text-gray-700 dark:text-gray-300 border border-indigo-100 dark:border-indigo-900/30">
                                <p className="font-semibold text-indigo-600 mb-1">Explanation ({language}):</p>
                                {explanation}
                            </motion.div>
                        )}

                        <div className="mt-auto pt-4 flex items-center justify-between">
                            <span className="text-xs text-gray-400">Current Language:</span>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="bg-transparent text-sm font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none cursor-pointer"
                            >
                                {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                            </select>
                        </div>
                    </div>
                </GlassCard>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <GlassCard
                        onClick={() => setShowTriageModal(true)}
                        className="p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-purple-500/50 group bg-purple-500/5"
                    >
                        <div className="p-4 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-3 group-hover:scale-110 transition-transform">
                            <Sparkles className="text-purple-600 dark:text-purple-400" size={32} />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white">AI Symptom Checker</h3>
                        <p className="text-xs text-gray-500 mt-1">Check symptoms instantly</p>
                    </GlassCard>

                    <GlassCard
                        onClick={() => navigate('/patient/book-ambulance')}
                        className="p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-red-500/50 group bg-red-500/5"
                    >
                        <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30 mb-3 group-hover:scale-110 transition-transform">
                            <Ambulance className="text-red-600 dark:text-red-400" size={32} />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Emergency SOS</h3>
                        <p className="text-xs text-gray-500 mt-1">Call Ambulance</p>
                    </GlassCard>

                    <GlassCard
                        onClick={() => setActiveTab('medications')}
                        className="p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-green-500/50 group bg-green-500/5 col-span-2"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 group-hover:scale-110 transition-transform">
                                <Pill className="text-green-600 dark:text-green-400" size={24} />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-gray-900 dark:text-white">Medication Tracker</h3>
                                <p className="text-xs text-gray-500">{prescriptions.length} Active Prescriptions</p>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Total Visits" value={appointments.length} icon={Calendar} colorClass="text-blue-500" bgClass="bg-blue-500/10" />
                <StatCard title="Test Results" value={labResults.length} icon={Beaker} colorClass="text-teal-500" bgClass="bg-teal-500/10" />
                <StatCard title="Bills Due" value={`$${billing.filter(b => b.paymentStatus !== 'paid').reduce((acc, curr) => acc + curr.amount, 0)}`} icon={DollarSign} colorClass="text-amber-500" bgClass="bg-amber-500/10" />
                <StatCard title="Pending" value={billing.filter(b => b.paymentStatus === 'pending').length} icon={Clock} colorClass="text-red-500" bgClass="bg-red-500/10" />
            </div>
        </motion.div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return dashboardJSX;
            case 'appointments':
                return (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-white/10 p-6 rounded-2xl backdrop-blur-md">
                            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">My Visits</h2>
                            <Button onClick={() => setShowModal('bookAppointment')} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30">Book New</Button>
                        </div>
                        {appointments.length > 0 ? (
                            <div className="grid gap-4">
                                {appointments.map((apt) => (
                                    <GlassCard key={apt.id} className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center text-2xl">👨‍⚕️</div>
                                            <div>
                                                <h3 className="font-bold text-xl dark:text-white">Dr. {apt.doctorName}</h3>
                                                <p className="text-gray-500 dark:text-gray-400">{apt.reason || 'General Consultation'}</p>
                                                <div className="flex items-center gap-2 mt-2 text-sm text-blue-400">
                                                    <Calendar size={14} />
                                                    {new Date(apt.appointmentDate).toLocaleDateString()} at {new Date(apt.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-4 py-2 rounded-full text-sm font-bold ${apt.status === 'scheduled' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-gray-500/10 text-gray-500'}`}>
                                                {apt.status.toUpperCase()}
                                            </span>
                                            {apt.status === 'scheduled' && apt.consultationType === 'virtual' && (
                                                <Button size="sm" onClick={() => window.open(apt.roomUrl, '_blank')} className="bg-purple-600">Join Call</Button>
                                            )}
                                        </div>
                                    </GlassCard>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                                <Calendar className="w-20 h-20 text-gray-600 mx-auto mb-4 opacity-50" />
                                <h3 className="text-2xl font-bold text-gray-500">No appointments found</h3>
                            </div>
                        )}
                    </div>
                );
            case 'records':
                return (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-3xl font-bold dark:text-white">Medical History</h2>
                            <div className="flex gap-2">
                                <Button onClick={() => setShowUploadModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                                    <Upload size={18} /> Upload Report
                                </Button>
                                <Button onClick={handleSummarizeHistory} className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                                    <Sparkles className="mr-2 h-4 w-4" /> Summarize with AI
                                </Button>
                            </div>
                        </div>
                        {records.length > 0 ? (
                            <div className="grid gap-4">
                                {records.map(rec => (
                                    <GlassCard key={rec.recordId} className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-bold text-lg dark:text-white">{rec.diagnosis}</h3>
                                                <p className="text-sm text-gray-500">Dr. {rec.doctorName} • {new Date(rec.recordDate).toLocaleDateString()}</p>
                                            </div>
                                            <FileText className="text-blue-500" />
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300 bg-black/5 dark:bg-white/5 p-4 rounded-xl">{rec.treatment}</p>
                                        {rec.notes && <p className="mt-2 text-sm text-gray-500 italic">Note: {rec.notes}</p>}
                                    </GlassCard>
                                ))}
                            </div>
                        ) : <p className="text-center text-gray-500">No records found.</p>}
                    </div>
                );
            case 'timeline':
                return <HealthTimeline patient={patient} />;
            case 'medications':
                return <MedicationTracker patient={patient} />;
            case 'prescriptions':
                return (
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold dark:text-white">Prescriptions</h2>
                        <div className="grid gap-4">
                            {prescriptions.map(pre => (
                                <GlassCard key={pre.prescriptionId} className="p-6 border-l-4 border-l-green-500">
                                    <div className="flex justify-between">
                                        <div>
                                            <h3 className="font-bold text-xl dark:text-white">{pre.medication}</h3>
                                            <p className="text-green-500">{pre.dosage}</p>
                                        </div>
                                        <Pill className="text-green-500/50 w-10 h-10" />
                                    </div>
                                    <div className="mt-4 flex gap-4 text-sm text-gray-500">
                                        <span>Start: {new Date(pre.startDate).toLocaleDateString()}</span>
                                        <span>End: {new Date(pre.endDate).toLocaleDateString()}</span>
                                    </div>
                                    <p className="mt-2 text-gray-600 dark:text-gray-400">{pre.instructions}</p>
                                </GlassCard>
                            ))}
                            {prescriptions.length === 0 && <p className="text-gray-500 text-center">No prescriptions found.</p>}
                        </div>
                    </div>
                );
            case 'billing':
                return (
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold dark:text-white">Billing & Payments</h2>
                        <div className="grid gap-4">
                            {billing.map(bill => (
                                <GlassCard key={bill.billId} className="p-6">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-sm text-gray-500">Bill #{bill.billId}</p>
                                            <p className="font-bold text-2xl dark:text-white">${bill.amount}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${bill.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {bill.paymentStatus.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10 flex justify-between items-center">
                                        <p className="text-sm text-gray-500">Due: {new Date(bill.billDate).toLocaleDateString()}</p>
                                        {bill.paymentStatus !== 'paid' && (
                                            <Button size="sm" className="bg-indigo-600">Pay Now</Button>
                                        )}
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    </div>
                );
            case 'heart-health':
                return <HeartHealthDashboard />;
            case 'lab_results':
                return (
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold dark:text-white">Lab Results</h2>
                        {labResults.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {labResults.map(lab => (
                                    <GlassCard key={lab.resultId} className="p-6 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10"><Beaker size={64} /></div>
                                        <h3 className="font-bold text-lg dark:text-white relative z-10">{lab.testName}</h3>
                                        <p className="text-3xl font-bold text-teal-500 my-2 relative z-10">{lab.resultValue} <span className="text-sm text-gray-400 font-normal">{lab.unit}</span></p>
                                        <p className="text-sm text-gray-500 relative z-10">Ref: {lab.referenceRange}</p>
                                        <p className="text-xs text-gray-400 mt-4 relative z-10">{new Date(lab.resultDate).toLocaleDateString()}</p>
                                    </GlassCard>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                                <Beaker className="w-20 h-20 text-gray-600 mx-auto mb-4 opacity-50" />
                                <h3 className="text-2xl font-bold text-gray-500">No lab results found</h3>
                                <p className="text-gray-400 mt-2">Your test results will appear here once they are ready.</p>
                            </div>
                        )}
                    </div>
                );
            default:
                return dashboardJSX;
        }
    };

    return (
        <div className="flex h-screen overflow-hidden font-sans relative">
            {/* GLOBAL ANIMATED BACKGROUND */}
            <div className="absolute inset-0 z-0 bg-gray-50 dark:bg-[#0a0a0a]">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-gray-50 to-cyan-50 dark:from-blue-900/10 dark:via-black dark:to-cyan-900/10 opacity-70 animate-gradient-xy"></div>
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyan-400/20 rounded-full blur-[120px] pointer-events-none"></div>
            </div>

            {/* Sidebar */}
            <div className="relative z-20 h-full">
                <NewSidebar
                    activeModule={activeTab}
                    setActiveModule={setActiveTab}
                    userType="patient"
                    onLogout={onLogout}
                    user={patient}
                    isSidebarOpen={isSidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                {/* Mobile Header */}
                <header className="lg:hidden p-4 flex justify-between items-center bg-white/50 dark:bg-black/50 backdrop-blur-md">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg bg-gray-100 dark:bg-white/10">
                        <LayoutGrid size={24} className="text-gray-700 dark:text-white" />
                    </button>
                    <span className="font-bold text-gray-900 dark:text-white">Shree Medicare</span>
                    <div className="flex items-center gap-2">
                        <div className="hidden lg:flex items-center gap-2 mr-4 bg-white/50 dark:bg-black/20 px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/10">
                            <Globe size={16} className="text-gray-500" />
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
                            >
                                {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                            </select>
                        </div>
                        <Button variant="ghost" size="icon" onClick={toggleTheme}>
                            <Sun className="h-5 w-5 dark:hidden" />
                            <Moon className="h-5 w-5 hidden dark:block" />
                        </Button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scrollbar-hide">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="max-w-7xl mx-auto"
                        >
                            {renderContent()}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            {/* Modals reused from existing state */}
            {/* Same Appointment Booking / Summary modals code goes here, but ensuring correct z-index over the glass background */}
            <AnimatePresence>
                {showModal === 'bookAppointment' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 30, opacity: 0 }}
                            className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-8 w-full max-w-lg shadow-2xl border border-white/20"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Book Appointment</h2>
                                <button onClick={() => setShowModal(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><X size={24} className="text-gray-500" /></button>
                            </div>

                            {/* ... Appointment Form Content reused ... */}
                            {/* Simplified for brevity in this specific replacement call, usually would duplicate form logic here */}
                            <form onSubmit={handleBookAppointment} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-2">Select Specialist</label>
                                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                        {doctors.filter(doc => doc.role === 'doctor').map(doc => (
                                            <div key={doc.id} onClick={() => { setNewAppointment(p => ({ ...p, doctorId: doc.id })); setBookingDate(''); setBookingSlot(''); }}
                                                className={`flex-shrink-0 w-24 flex flex-col items-center gap-2 p-3 rounded-2xl border-2 cursor-pointer transition-all ${newAppointment.doctorId === doc.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-transparent bg-gray-50 dark:bg-white/5 hover:bg-gray-100'}`}>
                                                <img src={doc.profileImageUrl ? `${apiUrl('')}${doc.profileImageUrl}` : `https://ui-avatars.com/api/?name=${doc.firstName}`} className="w-12 h-12 rounded-full object-cover" alt="" />
                                                <p className="text-xs font-bold text-center truncate w-full">{doc.firstName}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Date</label>
                                        <input type="date" value={bookingDate} onChange={(e) => { setBookingDate(e.target.value); setBookingSlot(''); }} min={new Date().toISOString().split('T')[0]} className="w-full p-3 rounded-xl bg-gray-50 dark:bg-white/5 border-none focus:ring-2 focus:ring-blue-500" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Type</label>
                                        <select value={newAppointment.consultationType} onChange={(e) => setNewAppointment(p => ({ ...p, consultationType: e.target.value }))} className="w-full p-3 rounded-xl bg-gray-50 dark:bg-white/5 border-none focus:ring-2 focus:ring-blue-500">
                                            <option value="in-person">In-clinic</option>
                                            <option value="virtual">Video Call</option>
                                        </select>
                                    </div>
                                </div>

                                {availableSlots.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Available Time</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {availableSlots.map(slot => (
                                                <button type="button" key={slot} onClick={() => setBookingSlot(slot)} className={`py-2 rounded-lg text-xs font-bold transition-all ${bookingSlot === slot ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200'}`}>
                                                    {new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button type="submit" disabled={!bookingSlot} className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-50 hover:scale-[1.02] transition-transform">
                                    Confirm Booking
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {showTriageModal && <TriageChatModal onClose={() => setShowTriageModal(false)} />}
            {showUploadModal && <UploadReport onClose={() => setShowUploadModal(false)} onSave={handleUploadSuccess} />}

            {/* Summary Modal with Glassmorphism */}
            <AnimatePresence>
                {showSummaryModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                        <GlassCard className="max-w-2xl w-full p-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                            <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-white/10 pb-4">
                                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center gap-2"><Sparkles className="text-yellow-500" /> AI Medical Summary</h2>
                                <button onClick={() => setShowSummaryModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                            </div>
                            <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                {isSummarizing ? (
                                    <div className="flex flex-col items-center py-12 gap-4">
                                        <div className="w-12 h-12 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
                                        <p className="text-gray-500 animate-pulse">Analyzing your medical history...</p>
                                    </div>
                                ) : (
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{summaryContent}</p>
                                )}
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
