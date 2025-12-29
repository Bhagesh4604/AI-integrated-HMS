import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, DollarSign, ArrowDown, ArrowUp, X, Sparkles, Mail, Send, CheckCircle, AlertTriangle } from 'lucide-react';
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

export default function AccountingModule() {
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState('receivable');
    const [payables, setPayables] = useState([]);
    const [receivables, setReceivables] = useState([]);
    const [patients, setPatients] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [showReminderModal, setShowReminderModal] = useState(null);
    const [showConfirmationModal, setShowConfirmationModal] = useState(null);
    const [generatedMessage, setGeneratedMessage] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSendingSms, setIsSendingSms] = useState(false);
    const [smsStatus, setSmsStatus] = useState('');
    const [recipientNumber, setRecipientNumber] = useState('');

    const [newEntry, setNewEntry] = useState({
        type: 'receivable',
        invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        name: '',
        amount: '',
        dueDate: '',
        patientId: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [payablesRes, receivablesRes, patientsRes, vendorsRes] = await Promise.all([
                    fetch(apiUrl('/api/accounting/payable')),
                    fetch(apiUrl('/api/accounting/receivable')),
                    fetch(apiUrl('/api/patients')),
                    fetch(apiUrl('/api/vendors'))
                ]);
                setPayables(await payablesRes.json() || []);
                setReceivables(await receivablesRes.json() || []);
                setPatients(await patientsRes.json() || []);
                setVendors(await vendorsRes.json() || []);
            } catch (error) { console.error("Failed to fetch accounting data:", error); }
        };
        fetchData();
    }, []);

    const fetchAllData = () => {
        fetch(apiUrl('/api/accounting/payable')).then(res => res.json()).then(data => setPayables(Array.isArray(data) ? data : []));
        fetch(apiUrl('/api/accounting/receivable')).then(res => res.json()).then(data => setReceivables(Array.isArray(data) ? data : []));
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const invoiceNumber = name === 'type'
            ? `INV-${Math.floor(1000 + Math.random() * 9000)}`
            : newEntry.invoiceNumber;
        setNewEntry(prevState => ({ ...prevState, [name]: value, invoiceNumber }));
    };

    const handleAddEntry = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(apiUrl('/api/accounting/add'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEntry),
            });
            if ((await response.json()).success) {
                setShowAddModal(false);
                fetchAllData();
            } else { alert('Failed to add entry.'); }
        } catch (error) { alert('Failed to connect to server.'); }
    };

    const handleUpdateStatus = async (type, id, newStatus) => {
        try {
            const response = await fetch(apiUrl(`/api/accounting/${type}/${id}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentStatus: newStatus })
            });
            const data = await response.json();
            if (data.success) {
                if (type === 'receivable' && newStatus === 'paid') {
                    const updatedItem = receivables.find(item => item.id === id) || payables.find(item => item.id === id);
                    if (updatedItem) {
                        const patient = patients.find(p => p.id === updatedItem.patientId);
                        setRecipientNumber(patient?.phone || '');
                        setShowConfirmationModal(updatedItem);
                        setGeneratedMessage('');
                    }
                }
                fetchAllData();
            } else {
                alert('Failed to update status.');
            }
        } catch (error) { alert('Failed to connect to server.'); }
    };

    const handleDeleteEntry = async (type, id) => {
        try {
            const response = await fetch(apiUrl(`/api/accounting/${type}/${id}`), { method: 'DELETE' });
            if ((await response.json()).success) {
                fetchAllData();
            } else { alert('Failed to delete entry.'); }
        } catch (error) { alert('Failed to connect to server.'); }
        setShowDeleteConfirm(null);
    };

    const handleGenerateMessage = async (item, type) => {
        setIsGenerating(true);
        setGeneratedMessage('');
        setSmsStatus('');

        const systemPrompt = "You are a friendly but professional accounting assistant for 'Shree Medicare Hospital'. Your task is to draft a brief and polite message suitable for an SMS or short email.";
        const userQuery = type === 'reminder'
            ? `Draft a payment reminder for patient ${item.patientName} regarding invoice #${item.invoiceNumber} for the amount of $${item.amount}, which was due on ${new Date(item.dueDate).toLocaleDateString()}.`
            : `Draft a payment confirmation for patient ${item.patientName} for invoice #${item.invoiceNumber} for the amount of $${item.amount}. Thank them for their payment and confirm the payment has been received.`;

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
            setGeneratedMessage(text || "Could not generate draft.");
        } catch (error) {
            console.error("Gemini API error:", error);
            setGeneratedMessage("Error connecting to AI service.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSendSms = async () => {
        if (!recipientNumber || !generatedMessage) {
            setSmsStatus('Error: Phone number or message is missing.');
            return;
        }

        setIsSendingSms(true);
        setSmsStatus('Sending...');
        try {
            const response = await fetch(apiUrl('/api/sms/send'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: recipientNumber, message: generatedMessage }),
            });
            const data = await response.json();
            if (data.success) {
                setSmsStatus('Sent Successfully!');
            } else {
                setSmsStatus(`Error: ${data.error || data.message}`);
            }
        } catch (error) {
            setSmsStatus('Error: Failed to connect to SMS service.');
        } finally {
            setIsSendingSms(false);
        }
    }


    const getStatusPill = (status) => {
        switch (status) {
            case 'paid': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'overdue': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    const totalReceivable = useMemo(() => receivables.reduce((sum, item) => item.paymentStatus !== 'paid' ? sum + Number(item.amount) : sum, 0), [receivables]);
    const totalPayable = useMemo(() => payables.reduce((sum, item) => item.paymentStatus !== 'paid' ? sum + Number(item.amount) : sum, 0), [payables]);

    const dataToDisplay = activeTab === 'payable' ? payables : receivables;
    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
    const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };
    const tabs = ['receivable', 'payable'];

    return (
        <div className="p-4 md:p-8 font-sans min-h-full">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-300">Accounting</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Manage all financial transactions and records.</p>
                    </div>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2">
                        <Plus size={20} /> New Entry
                    </motion.button>
                </div>
            </motion.div>

            <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" variants={containerVariants} initial="hidden" animate="visible">
                <motion.div variants={itemVariants}><StatCard title="Total Receivable" value={`$${totalReceivable.toLocaleString()}`} icon={ArrowDown} color="text-green-500" /></motion.div>
                <motion.div variants={itemVariants}><StatCard title="Total Payable" value={`$${totalPayable.toLocaleString()}`} icon={ArrowUp} color="text-red-500" /></motion.div>
                <motion.div variants={itemVariants}><StatCard title="Net Balance" value={`$${(totalReceivable - totalPayable).toLocaleString()}`} icon={DollarSign} color="text-blue-500" /></motion.div>
            </motion.div>

            <div className="glass-panel rounded-3xl border border-white/20 overflow-hidden shadow-xl">
                <div className="p-2 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
                    <div className="flex space-x-2 relative">
                        {tabs.map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all z-10 ${activeTab === tab ? 'text-blue-600 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                                {tab === 'receivable' ? 'My Receivables' : 'My Payables'}
                            </button>
                        ))}
                        <motion.div layoutId="activeAcctTab" className="absolute h-full w-1/2 bg-white dark:bg-white/10 shadow-sm rounded-xl" transition={{ type: 'spring', stiffness: 300, damping: 30 }} animate={{ x: `${tabs.indexOf(activeTab) * 100}%` }} />
                    </div>
                </div>
                <div className="p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead><tr className="border-b border-gray-100 dark:border-white/10"><th className="p-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Invoice #</th><th className="p-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{activeTab === 'payable' ? 'Vendor' : 'Patient'}</th><th className="p-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th><th className="p-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Due Date</th><th className="p-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th><th className="p-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th></tr></thead>
                            <motion.tbody key={activeTab} variants={containerVariants} initial="hidden" animate="visible">
                                {dataToDisplay.map(item => (
                                    <motion.tr key={item.id} variants={itemVariants} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="p-4 font-bold text-pink-500 dark:text-pink-400">{item.invoiceNumber}</td>
                                        <td className="p-4 font-bold text-gray-700 dark:text-gray-200">{activeTab === 'payable' ? item.vendorName : item.patientName}</td>
                                        <td className="p-4 font-bold text-gray-900 dark:text-white">${Number(item.amount).toLocaleString()}</td>
                                        <td className="p-4 text-sm text-gray-500">{new Date(item.dueDate).toLocaleDateString()}</td>
                                        <td className="p-4">
                                            <select value={item.paymentStatus} onChange={(e) => handleUpdateStatus(activeTab, item.id, e.target.value)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border outline-none appearance-none transition-colors cursor-pointer ${getStatusPill(item.paymentStatus)}`}>
                                                <option value="pending" className="text-black">Pending</option>
                                                <option value="paid" className="text-black">Paid</option>
                                                <option value="overdue" className="text-black">Overdue</option>
                                            </select>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {activeTab === 'receivable' && item.paymentStatus !== 'paid' && (
                                                    <button onClick={() => {
                                                        const patient = patients.find(p => p.id === item.patientId);
                                                        setRecipientNumber(patient?.phone || '');
                                                        setShowReminderModal(item);
                                                        setGeneratedMessage('');
                                                    }} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/20 rounded-lg transition-colors" title="Send Reminder"><Mail size={18} /></button>
                                                )}
                                                <button onClick={() => setShowDeleteConfirm({ type: activeTab, ...item })} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </motion.tbody>
                        </table>
                        {dataToDisplay.length === 0 && <p className="text-center py-20 text-gray-400">No entries found.</p>}
                    </div>
                </div>
            </div>

            {showAddModal && (
                <Modal onClose={() => setShowAddModal(false)}>
                    <form onSubmit={handleAddEntry} className="space-y-4">
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 mb-6">New Accounting Entry</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <select name="type" value={newEntry.type} onChange={handleInputChange} className="col-span-2 p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white" required>
                                <option value="receivable" className="text-black">Receivable (Patient Bill)</option>
                                <option value="payable" className="text-black">Payable (Vendor Bill)</option>
                            </select>
                            {newEntry.type === 'payable' ? (
                                <select name="name" onChange={handleInputChange} className="col-span-2 p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white" required><option value="">Select Vendor</option>{vendors.map(v => <option key={v.id} value={v.vendorName} className="text-black">{v.vendorName}</option>)}</select>
                            ) : (
                                <select name="patientId" onChange={handleInputChange} className="col-span-2 p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white" required><option value="">Select Patient</option>{patients.map(p => <option key={p.id} value={p.id} className="text-black">{p.firstName} {p.lastName}</option>)}</select>
                            )}
                            <input type="number" name="amount" step="0.01" onChange={handleInputChange} placeholder="Amount" className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400" required />
                            <input type="date" name="dueDate" onChange={handleInputChange} className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white" required />
                        </div>
                        <div className="flex justify-end gap-3 pt-6">
                            <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">Cancel</button>
                            <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">Add Entry</button>
                        </div>
                    </form>
                </Modal>
            )}

            {showDeleteConfirm && (
                <Modal onClose={() => setShowDeleteConfirm(null)} width="max-w-md">
                    <div className="flex flex-col items-center text-center">
                        <div className="p-4 bg-red-500/10 rounded-full text-red-500 mb-4"><AlertTriangle size={32} /></div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Confirm Deletion</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">Are you sure you want to delete invoice <span className="font-bold text-gray-900 dark:text-white">#{showDeleteConfirm.invoiceNumber}</span>?</p>
                        <div className="flex gap-3 w-full">
                            <button type="button" onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">Cancel</button>
                            <button type="button" onClick={() => handleDeleteEntry(showDeleteConfirm.type, showDeleteConfirm.id)} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30">Delete</button>
                        </div>
                    </div>
                </Modal>
            )}

            {(showReminderModal || showConfirmationModal) && (
                <Modal onClose={() => { setShowReminderModal(null); setShowConfirmationModal(null) }} width="max-w-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                            {showConfirmationModal ? <CheckCircle size={24} /> : <Sparkles size={24} />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{showConfirmationModal ? 'Payment Confirmation' : 'AI Reminder Assistant'}</h2>
                            <p className="text-sm text-gray-500">
                                {showConfirmationModal
                                    ? `Send a confirmation to ${showConfirmationModal.patientName}.`
                                    : `Send a reminder to ${showReminderModal.patientName}.`
                                }
                            </p>
                        </div>
                    </div>

                    {!generatedMessage && !isGenerating && (
                        <button onClick={() => handleGenerateMessage(showReminderModal || showConfirmationModal, showConfirmationModal ? 'confirmation' : 'reminder')} className="w-full py-4 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-transform hover:scale-105 active:scale-95">
                            <Sparkles size={20} /> Generate Message
                        </button>
                    )}

                    {isGenerating && (
                        <div className="py-12 flex flex-col items-center justify-center text-gray-500">
                            <Sparkles className="animate-spin mb-2 text-blue-500" />
                            <p className="animate-pulse">AI is crafting the message...</p>
                        </div>
                    )}

                    {generatedMessage && (
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={recipientNumber}
                                onChange={(e) => setRecipientNumber(e.target.value)}
                                placeholder="Recipient number e.g. +911234567890"
                                className="w-full p-4 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 font-medium"
                            />
                            <textarea value={generatedMessage} onChange={(e) => setGeneratedMessage(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white h-48 resize-none focus:ring-2 focus:ring-blue-500/50 outline-none" />
                            <div className="flex justify-end gap-3 mt-4">
                                <button onClick={() => navigator.clipboard.writeText(generatedMessage)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">Copy</button>
                                <button
                                    onClick={handleSendSms}
                                    disabled={isSendingSms}
                                    className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:bg-gray-500 transition-colors shadow-lg shadow-green-500/30 flex items-center gap-2"
                                >
                                    <Send size={18} />
                                    {isSendingSms ? 'Sending...' : 'Send SMS'}
                                </button>
                            </div>
                            {smsStatus && <p className={`text-sm text-center font-semibold mt-2 ${smsStatus.startsWith('Error') ? 'text-red-500' : 'text-green-500'}`}>{smsStatus}</p>}
                        </div>
                    )}
                </Modal>
            )}
        </div>
    );
}
