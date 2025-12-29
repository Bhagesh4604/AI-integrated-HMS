import React, { useState } from 'react';
import { Upload, X, FileText, CheckCircle, Loader2, AlertCircle, Activity, Utensils, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiUrl from '../config/api';

interface UploadReportProps {
    onClose: () => void;
    onSave: (data: any) => void;
}

export default function UploadReport({ onClose, onSave }: UploadReportProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [healthPlan, setHealthPlan] = useState<any>(null);
    const [generatingPlan, setGeneratingPlan] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
            setResult(null);
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;

        setIsAnalyzing(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(apiUrl('/api/ai/analyze-document'), {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Analysis failed: ${response.statusText}`);
            }

            const data = await response.json();
            setResult(data);
        } catch (err: any) {
            setError(err.message || "Failed to analyze document");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
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
                    className="bg-[#1C1C1E] rounded-2xl w-full max-w-2xl border border-gray-700 shadow-2xl text-white overflow-hidden flex flex-col max-h-[90vh]"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Upload className="text-blue-500" />
                            Upload & Analyze Report
                        </h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto custom-scrollbar">
                        {!result ? (
                            <div className="space-y-6">
                                <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-blue-500/50 transition-colors bg-gray-800/20">
                                    <input
                                        type="file"
                                        id="report-upload"
                                        className="hidden"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleFileChange}
                                    />
                                    <label htmlFor="report-upload" className="cursor-pointer flex flex-col items-center">
                                        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 text-blue-400">
                                            {file ? <FileText size={32} /> : <Upload size={32} />}
                                        </div>
                                        {file ? (
                                            <div>
                                                <p className="font-semibold text-white text-lg">{file.name}</p>
                                                <p className="text-gray-400 text-sm mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="font-semibold text-white text-lg">Click to upload or drag and drop</p>
                                                <p className="text-gray-400 text-sm mt-1">PDF, JPG, PNG (Max 10MB)</p>
                                            </div>
                                        )}
                                    </label>
                                </div>

                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
                                        <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
                                        <p className="text-red-200">{error}</p>
                                    </div>
                                )}

                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={handleAnalyze}
                                        disabled={!file || isAnalyzing}
                                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-xl transition-all flex items-center gap-2"
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <Loader2 className="animate-spin" /> Analyzing...
                                            </>
                                        ) : (
                                            <>
                                                <FileText /> Extract Data
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 text-green-400 bg-green-500/10 p-4 rounded-xl border border-green-500/20">
                                    <CheckCircle size={24} />
                                    <div>
                                        <p className="font-bold">Analysis Complete</p>
                                        <p className="text-sm opacity-80">Extracted data from {file?.name}</p>
                                    </div>
                                </div>

                                {!healthPlan && (
                                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                                        <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Raw Extracted Text</h3>
                                        <div className="text-gray-300 text-sm whitespace-pre-wrap max-h-40 overflow-y-auto p-2 bg-black/20 rounded">
                                            {result.text}
                                        </div>
                                    </div>
                                )}

                                {healthPlan && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                        <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 p-5 rounded-xl">
                                            <div className="flex items-center gap-2 mb-3">
                                                <BrainCircuit className="text-indigo-400" />
                                                <h3 className="text-lg font-bold text-indigo-100">AI Wellness Analysis</h3>
                                            </div>
                                            <p className="text-indigo-200/80 italic mb-4">"{healthPlan.summary}"</p>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="bg-black/20 p-4 rounded-lg">
                                                    <div className="flex items-center gap-2 text-green-400 mb-2 font-semibold">
                                                        <Utensils size={16} /> Nutrition Plan
                                                    </div>
                                                    <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                                                        {healthPlan.diet?.map((item: string, i: number) => <li key={i}>{item}</li>)}
                                                    </ul>
                                                </div>
                                                <div className="bg-black/20 p-4 rounded-lg">
                                                    <div className="flex items-center gap-2 text-blue-400 mb-2 font-semibold">
                                                        <Activity size={16} /> Lifestyle Goals
                                                    </div>
                                                    <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                                                        {healthPlan.lifestyle?.map((item: string, i: number) => <li key={i}>{item}</li>)}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Responsible AI Section */}
                                        <div className="mt-4 pt-4 border-t border-indigo-500/30">
                                            <h4 className="text-sm font-bold text-indigo-300 mb-2">Suggested Questions for your Doctor:</h4>
                                            <ul className="list-disc list-inside text-sm text-gray-400 mb-4">
                                                {healthPlan.questions?.map((q: string, i: number) => <li key={i}>{q}</li>)}
                                            </ul>
                                            <div className="bg-indigo-950/50 p-3 rounded-lg border border-indigo-500/20 flex gap-2">
                                                <AlertCircle className="text-indigo-400 shrink-0" size={16} />
                                                <p className="text-xs text-indigo-200 opacity-80">{healthPlan.disclaimer || "AI-generated results. Consult a medical professional for diagnosis."}</p>
                                            </div>
                                        </div>

                                    </motion.div>
                                )}

                                <div className="flex justify-between items-center pt-4 border-t border-gray-800">
                                    <button
                                        onClick={() => { setResult(null); setHealthPlan(null); }}
                                        className="px-6 py-2.5 rounded-xl font-semibold bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                                    >
                                        Start Over
                                    </button>

                                    <div className="flex gap-3">
                                        {!healthPlan && (
                                            <button
                                                onClick={async () => {
                                                    setGeneratingPlan(true);
                                                    try {
                                                        const res = await fetch(apiUrl('/api/ai/generate-health-plan'), {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ reportText: result.text })
                                                        });
                                                        setHealthPlan(await res.json());
                                                    } catch (e) {
                                                        console.error(e);
                                                    } finally {
                                                        setGeneratingPlan(false);
                                                    }
                                                }}
                                                disabled={generatingPlan}
                                                className="px-6 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {generatingPlan ? <Loader2 className="animate-spin" /> : <BrainCircuit size={18} />}
                                                Generate Health Plan
                                            </button>
                                        )}
                                        {healthPlan && (
                                            <button
                                                onClick={() => onSave({ ...result, healthPlan })}
                                                className="px-6 py-2.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
                                            >
                                                Save to Records
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence >
    );
}
