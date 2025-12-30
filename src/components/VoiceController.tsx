import React, { useEffect, useState } from 'react';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import { Mic, MicOff, Move } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VoiceController() {
    // Now using the Global Azure-Powered Hook
    const { isListening, transcript, startListening, stopListening, agentSpeaking } = useSpeechRecognition();
    const [connectionStatus, setConnectionStatus] = useState<"connecting" | "online" | "offline">("connecting");

    useEffect(() => {
        // Check Health Check Logic
        fetch('/api/health/ai-status')
            .then(res => res.json())
            .then(data => {
                if (data.services.speech) {
                    setConnectionStatus("online");
                } else {
                    console.warn("Speech Service not configured.");
                    setConnectionStatus("offline");
                }
            })
            .catch(() => setConnectionStatus("offline"));
    }, []);

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    return (
        <motion.div
            drag
            dragMomentum={false}
            className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2"
        >
            <AnimatePresence>
                {transcript && isListening && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-black/80 backdrop-blur text-white px-4 py-2 rounded-lg text-sm mb-2 pointer-events-none"
                    >
                        "{transcript}"
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Draggable Handle / Button Wrapper */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onPointerDown={(e) => e.stopPropagation()} // Prevent drag when clicking button? Actually drag works fine with button usually.
                onClick={toggleListening}
                className={`p-4 rounded-full shadow-lg transition-colors flex items-center justify-center relative ${isListening
                        ? 'bg-red-500 text-white animate-pulse shadow-red-500/50'
                        : agentSpeaking
                            ? 'bg-purple-600 text-white animate-bounce shadow-purple-500/50' // AI Speaking
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/50 cursor-move'
                    }`}
                title="Azure AI Voice Control (Drag to Move)"
            >
                {agentSpeaking ? (
                    <div className="flex gap-1">
                        <span className="w-1 h-3 bg-white animate-bounce" />
                        <span className="w-1 h-3 bg-white animate-bounce delay-75" />
                    </div>
                ) : isListening ? (
                    <Mic className="w-6 h-6" />
                ) : (
                    <MicOff className="w-6 h-6" />
                )}

                {/* Status Indicator Dot */}
                <div
                    className={`absolute top-0 right-0 w-3 h-3 rounded-full border-2 border-white ${connectionStatus === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                        }`}
                />
            </motion.button>
        </motion.div>
    );
}
