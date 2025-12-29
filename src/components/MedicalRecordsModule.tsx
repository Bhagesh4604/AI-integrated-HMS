import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, FileText, CheckCircle, Clock, X, Sparkles, Search, Users } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import apiUrl from '../config/api';

const Modal = ({ children, onClose, width = "max-w-lg" }) => (
    <AnimatePresence>
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 font-sans"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20, opacity: 0 }}
                className={`bg-[#1C1C1E] rounded-2xl p-8 w-full ${width} border border-gray-700 shadow-2xl text-white`}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </motion.div>
        </motion.div>
    </AnimatePresence>
);

const StatCard = ({ title, value, icon: Icon, color }) => (
    <motion.div
        whileHover={{ y: -5, rotateX: 5 }}
        className="p-5 rounded-3xl glass-card border border-white/10 relative overflow-hidden group perspective-1000"
    >
        <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full ${color.replace('text-', 'bg-')}/10 blur-xl group-hover:scale-150 transition-transform duration-500`} />
        <div className="flex items-center justify-between relative z-10">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</p>
            <div className={`p-2 rounded-xl ${color.replace('text-', 'bg-')}/10`}>
                <Icon className={`w-5 h-5 ${color}`} />
            </div>
        </div>
        <p className="text-3xl font-black mt-3 text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400">{value}</p>
    </motion.div>
);

export default function MedicalRecordsModule() {
    const { theme } = useTheme();
    const [records, setRecords] = useState([]);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [modal, setModal] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [showSummaryModal, setShowSummaryModal] = useState(null);
    const [generatedSummary, setGeneratedSummary] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [newRecord, setNewRecord] = useState({
        patientId: '',
        doctorId: '',
        recordDate: '',
        diagnosis: '',
        treatment: '',
        prescription: {
            medicationName: '',
            dosage: '',
            schedules: [{ time: '' }],
            status: 'active'
        }
    });

    useEffect(() => {
        fetchRecords();
        fetchPatients();
        fetchDoctors();
    }, []);

    const fetchRecords = async () => {
        try {
            const res = await fetch(apiUrl('/api/medical-records'));
            const data = await res.json();
            setRecords(Array.isArray(data) ? data : []);
        } catch (e) { console.error("Failed to fetch records:", e); }
    };

    const fetchPatients = async () => {
        try {
            const res = await fetch(apiUrl('/api/patients'));
            setPatients(await res.json() || []);
        } catch (e) { console.error('Failed to fetch patients:', e); }
    };

    const fetchDoctors = async () => {
        try {
            const res = await fetch(apiUrl('/api/employees'));
            const allEmployees = await res.json();
            setDoctors(allEmployees.filter(emp => emp.role === 'doctor') || []);
        } catch (e) { console.error('Failed to fetch doctors:', e); }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewRecord(prev => ({ ...prev, [name]: value }));
    };

    const handlePrescriptionChange = (e) => {
        const { name, value } = e.target;
        setNewRecord(prev => ({
            ...prev,
            prescription: { ...prev.prescription, [name]: value }
        }));
    };

    const handleScheduleChange = (index, e) => {
        const { value } = e.target;
        const schedules = [...newRecord.prescription.schedules];
        schedules[index] = { ...schedules[index], time: value };
        setNewRecord(prev => ({
            ...prev,
            prescription: { ...prev.prescription, schedules }
        }));
    };

    const addSchedule = () => {
        setNewRecord(prev => ({
            ...prev,
            prescription: {
                ...prev.prescription,
                schedules: [...prev.prescription.schedules, { time: '' }]
            }
        }));
    };

    const removeSchedule = (index) => {
        const schedules = [...newRecord.prescription.schedules];
        schedules.splice(index, 1);
        setNewRecord(prev => ({
            ...prev,
            prescription: { ...prev.prescription, schedules }
        }));
    };

    const handleAddRecord = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(apiUrl('/api/medical-records/add'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRecord),
            });
            const data = await res.json();
            if (data.success) {
                setModal(null);
                fetchRecords();
            } else { alert(data.message); }
        } catch (error) { alert('Failed to connect to server.'); }
    };

    const handleDeleteRecord = async (recordId) => {
        try {
            const res = await fetch(apiUrl(`/api/medical-records/${recordId}`), { method: 'DELETE' });
            if ((await res.json()).success) {
                fetchRecords();
            }
        } catch (error) { alert('Failed to connect to server.'); }
        setShowDeleteConfirm(null);
    };

    const handleGenerateSummary = async (record) => {
        setIsGenerating(true);
        setGeneratedSummary('');

        const systemPrompt = "You are a helpful medical assistant. Your task is to explain a patient's diagnosis and treatment plan in simple, clear, and reassuring terms. Avoid complex medical jargon. Keep the summary to 2-3 sentences.";
        const userQuery = `Explain the following for a patient: Diagnosis is "${record.diagnosis}" and the treatment is "${record.treatment}".`;

        try {
            const response = await fetch(apiUrl('/api/ai/ask'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userQuery }
                    ]
                }),
            });

            if (!response.ok) throw new Error(`API error: ${response.status}`);

            const result = await response.json();
            const text = result.reply;
            setGeneratedSummary(text || "Could not generate summary.");

        } catch (error) {
            console.error("Gemini API error:", error);
            setGeneratedSummary("Error connecting to AI service.");
        } finally {
            setIsGenerating(false);
        }
    };

    const filteredRecords = useMemo(() =>
        records.filter(r =>
            Object.values(r).some(val =>
                String(val).toLowerCase().includes(searchTerm.toLowerCase())
            )
        ), [records, searchTerm]
    );

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
    const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

    return (
        <div className="p-4 sm:p-8 font-sans min-h-screen text-white transition-colors duration-300">

            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500 drop-shadow-sm">Medical Records</h1>
                        <p className="text-gray-400 mt-2 font-medium">Manage patient medical history and records.</p>
                    </div>
                    <button onClick={() => setModal('add')} className="group relative px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300 overflow-hidden">
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        <div className="flex items-center gap-2 relative z-10">
                            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                            <span>Add Record</span>
                        </div>
                    </button>
                </div>
            </motion.div>

            <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" variants={containerVariants} initial="hidden" animate="visible">
                <motion.div variants={itemVariants}><StatCard title="Total Records" value={records.length} icon={FileText} color="text-blue-400" /></motion.div>
                <motion.div variants={itemVariants}><StatCard title="Records Today" value={records.filter(r => new Date(r.recordDate).toDateString() === new Date().toDateString()).length} icon={Clock} color="text-yellow-400" /></motion.div>
                <motion.div variants={itemVariants}><StatCard title="Unique Patients" value={new Set(records.map(r => r.patientName)).size} icon={Users} color="text-green-400" /></motion.div>
            </motion.div>

            <div className="glass-panel rounded-3xl p-1 overflow-hidden">
                <div className="bg-white/50 dark:bg-black/40 backdrop-blur-md rounded-[20px] p-6 min-h-[500px]">
                    <div className="relative mb-6 group">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                        <input type="text" placeholder="Search by patient, doctor, or diagnosis..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-100/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none transition-all duration-300" />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead><tr className="border-b border-gray-800"><th className="p-4 text-left text-sm font-semibold text-gray-400">Patient</th><th className="p-4 text-left text-sm font-semibold text-gray-400">Doctor</th><th className="p-4 text-left text-sm font-semibold text-gray-400">Diagnosis</th><th className="p-4 text-left text-sm font-semibold text-gray-400">Date</th><th className="p-4 text-right text-sm font-semibold text-gray-400">Actions</th></tr></thead>
                            <motion.tbody variants={containerVariants} initial="hidden" animate="visible">
                                {filteredRecords.map(rec => (
                                    <motion.tr key={rec.id} variants={itemVariants} className="border-b border-gray-800 hover:bg-gray-800/50">
                                        <td className="p-4 font-semibold">{rec.patientName}</td>
                                        <td className="p-4 text-gray-400">Dr. {rec.doctorName}</td>
                                        <td className="p-4 font-medium">{rec.diagnosis}</td>
                                        <td className="p-4 text-gray-400 text-sm">{new Date(rec.recordDate).toLocaleDateString()}</td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button onClick={() => { setShowSummaryModal(rec); setGeneratedSummary(''); }} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full" title="Summarize with AI"><Sparkles size={18} /></button>
                                                <button onClick={() => setShowDeleteConfirm(rec)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-full"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </motion.tbody>
                        </table>
                        {filteredRecords.length === 0 && <p className="text-center py-12 text-gray-500">No medical records found.</p>}
                    </div>
                </div>
            </div>

            {modal === 'add' && (
                <Modal onClose={() => setModal(null)} width="max-w-2xl">
                    <form onSubmit={handleAddRecord}>
                        <h2 className="text-2xl font-bold mb-6">Add Medical Record</h2>
                        <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                            {/* Patient, Doctor, Date */}
                            <div className="grid grid-cols-2 gap-4">
                                <select name="patientId" onChange={handleInputChange} className="col-span-2 p-3 bg-gray-800 border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required><option value="">Select Patient</option>{patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} (ID: {p.patientId})</option>)}</select>
                                <select name="doctorId" onChange={handleInputChange} className="col-span-2 p-3 bg-gray-800 border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required><option value="">Select Doctor</option>{doctors.map(d => <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>)}</select>
                                <input name="recordDate" type="date" onChange={handleInputChange} className="p-3 bg-gray-800 border-gray-700 rounded-lg col-span-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                            </div>

                            {/* Diagnosis and Treatment */}
                            <input name="diagnosis" onChange={handleInputChange} placeholder="Diagnosis" className="w-full p-3 bg-gray-800 border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                            <textarea name="treatment" onChange={handleInputChange} placeholder="Treatment Notes..." className="w-full p-3 bg-gray-800 border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3}></textarea>

                            {/* Prescription Section */}
                            <div className="p-4 border border-gray-700 rounded-lg">
                                <h3 className="text-lg font-semibold mb-3">Prescription (Optional)</h3>
                                <div className="space-y-3">
                                    <input name="medicationName" value={newRecord.prescription.medicationName} onChange={handlePrescriptionChange} placeholder="Medication Name" className="w-full p-3 bg-gray-900 border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                    <input name="dosage" value={newRecord.prescription.dosage} onChange={handlePrescriptionChange} placeholder="Dosage (e.g., 500mg)" className="w-full p-3 bg-gray-900 border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />

                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Scheduled Times</label>
                                        {newRecord.prescription.schedules.map((schedule, index) => (
                                            <div key={index} className="flex items-center gap-2 mb-2">
                                                <input type="time" value={schedule.time} onChange={(e) => handleScheduleChange(index, e)} className="w-full p-3 bg-gray-900 border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                                {newRecord.prescription.schedules.length > 1 && (
                                                    <button type="button" onClick={() => removeSchedule(index)} className="p-2 bg-red-600/20 text-red-400 rounded-full hover:bg-red-600/40">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button type="button" onClick={addSchedule} className="mt-2 text-sm font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                            <Plus size={16} /> Add Time
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-gray-800">
                            <button type="button" onClick={() => setModal(null)} className="px-6 py-2 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600">Cancel</button>
                            <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">Save Record</button>
                        </div>
                    </form>
                </Modal>
            )}

            {showDeleteConfirm && (
                <Modal onClose={() => setShowDeleteConfirm(null)} width="max-w-md">
                    <h2 className="text-2xl font-bold mb-4">Confirm Deletion</h2>
                    <p className="text-gray-400 mb-6">Are you sure you want to delete the record for "{showDeleteConfirm.patientName}" on {new Date(showDeleteConfirm.recordDate).toLocaleDateString()}?</p>
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={() => setShowDeleteConfirm(null)} className="px-6 py-2 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600">Cancel</button>
                        <button type="button" onClick={() => handleDeleteRecord(showDeleteConfirm.id)} className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700">Delete</button>
                    </div>
                </Modal>
            )}

            {showSummaryModal && (
                <Modal onClose={() => setShowSummaryModal(null)} width="max-w-xl">
                    <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">✨ AI Patient Summary</h2>
                    <p className="text-gray-400 mb-6">A simplified explanation of the record for {showSummaryModal.patientName}.</p>

                    {!generatedSummary && !isGenerating && (
                        <button onClick={() => handleGenerateSummary(showSummaryModal)} className="w-full py-3 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                            <Sparkles size={20} /> Generate Summary
                        </button>
                    )}

                    {isGenerating && <p className="text-center text-gray-400 animate-pulse py-10">AI is generating a summary...</p>}

                    {generatedSummary && (
                        <div className="space-y-4">
                            <p className="p-4 bg-gray-800 border-gray-700 rounded-lg text-gray-300">{generatedSummary}</p>
                            <div className="flex justify-end gap-4">
                                <button onClick={() => navigator.clipboard.writeText(generatedSummary)} className="px-6 py-2 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600">Copy Text</button>
                                <button onClick={() => setShowSummaryModal(null)} className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">Done</button>
                            </div>
                        </div>
                    )}
                </Modal>
            )}
        </div>
    );
}
