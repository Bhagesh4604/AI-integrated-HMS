import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Eye, Edit2, Trash2, DollarSign, FileText, X, User, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
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
                {/* Background Glow */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
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

export default function BillingModule() {
    const { theme } = useTheme();
    const [bills, setBills] = useState([]);
    const [patients, setPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [modal, setModal] = useState(null); // 'generate', 'view', 'edit', 'pay'
    const [selectedBill, setSelectedBill] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

    const [newBillData, setNewBillData] = useState({
        patientId: '', dueDate: '', items: [], notes: ''
    });
    const [newItem, setNewItem] = useState({ description: '', amount: '', serviceReference: '' });
    const [paymentData, setPaymentData] = useState({ paymentAmount: '', paymentMethod: 'Cash', notes: '' });

    useEffect(() => {
        fetchBills();
        fetchPatients();
    }, []);

    const fetchBills = async () => {
        try {
            const response = await fetch(apiUrl('/api/billing'));
            setBills(await response.json() || []);
        } catch (error) { console.error('Failed to fetch bills:', error); }
    };

    const fetchPatients = async () => {
        try {
            const response = await fetch(apiUrl('/api/patients'));
            setPatients(await response.json() || []);
        } catch (error) { console.error('Failed to fetch patients:', error); }
    };

    const handleNewBillDataChange = (e) => {
        const { name, value } = e.target;
        setNewBillData(prev => ({ ...prev, [name]: value }));
    };

    const handleNewItemChange = (e) => {
        const { name, value } = e.target;
        setNewItem(prev => ({ ...prev, [name]: value }));
    };

    const handleAddItemToBill = () => {
        if (newItem.description && newItem.amount) {
            setNewBillData(prev => ({ ...prev, items: [...prev.items, newItem] }));
            setNewItem({ description: '', amount: '', serviceReference: '' });
        }
    };

    const handleRemoveItemFromBill = (index) => {
        setNewBillData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
    };

    const handleGenerateBill = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(apiUrl('/api/billing/generate'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newBillData),
            });
            const data = await response.json();
            if (data.success) {
                setModal(null);
                fetchBills();
                setNewBillData({ patientId: '', dueDate: '', items: [], notes: '' });
            } else { alert(data.message); }
        } catch (error) { alert('Failed to connect to the server.'); }
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        if (!selectedBill) return;
        try {
            const response = await fetch(apiUrl(`/api/billing/${selectedBill.id}/pay`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentData),
            });
            const data = await response.json();
            if (data.success) {
                setModal(null);
                fetchBills();
                setPaymentData({ paymentAmount: '', paymentMethod: 'Cash', notes: '' });
            } else { alert(data.message); }
        } catch (error) { alert('Failed to connect to server.'); }
    };

    const handleUpdateBill = async (e) => {
        e.preventDefault();
        if (!selectedBill) return;
        try {
            const response = await fetch(apiUrl(`/api/billing/${selectedBill.id}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dueDate: selectedBill.dueDate, status: selectedBill.status, notes: selectedBill.notes }),
            });
            const data = await response.json();
            if (data.success) {
                setModal(null);
                fetchBills();
            } else { alert(data.message); }
        } catch (error) { alert('Failed to connect to server.'); }
    };

    const handleDeleteBill = async (id) => {
        try {
            const response = await fetch(apiUrl(`/api/billing/${id}`), { method: 'DELETE' });
            if ((await response.json()).success) fetchBills(); else alert('Failed to delete');
        } catch (error) { alert('Failed to connect to server.'); }
        setShowDeleteConfirm(null);
    };

    const openModal = async (type, bill = null) => {
        setModal(type);
        if (bill) {
            if (type === 'view') {
                try {
                    const response = await fetch(apiUrl(`/api/billing/${bill.id}/details`));
                    const data = await response.json();
                    if (data.success) setSelectedBill(data.bill); else alert(data.message);
                } catch (error) { alert('Failed to fetch bill details.'); }
            } else {
                setSelectedBill(JSON.parse(JSON.stringify(bill)));
            }
        }
        if (type === 'generate') {
            setNewBillData({ patientId: '', dueDate: '', items: [], notes: '' });
            setNewItem({ description: '', amount: '', serviceReference: '' });
        }
    };

    const filteredBills = useMemo(() =>
        bills.filter(bill =>
            Object.values(bill).some(val =>
                String(val).toLowerCase().includes(searchTerm.toLowerCase())
            )
        ),
        [bills, searchTerm]
    );

    const getStatusPill = (status) => {
        switch (status) {
            case 'paid': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'partial': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'overdue': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    const totalOutstanding = useMemo(() => (bills || []).reduce((sum, bill) => sum + parseFloat(bill.balanceDue), 0) || 0, [bills]);

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
    const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

    return (
        <div className="p-4 md:p-8 font-sans min-h-full">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-300">Patient Billing</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Manage invoices and payments.</p>
                    </div>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openModal('generate')} className="bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2">
                        <Plus size={20} /> Generate New Bill
                    </motion.button>
                </div>
            </motion.div>

            <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" variants={containerVariants} initial="hidden" animate="visible">
                <motion.div variants={itemVariants}><StatCard title="Total Bills" value={bills.length} icon={FileText} color="text-blue-500" /></motion.div>
                <motion.div variants={itemVariants}><StatCard title="Outstanding Balance" value={`$${totalOutstanding.toFixed(2)}`} icon={DollarSign} color="text-red-500" /></motion.div>
                <motion.div variants={itemVariants}><StatCard title="Patients with Bills" value={new Set(bills.map(bill => bill.patientId)).size} icon={User} color="text-green-500" /></motion.div>
            </motion.div>

            <div className="glass-panel rounded-3xl border border-white/20 overflow-hidden shadow-xl p-6">
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input type="text" placeholder="Search by bill number, patient, or status..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none text-gray-900 dark:text-white placeholder-gray-400 transition-all" />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-white/10">
                                <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Bill #</th>
                                <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Patient</th>
                                <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Total</th>
                                <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Balance</th>
                                <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="text-right p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <motion.tbody variants={containerVariants} initial="hidden" animate="visible">
                            {filteredBills.map(bill => (
                                <motion.tr key={bill.id} variants={itemVariants} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-bold text-blue-600 dark:text-blue-400">{bill.billNumber}</td>
                                    <td className="p-4 font-bold text-gray-700 dark:text-gray-200">{patients.find(p => p.id === bill.patientId)?.firstName} {patients.find(p => p.id === bill.patientId)?.lastName}</td>
                                    <td className="p-4 font-medium text-gray-900 dark:text-gray-300">${parseFloat(bill.totalAmount).toFixed(2)}</td>
                                    <td className="p-4 font-medium text-gray-900 dark:text-gray-300 text-red-500 dark:text-red-400">${parseFloat(bill.balanceDue).toFixed(2)}</td>
                                    <td className="p-4"><span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getStatusPill(bill.status)} shadow-sm`}>{bill.status.toUpperCase()}</span></td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button onClick={() => openModal('view', bill)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-500 rounded-lg transition-colors"><Eye size={18} /></button>
                                            <button onClick={() => openModal('pay', bill)} className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-500/20 rounded-lg transition-colors" title="Record Payment"><DollarSign size={18} /></button>
                                            <button onClick={() => openModal('edit', bill)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/20 rounded-lg transition-colors"><Edit2 size={18} /></button>
                                            <button onClick={() => setShowDeleteConfirm(bill)} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </motion.tbody>
                    </table>
                    {filteredBills.length === 0 && <p className="text-center py-12 text-gray-400">No bills found.</p>}
                </div>
            </div>

            {modal && (
                <Modal onClose={() => setModal(null)} width={modal === 'view' ? 'max-w-2xl' : 'max-w-lg'}>
                    {modal === 'generate' && (
                        <form onSubmit={handleGenerateBill} className="space-y-4">
                            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 mb-6">Generate New Bill</h2>
                            <div className="grid grid-cols-1 gap-4">
                                <select name="patientId" onChange={handleNewBillDataChange} className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white" required>
                                    <option value="">Select Patient</option>
                                    {patients.map(p => <option key={p.id} value={p.id} className="text-black">{p.firstName} {p.lastName}</option>)}
                                </select>
                                <input type="date" name="dueDate" onChange={handleNewBillDataChange} className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white" required />
                                <textarea name="notes" onChange={handleNewBillDataChange} placeholder="Bill Notes (Optional)" className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400" rows={2}></textarea>

                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-2">Bill Items</h3>
                                <div className="space-y-2">
                                    {newBillData.items.map((item, index) => (
                                        <div key={index} className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                                            <span className="flex-1 font-medium text-gray-700 dark:text-gray-300">{item.description} - ${parseFloat(item.amount).toFixed(2)}</span>
                                            <button type="button" onClick={() => handleRemoveItemFromBill(index)} className="p-1 text-red-500 hover:text-red-600"><X size={16} /></button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input name="description" value={newItem.description} onChange={handleNewItemChange} placeholder="Item Description" className="flex-1 p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400" />
                                    <input type="number" name="amount" value={newItem.amount} onChange={handleNewItemChange} placeholder="Amount" step="0.01" className="w-28 p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400" />
                                    <button type="button" onClick={handleAddItemToBill} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30 font-bold"><Plus size={20} /></button>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-6">
                                <button type="button" onClick={() => setModal(null)} className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">Cancel</button>
                                <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">Generate Bill</button>
                            </div>
                        </form>
                    )}

                    {modal === 'view' && selectedBill && (
                        <div>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Bill #{selectedBill.billNumber}</h2>
                                    <p className="text-gray-500 dark:text-gray-400">Patient: <span className="font-semibold text-gray-900 dark:text-white">{patients.find(p => p.id === selectedBill.patientId)?.firstName} {patients.find(p => p.id === selectedBill.patientId)?.lastName}</span></p>
                                </div>
                                <button onClick={() => setModal(null)} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"><X size={24} /></button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-gray-500 uppercase">Bill Date</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">{new Date(selectedBill.billDate).toLocaleDateString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-gray-500 uppercase">Due Date</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">{new Date(selectedBill.dueDate).toLocaleDateString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-gray-500 uppercase">Total Amount</p>
                                    <p className="font-bold text-xl text-blue-600 dark:text-blue-400">${parseFloat(selectedBill.totalAmount).toFixed(2)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-gray-500 uppercase">Balance Due</p>
                                    <p className="font-bold text-xl text-red-500 dark:text-red-400">${parseFloat(selectedBill.balanceDue).toFixed(2)}</p>
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <p className="text-xs font-bold text-gray-500 uppercase">Status</p>
                                    <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold border ${getStatusPill(selectedBill.status)}`}>{selectedBill.status.toUpperCase()}</span>
                                </div>
                                {selectedBill.notes && <div className="col-span-2 space-y-1"><p className="text-xs font-bold text-gray-500 uppercase">Notes</p><p className="text-gray-700 dark:text-gray-300">{selectedBill.notes}</p></div>}
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Items</h3>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                {selectedBill.items?.map((item, index) => (
                                    <div key={index} className="flex justify-between p-3 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300">
                                        <span className="font-medium">{item.description}</span>
                                        <span className="font-bold">${parseFloat(item.amount).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end pt-6 mt-4 border-t border-gray-200 dark:border-white/10">
                                <button type="button" onClick={() => setModal(null)} className="px-6 py-2.5 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600 transition-colors">Close</button>
                            </div>
                        </div>
                    )}

                    {modal === 'edit' && selectedBill && (
                        <form onSubmit={handleUpdateBill} className="space-y-4">
                            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 mb-6">Edit Bill #{selectedBill.billNumber}</h2>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">DUE DATE</label>
                                    <input type="date" name="dueDate" value={selectedBill.dueDate.split('T')[0]} onChange={(e) => setSelectedBill(prev => ({ ...prev, dueDate: e.target.value }))} className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">STATUS</label>
                                    <select name="status" value={selectedBill.status} onChange={(e) => setSelectedBill(prev => ({ ...prev, status: e.target.value }))} className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white">
                                        <option value="pending" className="text-black">Pending</option>
                                        <option value="paid" className="text-black">Paid</option>
                                        <option value="partial" className="text-black">Partial</option>
                                        <option value="overdue" className="text-black">Overdue</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">NOTES</label>
                                    <textarea name="notes" value={selectedBill.notes || ''} onChange={(e) => setSelectedBill(prev => ({ ...prev, notes: e.target.value }))} placeholder="Notes (Optional)" className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400" rows={3}></textarea>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-6">
                                <button type="button" onClick={() => setModal(null)} className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">Cancel</button>
                                <button type="submit" className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-500/30">Save Changes</button>
                            </div>
                        </form>
                    )}

                    {modal === 'pay' && selectedBill && (
                        <form onSubmit={handleRecordPayment} className="space-y-4">
                            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-500 mb-2">Record Payment</h2>
                            <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">Balance Due: <span className="font-bold text-red-500">${parseFloat(selectedBill.balanceDue).toFixed(2)}</span></p>

                            <div className="grid grid-cols-1 gap-4">
                                <input type="number" name="paymentAmount" value={paymentData.paymentAmount} onChange={(e) => setPaymentData(prev => ({ ...prev, paymentAmount: e.target.value }))} placeholder="Payment Amount" step="0.01" className="w-full p-4 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-xl font-bold text-gray-900 dark:text-white placeholder-gray-400" required />
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">METHOD</label>
                                        <select name="paymentMethod" value={paymentData.paymentMethod} onChange={(e) => setPaymentData(prev => ({ ...prev, paymentMethod: e.target.value }))} className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white">
                                            <option value="Cash" className="text-black">Cash</option>
                                            <option value="Card" className="text-black">Card</option>
                                            <option value="Online" className="text-black">Online</option>
                                            <option value="Insurance" className="text-black">Insurance</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">NOTES</label>
                                        <input name="notes" value={paymentData.notes} onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))} placeholder="Optional" className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-6">
                                <button type="button" onClick={() => setModal(null)} className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">Cancel</button>
                                <button type="submit" className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-500/30">Record Payment</button>
                            </div>
                        </form>
                    )}
                </Modal>
            )}

            {showDeleteConfirm && (
                <Modal onClose={() => setShowDeleteConfirm(null)} width="max-w-md">
                    <div className="flex flex-col items-center text-center">
                        <div className="p-4 bg-red-500/10 rounded-full text-red-500 mb-4"><AlertTriangle size={32} /></div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Confirm Deletion</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">Are you sure you want to delete bill <span className="font-bold text-gray-900 dark:text-white">#{selectedBill?.billNumber}</span>? This cannot be undone.</p>
                        <div className="flex gap-3 w-full">
                            <button type="button" onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">Cancel</button>
                            <button type="button" onClick={() => handleDeleteBill(showDeleteConfirm.id)} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30">Delete</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
