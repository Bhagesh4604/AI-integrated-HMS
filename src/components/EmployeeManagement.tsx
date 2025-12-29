import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Eye, Edit2, Trash2, X, Users, UserCog, Stethoscope, Sparkles, CheckCircle, Mail } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import apiUrl from '@/config/api';

// --- Reusable Components (Local for now to match pattern) ---

const Modal = ({ children, onClose, width = "max-w-2xl" }) => (
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
                className={`glass-panel rounded-3xl p-8 w-full ${width} border border-white/10 shadow-2xl relative overflow-hidden text-gray-900 dark:text-white`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative z-10">{children}</div>
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            </motion.div>
        </motion.div>
    </AnimatePresence>
);

const StatCard = ({ title, value, icon: Icon, color, gradient }) => {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="glass-card p-6 rounded-3xl border border-white/20 relative overflow-hidden group"
        >
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
                <Icon size={80} />
            </div>
            <div className="relative z-10">
                <div className={`p-3 rounded-2xl w-fit mb-4 ${gradient} text-white shadow-lg`}>
                    <Icon size={24} />
                </div>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
                <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{value}</p>
            </div>
        </motion.div>
    );
};

// --- Main Employee Management Module ---

export default function EmployeeManagement() {
    const { theme } = useTheme();
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [modal, setModal] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [showWelcomeEmail, setShowWelcomeEmail] = useState(null);
    const [generatedEmail, setGeneratedEmail] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });

    const [newEmployee, setNewEmployee] = useState({
        employeeId: `EMP${Math.floor(1000 + Math.random() * 9000)}`,
        firstName: '', lastName: '', email: '', password: '', phone: '', departmentId: '', position: '', role: 'staff', hireDate: '', salary: '',
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [employeesRes, departmentsRes] = await Promise.all([
                    fetch(apiUrl('/api/employees')),
                    fetch(apiUrl('/api/employees/departments'))
                ]);
                setEmployees(await employeesRes.json() || []);
                setDepartments(await departmentsRes.json() || []);
            } catch (error) {
                console.error("Failed to fetch initial data:", error);
            }
        };
        fetchData();
    }, []);

    const fetchEmployees = async () => {
        try {
            const response = await fetch(apiUrl('/api/employees'));
            setEmployees(await response.json() || []);
        } catch (error) { console.error('Failed to fetch employees:', error); }
    };

    const handleInputChange = (e, formType) => {
        const { name, value } = e.target;
        if (formType === 'new') {
            setNewEmployee(prevState => ({ ...prevState, [name]: value }));
        } else if (selectedEmployee) {
            setSelectedEmployee(prevState => (prevState ? { ...prevState, [name]: value } : null));
        }
    };

    const handleAddEmployee = async (e) => {
        e.preventDefault();
        if (!newEmployee.password) {
            alert("Password is required for new employees.");
            return;
        }
        try {
            const response = await fetch(apiUrl('/api/employees/add'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEmployee),
            });
            const data = await response.json();
            if (data.success) {
                setModal(null);
                fetchEmployees();
                setShowWelcomeEmail(newEmployee);
            } else { alert(data.message); }
        } catch (error) { alert('Failed to connect to the server.'); }
    };

    const handleUpdateEmployee = async (e) => {
        e.preventDefault();
        if (!selectedEmployee) return;
        try {
            const response = await fetch(apiUrl(`/api/employees/${selectedEmployee.id}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(selectedEmployee),
            });
            const data = await response.json();
            if (data.success) {
                setModal(null);
                fetchEmployees();
            } else { alert(data.message); }
        } catch (error) { alert('Failed to connect to server.'); }
    };

    const handleDeleteEmployee = async (employeeId) => {
        try {
            const response = await fetch(apiUrl(`/api/employees/${employeeId}`), { method: 'DELETE' });
            if ((await response.json()).success) {
                fetchEmployees();
            }
        } catch (error) { alert('Failed to connect to server.'); }
        setShowDeleteConfirm(null);
    };

    const handlePasswordDataChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prevState => ({ ...prevState, [name]: value }));
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert("New passwords do not match.");
            return;
        }
        if (!selectedEmployee) return;

        try {
            const response = await fetch(apiUrl(`/api/employees/change-password/${selectedEmployee.id}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(passwordData),
            });
            const data = await response.json();
            if (data.success) {
                setModal(null);
                fetchEmployees();
                alert('Password updated successfully!');
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('Failed to connect to the server.');
        }
    };

    const handleResetPassword = async (newPassword) => {
        if (!selectedEmployee) return;

        try {
            const response = await fetch(apiUrl(`/api/employees/reset-password/${selectedEmployee.id}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: newPassword }),
            });
            const data = await response.json();
            if (data.success) {
                setModal(null);
                alert('Password has been reset successfully!');
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('Failed to connect to the server.');
        }
    };

    const handleGenerateEmail = async (employee) => {
        setIsGenerating(true);
        setGeneratedEmail('');
        const deptName = departments.find(d => d.id == employee.departmentId)?.name || 'their new';
        const systemPrompt = "You are an HR Manager for 'Shree Medicare Hospital'. Your tone is professional, welcoming, and informative.";
        const userQuery = `Draft a welcome/onboarding email for a new employee named ${employee.firstName} ${employee.lastName} who is joining as a ${employee.position} in the ${deptName} department. Their start date is ${new Date(employee.hireDate).toLocaleDateString()}. Include some brief welcome text, a note about what to expect on their first day (like meeting the team), and who their point of contact is.`;

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
            setGeneratedEmail(text || "Could not generate email draft.");
        } catch (error) {
            console.error("Gemini API error:", error);
            setGeneratedEmail("Error connecting to AI service.");
        } finally {
            setIsGenerating(false);
        }
    };


    const openModal = (type, employee = null) => {
        setModal(type);
        if (employee) setSelectedEmployee(JSON.parse(JSON.stringify(employee)));
        if (type === 'add') {
            setNewEmployee({
                employeeId: `EMP${Math.floor(1000 + Math.random() * 9000)}`,
                firstName: '', lastName: '', email: '', password: '', phone: '', departmentId: '', position: '', role: 'staff', hireDate: '', salary: '',
            });
        }
    };

    const filteredEmployees = useMemo(() => employees.filter(e =>
        `${e.firstName} ${e.lastName} ${e.employeeId}`.toLowerCase().includes(searchTerm.toLowerCase())
    ), [employees, searchTerm]);

    const getStatusPill = (status) => {
        switch (status) {
            case 'active': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'inactive': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'on_leave': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
    const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

    return (
        <div className="p-4 md:p-8 font-sans min-h-full">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">Employee Management</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Manage all staff members and their roles.</p>
                    </div>
                    <button onClick={() => openModal('add')} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-blue-500/30 flex items-center gap-2">
                        <Plus size={20} />
                        <span>Add Employee</span>
                    </button>
                </div>
            </motion.div>

            <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" variants={containerVariants} initial="hidden" animate="visible">
                <motion.div variants={itemVariants}><StatCard title="Total Staff" value={employees.length} icon={Users} color="text-blue-500" gradient="bg-gradient-to-br from-blue-500 to-indigo-600" /></motion.div>
                <motion.div variants={itemVariants}><StatCard title="Doctors" value={employees.filter(e => e.role === 'doctor').length} icon={Stethoscope} color="text-green-500" gradient="bg-gradient-to-br from-green-500 to-emerald-600" /></motion.div>
                <motion.div variants={itemVariants}><StatCard title="Departments" value={departments.length} icon={UserCog} color="text-purple-500" gradient="bg-gradient-to-br from-purple-500 to-pink-600" /></motion.div>
            </motion.div>

            <div className="glass-panel rounded-3xl border border-white/20 p-6 shadow-xl overflow-hidden">
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by name or employee ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all text-gray-900 dark:text-white placeholder-gray-500"
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-white/5">
                                <th className="p-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                <th className="p-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Department</th>
                                <th className="p-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                                <th className="p-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="p-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <motion.tbody variants={containerVariants} initial="hidden" animate="visible">
                            {filteredEmployees.map((emp) => (
                                <motion.tr key={emp.id} variants={itemVariants} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                                    <td className="p-4">
                                        <div className="font-bold text-gray-900 dark:text-white">{emp.firstName} {emp.lastName}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{emp.email}</div>
                                    </td>
                                    <td className="p-4 text-gray-600 dark:text-gray-300 font-medium">{emp.departmentName}</td>
                                    <td className="p-4 capitalize text-gray-600 dark:text-gray-300">{emp.role}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusPill(emp.status)}`}>
                                            {emp.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button onClick={() => openModal('details', emp)} className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"><Eye size={18} /></button>
                                            <button onClick={() => openModal('edit', emp)} className="p-2 text-gray-500 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-colors"><Edit2 size={18} /></button>
                                            <button onClick={() => openModal('password', emp)} className="p-2 text-gray-500 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-colors"><UserCog size={18} /></button>
                                            <button onClick={() => setShowDeleteConfirm(emp)} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </motion.tbody>
                    </table>
                    {filteredEmployees.length === 0 && <p className="text-center py-12 text-gray-400 font-medium">No employees found.</p>}
                </div>
            </div>

            {modal && (
                <Modal onClose={() => setModal(null)} width={modal === 'details' ? 'max-w-lg' : 'max-w-2xl'}>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {modal === 'add' && 'Add New Employee'}
                            {modal === 'edit' && 'Edit Employee'}
                            {modal === 'password' && `Change Password for ${selectedEmployee.firstName}`}
                            {modal === 'details' && `${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
                        </h2>
                        <button onClick={() => setModal(null)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-500"><X size={20} /></button>
                    </div>

                    {modal === 'add' && (
                        <form onSubmit={handleAddEmployee}>
                            <div className="grid grid-cols-2 gap-4">
                                <input name="firstName" onChange={(e) => handleInputChange(e, 'new')} placeholder="First Name" className="p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" required />
                                <input name="lastName" onChange={(e) => handleInputChange(e, 'new')} placeholder="Last Name" className="p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" required />
                                <input type="email" name="email" onChange={(e) => handleInputChange(e, 'new')} placeholder="Email" className="p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl col-span-2 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" required />
                                <input type="password" name="password" onChange={(e) => handleInputChange(e, 'new')} placeholder="Password" className="p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl col-span-2 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" required />
                                <select name="departmentId" onChange={(e) => handleInputChange(e, 'new')} className="p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" required>
                                    <option value="">Select Department</option>
                                    {departments.map(d => <option key={d.id} value={d.id} className="text-black">{d.name}</option>)}
                                </select>
                                <input name="position" onChange={(e) => handleInputChange(e, 'new')} placeholder="Position" className="p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" required />
                                <input type="date" name="hireDate" onChange={(e) => handleInputChange(e, 'new')} className="p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" required />
                                <select name="role" value={newEmployee.role} onChange={(e) => handleInputChange(e, 'new')} className="p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" required>
                                    <option value="staff" className="text-black">Staff</option>
                                    <option value="doctor" className="text-black">Doctor</option>
                                    <option value="admin" className="text-black">Admin</option>
                                    <option value="ROLE_DISPATCHER" className="text-black">Dispatcher</option>
                                    <option value="ROLE_PARAMEDIC" className="text-black">Paramedic</option>
                                    <option value="ROLE_ER_STAFF" className="text-black">ER Staff</option>
                                </select>
                                <input name="phone" onChange={(e) => handleInputChange(e, 'new')} placeholder="Phone" className="p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" />
                                <input type="number" name="salary" step="0.01" onChange={(e) => handleInputChange(e, 'new')} placeholder="Salary" className="p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" required />
                            </div>
                            <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-gray-100 dark:border-white/10">
                                <button type="button" onClick={() => setModal(null)} className="px-6 py-2 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all">Add Employee</button>
                            </div>
                        </form>
                    )}
                    {modal === 'edit' && selectedEmployee && (
                        <form onSubmit={handleUpdateEmployee}>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">First Name</label>
                                    <input name="firstName" value={selectedEmployee.firstName} onChange={(e) => handleInputChange(e, 'edit')} className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Last Name</label>
                                    <input name="lastName" value={selectedEmployee.lastName} onChange={(e) => handleInputChange(e, 'edit')} className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Position</label>
                                    <input name="position" value={selectedEmployee.position} onChange={(e) => handleInputChange(e, 'edit')} className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                                    <select name="status" value={selectedEmployee.status} onChange={(e) => handleInputChange(e, 'edit')} className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none">
                                        <option value="active" className="text-black">Active</option>
                                        <option value="inactive" className="text-black">Inactive</option>
                                        <option value="on_leave" className="text-black">On Leave</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-gray-100 dark:border-white/10">
                                <button type="button" onClick={() => setModal(null)} className="px-6 py-2 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 shadow-lg shadow-green-500/30 transition-all">Save Changes</button>
                            </div>
                        </form>
                    )}
                    {modal === 'password' && selectedEmployee && (
                        <form onSubmit={handlePasswordChange}>
                            <div className="grid grid-cols-1 gap-4">
                                <input type="password" name="oldPassword" onChange={handlePasswordDataChange} placeholder="Old Password" value={passwordData.oldPassword} className="p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" required />
                                <input type="password" name="newPassword" onChange={handlePasswordDataChange} placeholder="New Password" value={passwordData.newPassword} className="p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" required />
                                <input type="password" name="confirmPassword" onChange={handlePasswordDataChange} placeholder="Confirm New Password" value={passwordData.confirmPassword} className="p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" required />
                            </div>
                            <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-gray-100 dark:border-white/10">
                                <button type="button" onClick={() => setModal(null)} className="px-6 py-2 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 shadow-lg shadow-green-500/30 transition-all">Update Password</button>
                            </div>
                        </form>
                    )}
                    {modal === 'details' && selectedEmployee && (
                        <div>
                            <div className="space-y-4 text-gray-600 dark:text-gray-300">
                                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Position</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedEmployee.position}</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Department</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedEmployee.departmentName}</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Email</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedEmployee.email}</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Status</p>
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getStatusPill(selectedEmployee.status)}`}>
                                        {selectedEmployee.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/10">
                                <button onClick={() => {
                                    const newPassword = prompt('Enter new password for the employee:');
                                    if (newPassword) {
                                        handleResetPassword(newPassword);
                                    }
                                }} className="w-full py-3 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-xl font-bold hover:bg-red-500/20 transition-colors">
                                    Reset Password (Admin Override)
                                </button>
                            </div>
                        </div>
                    )}
                </Modal>
            )}

            {showDeleteConfirm && (
                <Modal onClose={() => setShowDeleteConfirm(null)} width="max-w-md">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-red-500">Confirm Deletion</h2>
                        <button onClick={() => setShowDeleteConfirm(null)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-500"><X size={20} /></button>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">Are you sure you want to delete employee <span className="font-bold text-gray-900 dark:text-white">{showDeleteConfirm.firstName} {showDeleteConfirm.lastName}</span>?</p>
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={() => setShowDeleteConfirm(null)} className="px-6 py-2 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">Cancel</button>
                        <button type="button" onClick={() => handleDeleteEmployee(showDeleteConfirm.id)} className="px-6 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all">Delete</button>
                    </div>
                </Modal>
            )}

            {showWelcomeEmail && (
                <Modal onClose={() => setShowWelcomeEmail(null)} width="max-w-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><CheckCircle className="text-green-500" /> Employee Added!</h2>
                        <button onClick={() => setShowWelcomeEmail(null)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-500"><X size={20} /></button>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">Use the AI assistant to generate a welcome email for <span className="font-bold text-gray-900 dark:text-white">{showWelcomeEmail.firstName}</span>.</p>
                    {!generatedEmail && !isGenerating && (
                        <button onClick={() => handleGenerateEmail(showWelcomeEmail)} className="w-full py-4 font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2">
                            <Sparkles size={20} /> Generate Onboarding Email
                        </button>
                    )}
                    {isGenerating && (
                        <div className="text-center py-10">
                            <Sparkles className="animate-spin text-blue-500 mx-auto mb-4" size={32} />
                            <p className="text-blue-500 font-bold animate-pulse">AI is drafting an email...</p>
                        </div>
                    )}
                    {generatedEmail && (
                        <div className="space-y-4">
                            <textarea value={generatedEmail} onChange={(e) => setGeneratedEmail(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white h-72 resize-none focus:ring-2 focus:ring-blue-500/50 outline-none" />
                            <div className="flex justify-end gap-4">
                                <button onClick={() => navigator.clipboard.writeText(generatedEmail)} className="px-6 py-2 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">Copy Text</button>
                                <button onClick={() => setShowWelcomeEmail(null)} className="px-6 py-2 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 shadow-lg shadow-green-500/30 transition-all">Done</button>
                            </div>
                        </div>
                    )}
                </Modal>
            )}
        </div>
    );
}
