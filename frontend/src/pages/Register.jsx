import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, AlertCircle, Film } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client side checks
    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    
    try {
      await register(username, email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Try a different username/email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="min-h-screen bg-bg-dark relative flex items-center justify-center px-4 py-12 select-none overflow-hidden">
      {/* Background blur circles */}
      <div class="absolute -top-40 -left-40 w-96 h-96 bg-brand-red/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-brand-red/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div class="w-full max-w-md bg-bg-card border border-white/5 p-8 rounded-xl shadow-2xl relative z-10 animate-slide-up">
        {/* Logo */}
        <div class="flex flex-col items-center gap-2 mb-6">
          <div class="flex items-center gap-2 text-brand-red font-extrabold text-2xl tracking-wider">
            <Film class="w-8 h-8 fill-brand-red stroke-2" />
            <span>CINE<span class="text-white font-medium">SUGGEST</span></span>
          </div>
          <p class="text-neutral-400 text-xs">Create your profile to start recommending</p>
        </div>

        {error && (
          <div class="mb-5 p-3.5 bg-brand-red/10 border border-brand-red/20 text-brand-red text-xs rounded-lg flex items-start gap-2.5">
            <AlertCircle class="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} class="space-y-4">
          {/* Username */}
          <div class="space-y-1">
            <label class="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">Username</label>
            <div class="relative flex items-center bg-black/40 border border-neutral-800 focus-within:border-brand-red focus-within:ring-1 focus-within:ring-brand-red rounded-lg transition overflow-hidden">
              <span class="absolute left-3.5 text-neutral-500"><User class="w-4 h-4" /></span>
              <input
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                class="bg-transparent text-white placeholder-neutral-500 text-sm pl-11 pr-4 py-2.5 w-full focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div class="space-y-1">
            <label class="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">Email Address</label>
            <div class="relative flex items-center bg-black/40 border border-neutral-800 focus-within:border-brand-red focus-within:ring-1 focus-within:ring-brand-red rounded-lg transition overflow-hidden">
              <span class="absolute left-3.5 text-neutral-500"><Mail class="w-4 h-4" /></span>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                class="bg-transparent text-white placeholder-neutral-500 text-sm pl-11 pr-4 py-2.5 w-full focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div class="space-y-1">
            <label class="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">Password</label>
            <div class="relative flex items-center bg-black/40 border border-neutral-800 focus-within:border-brand-red focus-within:ring-1 focus-within:ring-brand-red rounded-lg transition overflow-hidden">
              <span class="absolute left-3.5 text-neutral-500"><Lock class="w-4 h-4" /></span>
              <input
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                class="bg-transparent text-white placeholder-neutral-500 text-sm pl-11 pr-4 py-2.5 w-full focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div class="space-y-1">
            <label class="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">Confirm Password</label>
            <div class="relative flex items-center bg-black/40 border border-neutral-800 focus-within:border-brand-red focus-within:ring-1 focus-within:ring-brand-red rounded-lg transition overflow-hidden">
              <span class="absolute left-3.5 text-neutral-500"><Lock class="w-4 h-4" /></span>
              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                class="bg-transparent text-white placeholder-neutral-500 text-sm pl-11 pr-4 py-2.5 w-full focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            class="w-full bg-brand-red hover:bg-brand-dark-red disabled:bg-brand-red/50 text-white font-bold py-3 rounded-lg shadow-lg cursor-pointer hover:shadow-brand-red/10 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Link to login */}
        <div class="text-center mt-6 pt-4 border-t border-white/5 text-sm text-neutral-400">
          <span>Already have an account? </span>
          <Link to="/login" class="text-brand-red hover:underline font-semibold">Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
