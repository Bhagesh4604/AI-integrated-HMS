import React, { useState } from 'react';
import { X, ExternalLink, Code2, Copyright } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AboutModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    const libraries = [
        { name: 'React', license: 'MIT', url: 'https://reactjs.org' },
        { name: 'Lucide React', license: 'ISC', url: 'https://lucide.dev' },
        { name: 'Framer Motion', license: 'MIT', url: 'https://www.framer.com/motion/' },
        { name: 'Tailwind CSS', license: 'MIT', url: 'https://tailwindcss.com' },
        { name: 'Azure AI SDKs', license: 'MIT', url: 'https://github.com/Azure/azure-sdk-for-js' },
        { name: 'MySQL2', license: 'MIT', url: 'https://github.com/sidorares/node-mysql2' }
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Copyright size={20} className="text-blue-400" />
                            About & Data Privacy
                        </h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">

                        <section>
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Open Source Attribution</h3>
                            <p className="text-sm text-gray-300 mb-4">
                                This project allows you to manage healthcare data securely. We gratefully acknowledge the following open-source libraries used in this application:
                            </p>
                            <div className="space-y-2">
                                {libraries.map((lib, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-gray-800/50 p-3 rounded-lg border border-gray-700 hover:border-blue-500/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Code2 size={16} className="text-blue-400" />
                                            <span className="text-gray-200 font-medium">{lib.name}</span>
                                        </div>
                                        <a href={lib.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-400">
                                            {lib.license} <ExternalLink size={12} />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4">
                            <h3 className="text-sm font-bold text-blue-200 mb-2">Imagine Cup Compliance</h3>
                            <ul className="list-disc list-inside text-xs text-blue-200/80 space-y-1">
                                <li>Your data is processed locally or via secure Azure endpoints.</li>
                                <li>AI analysis is for demonstration purposes only.</li>
                                <li>No real patient data is shared without consent.</li>
                            </ul>
                        </section>

                        <div className="text-center pt-4 border-t border-gray-800">
                            <p className="text-xs text-gray-500">
                                Imagine Cup 2026 Entry - Team Antigravity
                            </p>
                        </div>

                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
