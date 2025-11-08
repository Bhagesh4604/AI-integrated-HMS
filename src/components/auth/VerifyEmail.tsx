import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MailCheck } from 'lucide-react';
import apiUrl from '@/config/api';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function VerifyEmail() {
  const query = useQuery();
  const navigate = useNavigate();
  const token = query.get('token');

  const [message, setMessage] = useState('Verifying your email...');
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await fetch(apiUrl(`/api/auth/patient/verify-email?token=${token}`), {
          method: 'GET',
        });
        const data = await response.json();
        if (data.success) {
          setMessage(data.message);
          setTimeout(() => {
            navigate('/');
          }, 3000);
        } else {
          setError(data.message || 'Failed to verify email.');
        }
      } catch (error) {
        console.error('Email verification fetch error:', error);
        setError('Failed to connect to the server.');
      }
    };

    if (token) {
      verifyEmail();
    }
  }, [token, navigate]);

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-cover bg-center text-white font-sans overflow-hidden" style={{ backgroundImage: "url('/login-bg.jpg')" }}>
      <div className="absolute inset-0 bg-black/60 z-0"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md mx-4 sm:mx-0 p-8 space-y-6 bg-black/20 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl"
      >
        <div className="text-center">
          <div className="inline-block bg-gray-800/50 p-3 rounded-full mb-4 border border-white/10">
            <MailCheck className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-white">Email Verification</h2>
          {message && <p className="text-lg text-green-400 mt-4">{message}</p>}
          {error && <p className="text-lg text-red-400 mt-4">{error}</p>}
        </div>
      </motion.div>
    </div>
  );
}
