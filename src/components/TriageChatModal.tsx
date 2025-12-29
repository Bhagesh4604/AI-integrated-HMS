import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import MedicalDisclaimerBanner from './MedicalDisclaimerBanner';

// In a real app, this would be in a separate config file
import apiUrl from '@/config/api';

export default function TriageChatModal({ onClose }) {
  const [messages, setMessages] = useState([
    { from: 'ai', text: 'Hello! I am your AI Symptom Checker. Please describe your symptoms, and I can suggest the right department for you.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  const { isListening, startListening, stopListening } = useSpeechRecognition({
    commandMode: false,
    onResult: (text) => setInput(prev => prev + ' ' + text)
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { from: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
      const response = await fetch(apiUrl('/api/triage/ask'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: input }),
      });
      const data = await response.json();
      const aiMessage = { from: 'ai', text: data.reply };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage = { from: 'ai', text: 'Sorry, I am having trouble connecting. Please try again later.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const TypingIndicator = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start"
    >
      <div className="p-3 rounded-2xl bg-gray-800 flex items-center space-x-1.5">
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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 font-sans p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        className="bg-white/90 dark:bg-black/80 backdrop-blur-2xl rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl w-full max-w-lg flex flex-col h-[80vh] max-h-[700px] overflow-hidden"
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-white/10 bg-white/50 dark:bg-black/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <Sparkles className="text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Symptom Checker</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-gray-50/50 dark:bg-transparent">
          <MedicalDisclaimerBanner />
          <AnimatePresence>
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                layout
                className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${msg.from === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-bl-none'
                    }`}
                  dangerouslySetInnerHTML={{ __html: msg.text }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && <TypingIndicator />}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 bg-white dark:bg-black/40 border-t border-gray-200 dark:border-white/10">
          <div className="flex gap-2 items-center bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-full p-2 pl-4 transition-all focus-within:ring-2 focus-within:ring-blue-500/50">
            <motion.button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse shadow-red-500/50 shadow-lg' : 'text-gray-400 hover:text-gray-600 dark:hover:text-white'}`}
            >
              <Mic size={20} />
            </motion.button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Describe symptoms..."
              className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none text-sm"
              disabled={isLoading}
            />
            <motion.button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-blue-600 text-white p-2.5 rounded-full flex items-center justify-center disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
            >
              <Send size={18} />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}