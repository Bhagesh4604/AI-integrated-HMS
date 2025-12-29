import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, DollarSign, Users, Clock, X, Sparkles, Mail, AlertTriangle, Send } from 'lucide-react';
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
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
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

export default function PayrollModule() {
  const { theme } = useTheme();
  const [payrolls, setPayrolls] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showNotifyModal, setShowNotifyModal] = useState(null);
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [newPayroll, setNewPayroll] = useState({ employeeId: '', payPeriodStart: '', payPeriodEnd: '' });

  useEffect(() => {
    fetchPayrolls();
    fetchEmployees();
  }, []);

  const fetchPayrolls = async () => {
    try {
      const res = await fetch(apiUrl('/api/payroll'));
      const data = await res.json();
      setPayrolls(Array.isArray(data) ? data : []);
    } catch (e) { console.error("Failed to fetch payrolls:", e); }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch(apiUrl('/api/employees'));
      setEmployees(await response.json());
    } catch (error) { console.error('Failed to fetch employees:', error); }
  };

  const handleGenerateEmail = async (payrollRecord) => {
    setIsGenerating(true);
    setGeneratedEmail('');

    const systemPrompt = "You are an HR assistant for a hospital named 'Shree Medicare'. Your tone is professional, friendly, and concise.";
    const userQuery = `Draft an email to an employee named ${payrollRecord.firstName} ${payrollRecord.lastName} notifying them that their salary of $${Number(payrollRecord.basicSalary).toLocaleString()} for the pay period ${new Date(payrollRecord.payPeriodStart).toLocaleDateString()} to ${new Date(payrollRecord.payPeriodEnd).toLocaleDateString()} has been processed. Mention that the amount will be reflected in their bank account shortly. Keep it brief.`;

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

      if (!response.ok) throw new Error(`API call failed with status: ${response.status}`);

      const result = await response.json();
      setGeneratedEmail(result.reply || "Sorry, I couldn't generate an email draft at this time.");

    } catch (error) {
      console.error("Gemini API error:", error);
      setGeneratedEmail("Error: Could not connect to the AI service. Please check the server configuration.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPayroll(prev => ({ ...prev, [name]: value }));
  };

  const handleAddPayroll = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl('/api/payroll/add'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPayroll),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        fetchPayrolls();
      } else {
        alert(data.message);
      }
    } catch (error) { console.error('Failed to connect to server.', error); alert('Failed to connect to server.'); }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(apiUrl(`/api/payroll/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchPayrolls();
      } else {
        alert(data.message);
      }
    } catch (error) { console.error('Failed to connect to server.', error); alert('Failed to connect to server.'); }
  };

  const handleDeletePayroll = async (id) => {
    try {
      const res = await fetch(apiUrl(`/api/payroll/${id}`), { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchPayrolls();
      } else {
        alert(data.message);
      }
    } catch (error) { console.error('Failed to connect to server.', error); alert('Failed to connect to server.'); }
    setShowDeleteConfirm(null);
  };

  const getStatusPill = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  const totalPending = useMemo(() =>
    payrolls.filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + Number(p.basicSalary), 0),
    [payrolls]
  );

  return (
    <div className="p-4 md:p-8 font-sans min-h-full">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-green-600 dark:from-emerald-400 dark:to-green-500">Payroll</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Manage employee salaries and payments.</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/30 flex items-center gap-2">
            <Plus size={20} /> Generate Payroll
          </motion.button>
        </div>
      </motion.div>

      <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants}><StatCard title="Total Records" value={payrolls.length} icon={Users} color="text-blue-500" /></motion.div>
        <motion.div variants={itemVariants}><StatCard title="Pending Payments" value={`$${totalPending.toLocaleString()}`} icon={Clock} color="text-yellow-500" /></motion.div>
        <motion.div variants={itemVariants}><StatCard title="Employees" value={employees.length} icon={DollarSign} color="text-green-500" /></motion.div>
      </motion.div>

      <div className="glass-panel rounded-3xl border border-white/20 overflow-hidden shadow-xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/10">
                <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Employee</th>
                <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Pay Period</th>
                <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Salary</th>
                <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-right p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <motion.tbody variants={containerVariants} initial="hidden" animate="visible">
              {payrolls.map(p => (
                <motion.tr key={p.id} variants={itemVariants} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="p-4 font-bold text-gray-700 dark:text-gray-200">{p.firstName} {p.lastName}</td>
                  <td className="p-4 text-sm text-gray-500 dark:text-gray-400">{new Date(p.payPeriodStart).toLocaleDateString()} - {new Date(p.payPeriodEnd).toLocaleDateString()}</td>
                  <td className="p-4 font-bold text-lg text-gray-900 dark:text-white">${Number(p.basicSalary).toLocaleString()}</td>
                  <td className="p-4">
                    <select value={p.status} onChange={(e) => handleUpdateStatus(p.id, e.target.value)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border outline-none appearance-none transition-colors cursor-pointer ${getStatusPill(p.status)}`}>
                      <option value="pending" className="text-black">Pending</option>
                      <option value="paid" className="text-black">Paid</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setShowNotifyModal(p); setGeneratedEmail(''); }} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/20 rounded-lg transition-colors" title="AI Email Draft">
                        <Sparkles size={18} />
                      </button>
                      <button onClick={() => setShowDeleteConfirm(p)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg transition-colors" title="Delete Record">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
          {payrolls.length === 0 && <p className="text-center py-12 text-gray-400">No payroll records found.</p>}
        </div>
      </div>

      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddPayroll}>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-green-600 mb-6">Generate New Payroll</h2>
            <div className="grid grid-cols-1 gap-4">
              <select name="employeeId" onChange={handleInputChange} className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white" required>
                <option value="">Select Employee</option>
                {employees.map(e => <option key={e.id} value={e.id} className="text-black">{e.firstName} {e.lastName}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">START DATE</label>
                  <input name="payPeriodStart" type="date" onChange={handleInputChange} className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white" required />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">END DATE</label>
                  <input name="payPeriodEnd" type="date" onChange={handleInputChange} className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white" required />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-6">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">Cancel</button>
              <button type="submit" className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30">Generate</button>
            </div>
          </form>
        </Modal>
      )}

      {showDeleteConfirm && (
        <Modal onClose={() => setShowDeleteConfirm(null)} width="max-w-md">
          <div className="flex flex-col items-center text-center">
            <div className="p-4 bg-red-500/10 rounded-full text-red-500 mb-4"><AlertTriangle size={32} /></div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Confirm Deletion</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Are you sure you want to delete the payroll record for <span className="font-bold text-gray-900 dark:text-white">{showDeleteConfirm.firstName} {showDeleteConfirm.lastName}</span>?</p>
            <div className="flex gap-3 w-full">
              <button type="button" onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">Cancel</button>
              <button type="button" onClick={() => handleDeletePayroll(showDeleteConfirm.id)} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30">Delete</button>
            </div>
          </div>
        </Modal>
      )}

      {showNotifyModal && (
        <Modal onClose={() => setShowNotifyModal(null)} width="max-w-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500"><Sparkles size={24} /></div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Email Assistant</h2>
              <p className="text-sm text-gray-500">Draft a payment notification for {showNotifyModal.firstName}.</p>
            </div>
          </div>

          {!generatedEmail && !isGenerating && (
            <button onClick={() => handleGenerateEmail(showNotifyModal)} className="w-full py-4 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-transform hover:scale-105 active:scale-95">
              <Sparkles size={20} /> Generate Draft Email
            </button>
          )}

          {isGenerating && (
            <div className="py-12 flex flex-col items-center justify-center text-gray-500">
              <Sparkles className="animate-spin mb-2 text-blue-500" />
              <p className="animate-pulse">AI is writing the email...</p>
            </div>
          )}

          {generatedEmail && (
            <div className="space-y-4">
              <textarea
                value={generatedEmail}
                onChange={(e) => setGeneratedEmail(e.target.value)}
                className="w-full p-4 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white h-64 resize-none focus:ring-2 focus:ring-blue-500/50 outline-none"
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => navigator.clipboard.writeText(generatedEmail)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">Copy Text</button>
                <button onClick={() => setShowNotifyModal(null)} className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-500/30">Done</button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
