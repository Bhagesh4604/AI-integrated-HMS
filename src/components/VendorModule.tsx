import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Eye, Edit2, Trash2, Search, Building, User, X, Package, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
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

export default function VendorModule() {
    const { theme } = useTheme();
    const [vendors, setVendors] = useState([]);
    const [showModal, setShowModal] = useState(null);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [newVendor, setNewVendor] = useState({
        vendorName: '', contactPerson: '', email: '', phone: '', address: '', vendorType: '', status: 'active'
    });

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        try {
            const response = await fetch(apiUrl('/api/vendors'));
            const data = await response.json();
            setVendors(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch vendors:", error);
            setVendors([]);
        }
    };

    const handleInputChange = (e, formType) => {
        const { name, value } = e.target;
        if (formType === 'new') {
            setNewVendor(prev => ({ ...prev, [name]: value }));
        } else if (selectedVendor) {
            setSelectedVendor(prev => (prev ? { ...prev, [name]: value } : prev));
        }
    };

    const handleAddVendor = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(apiUrl('/api/vendors/add'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newVendor),
            });
            const data = await response.json();
            if (data.success) {
                setShowModal(null);
                fetchVendors();
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('Failed to connect to server.');
        }
    };

    const handleUpdateVendor = async (e) => {
        e.preventDefault();
        if (!selectedVendor) return;
        try {
            const response = await fetch(apiUrl(`/api/vendors/${selectedVendor.id}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(selectedVendor)
            });
            const data = await response.json();
            if (data.success) {
                setShowModal(null);
                fetchVendors();
            } else {
                alert(data.message);
            }
        } catch (error) { console.error('Failed to connect to server', error); alert('Failed to connect to server'); }
    };

    const handleDeleteVendor = async (vendorId) => {
        try {
            const response = await fetch(apiUrl(`/api/vendors/${vendorId}`), { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                fetchVendors();
            } else {
                alert(data.message);
            }
        } catch (error) { console.error('Failed to connect to server', error); alert('Failed to connect to server'); }
        setShowDeleteConfirm(null);
    };

    const openModal = (type, vendor = null) => {
        setShowModal(type);
        if (vendor) setSelectedVendor(JSON.parse(JSON.stringify(vendor)));
        if (type === 'add') {
            setNewVendor({ vendorName: '', contactPerson: '', email: '', phone: '', address: '', vendorType: '', status: 'active' });
        }
    };

    const filteredVendors = useMemo(() =>
        vendors.filter(v =>
            Object.values(v).some(val =>
                String(val).toLowerCase().includes(searchTerm.toLowerCase())
            )
        ), [vendors, searchTerm]);

    const getStatusPill = (status) => {
        return status === 'active'
            ? 'bg-green-500/10 text-green-500 border-green-500/20'
            : 'bg-red-500/10 text-red-500 border-red-500/20';
    };

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
    const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

    return (
        <div className="p-4 md:p-8 font-sans min-h-full">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">Vendors</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Manage hospital suppliers and partners.</p>
                    </div>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openModal('add')} className="bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-purple-500/30 flex items-center gap-2">
                        <Plus size={20} /> Add Vendor
                    </motion.button>
                </div>
            </motion.div>

            <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" variants={containerVariants} initial="hidden" animate="visible">
                <motion.div variants={itemVariants}><StatCard title="Total Vendors" value={vendors.length} icon={Building} color="text-purple-500" /></motion.div>
                <motion.div variants={itemVariants}><StatCard title="Active Vendors" value={vendors.filter(v => v.status === 'active').length} icon={User} color="text-green-500" /></motion.div>
                <motion.div variants={itemVariants}><StatCard title="Vendor Types" value={new Set(vendors.map(v => v.vendorType)).size} icon={Package} color="text-pink-500" /></motion.div>
            </motion.div>

            <div className="glass-panel rounded-3xl border border-white/20 overflow-hidden shadow-xl p-6">
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by name, contact, type..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/50 outline-none text-gray-900 dark:text-white placeholder-gray-400 transition-all"
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-white/10">
                                <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Vendor Name</th>
                                <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Contact</th>
                                <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                                <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="text-right p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <motion.tbody variants={containerVariants} initial="hidden" animate="visible">
                            {filteredVendors.map((vendor) => (
                                <motion.tr key={vendor.id} variants={itemVariants} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-bold text-gray-700 dark:text-gray-200">{vendor.vendorName}</td>
                                    <td className="p-4 text-sm">
                                        <div className="font-semibold text-gray-700 dark:text-gray-300">{vendor.contactPerson}</div>
                                        <div className="text-gray-500 dark:text-gray-400 text-xs">{vendor.email}</div>
                                    </td>
                                    <td className="p-4 text-gray-600 dark:text-gray-400 font-medium">{vendor.vendorType}</td>
                                    <td className="p-4"><span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getStatusPill(vendor.status)}`}>{vendor.status.toUpperCase()}</span></td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button onClick={() => openModal('details', vendor)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-500 rounded-lg transition-colors"><Eye size={18} /></button>
                                            <button onClick={() => openModal('edit', vendor)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/20 rounded-lg transition-colors"><Edit2 size={18} /></button>
                                            <button onClick={() => setShowDeleteConfirm(vendor)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </motion.tbody>
                    </table>
                    {filteredVendors.length === 0 && <p className="text-center py-12 text-gray-400">No vendors found.</p>}
                </div>
            </div>

            {showModal && (
                <Modal onClose={() => setShowModal(null)}>
                    {showModal === 'add' && (
                        <form onSubmit={handleAddVendor}>
                            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 mb-6">Add New Vendor</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <input name="vendorName" onChange={(e) => handleInputChange(e, 'new')} placeholder="Vendor Name" className="col-span-2 p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400" required />
                                <input name="contactPerson" onChange={(e) => handleInputChange(e, 'new')} placeholder="Contact Person" className="p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400" />
                                <input type="email" name="email" onChange={(e) => handleInputChange(e, 'new')} placeholder="Email" className="p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400" />
                                <input name="phone" onChange={(e) => handleInputChange(e, 'new')} placeholder="Phone" className="p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400" />
                                <input name="vendorType" onChange={(e) => handleInputChange(e, 'new')} placeholder="Vendor Type (e.g., Supplies)" className="col-span-2 p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400" />
                            </div>
                            <div className="flex justify-end gap-3 pt-6">
                                <button type="button" onClick={() => setShowModal(null)} className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">Cancel</button>
                                <button type="submit" className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/30">Add Vendor</button>
                            </div>
                        </form>
                    )}
                    {showModal === 'edit' && selectedVendor && (
                        <form onSubmit={handleUpdateVendor}>
                            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 mb-6">Edit Vendor</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <input name="vendorName" value={selectedVendor.vendorName} onChange={(e) => handleInputChange(e, 'edit')} className="col-span-2 p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white" required />
                                <input name="contactPerson" value={selectedVendor.contactPerson} onChange={(e) => handleInputChange(e, 'edit')} className="p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white" />
                                <input name="email" value={selectedVendor.email} onChange={(e) => handleInputChange(e, 'edit')} className="p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white" />
                                <input name="phone" value={selectedVendor.phone} onChange={(e) => handleInputChange(e, 'edit')} className="p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white" />
                                <input name="vendorType" value={selectedVendor.vendorType} onChange={(e) => handleInputChange(e, 'edit')} className="p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white" />
                                <select name="status" value={selectedVendor.status} onChange={(e) => handleInputChange(e, 'edit')} className="p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white">
                                    <option value="active" className="text-black">Active</option>
                                    <option value="inactive" className="text-black">Inactive</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-6">
                                <button type="button" onClick={() => setShowModal(null)} className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">Cancel</button>
                                <button type="submit" className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-500/30">Save Changes</button>
                            </div>
                        </form>
                    )}
                    {showModal === 'details' && selectedVendor && (
                        <div>
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedVendor.vendorName}</h2>
                                <button onClick={() => setShowModal(null)} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"><X size={20} /></button>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">CONTACT PERSON</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">{selectedVendor.contactPerson || 'N/A'}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">EMAIL</p>
                                        <p className="font-semibold text-gray-900 dark:text-white break-words">{selectedVendor.email || 'N/A'}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">PHONE</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">{selectedVendor.phone || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">TYPE</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">{vendor.vendorType || 'N/A'}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getStatusPill(selectedVendor.status)}`}>{selectedVendor.status.toUpperCase()}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </Modal>
            )}

            {showDeleteConfirm && (
                <Modal onClose={() => setShowDeleteConfirm(null)} width="max-w-md">
                    <div className="flex flex-col items-center text-center">
                        <div className="p-4 bg-red-500/10 rounded-full text-red-500 mb-4"><AlertTriangle size={32} /></div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Confirm Deletion</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">Are you sure you want to delete vendor <span className="font-bold text-gray-900 dark:text-white">{showDeleteConfirm.vendorName}</span>?</p>
                        <div className="flex gap-3 w-full">
                            <button type="button" onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">Cancel</button>
                            <button type="button" onClick={() => handleDeleteVendor(showDeleteConfirm.id)} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30">Delete</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
