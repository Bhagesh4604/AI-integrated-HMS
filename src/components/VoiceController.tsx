import React from 'react';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import { Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VoiceController() {
    const { isListening, transcript, startListening } = useSpeechRecognition();

    if (!(window as any).webkitSpeechRecognition && !(window as any).SpeechRecognition) {
        return null; // Hide if browser doesn't support
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
            <AnimatePresence>
                {transcript && isListening && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-black/80 backdrop-blur text-white px-4 py-2 rounded-lg text-sm mb-2"
                    >
                        "{transcript}"
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={startListening}
                className={`p-4 rounded-full shadow-lg transition-colors ${isListening
                        ? 'bg-red-500 text-white animate-pulse shadow-red-500/50'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/50'
                    }`}
                title="Voice Control (Press to Speak)"
            >
                {isListening ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </motion.button>
        </div>
    );
}
