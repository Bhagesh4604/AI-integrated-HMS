import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export default function useSpeechRecognition({ commandMode = true, onResult = (text: string) => { } } = {}) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);

        recognition.onresult = (event: any) => {
            const text = event.results[0][0].transcript.toLowerCase();
            setTranscript(text);
            if (onResult) onResult(text);
            if (commandMode) {
                handleCommand(text);
            }
        };

        if (isListening) {
            recognition.start();
        } else {
            recognition.stop();
        }

        return () => recognition.stop();
    }, [isListening]);

    const startListening = useCallback(() => setIsListening(true), []);
    const stopListening = useCallback(() => setIsListening(false), []);

    const handleCommand = (text: string) => {
        console.log("Voice Command:", text);

        // Navigation Commands
        if (text.includes('dashboard') || text.includes('home')) navigate('/');
        if (text.includes('patient') || text.includes('patients')) navigate('/patients');
        if (text.includes('staff') || text.includes('doctor')) navigate('/staff');
        if (text.includes('lab') || text.includes('laboratory')) navigate('/laboratory');
        if (text.includes('pharmacy')) navigate('/pharmacy');

        // Action Commands
        if (text.includes('scroll down')) window.scrollBy({ top: 500, behavior: 'smooth' });
        if (text.includes('scroll up')) window.scrollBy({ top: -500, behavior: 'smooth' });
    };

    return { isListening, transcript, startListening, stopListening };
}
