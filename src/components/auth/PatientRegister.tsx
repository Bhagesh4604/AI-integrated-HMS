import React, { useState } from 'react';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';

// In a real app, this would be in a separate config file
import apiUrl from '@/config/api';

export default function PatientRegister({ setAuthMode, setLoginPortal }) {
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '', contact: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(formData.contact)) {
        setError('Please enter a valid contact number in the format +911234567890.');
        return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
      const response = await fetch(apiUrl('/api/auth/patient/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        alert('Registration successful! Please log in.');
        setAuthMode('login');
      } else {
        setError(data.message || 'Registration failed. Please try again.');
        console.error('Registration failed:', data);
      }
    } catch (error) {
      console.error('Patient register error', error);
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
    <div className="relative flex items-center justify-center h-screen bg-cover bg-center text-white font-sans overflow-hidden" style={{ backgroundImage: "url('/login-bg.jpg')" }}>
      {/* Darkening Overlay */}
      <div className="absolute inset-0 bg-black/60 z-0"></div>

      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        onClick={() => setLoginPortal(null)}
        className="absolute top-8 left-8 flex items-center gap-2 text-gray-300 hover:text-white transition-colors z-20"
      >
        <ArrowLeft size={20} /> Back to Portal Selection
      </motion.button>

      {/* Registration Card */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md p-8 space-y-6 bg-black/20 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl"
      >
        <motion.div variants={itemVariants} className="text-center">
          <div className="inline-block bg-gray-800/50 p-3 rounded-full mb-4 border border-white/10">
            <UserPlus className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-white">Create Account</h2>
          <p className="text-gray-400 mt-2">Join Shree Medicare today.</p>
        </motion.div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                <input name="firstName" onChange={handleInputChange} placeholder="First Name" className="w-full px-4 py-3 bg-white/5 text-white border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all placeholder:text-gray-500" required />
                <input name="lastName" onChange={handleInputChange} placeholder="Last Name" className="w-full px-4 py-3 bg-white/5 text-white border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all placeholder:text-gray-500" required />
            </motion.div>
            <motion.div variants={itemVariants}>
                <input name="email" type="email" onChange={handleInputChange} placeholder="Email Address" className="w-full px-4 py-3 bg-white/5 text-white border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all placeholder:text-gray-500" required />
            </motion.div>
            <motion.div variants={itemVariants}>
                <input name="contact" type="tel" onChange={handleInputChange} placeholder="Contact Number (e.g., +911234567890)" className="w-full px-4 py-3 bg-white/5 text-white border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all placeholder:text-gray-500" required />
            </motion.div>
            <motion.div variants={itemVariants}>
                <input name="password" type="password" onChange={handleInputChange} placeholder="Password" className="w-full px-4 py-3 bg-white/5 text-white border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all placeholder:text-gray-500" required />
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
              className="w-full px-4 py-3 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Account...' : 'Register'}
            </button>
          </motion.div>
          <motion.div variants={itemVariants} className="text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <button type="button" onClick={() => setAuthMode('login')} className="font-medium text-green-400 hover:underline">
                Sign In
              </button>
            </p>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}