import React, { useEffect, useState } from 'react';
import { ShieldCheck, Clock, User, Fingerprint } from 'lucide-react';
import { motion } from 'framer-motion';
import apiUrl from '../config/api';

interface AccessLog {
    index: number;
    timestamp: string;
    hash: string;
    previousHash: string;
    data: {
        patientId: string;
        doctorId: string;
        action: string;
    };
}

export default function AccessHistory({ patientId }: { patientId: string }) {
    const [logs, setLogs] = useState<AccessLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await fetch(apiUrl(`/api/blockchain/history/${patientId}`));
                const data = await response.json();
                if (data.success) {
                    // Reverse to show newest first
                    setLogs([...data.chain].reverse());
                }
            } catch (error) {
                console.error("Failed to fetch blockchain history", error);
            } finally {
                setLoading(false);
            }
        };

        if (patientId) {
            fetchHistory();
        }
    }, [patientId]);

    if (loading) return <div className="p-4 text-gray-400">Loading immutable records...</div>;

    if (logs.length === 0) return <div className="p-4 text-gray-500">No access history found on the ledger.</div>;

    return (
        <div className="bg-[#1C1C1E] rounded-2xl border border-gray-800 p-6 font-sans">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
                <div className="p-2 bg-green-500/10 rounded-lg">
                    <ShieldCheck className="text-green-400" size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Trust Layer: Access History</h2>
                    <p className="text-sm text-gray-400">Immutable ledger verified by Blockchain</p>
                </div>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                {logs.map((log) => (
                    <motion.div
                        key={log.hash}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 hover:border-blue-500/30 transition-colors"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2 text-blue-400 font-medium">
                                <User size={16} />
                                <span>{log.data.doctorId}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500 text-xs">
                                <Clock size={14} />
                                <span>{new Date(log.timestamp).toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="text-gray-300 text-sm mb-3">
                            <span className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-400 mr-2 uppercase tracking-wide">Action</span>
                            {log.data.action}
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-gray-600 font-mono bg-black/20 p-2 rounded truncate">
                            <Fingerprint size={12} className="shrink-0" />
                            <span className="truncate w-full" title={log.hash}>Hash: {log.hash}</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
