import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Eye, Edit2, Trash2, RefreshCw, FilePlus, Pill, X, Search, CheckCircle, AlertTriangle, Package } from 'lucide-react';
import apiUrl from '../config/api';

const Modal = ({ children, onClose }) => (
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
        className="bg-[#1C1C1E] rounded-2xl p-8 w-full max-w-lg border border-gray-700 shadow-2xl text-white"
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

const MedicineCard = ({ med, getStockStatusPill, openModal, setShowDeleteConfirm }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="glass-card p-4 rounded-2xl border border-white/10 flex flex-col space-y-4"
  >
    <div className="flex justify-between items-start">
      <div>
        <div className="font-semibold text-white">{med.name}</div>
        <div className="text-sm text-gray-400">{med.strength}</div>
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStockStatusPill(med.stockQuantity, med.reorderLevel).bg} ${getStockStatusPill(med.stockQuantity, med.reorderLevel).text}`}>
        {getStockStatusPill(med.stockQuantity, med.reorderLevel).label}
      </span>
    </div>
    <div className="text-sm text-gray-400">Category: <span className="font-semibold text-teal-300">{med.categoryName}</span></div>
    <div className="flex justify-between items-center">
      <div>
        <div className="text-xs text-gray-500">Stock</div>
        <div className="font-semibold text-white">{med.stockQuantity}</div>
      </div>
      <div>
        <div className="text-xs text-gray-500">Reorder</div>
        <div className="font-semibold text-white">{med.reorderLevel}</div>
      </div>
    </div>
    <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-800/50">
      <button onClick={() => openModal('details', med)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full"><Eye size={18} /></button>
      <button onClick={() => openModal('edit', med)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full"><Edit2 size={18} /></button>
      <button onClick={() => setShowDeleteConfirm(med)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-full"><Trash2 size={18} /></button>
    </div>
  </motion.div>
);

export default function PharmacyManagement() {
  const [activeTab, setActiveTab] = useState('medicines');
  const [pharmaceuticals, setPharmaceuticals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modal, setModal] = useState(null);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [newMedicine, setNewMedicine] = useState({ name: '', categoryId: '', description: '', dosageForm: '', strength: '', unitPrice: '', stockQuantity: '', reorderLevel: '' });

  const fetchAllData = async () => {
    try {
      const [medRes, catRes, presRes] = await Promise.all([
        fetch(apiUrl('/api/pharmacy/medicines')),
        fetch(apiUrl('/api/pharmacy/categories')),
        fetch(apiUrl('/api/pharmacy/prescriptions'))
      ]);
      setPharmaceuticals(await medRes.json() || []);
      setCategories(await catRes.json() || []);
      setPrescriptions(await presRes.json() || []);
    } catch (err) {
      console.error('Failed to fetch pharmacy data:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (activeTab === 'prescriptions') {
      fetchAllData();
    }
  }, [activeTab]);

  const handleInputChange = (e, formType) => {
    const { name, value } = e.target;
    if (formType === 'new') {
      setNewMedicine(prev => ({ ...prev, [name]: value }));
    } else if (formType === 'edit' && selectedMedicine) {
      setSelectedMedicine(prev => (prev ? { ...prev, [name]: value } : prev));
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl('/api/pharmacy/medicines/add'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newMedicine) });
      const data = await res.json();
      if (data.success) {
        setModal(null);
        fetchAllData();
      } else { alert(data.message); }
    } catch (err) { alert('Failed to connect to server.'); }
  };

  const handleUpdateMedicine = async (e) => {
    e.preventDefault();
    if (!selectedMedicine) return;
    try {
      const res = await fetch(apiUrl(`/api/pharmacy/medicines/${selectedMedicine.id}`), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(selectedMedicine) });
      const data = await res.json();
      if (data.success) {
        setModal(null);
        fetchAllData();
      } else { alert(data.message); }
    } catch (err) { alert('Failed to connect to server.'); }
  };

  const handleDeleteMedicine = async (medicineId) => {
    try {
      const res = await fetch(apiUrl(`/api/pharmacy/medicines/${medicineId}`), { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchAllData();
      } else { alert(data.message); }
    } catch (err) { alert('Failed to connect to server.'); }
    setShowDeleteConfirm(null);
  };

  const handleUpdatePrescriptionStatus = async (prescriptionId, newStatus) => {
    try {
      const res = await fetch(apiUrl(`/api/pharmacy/prescriptions/${prescriptionId}`), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
      const data = await res.json();
      if (data.success) {
        fetchAllData();
      } else { alert(data.message); }
    } catch (err) { alert('Failed to connect to the server.'); }
  };

  const openModal = (type, medicine = null) => {
    setModal(type);
    if (medicine) setSelectedMedicine(JSON.parse(JSON.stringify(medicine)));
    if (type === 'add') {
      setNewMedicine({ name: '', categoryId: '', description: '', dosageForm: '', strength: '', unitPrice: '', stockQuantity: '', reorderLevel: '' });
    }
  };

  const filteredPharmaceuticals = useMemo(() =>
    pharmaceuticals.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase())),
    [pharmaceuticals, searchTerm]
  );

  const getStockStatusPill = (stock, reorder) => {
    if (stock <= reorder) return { bg: 'bg-red-500/20', text: 'text-red-300', label: 'Low Stock' };
    if (stock <= reorder * 1.5) return { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: 'Warning' };
    return { bg: 'bg-green-500/20', text: 'text-green-300', label: 'In Stock' };
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const tabs = ['medicines', 'categories', 'prescriptions'];

  return (
    <div className="p-4 sm:p-8 font-sans min-h-screen text-white transition-colors duration-300">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 drop-shadow-sm">Pharmacy Management</h1>
            <p className="text-gray-400 mt-2 font-medium">Manage medicines, categories, and prescriptions.</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={fetchAllData} className="px-4 py-2 rounded-full glass-card border border-white/10 flex items-center gap-2 hover:bg-white/5 text-gray-300"><RefreshCw className="w-4 h-4" /><span>Refresh</span></button>
            <button onClick={() => openModal('add')} className="group relative px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <div className="flex items-center gap-2 relative z-10">
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" /><span>Add Medicine</span>
              </div>
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants}><StatCard title="Total Medicines" value={pharmaceuticals.length} icon={Pill} color="text-blue-400" /></motion.div>
        <motion.div variants={itemVariants}><StatCard title="Low Stock" value={pharmaceuticals.filter(p => p.stockQuantity <= p.reorderLevel).length} icon={AlertTriangle} color="text-red-400" /></motion.div>
        <motion.div variants={itemVariants}><StatCard title="Pending Prescriptions" value={prescriptions.filter(p => p.status === 'active').length} icon={FilePlus} color="text-yellow-400" /></motion.div>
      </motion.div>

      <div className="glass-panel rounded-3xl p-1 overflow-hidden">
        <div className="bg-white/50 dark:bg-black/40 backdrop-blur-md rounded-[20px] p-6 min-h-[500px]">
          <div className="border-b border-gray-200 dark:border-white/10 mb-6">
            <div className="flex space-x-2 relative p-1 max-w-md">
              {tabs.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2.5 text-sm rounded-lg font-bold transition-colors z-10 ${activeTab === tab ? 'text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
              <motion.div
                layoutId="activeTabPill"
                className="absolute h-full w-1/3 bg-gradient-to-r from-indigo-600 to-blue-500 rounded-lg shadow-lg"
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                animate={{ x: `${tabs.indexOf(activeTab) * 100}%` }}
              />
            </div>
          </div>

          <div className="p-2">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {activeTab === 'medicines' && (
                  <div>
                    <div className="relative mb-6 group">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                      <input type="text" placeholder="Search medicines..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-100/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none transition-all duration-300" />
                    </div>
                    <div className="md:hidden grid grid-cols-1 gap-4">
                      {filteredPharmaceuticals.map(med => (
                        <MedicineCard key={med.id} med={med} getStockStatusPill={getStockStatusPill} openModal={openModal} setShowDeleteConfirm={setShowDeleteConfirm} />
                      ))}
                    </div>
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full">
                        <thead><tr className="border-b border-gray-800"><th className="p-4 text-left text-sm font-semibold text-gray-400">Medicine</th><th className="p-4 text-left text-sm font-semibold text-gray-400">Category</th><th className="p-4 text-left text-sm font-semibold text-gray-400">Stock</th><th className="p-4 text-left text-sm font-semibold text-gray-400">Status</th><th className="p-4 text-right text-sm font-semibold text-gray-400">Actions</th></tr></thead>
                        <motion.tbody variants={containerVariants} initial="hidden" animate="visible">
                          {filteredPharmaceuticals.map(med => {
                            const stock = getStockStatusPill(med.stockQuantity, med.reorderLevel);
                            return (
                              <motion.tr key={med.id} variants={itemVariants} className="border-b border-gray-800 hover:bg-gray-800/50">
                                <td className="p-4"><div className="font-semibold">{med.name}</div><div className="text-sm text-gray-400">{med.strength}</div></td>
                                <td className="p-4"><span className="px-3 py-1 bg-teal-500/10 text-teal-300 rounded-full text-xs font-semibold border border-teal-500/20">{med.categoryName}</span></td>
                                <td className="p-4"><div className="font-semibold">{med.stockQuantity}</div><div className="text-xs text-gray-500">Reorder: {med.reorderLevel}</div></td>
                                <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${stock.bg} ${stock.text}`}>{stock.label}</span></td>
                                <td className="p-4"><div className="flex items-center justify-end space-x-2"><button onClick={() => openModal('details', med)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full"><Eye size={18} /></button><button onClick={() => openModal('edit', med)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full"><Edit2 size={18} /></button><button onClick={() => setShowDeleteConfirm(med)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-full"><Trash2 size={18} /></button></div></td>
                              </motion.tr>
                            )
                          })}
                        </motion.tbody>
                      </table>
                    </div>
                  </div>
                )}
                {activeTab === 'categories' && (
                  <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" variants={containerVariants} initial="hidden" animate="visible">
                    {categories.map(c => <motion.div key={c.id} variants={itemVariants} className="glass-card p-5 rounded-2xl border border-white/10 hover:border-white/20 transition-all">
                      <h3 className="text-lg font-bold text-white mb-2">{c.name}</h3>
                      <p className="text-sm text-gray-400">{c.description}</p>
                      <div className="mt-4 flex items-center justify-end">
                        <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Category ID: {c.id}</span>
                      </div>
                    </motion.div>)}
                  </motion.div>
                )}
                {activeTab === 'prescriptions' && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead><tr className="border-b border-gray-800"><th className="p-4 text-left text-sm font-semibold text-gray-400">Patient</th><th className="p-4 text-left text-sm font-semibold text-gray-400">Medication</th><th className="p-4 text-left text-sm font-semibold text-gray-400">Prescribed By</th><th className="p-4 text-left text-sm font-semibold text-gray-400">Date</th><th className="p-4 text-left text-sm font-semibold text-gray-400">Status</th></tr></thead>
                      <motion.tbody variants={containerVariants} initial="hidden" animate="visible">
                        {prescriptions.map(p => (
                          <motion.tr key={p.id} variants={itemVariants} className="border-b border-gray-800 hover:bg-gray-800/50">
                            <td className="p-4 font-semibold">{p.patientName}</td>
                            <td className="p-4"><div className="font-semibold">{p.medicationName}</div><div className="text-sm text-gray-400">{p.dosage}</div></td>
                            <td className="p-4 text-gray-400">Dr. {p.doctorName}</td>
                            <td className="p-4 text-gray-400">{new Date(p.prescriptionDate).toLocaleDateString()}</td>
                            <td className="p-4">
                              <select value={p.status} onChange={(e) => handleUpdatePrescriptionStatus(p.id, e.target.value)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border-none outline-none appearance-none transition-colors ${p.status === 'dispensed' ? 'bg-green-500/20 text-green-300' : p.status === 'canceled' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'} bg-opacity-100`}>
                                <option value="active" className="bg-gray-800 text-white">Active</option>
                                <option value="filled" className="bg-gray-800 text-white">Filled</option>
                                <option value="canceled" className="bg-gray-800 text-white">Canceled</option>
                              </select>
                            </td>
                          </motion.tr>
                        ))}
                      </motion.tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {modal && (
        <Modal onClose={() => setModal(null)}>
          {modal === 'add' && (
            <form onSubmit={handleAddMedicine}>
              <h2 className="text-2xl font-bold mb-6">Add New Medicine</h2>
              <div className="grid grid-cols-2 gap-4">
                <input name="name" onChange={(e) => handleInputChange(e, 'new')} placeholder="Medicine Name" className="col-span-2 p-3 bg-gray-800 border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                <select name="categoryId" onChange={(e) => handleInputChange(e, 'new')} className="p-3 bg-gray-800 border-gray-700 rounded-lg col-span-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" required><option value="">Select Category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                <input name="strength" onChange={(e) => handleInputChange(e, 'new')} placeholder="Strength (e.g., 500mg)" className="p-3 bg-gray-800 border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <input type="number" name="stockQuantity" onChange={(e) => handleInputChange(e, 'new')} placeholder="Stock Quantity" className="p-3 bg-gray-800 border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-gray-800">
                <button type="button" onClick={() => setModal(null)} className="px-6 py-2 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700">Add Medicine</button>
              </div>
            </form>
          )}
          {modal === 'edit' && selectedMedicine && (
            <form onSubmit={handleUpdateMedicine}>
              <h2 className="text-2xl font-bold mb-6">Edit {selectedMedicine.name}</h2>
              <div className="grid grid-cols-2 gap-4">
                <input name="name" value={selectedMedicine.name} onChange={(e) => handleInputChange(e, 'edit')} className="col-span-2 p-3 bg-gray-800 border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                <select name="categoryId" value={selectedMedicine.categoryId} onChange={(e) => handleInputChange(e, 'edit')} className="p-3 bg-gray-800 border-gray-700 rounded-lg col-span-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" required>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                <input name="strength" value={selectedMedicine.strength} onChange={(e) => handleInputChange(e, 'edit')} className="p-3 bg-gray-800 border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <input type="number" name="stockQuantity" value={selectedMedicine.stockQuantity} onChange={(e) => handleInputChange(e, 'edit')} className="p-3 bg-gray-800 border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-gray-800">
                <button type="button" onClick={() => setModal(null)} className="px-6 py-2 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">Save Changes</button>
              </div>
            </form>
          )}
          {modal === 'details' && selectedMedicine && (
            <div>
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold mb-6">{selectedMedicine.name}</h2>
                <button onClick={() => setModal(null)} className="-mt-2 -mr-2 p-2 rounded-full hover:bg-gray-700"><X size={20} /></button>
              </div>
              <div className="space-y-3 text-gray-300">
                <p><strong>Category:</strong> {selectedMedicine.categoryName}</p>
                <p><strong>Stock:</strong> {selectedMedicine.stockQuantity} units</p>
                <p><strong>Reorder Level:</strong> {selectedMedicine.reorderLevel} units</p>
              </div>
            </div>
          )}
        </Modal>
      )}

      {showDeleteConfirm && (
        <Modal onClose={() => setShowDeleteConfirm(null)}>
          <h2 className="text-2xl font-bold mb-4 text-white">Confirm Deletion</h2>
          <p className="text-gray-400 mb-6">Are you sure you want to delete "{showDeleteConfirm.name}"? This action cannot be undone.</p>
          <div className="flex justify-end gap-4">
            <button type="button" onClick={() => setShowDeleteConfirm(null)} className="px-6 py-2 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600">Cancel</button>
            <button type="button" onClick={() => handleDeleteMedicine(showDeleteConfirm.id)} className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700">Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
