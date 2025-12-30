import React, { useState } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

import apiUrl from '@/config/api';

export default function ForgotPassword({ setAuthMode }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);
    try {
      const response = await fetch(apiUrl('/api/auth/patient/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (data.success) {
        setMessage(data.message);
      } else {
        setError(data.message || 'Failed to send password reset email.');
      }
    } catch (error) {
      setError('Failed to connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-cover bg-center text-white font-sans overflow-hidden" style={{ backgroundImage: "url('/login-bg.jpg')" }}>
      <div className="absolute inset-0 bg-black/60 z-0"></div>

      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        onClick={() => setAuthMode('login')}
        className="absolute top-12 left-4 flex items-center gap-2 text-gray-300 hover:text-white transition-colors z-20"
      >
        <ArrowLeft size={20} /> Back to Login
      </motion.button>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md mx-4 sm:mx-0 p-8 space-y-6 bg-black/20 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl"
      >
        <div className="text-center">
          <div className="inline-block bg-gray-800/50 p-3 rounded-full mb-4 border border-white/10">
            <Mail className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold text-white">Forgot Password</h2>
          <p className="text-gray-300 mt-2 text-base">Enter your email to receive a password reset link.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 text-white border border-white/10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-500"
              required
            />
          </div>

          {message && <p className="text-sm text-green-400 text-center">{message}</p>}
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-3 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
        </form>
      </motion.div>

      <p className="absolute bottom-8 text-center text-gray-400 text-sm">
        Shree Medicare Management System &copy; 2026
      </p>
    </div>
  );
}
