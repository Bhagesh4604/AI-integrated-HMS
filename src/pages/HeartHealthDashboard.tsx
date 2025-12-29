import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { Activity, Heart, Smartphone, Wifi, Zap, Phone } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const apiUrl = (endpoint) => {
    const baseUrl = import.meta.env.VITE_API_BASE || 'http://localhost:8080';
    return `${baseUrl}${endpoint}`;
};

const HeartHealthDashboard = () => {
    const { isDarkMode } = useTheme();
    const patientId = 4; // Mock logged-in patient

    const [connected, setConnected] = useState(false);
    const [heartRate, setHeartRate] = useState(72);
    const [spo2, setSpo2] = useState(98);
    const [history, setHistory] = useState([]);
    const [riskScore, setRiskScore] = useState(0);
    const [isSimulationRunning, setIsSimulationRunning] = useState(false);
    const simulationInterval = useRef<any>(null);
    const [bluetoothDevice, setBluetoothDevice] = useState<any>(null);

    useEffect(() => {
        fetchHistory();
        const interval = setInterval(fetchHistory, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch(apiUrl(`/api/monitoring/vitals/history/${patientId}`));
            const data = await res.json();
            if (data.success) {
                const formatted = data.history.map(h => ({
                    time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    hr: h.heart_rate,
                    spo2: h.spo2,
                    risk: h.risk_score
                }));
                setHistory(formatted.slice(-20));
                if (formatted.length > 0) {
                    setRiskScore(formatted[formatted.length - 1].risk);
                }
            }
        } catch (err) {
            console.error("Failed to fetch history", err);
        }
    };

    const toggleSimulation = () => {
        if (isSimulationRunning) {
            clearInterval(simulationInterval.current);
            setIsSimulationRunning(false);
            setConnected(false);
        } else {
            setIsSimulationRunning(true);
            setConnected(true);
            simulationInterval.current = setInterval(() => {
                const newHr = Math.floor(60 + Math.random() * 40) + (Math.random() > 0.9 ? 30 : 0);
                const newSpo2 = Math.floor(95 + Math.random() * 5);
                setHeartRate(newHr);
                setSpo2(newSpo2);

                fetch(apiUrl('/api/monitoring/vitals/sync'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        patient_id: patientId,
                        heart_rate: newHr,
                        spo2: newSpo2,
                        device_id: 1
                    })
                }).then(() => { });

            }, 2000);
        }
    };

    const connectBluetooth = async () => {
        try {
            // Ensure simulation is stopped completely
            if (simulationInterval.current) {
                clearInterval(simulationInterval.current);
                simulationInterval.current = null;
            }
            setIsSimulationRunning(false);

            // @ts-ignore - Web Bluetooth types might be missing
            const device = await navigator.bluetooth.requestDevice({
                filters: [{ services: ['heart_rate'] }]
            });
            const server = await device.gatt.connect();
            const service = await server.getPrimaryService('heart_rate');
            const characteristic = await service.getCharacteristic('heart_rate_measurement');
            await characteristic.startNotifications();
            characteristic.addEventListener('characteristicvaluechanged', handleBluetoothData);
            setBluetoothDevice(device);
            setConnected(true);
            setHeartRate(0); // Reset to 0 until actual data arrives

        } catch (error) {
            console.error('Bluetooth error:', error);
            alert("Could not connect to Bluetooth device. Ensure your watch is in 'Broadcast HR' mode.");
        }
    };

    const handleBluetoothData = (event: any) => {
        const value = event.target.value;
        const flags = value.getUint8(0);
        const rate16Bits = flags & 0x1;
        let bpm;
        if (rate16Bits) {
            bpm = value.getUint16(1, true);
        } else {
            bpm = value.getUint8(1);
        }
        setHeartRate(bpm);

        // Sync to backend real-time
        fetch(apiUrl('/api/monitoring/vitals/sync'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                patient_id: patientId,
                heart_rate: bpm,
                spo2: 98, // Most BLE HR profiles don't send SpO2, default to normal
                device_id: 2 // Real Device ID
            })
        }).catch(console.error);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                        My Heart Health
                    </h1>
                    <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Real-time monitoring & AI cardiac analysis.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={connectBluetooth}
                        className="flex items-center gap-3 px-6 py-3 rounded-2xl font-bold bg-blue-600 text-white shadow-xl hover:bg-blue-700 transition-all"
                    >
                        <Zap size={20} /> Pair Live Device
                    </button>
                    <button
                        onClick={toggleSimulation}
                        className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold transition-all shadow-xl hover:scale-105 active:scale-95 ${connected && isSimulationRunning
                            ? 'bg-green-500/20 text-green-500 border border-green-500/30'
                            : 'bg-white dark:bg-white/10 text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-white/10'
                            }`}
                    >
                        {connected && isSimulationRunning ? <Wifi className="animate-pulse" /> : <Smartphone />}
                        {connected && isSimulationRunning ? 'Simulating...' : 'Start Simulation'}
                    </button>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left: Vitals Cards */}
                <div className="space-y-6">

                    {/* Heart Rate Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className={`relative p-6 rounded-3xl backdrop-blur-xl border shadow-2xl overflow-hidden ${isDarkMode ? 'bg-black/40 border-white/10' : 'bg-white/80 border-white/40'}`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-red-500/20 rounded-2xl text-red-500">
                                <Heart size={32} className={connected ? "animate-pulse" : ""} />
                            </div>
                            {connected && <span className="px-3 py-1 bg-green-500/20 text-green-500 text-xs font-bold rounded-full animate-pulse">LIVE</span>}
                        </div>
                        <div>
                            <span className="text-5xl font-black tracking-tighter text-gray-900 dark:text-white">
                                {connected && heartRate > 0 ? heartRate : '--'}
                            </span>
                            <span className="text-lg text-gray-500 ml-2 font-bold">BPM</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-2">72 BPM avg. resting rate today</p>

                        <div className="absolute bottom-0 left-0 w-full h-16 opacity-20">
                            <svg className="w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
                                <path fill="#ef4444" fillOpacity="1" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,250.7C960,235,1056,181,1152,165.3C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                            </svg>
                        </div>
                    </motion.div>

                    {/* SpO2 Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className={`p-6 rounded-3xl backdrop-blur-xl border shadow-2xl ${isDarkMode ? 'bg-black/40 border-white/10' : 'bg-white/80 border-white/40'}`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-cyan-500/20 rounded-2xl text-cyan-500">
                                <Activity size={32} />
                            </div>
                        </div>
                        <div>
                            <span className="text-5xl font-black tracking-tighter text-gray-900 dark:text-white">
                                {connected ? spo2 : '--'}
                            </span>
                            <span className="text-lg text-gray-500 ml-2 font-bold">%</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-2">Blood Oxygen Saturation</p>
                    </motion.div>

                    {/* AI Risk Analysis */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className={`p-6 rounded-3xl backdrop-blur-xl border shadow-2xl relative overflow-hidden ${riskScore > 50
                            ? 'bg-red-500/10 border-red-500/50'
                            : isDarkMode ? 'bg-black/40 border-white/10' : 'bg-white/80 border-white/40'
                            }`}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <Zap className={riskScore > 50 ? 'text-red-500' : 'text-yellow-500'} />
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">AI Risk Analysis</h3>
                        </div>

                        <div className="flex items-end gap-2 mb-2">
                            <div className="text-4xl font-black text-gray-900 dark:text-white">{riskScore}/100</div>
                            <div className="text-sm font-bold text-gray-500 mb-1">Risk Score</div>
                        </div>

                        <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-2 mb-4">
                            <div
                                className={`h-2 rounded-full transition-all duration-500 ${riskScore > 50 ? 'bg-red-500' : 'bg-green-500'}`}
                                style={{ width: `${riskScore}%` }}
                            ></div>
                        </div>

                        <p className="text-sm text-gray-500 leading-relaxed">
                            {riskScore > 50
                                ? "Warning: Unusual heart variability detected. Dr. Sarah has been notified."
                                : "Your heart rhythm is normal. No irregularities detected in the last hour."}
                        </p>

                        {riskScore > 50 && (
                            <button className="mt-4 w-full py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors flex justify-center items-center gap-2 animate-bounce">
                                <Phone size={18} /> Emergency Contact
                            </button>
                        )}
                    </motion.div>

                </div>

                {/* Right: Real-time Graph */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className={`lg:col-span-2 p-6 rounded-3xl backdrop-blur-xl border shadow-2xl flex flex-col ${isDarkMode ? 'bg-black/40 border-white/10' : 'bg-white/80 border-white/40'}`}
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Live Heart Trace</h3>
                        <div className="flex gap-2">
                            <span className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div> Heart Rate (Live Feed)
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 min-h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={history}>
                                <defs>
                                    <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'} />
                                <XAxis
                                    dataKey="time"
                                    stroke={isDarkMode ? '#64748b' : '#94a3b8'}
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke={isDarkMode ? '#64748b' : '#94a3b8'}
                                    domain={['auto', 'auto']}
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
                                        border: 'none',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                    itemStyle={{ color: isDarkMode ? '#fff' : '#000' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="hr"
                                    stroke="#ef4444"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorHr)"
                                    isAnimationActive={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

            </div>
        </div>
    );
};

export default HeartHealthDashboard;
