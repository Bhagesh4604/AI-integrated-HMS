import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Scissors, Calendar, CheckCircle, XCircle, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import apiUrl from '../config/api';

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
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
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

export default function SurgicalModule() {
  const { theme } = useTheme();
  const [surgeries, setSurgeries] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [patients, setPatients] = useState([]);
  const [surgeons, setSurgeons] = useState([]);
  const [newSurgery, setNewSurgery] = useState({
    surgeryNumber: `SURG-${Math.floor(1000 + Math.random() * 9000)}`,
    patientId: '',
    surgeonId: '',
    surgeryType: '',
    surgeryDate: '',
    notes: ''
  });

  useEffect(() => {
    fetchSurgeries();
    fetchPatients();
    fetchSurgeons();
  }, []);

  const fetchSurgeries = async () => {
    try {
      const res = await fetch(apiUrl('/api/surgical'));
      const data = await res.json();
      setSurgeries(Array.isArray(data) ? data : []);
    } catch (e) { console.error("Failed to fetch surgeries:", e); }
  };

  const fetchPatients = async () => {
    try {
      const response = await fetch(apiUrl('/api/patients'));
      setPatients(await response.json());
    } catch (error) { console.error('Failed to fetch patients:', error); }
  };

  const fetchSurgeons = async () => {
    try {
      const response = await fetch(apiUrl('/api/employees'));
      const allEmployees = await response.json();
      setSurgeons(allEmployees.filter(emp => emp.role === 'doctor' || emp.position.toLowerCase().includes('surgeon')));
    } catch (error) { console.error('Failed to fetch surgeons:', error); }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSurgery(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSurgery = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl('/api/surgical/add'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSurgery),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        fetchSurgeries();
      } else {
        alert(data.message);
      }
    } catch (error) { console.error('Failed to connect to server.', error); alert('Failed to connect to server.'); }
  };

  const handleUpdateStatus = async (surgeryId, newStatus) => {
    try {
      const response = await fetch(apiUrl(`/api/surgical/${surgeryId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (data.success) {
        fetchSurgeries();
      } else {
        alert(data.message);
      }
    } catch (error) { console.error('Failed to connect to server.', error); alert('Failed to connect to server.'); }
  };

  const handleDeleteSurgery = async (surgeryId) => {
    try {
      const response = await fetch(apiUrl(`/api/surgical/${surgeryId}`), { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        fetchSurgeries();
      } else {
        alert(data.message);
      }
    } catch (error) { console.error('Failed to connect to server', error); alert('Failed to connect to server'); }
    setShowDeleteConfirm(null);
  };

  const getStatusPill = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'canceled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'scheduled':
      default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  const surgeriesToday = useMemo(() => surgeries.filter(s => new Date(s.surgeryDate).toDateString() === new Date().toDateString()).length, [surgeries]);

  return (
    <div className="p-4 md:p-8 font-sans min-h-full">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 dark:from-red-400 dark:to-orange-400">Surgery</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Schedule and manage surgical procedures.</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-red-500/30 flex items-center gap-2">
            <Plus size={20} /> Schedule Surgery
          </motion.button>
        </div>
      </motion.div>

      <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants}><StatCard title="Total Surgeries" value={surgeries.length} icon={Scissors} color="text-blue-500" /></motion.div>
        <motion.div variants={itemVariants}><StatCard title="Scheduled Today" value={surgeriesToday} icon={Calendar} color="text-orange-500" /></motion.div>
        <motion.div variants={itemVariants}><StatCard title="Completed" value={surgeries.filter(s => s.status === 'completed').length} icon={CheckCircle} color="text-green-500" /></motion.div>
      </motion.div>

      <div className="glass-panel rounded-3xl border border-white/20 overflow-hidden shadow-xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/10">
                <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Procedure</th>
                <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Patient & Surgeon</th>
                <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date & Time</th>
                <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-right p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <motion.tbody variants={containerVariants} initial="hidden" animate="visible">
              {surgeries.map(surg => (
                <motion.tr key={surg.id} variants={itemVariants} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-gray-800 dark:text-gray-200">{surg.surgeryType}</p>
                    <p className="text-xs font-medium text-blue-500">{surg.surgeryNumber}</p>
                  </td>
                  <td className="p-4 text-sm">
                    <div className="font-semibold text-gray-700 dark:text-gray-300">{surg.patientName}</div>
                    <div className="text-gray-500 text-xs">Dr. {surg.surgeonName}</div>
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-400 text-sm font-medium">{new Date(surg.surgeryDate).toLocaleString()}</td>
                  <td className="p-4">
                    <select value={surg.status} onChange={(e) => handleUpdateStatus(surg.id, e.target.value)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border outline-none appearance-none transition-colors cursor-pointer ${getStatusPill(surg.status)}`}>
                      <option value="scheduled" className="text-black">Scheduled</option>
                      <option value="completed" className="text-black">Completed</option>
                      <option value="canceled" className="text-black">Canceled</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end">
                      <button onClick={() => setShowDeleteConfirm(surg)} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
          {surgeries.length === 0 && <p className="text-center py-12 text-gray-400">No surgeries scheduled.</p>}
        </div>
      </div>

      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddSurgery} className="space-y-4">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500 mb-6">Schedule New Surgery</h2>
            <div className="grid grid-cols-2 gap-4">
              <select name="patientId" onChange={handleInputChange} className="col-span-2 p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white" required>
                <option value="">Select Patient</option>
                {patients.map(p => <option key={p.id} value={p.id} className="text-black">{p.firstName} {p.lastName}</option>)}
              </select>
              <select name="surgeonId" onChange={handleInputChange} className="col-span-2 p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white" required>
                <option value="">Select Surgeon</option>
                {surgeons.map(s => <option key={s.id} value={s.id} className="text-black">{s.firstName} {s.lastName}</option>)}
              </select>
              <input name="surgeryType" onChange={handleInputChange} placeholder="Surgery Type / Procedure" className="col-span-2 p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400" required />
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">DATE & TIME</label>
                <input name="surgeryDate" type="datetime-local" onChange={handleInputChange} className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white" required />
              </div>
              <textarea name="notes" onChange={handleInputChange} placeholder="Notes..." className="col-span-2 p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400" rows={3}></textarea>
            </div>
            <div className="flex justify-end gap-3 pt-6">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">Cancel</button>
              <button type="submit" className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30">Schedule</button>
            </div>
          </form>
        </Modal>
      )}

      {showDeleteConfirm && (
        <Modal onClose={() => setShowDeleteConfirm(null)} width="max-w-md">
          <div className="flex flex-col items-center text-center">
            <div className="p-4 bg-red-500/10 rounded-full text-red-500 mb-4"><AlertTriangle size={32} /></div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Confirm Deletion</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Are you sure you want to delete the surgery record for <span className="font-bold text-gray-900 dark:text-white">{showDeleteConfirm.patientName}</span>?</p>
            <div className="flex gap-3 w-full">
              <button type="button" onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">Cancel</button>
              <button type="button" onClick={() => handleDeleteSurgery(showDeleteConfirm.id)} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30">Delete</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
