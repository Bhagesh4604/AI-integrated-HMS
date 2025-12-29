import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { AnimatedLogin } from './AnimatedLogin';
import apiUrl from '@/config/api';

export default function PatientLogin({ onLogin, setAuthMode }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // Slight delay for animation feel
      const response = await fetch(apiUrl('/api/auth/patient/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.success) {
        onLogin(data.patient);
      } else {
        setError(data.message || 'Invalid credentials.');
      }
    } catch (error) {
      console.error('Patient login error', error);
      setError('Connection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatedLogin
      title="Patient Portal"
      description="Access your medical records and appointments safely."
      onSubmit={handleSubmit}
      isLoading={isLoading}
    >
      <div className="space-y-4">
        {/* Email Input */}
        <div className="group relative">
          <label className="block text-xs font-medium text-cyan-100/60 mb-1 ml-1 uppercase tracking-wider">Email Address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-cyan-400/50 group-focus-within:text-cyan-400 transition-colors" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-transparent transition-all backdrop-blur-sm"
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="group relative">
          <label className="block text-xs font-medium text-cyan-100/60 mb-1 ml-1 uppercase tracking-wider">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-cyan-400/50 group-focus-within:text-cyan-400 transition-colors" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-transparent transition-all backdrop-blur-sm"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => setAuthMode('forgot_password')}
            className="text-sm text-cyan-300 hover:text-cyan-200 transition-colors font-medium"
          >
            Forgot Password?
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('register')}
            className="text-sm text-cyan-300 hover:text-cyan-200 transition-colors font-medium"
          >
            Create Account
          </button>
        </div>
      </div>
    </AnimatedLogin>
  );
}