import React, { useState, useEffect } from 'react';
import { ArrowLeft, HeartPulse } from 'lucide-react';
import { motion } from 'framer-motion';


import apiUrl from '@/config/api';

export default function PatientLogin({ onLogin, setAuthMode, setLoginPortal }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      // Simulate network delay for UI feedback
      await new Promise(resolve => setTimeout(resolve, 500)); 
      const response = await fetch(apiUrl('/api/auth/patient/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.success) {
        onLogin(data.patient);
      } else {
        setError(data.message || 'Invalid credentials. Please try again.');
      }
    } catch (error) {
      console.error('Patient login error', error);
      setError('Failed to connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        staggerChildren: 0.1,
        duration: 0.4,
        ease: "easeOut"
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 },
    },
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-cover bg-center text-white font-sans overflow-hidden" style={{ backgroundImage: "url('/login-bg.jpg')" }}>
      {/* Darkening Overlay */}
      <div className="absolute inset-0 bg-black/60 z-0"></div>


      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        onClick={() => setLoginPortal(null)}
        className="absolute left-4 flex items-center gap-2 text-gray-300 hover:text-white transition-colors z-20"
        style={{ top: 'env(safe-area-inset-top, 3rem)' }}
      >
        <ArrowLeft size={20} /> Back to Portal Selection
      </motion.button>

      {/* Login Card */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md mx-4 sm:mx-0 p-6 sm:p-8 space-y-6 bg-black/20 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl"
      >
        <motion.div variants={itemVariants} className="text-center">
          <div className="inline-block bg-gray-800/50 p-3 rounded-full mb-4 border border-white/10">
            <HeartPulse className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold text-white">Patient Portal</h2>
          <p className="text-gray-300 mt-2 text-base">Sign in to access your health dashboard.</p>
        </motion.div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div variants={itemVariants}>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 text-white border border-white/10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-500"
              required
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 text-white border border-white/10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-500"
              required
            />
          </motion.div>

          {error && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-400 text-center"
              >
                {error}
              </motion.p>
          )}

          <motion.div variants={itemVariants}>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-3 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </motion.div>

          <motion.div variants={itemVariants} className="text-center">
            <p className="text-base text-gray-400">
              <button type="button" onClick={() => setAuthMode('forgot_password')} className="font-medium text-blue-400 hover:underline">
                Forgot Password?
              </button>
            </p>
          </motion.div>
          <motion.div variants={itemVariants} className="text-center">
            <p className="text-base text-gray-400">
              Don't have an account?{' '}
              <button type="button" onClick={() => setAuthMode('register')} className="font-medium text-blue-400 hover:underline">
                Sign Up
              </button>
            </p>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}