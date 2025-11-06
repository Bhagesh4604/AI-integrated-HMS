import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Eye, Edit2, Trash2, DollarSign, FileText, X, User } from 'lucide-react';

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

const StatCard = ({ title, value, icon: Icon, color }) => {
    const { theme } = useTheme();
    return (
        <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-[#1C1C1E] border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between">
                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
                <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className={`text-3xl font-bold mt-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{value}</p>
        </div>
    );
};

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
            const response = await fetch(apiUrl('/api/billing')); // Use the new GET / endpoint
            const data = await response.json();
            setBills(Array.isArray(data) ? data : []);
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
            const data = await response.json();
            if (data.success) {
                fetchBills();
            } else { alert(data.message); }
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
                    if (data.success) {
                        setSelectedBill(data.bill);
                    } else { alert(data.message); }
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
            case 'paid': return 'bg-green-500/20 text-green-300';
            case 'pending': return 'bg-yellow-500/20 text-yellow-300';
            case 'partial': return 'bg-blue-500/20 text-blue-300';
            case 'overdue': return 'bg-red-500/20 text-red-300';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    const totalOutstanding = useMemo(() => (bills || []).reduce((sum, bill) => sum + parseFloat(bill.balanceDue), 0) || 0, [bills]);

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
    const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

    return (
        <div className={`p-8 font-sans min-h-full ${theme === 'dark' ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>

            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold">Patient Billing</h1>
                        <p className="text-gray-400 mt-2">Manage patient invoices and payments.</p>
                    </div>
                    <button onClick={() => openModal('generate')} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-full transition-colors flex items-center gap-2">
                        <Plus size={20} />
                        <span>Generate New Bill</span>
                    </button>
                </div>
            </motion.div>

            <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" variants={containerVariants} initial="hidden" animate="visible">
                <motion.div variants={itemVariants}><StatCard title="Total Bills" value={bills.length} icon={FileText} color="text-blue-400"/></motion.div>
                <motion.div variants={itemVariants}><StatCard title="Outstanding Balance" value={`$${totalOutstanding.toFixed(2)}`} icon={DollarSign} color="text-red-400"/></motion.div>
                <motion.div variants={itemVariants}><StatCard title="Patients with Bills" value={new Set(bills.map(bill => bill.patientId)).size} icon={User} color="text-green-400"/></motion.div>
            </motion.div>

            <div className="bg-[#1C1C1E] rounded-2xl border border-gray-800 p-6">
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input type="text" placeholder="Search by bill number, patient, or status..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-800">
                                <th className="text-left p-4 text-sm font-semibold text-gray-400">Bill #</th>
                                <th className="text-left p-4 text-sm font-semibold text-gray-400">Patient</th>
                                <th className="text-left p-4 text-sm font-semibold text-gray-400">Total Amount</th>
                                <th className="text-left p-4 text-sm font-semibold text-gray-400">Balance Due</th>
                                <th className="text-left p-4 text-sm font-semibold text-gray-400">Status</th>
                                <th className="text-right p-4 text-sm font-semibold text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <motion.tbody variants={containerVariants} initial="hidden" animate="visible">
                            {filteredBills.map(bill => (
                                <motion.tr key={bill.id} variants={itemVariants} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                                    <td className="p-4 font-semibold">{bill.billNumber}</td>
                                    <td className="p-4">{patients.find(p => p.id === bill.patientId)?.firstName} {patients.find(p => p.id === bill.patientId)?.lastName}</td>
                                    <td className="p-4">${parseFloat(bill.totalAmount).toFixed(2)}</td>
                                    <td className="p-4">${parseFloat(bill.balanceDue).toFixed(2)}</td>
                                    <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusPill(bill.status)}`}>{bill.status.toUpperCase()}</span></td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button onClick={() => openModal('view', bill)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full"><Eye size={18}/></button>
                                            <button onClick={() => openModal('pay', bill)} className="p-2 text-green-400 hover:text-white hover:bg-green-700 rounded-full" title="Record Payment"><DollarSign size={18}/></button>
                                            <button onClick={() => openModal('edit', bill)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full"><Edit2 size={18}/></button>
                                            <button onClick={() => setShowDeleteConfirm(bill)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-full"><Trash2 size={18}/></button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </motion.tbody>
                    </table>
                    {filteredBills.length === 0 && <p className="text-center py-12 text-gray-500">No bills found.</p>}
                </div>
            </div>

            {modal && (
                <Modal onClose={() => setModal(null)} width={modal === 'view' ? 'max-w-2xl' : 'max-w-lg'}>
                    {modal === 'generate' && (
                        <form onSubmit={handleGenerateBill}>
                            <h2 className="text-2xl font-bold mb-6">Generate New Bill</h2>
                            <div className="grid grid-cols-1 gap-4">
                                <select name="patientId" onChange={handleNewBillDataChange} className="p-3 bg-gray-800 border-gray-700 rounded-lg" required>
                                    <option value="">Select Patient</option>
                                    {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                                </select>
                                <input type="date" name="dueDate" onChange={handleNewBillDataChange} className="p-3 bg-gray-800 border-gray-700 rounded-lg" required />
                                <textarea name="notes" onChange={handleNewBillDataChange} placeholder="Bill Notes (Optional)" className="p-3 bg-gray-800 border-gray-700 rounded-lg" rows={2}></textarea>

                                <h3 className="text-xl font-bold mt-4 mb-2">Bill Items</h3>
                                <div className="space-y-2">
                                    {newBillData.items.map((item, index) => (
                                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-700 rounded-lg">
                                            <span className="flex-1">{item.description} - ${parseFloat(item.amount).toFixed(2)}</span>
                                            <button type="button" onClick={() => handleRemoveItemFromBill(index)} className="p-1 text-red-400 hover:text-red-300"><X size={16}/></button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input name="description" value={newItem.description} onChange={handleNewItemChange} placeholder="Item Description" className="flex-1 p-3 bg-gray-800 border-gray-700 rounded-lg" />
                                    <input type="number" name="amount" value={newItem.amount} onChange={handleNewItemChange} placeholder="Amount" step="0.01" className="w-24 p-3 bg-gray-800 border-gray-700 rounded-lg" />
                                    <button type="button" onClick={handleAddItemToBill} className="p-3 bg-blue-600 text-white rounded-lg"><Plus size={20}/></button>
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-gray-800">
                                <button type="button" onClick={() => setModal(null)} className="px-6 py-2 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">Generate Bill</button>
                            </div>
                        </form>
                    )}

                    {modal === 'view' && selectedBill && (
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-2xl font-bold">Bill #{selectedBill.billNumber}</h2>
                                <button onClick={() => setModal(null)} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white"><X size={24}/></button>
                            </div>
                            <p className="text-gray-400 mb-4">Patient: {patients.find(p => p.id === selectedBill.patientId)?.firstName} {patients.find(p => p.id === selectedBill.patientId)?.lastName}</p>
                            <div className="space-y-2 mb-4">
                                <p><strong>Bill Date:</strong> {new Date(selectedBill.billDate).toLocaleDateString()}</p>
                                <p><strong>Due Date:</strong> {new Date(selectedBill.dueDate).toLocaleDateString()}</p>
                                <p><strong>Total Amount:</strong> ${parseFloat(selectedBill.totalAmount).toFixed(2)}</p>
                                <p><strong>Amount Paid:</strong> ${parseFloat(selectedBill.amountPaid).toFixed(2)}</p>
                                <p><strong>Balance Due:</strong> ${parseFloat(selectedBill.balanceDue).toFixed(2)}</p>
                                <p><strong>Status:</strong> <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusPill(selectedBill.status)}`}>{selectedBill.status.toUpperCase()}</span></p>
                                {selectedBill.notes && <p><strong>Notes:</strong> {selectedBill.notes}</p>}
                            </div>
                            <h3 className="text-xl font-bold mt-4 mb-2">Items</h3>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                {selectedBill.items?.map((item, index) => (
                                    <div key={index} className="flex justify-between p-2 bg-gray-700 rounded-lg">
                                        <span>{item.description}</span>
                                        <span>${parseFloat(item.amount).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-gray-800">
                                <button type="button" onClick={() => setModal(null)} className="px-6 py-2 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600">Close</button>
                            </div>
                        </div>
                    )}

                    {modal === 'edit' && selectedBill && (
                        <form onSubmit={handleUpdateBill}>
                            <h2 className="text-2xl font-bold mb-6">Edit Bill #{selectedBill.billNumber}</h2>
                            <div className="grid grid-cols-1 gap-4">
                                <input type="date" name="dueDate" value={selectedBill.dueDate.split('T')[0]} onChange={(e) => setSelectedBill(prev => ({ ...prev, dueDate: e.target.value }))} className="p-3 bg-gray-800 border-gray-700 rounded-lg" required />
                                <select name="status" value={selectedBill.status} onChange={(e) => setSelectedBill(prev => ({ ...prev, status: e.target.value }))} className="p-3 bg-gray-800 border-gray-700 rounded-lg">
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                    <option value="partial">Partial</option>
                                    <option value="overdue">Overdue</option>
                                </select>
                                <textarea name="notes" value={selectedBill.notes || ''} onChange={(e) => setSelectedBill(prev => ({ ...prev, notes: e.target.value }))} placeholder="Notes (Optional)" className="p-3 bg-gray-800 border-gray-700 rounded-lg" rows={2}></textarea>
                            </div>
                            <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-gray-800">
                                <button type="button" onClick={() => setModal(null)} className="px-6 py-2 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">Save Changes</button>
                            </div>
                        </form>
                    )}

                    {modal === 'pay' && selectedBill && (
                        <form onSubmit={handleRecordPayment}>
                            <h2 className="text-2xl font-bold mb-6">Record Payment for Bill #{selectedBill.billNumber}</h2>
                            <p className="text-gray-400 mb-4">Balance Due: ${parseFloat(selectedBill.balanceDue).toFixed(2)}</p>
                            <div className="grid grid-cols-1 gap-4">
                                <input type="number" name="paymentAmount" value={paymentData.paymentAmount} onChange={(e) => setPaymentData(prev => ({ ...prev, paymentAmount: e.target.value }))} placeholder="Payment Amount" step="0.01" className="p-3 bg-gray-800 border-gray-700 rounded-lg" required />
                                <select name="paymentMethod" value={paymentData.paymentMethod} onChange={(e) => setPaymentData(prev => ({ ...prev, paymentMethod: e.target.value }))} className="p-3 bg-gray-800 border-gray-700 rounded-lg">
                                    <option value="Cash">Cash</option>
                                    <option value="Card">Card</option>
                                    <option value="Online">Online</option>
                                    <option value="Insurance">Insurance</option>
                                </select>
                                <textarea name="notes" value={paymentData.notes} onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))} placeholder="Payment Notes (Optional)" className="p-3 bg-gray-800 border-gray-700 rounded-lg" rows={2}></textarea>
                            </div>
                            <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-gray-800">
                                <button type="button" onClick={() => setModal(null)} className="px-6 py-2 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">Record Payment</button>
                            </div>
                        </form>
                    )}
                </Modal>
            )}

            {showDeleteConfirm && (
                <Modal onClose={() => setShowDeleteConfirm(null)} width="max-w-md">
                    <h2 className="text-2xl font-bold mb-4">Confirm Deletion</h2>
                    <p className="text-gray-400 mb-6">Are you sure you want to delete bill #{selectedBill?.billNumber}? This cannot be undone.</p>
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={() => setShowDeleteConfirm(null)} className="px-6 py-2 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600">Cancel</button>
                        <button type="button" onClick={() => handleDeleteBill(showDeleteConfirm.id)} className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700">Delete</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
