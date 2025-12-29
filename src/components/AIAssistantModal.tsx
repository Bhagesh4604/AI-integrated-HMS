import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, FileText, ListChecks, Mic } from 'lucide-react';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import MedicalDisclaimerBanner from './MedicalDisclaimerBanner';

// In a real app, these would be in separate files
import apiUrl from '@/config/api';

// --- Main AI Assistant Modal ---
export default function AIAssistantModal({ onClose, records = [], labResults = [], prescriptions = [], patientName = '' }) {
    const [input, setInput] = useState('Summarize this patient\'s history and suggest potential next steps.');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef(null);

    const { isListening, startListening, stopListening } = useSpeechRecognition({
        commandMode: false,
        onResult: (text) => setInput(prev => prev + ' ' + text)
    });

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const summary = useMemo(() => {
        const lines = [];
        if (records.length) {
            const recent = records.slice().sort((a, b) => new Date(b.recordDate || '').getTime() - new Date(a.recordDate || '').getTime())[0];
            if (recent) lines.push(`Recent diagnosis: ${recent.diagnosis || 'N/A'}`);
        }
        if (labResults.length) {
            const recentLab = labResults.slice().sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime())[0];
            if (recentLab) lines.push(`Latest lab result: ${recentLab.testName || 'Lab'} — status: ${recentLab.status || 'unknown'}`);
        }
        if (prescriptions.length) {
            const meds = prescriptions.map(p => p.notes).slice(0, 2).join(', ');
            if (meds) lines.push(`Prescriptions: ${meds}`);
        }
        if (!lines.length) lines.push('No recent medical history found.');
        return lines;
    }, [records, labResults, prescriptions]);

    async function handleSend(e) {
        if (e) e.preventDefault();
        if (!input.trim() || loading) return;

        const context = `Patient Name: ${patientName}\nSummary:\n- ${summary.join('\n- ')}`;
        const userMessage = { role: 'user', content: input };
        const systemMessage = { role: 'system', content: `Here is the patient's summary for context:\n${context}` };

        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch(apiUrl('/api/ai/ask'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [systemMessage, ...newMessages] }),
            });
            const data = await res.json();
            const replyText = String(data.reply || 'Sorry, I could not process that request.');
            setMessages([...newMessages, { role: 'assistant', content: replyText }]);
        } catch (err) {
            console.error('AI assistant fetch error', err);
            setMessages([...newMessages, { role: 'assistant', content: 'Error: Could not connect to the AI service.' }]);
        } finally {
            setLoading(false);
        }
    }

    const TypingIndicator = () => (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
        >
            <div className="p-3 rounded-2xl bg-gray-700 flex items-center space-x-1.5">
                <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }} className="w-2 h-2 bg-gray-500 rounded-full" />
                <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: 0.1 }} className="w-2 h-2 bg-gray-500 rounded-full" />
                <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }} className="w-2 h-2 bg-gray-500 rounded-full" />
            </div>
        </motion.div>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 font-sans"
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20, opacity: 0 }}
                className="bg-black/50 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl w-full max-w-4xl flex flex-col h-[90vh] max-h-[800px] text-white"
            >
                <div className="flex justify-between items-center p-6 border-b border-white/10 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <Sparkles className="text-blue-400" />
                        <h2 className="text-xl font-bold">AI Assistant — {patientName || 'Patient'}</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 flex gap-6 overflow-hidden p-6">
                    {/* Left Panel: Summary */}
                    <div className="w-1/3 flex flex-col gap-6">
                        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                            <h3 className="font-semibold text-white flex items-center gap-2 mb-2"><FileText size={16} /> Patient Summary</h3>
                            <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                                {summary.map((l, i) => <li key={i}>{l}</li>)}
                            </ul>
                        </div>
                        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                            <h3 className="font-semibold text-white flex items-center gap-2 mb-2"><ListChecks size={16} /> Quick Prompts</h3>
                            <div className="flex flex-col gap-2">
                                <button onClick={() => setInput('Summarize patient history.')} className="text-sm text-left p-2 bg-gray-700/50 hover:bg-gray-700 rounded">Summarize history</button>
                                <button onClick={() => setInput('What are the potential risks based on the summary?')} className="text-sm text-left p-2 bg-gray-700/50 hover:bg-gray-700 rounded">Identify risks</button>
                                <button onClick={() => setInput('Draft a follow-up plan.')} className="text-sm text-left p-2 bg-gray-700/50 hover:bg-gray-700 rounded">Draft follow-up plan</button>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Chat */}
                    <div className="w-2/3 flex flex-col bg-gray-900/50 rounded-xl border border-gray-700">
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            <MedicalDisclaimerBanner />
                            <AnimatePresence>
                                {messages.map((msg, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        layout
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-md p-3 rounded-2xl text-white ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-700'}`}
                                            dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br />') }}
                                        />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {loading && <TypingIndicator />}
                            <div ref={chatEndRef} />
                        </div>
                        <form onSubmit={handleSend} className="p-4 border-t border-gray-700">
                            <div className="flex gap-3 items-center bg-gray-800 border border-gray-600 rounded-full p-2">
                                <motion.button
                                    type="button"
                                    onClick={isListening ? stopListening : startListening}
                                    className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <Mic size={20} />
                                </motion.button>
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask the AI Assistant..."
                                    className="flex-1 bg-transparent px-3 text-white placeholder:text-gray-500 focus:outline-none"
                                    disabled={loading}
                                />
                                <motion.button
                                    type="submit"
                                    disabled={loading}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="bg-blue-600 text-white p-2.5 rounded-full flex items-center justify-center disabled:bg-gray-600 disabled:cursor-not-allowed"
                                >
                                    <Send size={20} />
                                </motion.button>
                            </div>
                        </form>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}