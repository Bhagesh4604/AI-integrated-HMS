import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Activity, TestTube, Thermometer, CheckCircle, Clock, Sparkles, Upload, FileText, AlertTriangle } from 'lucide-react';
import UploadReport from './UploadReport';
import { useTheme } from '../context/ThemeContext';
import apiUrl from '../config/api';

// --- Reusable Components (Inline for simplicity, but ideally shared) ---

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
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
            <div className={`p-2 rounded-xl ${color.replace('text-', 'bg-')}/10`}>
                <Icon className={`w-5 h-5 ${color}`} />
            </div>
        </div>
        <div className="mt-3 relative z-10">
            <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">{value}</p>
        </div>
    </motion.div>
);

export default function LaboratoryModule() {
    const { theme } = useTheme(); // Kept for logic if needed, but relying on CSS classes
    const [activeTab, setActiveTab] = useState('tests');
    const [labTests, setLabTests] = useState([]);
    const [patients, setPatients] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [showSummaryModal, setShowSummaryModal] = useState(null);
    const [generatedSummary, setGeneratedSummary] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [showResultModal, setShowResultModal] = useState(null);
    const [resultText, setResultText] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);

    const [newTest, setNewTest] = useState({
        testNumber: `LAB${Math.floor(1000 + Math.random() * 9000)}`,
        patientId: '',
        testName: '',
        testDate: '',
    });

    useEffect(() => {
        if (activeTab === 'tests') {
            fetchLabTests();
            fetchPatients();
        }
    }, [activeTab]);

    const fetchLabTests = async () => {
        try {
            const response = await fetch(apiUrl('/api/laboratory/tests'));
            setLabTests(await response.json() || []);
        } catch (error) { console.error('Failed to fetch lab tests:', error); }
    };

    const fetchPatients = async () => {
        try {
            const response = await fetch(apiUrl('/api/patients'));
            setPatients(await response.json() || []);
        } catch (error) { console.error('Failed to fetch patients:', error); }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewTest(prevState => ({ ...prevState, [name]: value }));
    };

    const handleAddTest = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(apiUrl('/api/laboratory/tests/add'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTest),
            });
            const data = await response.json();
            if (data.success) {
                setShowAddModal(false);
                fetchLabTests();
            } else {
                alert(data.message);
            }
        } catch (error) { alert('Failed to connect to server.'); }
    };

    const handleUpdateStatus = async (test, newStatus) => {
        if (newStatus === 'completed') {
            setShowResultModal(test);
            setResultText(test.result_text || '');
        } else {
            try {
                const response = await fetch(apiUrl(`/api/laboratory/tests/${test.id}`), {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus }),
                });
                const data = await response.json();
                if (data.success) fetchLabTests(); else alert(data.message);
            } catch (error) { alert('Failed to connect to server.'); }
        }
    };

    const handleSaveResult = async () => {
        if (!showResultModal) return;
        try {
            const response = await fetch(apiUrl(`/api/laboratory/tests/${showResultModal.id}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'completed', result_text: resultText }),
            });
            const data = await response.json();
            if (data.success) {
                setShowResultModal(null);
                fetchLabTests();
            } else alert(data.message);
        } catch (error) { alert('Failed to connect to server.'); }
    };

    const handleDeleteTest = async (testId) => {
        try {
            const response = await fetch(apiUrl(`/api/laboratory/tests/${testId}`), { method: 'DELETE' });
            if ((await response.json()).success) fetchLabTests(); else alert('Failed to delete');
        } catch (error) { alert('Failed to connect to server.'); }
        setShowDeleteConfirm(null);
    };

    const handleSaveReport = async (data) => {
        console.log("Saving report data:", data);
        const newTestPayload = {
            testNumber: `AI-${Math.floor(1000 + Math.random() * 9000)}`,
            patientId: 1, // Defaulting to first patient
            testName: 'AI Analyzed Report',
            testDate: new Date().toISOString().split('T')[0]
        };

        try {
            const createRes = await fetch(apiUrl('/api/laboratory/tests/add'), {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTestPayload),
            });
            if (!(await createRes.json()).success) throw new Error("Failed to create test entry");

            const testsRes = await fetch(apiUrl('/api/laboratory/tests'));
            const createdTest = (await testsRes.json())[0];

            const updateRes = await fetch(apiUrl(`/api/laboratory/tests/${createdTest.id}`), {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'completed', result_text: data.text, ai_analysis_json: data.healthPlan }),
            });

            if (updateRes.ok) {
                alert("Report and AI Health Plan saved successfully!");
                setShowUploadModal(false);
                fetchLabTests();
            } else throw new Error("Failed to save results");

        } catch (error) {
            console.error(error);
            alert("Error saving report: " + error.message);
        }
    };

    const handleGenerateSummary = async (test) => {
        setIsGenerating(true); setGeneratedSummary('');
        const systemPrompt = "You are a helpful medical assistant. Explain what a lab test is for in simple, clear, and reassuring terms. Keep it to 2-3 sentences.";
        const userQuery = `Explain what a "${test.testName}" test is used for.`;

        try {
            const response = await fetch(apiUrl('/api/ai/ask'), {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userQuery }] }),
            });
            if (!response.ok) throw new Error(`API error: ${response.status}`);
            setGeneratedSummary((await response.json()).reply || "Could not generate summary.");
        } catch (error) {
            console.error("AI API error:", error);
            setGeneratedSummary("Error connecting to AI service.");
        } finally { setIsGenerating(false); }
    };

    const getStatusPill = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
    const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };
    const tabs = ['tests', 'results', 'vitals', 'equipment'];

    return (
        <div className="p-4 md:p-8 font-sans min-h-full">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-300">Laboratory</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Manage lab tests, results, and equipment.</p>
                    </div>
                    <div className="flex gap-3">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2">
                            <Plus size={20} /> New Test
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowUploadModal(true)} className="glass-card bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold px-5 py-2.5 rounded-xl border border-purple-500/20 flex items-center gap-2">
                            <Upload size={20} /> Upload Report
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            <motion.div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" variants={containerVariants} initial="hidden" animate="visible">
                <motion.div variants={itemVariants}><StatCard title="Total Tests" value={labTests.length} icon={TestTube} color="text-blue-500" /></motion.div>
                <motion.div variants={itemVariants}><StatCard title="Pending" value={labTests.filter(t => t.status === 'pending').length} icon={Clock} color="text-yellow-500" /></motion.div>
                <motion.div variants={itemVariants}><StatCard title="Completed" value={labTests.filter(t => t.status === 'completed').length} icon={CheckCircle} color="text-green-500" /></motion.div>
                <motion.div variants={itemVariants}><StatCard title="Equipment Active" value="28" icon={Thermometer} color="text-orange-500" /></motion.div>
            </motion.div>

            <div className="glass-panel rounded-3xl border border-white/20 overflow-hidden shadow-xl">
                <div className="p-2 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
                    <div className="flex space-x-2 relative">
                        {tabs.map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all z-10 ${activeTab === tab ? 'text-blue-600 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                        <motion.div layoutId="activeLabTab" className="absolute h-full w-1/4 bg-white dark:bg-white/10 shadow-sm rounded-xl" transition={{ type: 'spring', stiffness: 300, damping: 30 }} animate={{ x: `${tabs.indexOf(activeTab) * 100}%` }} />
                    </div>
                </div>

                <div className="p-6 min-h-[400px]">
                    <AnimatePresence mode="wait">
                        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            {activeTab === 'tests' && (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead><tr className="border-b border-gray-100 dark:border-white/10"><th className="p-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Test #</th><th className="p-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Patient</th><th className="p-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Test Name</th><th className="p-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th><th className="p-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th><th className="p-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th></tr></thead>
                                        <motion.tbody variants={containerVariants} initial="hidden" animate="visible">
                                            {labTests.map(test => (
                                                <motion.tr key={test.id} variants={itemVariants} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                    <td className="p-4"><span className="font-bold text-blue-600 dark:text-blue-400">{test.testNumber}</span></td>
                                                    <td className="p-4 font-bold text-gray-700 dark:text-gray-200">{test.patientName || '—'}</td>
                                                    <td className="p-4 font-medium text-gray-600 dark:text-gray-300">{test.testName}</td>
                                                    <td className="p-4 text-sm text-gray-500">{new Date(test.testDate).toLocaleDateString()}</td>
                                                    <td className="p-4">
                                                        <select value={test.status} onChange={(e) => handleUpdateStatus(test, e.target.value)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border outline-none appearance-none transition-colors cursor-pointer ${getStatusPill(test.status)}`}>
                                                            <option value="pending" className="text-black">Pending</option>
                                                            <option value="completed" className="text-black">Completed</option>
                                                        </select>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center justify-end space-x-2">
                                                            <button onClick={() => { setShowSummaryModal(test); setGeneratedSummary(''); }} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/20 rounded-lg transition-colors" title="Explain with AI"><Sparkles size={18} /></button>
                                                            <button onClick={() => setShowDeleteConfirm(test)} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </motion.tbody>
                                    </table>
                                    {labTests.length === 0 && <div className="text-center py-20 text-gray-400">No lab tests found.</div>}
                                </div>
                            )}
                            {activeTab !== 'tests' && (<div className="text-center py-20"><Activity className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" /><p className="text-gray-500">Module under construction.</p></div>)}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Modals updated with glass styles via the Modal component wrapper */}
            {showAddModal && (
                <Modal onClose={() => setShowAddModal(false)}>
                    <form onSubmit={handleAddTest} className="space-y-4">
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 mb-6">Schedule New Lab Test</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">TEST ID</label>
                                <input name="testNumber" value={newTest.testNumber} className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl" disabled />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">PATIENT</label>
                                <select name="patientId" onChange={handleInputChange} className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white" required>
                                    <option value="">Select Patient</option>
                                    {patients.map(p => <option key={p.id} value={p.id} className="text-black">{p.firstName} {p.lastName}</option>)}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">TEST NAME</label>
                                <input name="testName" onChange={handleInputChange} placeholder="E.g. Full Blood Count" className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400" required />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">DATE</label>
                                <input type="date" name="testDate" onChange={handleInputChange} className="w-full p-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white" required />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-6">
                            <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">Cancel</button>
                            <button type="submit" className="px-6 py-2.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">Add Test</button>
                        </div>
                    </form>
                </Modal>
            )}

            {showDeleteConfirm && (
                <Modal onClose={() => setShowDeleteConfirm(null)} width="max-w-md">
                    <div className="flex flex-col items-center text-center">
                        <div className="p-4 bg-red-500/10 rounded-full text-red-500 mb-4"><AlertTriangle size={32} /></div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Confirm Deletion</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">Are you sure you want to delete <span className="text-gray-900 dark:text-white font-bold">"{showDeleteConfirm.testName}"</span>? This action cannot be undone.</p>
                        <div className="flex gap-3 w-full">
                            <button type="button" onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">Cancel</button>
                            <button type="button" onClick={() => handleDeleteTest(showDeleteConfirm.id)} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30">Delete</button>
                        </div>
                    </div>
                </Modal>
            )}

            {showSummaryModal && (
                <Modal onClose={() => setShowSummaryModal(null)} width="max-w-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500"><Sparkles size={24} /></div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Test Explainer</h2>
                            <p className="text-sm text-gray-500">Simplify medical terms for patients.</p>
                        </div>
                    </div>

                    {!generatedSummary && !isGenerating && (
                        <button onClick={() => handleGenerateSummary(showSummaryModal)} className="w-full py-4 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 transition-transform hover:scale-105 active:scale-95">
                            <Sparkles size={20} /> Generate Explanation
                        </button>
                    )}

                    {isGenerating && (
                        <div className="py-12 flex flex-col items-center justify-center text-gray-500">
                            <Sparkles className="animate-spin mb-2 text-indigo-500" />
                            <p className="animate-pulse">Consulting medical AI...</p>
                        </div>
                    )}

                    {generatedSummary && (
                        <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-6">
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">"{generatedSummary}"</p>
                            <div className="flex justify-end gap-3 mt-6">
                                <button onClick={() => navigator.clipboard.writeText(generatedSummary)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">Copy</button>
                                <button onClick={() => setShowSummaryModal(null)} className="px-6 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 shadow-lg shadow-green-500/30">Done</button>
                            </div>
                        </div>
                    )}
                </Modal>
            )}

            {showResultModal && (
                <Modal onClose={() => setShowResultModal(null)}>
                    <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Enter Lab Result</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">Patient: <span className="font-bold text-gray-900 dark:text-white">{showResultModal.patientName}</span></p>
                    <textarea
                        value={resultText}
                        onChange={(e) => setResultText(e.target.value)}
                        className="w-full p-4 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white h-48 resize-none focus:ring-2 focus:ring-blue-500/50 outline-none"
                        placeholder="Enter lab result details here..."
                        autoFocus
                    />
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setShowResultModal(null)} className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">Cancel</button>
                        <button type="button" onClick={handleSaveResult} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">Save Result</button>
                    </div>
                </Modal>
            )}

            {showUploadModal && <UploadReport onClose={() => setShowUploadModal(false)} onSave={handleSaveReport} />}
        </div>
    );
}
