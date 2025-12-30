import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, AlertTriangle, Activity, Gauge, MapPin, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import apiUrl from '../config/api';

const IoTDeviceSimulator = () => {
    const [speed, setSpeed] = useState([60]);
    const [status, setStatus] = useState('Normal'); // Normal, Unconscious, Critical
    const [isConnected, setIsConnected] = useState(true);
    const [logs, setLogs] = useState<string[]>([]);
    const [isSimulating, setIsSimulating] = useState(false);

    const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

    const handleSimulateCrash = async () => {
        setIsSimulating(true);
        addLog("⚠️ CRASH DETECTED via Accelerometer! High G-Force Impact.");

        if (status === 'Unconscious') {
            addLog("⚠️ Driver Status: UNCONSCIOUS (No Heartbeat/Response).");
            addLog("📡 Initiating Protocol: AUTOMATIC DISPATCH.");
        }

        // Demo Coordinates (Bangalore)
        const demoLat = 12.9716;
        const demoLon = 77.5946;

        try {
            addLog("📡 Connecting to Central EMS Server...");
            const response = await fetch(apiUrl('/api/ems/patient/receive-iot-alert'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    latitude: demoLat,
                    longitude: demoLon,
                    speed: speed[0],
                    status: status,
                    deviceId: "IOT-CAR-XYA-12",
                }),
            });
            const data = await response.json();

            if (data.success) {
                addLog(`✅ ALERT RECEIVED by Server. Trip ID: ${data.trip_id}`);
                addLog(`🚑 Ambulance Dispatch Request Sent.`);
            } else {
                addLog(`❌ Server Error: ${data.message}`);
            }

        } catch (error) {
            addLog(`❌ CONNECTION FAILED: ${error}`);
        } finally {
            setIsSimulating(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 font-mono relative overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:30px_30px]"></div>

            <div className="max-w-4xl mx-auto relative z-10 flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/50">
                            <Activity className="text-blue-400 w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">IoT Edge Simulator</h1>
                            <p className="text-xs text-gray-500">Connected Vehicle Sensor Array • v2.4.0</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                        <span className="text-xs font-bold text-green-400">{isConnected ? 'ONLINE' : 'OFFLINE'}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Control Panel */}
                    <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2"><Settings size={18} /> Vehicle Telemetry</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Speed Control */}
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400 flex items-center gap-2"><Gauge size={14} /> Vehicle Speed</span>
                                    <span className="font-bold text-cyan-400">{speed[0]} km/h</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="200"
                                    value={speed[0]}
                                    onChange={(e) => setSpeed([parseInt(e.target.value)])}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                />
                            </div>

                            {/* Driver Status */}
                            <div className="space-y-3">
                                <label className="text-sm text-gray-400 block">Driver Biometrics</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full bg-black/40 border border-gray-700 text-white rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="Normal">🟢 Normal (Heart Rate: 72bpm)</option>
                                    <option value="Stressed">🟡 Stressed (Heart Rate: 110bpm)</option>
                                    <option value="Unconscious">🔴 Unconscious (No Response)</option>
                                    <option value="Critical">☠️ Critical (Cardiac Arrest)</option>
                                </select>
                            </div>

                            {/* Simulate Button */}
                            <Button
                                onClick={handleSimulateCrash}
                                disabled={isSimulating}
                                className={`w-full h-16 text-lg font-bold transition-all duration-300 ${status === 'Unconscious' || status === 'Critical'
                                        ? 'bg-red-600 hover:bg-red-700 shadow-[0_0_20px_rgba(220,38,38,0.5)] animate-pulse'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {isSimulating ? "Transmitting..." : "💥 SIMULATE CRASH"}
                            </Button>
                            <p className="text-xs text-center text-gray-500">
                                {status === 'Unconscious' ? "Automatic Alert will be triggered immediately." : "Manual confirmation would typically be requested first."}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Console Output */}
                    <Card className="bg-black/80 border-gray-800 font-mono text-xs overflow-hidden flex flex-col h-[400px]">
                        <CardHeader className="bg-gray-900/50 py-3 border-b border-gray-800">
                            <CardTitle className="text-gray-400 text-sm">System Logs</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 overflow-y-auto flex-1 space-y-2">
                            {logs.length === 0 && <span className="text-gray-600 italic">Waiting for event...</span>}
                            <AnimatePresence>
                                {logs.map((log, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="border-l-2 border-cyan-500/30 pl-2 text-cyan-100/80"
                                    >
                                        {log}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default IoTDeviceSimulator;
