import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Syringe, Calendar, User, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import apiUrl from '@/config/api';

const Modal = ({ children, onClose, width = "max-w-lg" }) => (
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
                className={`glass-panel rounded-3xl p-6 w-full ${width} border border-white/10 shadow-2xl relative overflow-hidden`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative z-10">{children}</div>
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
            </motion.div>
        </motion.div>
    </AnimatePresence>
);

const StatCard = ({ title, value, icon: Icon, color }) => (
    <motion.div
        whileHover={{ y: -5, rotateX: 5 }}
        className="glass-card p-5 rounded-3xl border border-white/10 relative overflow-hidden group perspective-1000"
    >
        <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full ${color.replace('text-', 'bg-')}/10 blur-xl group-hover:scale-150 transition-transform duration-500`} />

        <div className="flex items-center justify-between relative z-10">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
            <div className={`p-2 rounded-xl ${color.replace('text-', 'bg-')}/10`}>
                <Icon className={`w-5 h-5 ${color}`} />
            </div>
        </div>
        <div className="mt-3 relative z-10">
            <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">{value}</p>
        </div>
    </motion.div>
);

export default function ImmunizationModule() {
    const { theme } = useTheme();
    const [immunizations, setImmunizations] = useState([]);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [modal, setModal] = useState(null); // 'add', 'edit'
    const [selectedImmunization, setSelectedImmunization] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

    const [newImmunization, setNewImmunization] = useState({
        patientId: '', vaccineName: '', vaccinationDate: '', doseNumber: 1, administeredByDoctorId: '', notes: '', nextDueDate: ''
    });

    useEffect(() => {
        fetchImmunizations();
        fetchPatients();
        fetchDoctors();
    }, []);

    const fetchImmunizations = async () => {
        try {
            const response = await fetch(apiUrl('/api/immunizations'));
            setImmunizations(await response.json() || []);
        } catch (error) { console.error('Failed to fetch immunizations:', error); }
    };

    const fetchPatients = async () => {
        try {
            const response = await fetch(apiUrl('/api/patients'));
            setPatients(await response.json() || []);
        } catch (error) { console.error('Failed to fetch patients:', error); }
    };

    const fetchDoctors = async () => {
        try {
            const response = await fetch(apiUrl('/api/employees'));
            const allEmployees = await response.json();
            setDoctors(allEmployees.filter(emp => emp.role === 'doctor') || []);
        } catch (error) { console.error('Failed to fetch doctors:', error); }
    };

    const handleInputChange = (e, formType) => {
        const { name, value } = e.target;
        if (formType === 'new') {
            setNewImmunization(prev => ({ ...prev, [name]: value }));
        } else if (selectedImmunization) {
            setSelectedImmunization(prev => (prev ? { ...prev, [name]: value } : null));
        }
    };

    const handleAddImmunization = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(apiUrl('/api/immunizations/add'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newImmunization),
            });
            const data = await response.json();
            if (data.success) {
                setModal(null);
                fetchImmunizations();
            } else { alert(data.message); }
        } catch (error) { alert('Failed to connect to the server.'); }
    };

    const handleUpdateImmunization = async (e) => {
        e.preventDefault();
        if (!selectedImmunization) return;
        try {
            const response = await fetch(apiUrl(`/api/immunizations/${selectedImmunization.id}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(selectedImmunization),
            });
            const data = await response.json();
            if (data.success) {
                setModal(null);
                fetchImmunizations();
            } else { alert(data.message); }
        } catch (error) { alert('Failed to connect to server.'); }
    };

    const handleDeleteImmunization = async (id) => {
        try {
            const response = await fetch(apiUrl(`/api/immunizations/${id}`), { method: 'DELETE' });
            if ((await response.json()).success) fetchImmunizations(); else alert('Failed to delete');
        } catch (error) { alert('Failed to connect to server.'); }
        setShowDeleteConfirm(null);
    };

    const openModal = (type, immunization = null) => {
        setModal(type);
        if (immunization) setSelectedImmunization(JSON.parse(JSON.stringify(immunization)));
        if (type === 'add') {
            setNewImmunization({ patientId: '', vaccineName: '', vaccinationDate: '', doseNumber: 1, administeredByDoctorId: '', notes: '', nextDueDate: '' });
        }
    };

    const filteredImmunizations = useMemo(() =>
        immunizations.filter(imm =>
            Object.values(imm).some(val =>
                String(val).toLowerCase().includes(searchTerm.toLowerCase())
            )
        ),
        [immunizations, searchTerm]
    );

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
    const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

    return (
        <div className="p-4 md:p-8 font-sans min-h-full">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">Immunization</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Manage and track patient vaccination records.</p>
                    </div>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openModal('add')} className="bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2">
                        <Plus size={20} /> Add Record
                    </motion.button>
                </div>
            </motion.div>

            <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" variants={containerVariants} initial="hidden" animate="visible">
                <motion.div variants={itemVariants}><StatCard title="Total Records" value={immunizations.length} icon={Syringe} color="text-blue-500" /></motion.div>
                <motion.div variants={itemVariants}><StatCard title="Upcoming Doses" value={immunizations.filter(imm => imm.nextDueDate && new Date(imm.nextDueDate) > new Date()).length} icon={Calendar} color="text-yellow-500" /></motion.div>
                <motion.div variants={itemVariants}><StatCard title="Patients Vaccinated" value={new Set(immunizations.map(imm => imm.patientId)).size} icon={User} color="text-green-500" /></motion.div>
            </motion.div>

            <div className="glass-panel rounded-3xl border border-white/20 overflow-hidden shadow-xl p-6">
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input type="text" placeholder="Search by vaccine, patient, or doctor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none text-gray-900 dark:text-white placeholder-gray-400 transition-all" />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-white/10">
                                <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Patient</th>
                                <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Vaccine</th>
                                <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                                <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Dose</th>
                                <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Administered By</th>
                                <th className="text-right p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <motion.tbody variants={containerVariants} initial="hidden" animate="visible">
                            {filteredImmunizations.map(imm => (
                                <motion.tr key={imm.id} variants={itemVariants} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-bold text-gray-700 dark:text-gray-200">{imm.patientName}</td>
                                    <td className="p-4 font-medium text-blue-600 dark:text-blue-400">{imm.vaccineName}</td>
                                    <td className="p-4 text-sm text-gray-500 dark:text-gray-400">{new Date(imm.vaccinationDate).toLocaleDateString()}</td>
                                    <td className="p-4"><span className="inline-flex items-center justify-center px-2 py-1 bg-blue-500/10 text-blue-500 rounded-lg text-xs font-bold">{imm.doseNumber}</span></td>
                                    <td className="p-4 text-sm text-gray-500 dark:text-gray-400">{imm.administeredByDoctorName || 'N/A'}</td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button onClick={() => openModal('edit', imm)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/20 rounded-lg transition-colors"><Edit2 size={18} /></button>
                                            <button onClick={() => setShowDeleteConfirm(imm)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </motion.tbody>
                    </table>
                    {filteredImmunizations.length === 0 && <p className="text-center py-12 text-gray-400">No immunization records found.</p>}
                </div>
            </div>

            {modal && (
                <Modal onClose={() => setModal(null)}>
                    <form onSubmit={modal === 'add' ? handleAddImmunization : handleUpdateImmunization} className="space-y-4">
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 mb-6">{modal === 'add' ? 'Add Immunization' : 'Edit Immunization'}</h2>
                        <div className="grid grid-cols-1 gap-4">
                            <select name="patientId" value={modal === 'add' ? newImmunization.patientId : selectedImmunization.patientId} onChange={(e) => handleInputChange(e, modal === 'add' ? 'new' : 'edit')} className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white" required disabled={modal === 'edit'}>
                                <option value="">Select Patient</option>
                                {patients.map(p => <option key={p.id} value={p.id} className="text-black">{p.firstName} {p.lastName}</option>)}
                            </select>
                            <input name="vaccineName" value={modal === 'add' ? newImmunization.vaccineName : selectedImmunization.vaccineName} onChange={(e) => handleInputChange(e, modal === 'add' ? 'new' : 'edit')} placeholder="Vaccine Name" className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400" required />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">DATE</label>
                                    <input type="date" name="vaccinationDate" value={(modal === 'add' ? newImmunization.vaccinationDate : selectedImmunization.vaccinationDate).split('T')[0]} onChange={(e) => handleInputChange(e, modal === 'add' ? 'new' : 'edit')} className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white" required />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">DOSE #</label>
                                    <input type="number" name="doseNumber" value={modal === 'add' ? newImmunization.doseNumber : selectedImmunization.doseNumber} onChange={(e) => handleInputChange(e, modal === 'add' ? 'new' : 'edit')} placeholder="Dose" className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400" />
                                </div>
                            </div>
                            <select name="administeredByDoctorId" value={modal === 'add' ? newImmunization.administeredByDoctorId : (selectedImmunization.administeredByDoctorId || '')} onChange={(e) => handleInputChange(e, modal === 'add' ? 'new' : 'edit')} className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white">
                                <option value="">Administered By (Doctor)</option>
                                {doctors.map(d => <option key={d.id} value={d.id} className="text-black">{d.firstName} {d.lastName}</option>)}
                            </select>
                            <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">NEXT DUE (OPTIONAL)</label>
                                <input type="date" name="nextDueDate" value={((modal === 'add' ? newImmunization.nextDueDate : selectedImmunization.nextDueDate) || '').split('T')[0]} onChange={(e) => handleInputChange(e, modal === 'add' ? 'new' : 'edit')} className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white" />
                            </div>
                            <textarea name="notes" value={modal === 'add' ? newImmunization.notes : (selectedImmunization.notes || '')} onChange={(e) => handleInputChange(e, modal === 'add' ? 'new' : 'edit')} placeholder="Notes (Optional)" className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400" rows={3}></textarea>
                        </div>
                        <div className="flex justify-end gap-3 pt-6">
                            <button type="button" onClick={() => setModal(null)} className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">Cancel</button>
                            <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">{modal === 'add' ? 'Add Record' : 'Save Changes'}</button>
                        </div>
                    </form>
                </Modal>
            )}

            {showDeleteConfirm && (
                <Modal onClose={() => setShowDeleteConfirm(null)} width="max-w-md">
                    <div className="flex flex-col items-center text-center">
                        <div className="p-4 bg-red-500/10 rounded-full text-red-500 mb-4"><AlertTriangle size={32} /></div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Confirm Deletion</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">Are you sure you want to delete the record for <span className="font-bold text-gray-900 dark:text-white">{showDeleteConfirm?.patientName}</span>?</p>
                        <div className="flex gap-3 w-full">
                            <button type="button" onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">Cancel</button>
                            <button type="button" onClick={() => handleDeleteImmunization(showDeleteConfirm.id)} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30">Delete</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
