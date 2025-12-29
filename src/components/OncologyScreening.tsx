import React, { useState } from 'react';
import { Upload, X, FileText, Activity, AlertTriangle, CheckCircle, Search, Microscope, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiUrl from '../config/api';

export default function OncologyScreening() {
    const [file, setFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

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
            const response = await fetch(apiUrl('/api/ai/analyze-oncology'), {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `Analysis failed: ${response.statusText}`);
            }

            const data = await response.json();
            setResult(data);
        } catch (err: any) {
            setError(err.message || "Failed to analyze document");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getRiskStyles = (level: string) => {
        switch (level?.toLowerCase()) {
            case 'critical': return 'bg-red-500/10 border-red-500/50 text-red-500';
            case 'high': return 'bg-orange-500/10 border-orange-500/50 text-orange-500';
            case 'medium': return 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500';
            case 'low': return 'bg-green-500/10 border-green-500/50 text-green-500';
            default: return 'bg-gray-500/10 border-gray-500/50 text-gray-400';
        }
    };

    return (
        <div className="p-6 h-full flex flex-col font-sans text-gray-900 dark:text-white">
            {/* Header */}
            <div className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-violet-900/20 to-fuchsia-900/20 border border-violet-500/20 backdrop-blur-xl flex items-center justify-between shadow-xl">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-violet-600 rounded-xl shadow-lg shadow-violet-600/20">
                            <Microscope className="text-white" size={24} />
                        </div>
                        <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">
                            AI Oncology Screener
                        </h1>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium ml-1">
                        Advanced Tumor Marker Detection & Risk Assessment
                    </p>
                </div>
                <div className="hidden md:block">
                    <div className="flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full text-violet-400 text-sm font-bold">
                        <Info size={16} /> Powered by Azure AI
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">

                {/* Left: Upload Area */}
                <div className="flex flex-col gap-6">
                    <div className={`flex-1 border-2 border-dashed rounded-3xl p-8 transition-all flex flex-col items-center justify-center text-center relative overflow-hidden group ${file ? 'border-violet-500/50 bg-violet-500/5' : 'border-gray-300 dark:border-gray-700 hover:border-violet-500/30 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                        <input
                            type="file"
                            id="oncology-upload"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                        />
                        <label htmlFor="oncology-upload" className="cursor-pointer flex flex-col items-center justify-center w-full h-full z-10">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${file ? 'bg-violet-500/20 text-violet-400' : 'bg-gray-100 dark:bg-white/10 text-gray-400'}`}>
                                {file ? <FileText size={40} /> : <Upload size={40} />}
                            </div>
                            {file ? (
                                <div>
                                    <p className="font-bold text-xl mb-2">{file.name}</p>
                                    <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    <button
                                        onClick={(e) => { e.preventDefault(); setFile(null); setResult(null); }}
                                        className="mt-4 px-4 py-2 bg-red-500/10 text-red-500 rounded-lg text-sm font-bold hover:bg-red-500/20 transition-colors"
                                    >
                                        Remove File
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <p className="font-bold text-xl mb-2">Upload Report / MRI Scan</p>
                                    <p className="text-sm text-gray-500 max-w-xs mx-auto">Support for PDF, JPG, PNG. Optimized for Biopsy & Radiology reports.</p>
                                </div>
                            )}
                        </label>

                        {/* 3D Decorative Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>

                    {file && !result && (
                        <div className="flex justify-center">
                            <button
                                onClick={handleAnalyze}
                                disabled={isAnalyzing}
                                className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-violet-600/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                        Analyzing Patterns...
                                    </>
                                ) : (
                                    <>
                                        <Search size={24} /> Start Screening
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500">
                            <AlertTriangle size={24} />
                            <p className="font-medium">{error}</p>
                        </div>
                    )}
                </div>

                {/* Right: Results Area */}
                <div className="relative">
                    <AnimatePresence mode="wait">
                        {result ? (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="h-full flex flex-col gap-6"
                            >
                                {/* Risk Card */}
                                <div className={`p-6 rounded-3xl border-2 shadow-2xl backdrop-blur-md ${getRiskStyles(result.riskLevel)}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-sm font-bold uppercase tracking-widest opacity-70">Assessed Risk Level</p>
                                            <h2 className="text-4xl font-black mt-1 uppercase tracking-tight">{result.riskLevel}</h2>
                                        </div>
                                        <div className="px-4 py-2 bg-black/10 rounded-xl font-bold text-sm">
                                            {result.confidence}% Confidence
                                        </div>
                                    </div>
                                    <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-current transition-all duration-1000"
                                            style={{ width: `${result.confidence}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Findings */}
                                <div className="flex-1 bg-white/50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-lg overflow-y-auto">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <Activity size={20} className="text-violet-500" />
                                        Key Findings
                                    </h3>
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {result.findings?.map((finding: string, i: number) => (
                                            <span key={i} className="px-3 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-300 rounded-lg text-sm font-semibold">
                                                {finding}
                                            </span>
                                        ))}
                                    </div>

                                    <h3 className="text-lg font-bold mb-2">Summary</h3>
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                                        {result.summary}
                                    </p>

                                    <h3 className="text-lg font-bold mb-2">Recommendations</h3>
                                    <ul className="space-y-3">
                                        {result.recommendations?.map((rec: string, i: number) => (
                                            <li key={i} className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
                                                <CheckCircle size={18} className="text-green-500 mt-1 shrink-0" />
                                                <span>{rec}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Disclaimer */}
                                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-500/80 flex items-start gap-2">
                                    <Info size={14} className="mt-0.5 shrink-0" />
                                    {result.disclaimer}
                                </div>

                            </motion.div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white/30 dark:bg-white/5 border border-dashed border-gray-300 dark:border-gray-700 rounded-3xl">
                                <div className="w-24 h-24 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 text-gray-300 dark:text-gray-600">
                                    <Microscope size={48} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-400 dark:text-gray-500">No Analysis Results Yet</h3>
                                <p className="text-gray-400 text-sm mt-2 max-w-xs">Upload a medical report to perform AI Screening.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

            </div>
        </div>
    );
}
