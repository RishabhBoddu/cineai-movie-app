import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertCircle, Film } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect to page requested before auth, or home
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email/username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="min-h-screen bg-bg-dark relative flex items-center justify-center px-4 py-12 select-none overflow-hidden">
      {/* Dynamic Background Accents */}
      <div class="absolute -top-40 -left-40 w-96 h-96 bg-brand-red/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-brand-red/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div class="w-full max-w-md bg-bg-card border border-white/5 p-8 rounded-xl shadow-2xl relative z-10 animate-slide-up">
        {/* Logo */}
        <div class="flex flex-col items-center gap-2 mb-8">
          <div class="flex items-center gap-2 text-brand-red font-extrabold text-2xl tracking-wider">
            <Film class="w-8 h-8 fill-brand-red stroke-2" />
            <span>CINE<span class="text-white font-medium">SUGGEST</span></span>
          </div>
          <p class="text-neutral-400 text-xs">Access your custom recommendations</p>
        </div>

        {error && (
          <div class="mb-5 p-3.5 bg-brand-red/10 border border-brand-red/20 text-brand-red text-xs rounded-lg flex items-start gap-2.5">
            <AlertCircle class="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} class="space-y-5">
          {/* Email/Username Field */}
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">Username or Email</label>
            <div class="relative flex items-center bg-black/40 border border-neutral-800 focus-within:border-brand-red focus-within:ring-1 focus-within:ring-brand-red rounded-lg transition overflow-hidden">
              <span class="absolute left-3.5 text-neutral-500"><Mail class="w-4 h-4" /></span>
              <input
                type="text"
                placeholder="Enter username or email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                class="bg-transparent text-white placeholder-neutral-500 text-sm pl-11 pr-4 py-3 w-full focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div class="space-y-1.5">
            <div class="flex justify-between items-center">
              <label class="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">Password</label>
            </div>
            <div class="relative flex items-center bg-black/40 border border-neutral-800 focus-within:border-brand-red focus-within:ring-1 focus-within:ring-brand-red rounded-lg transition overflow-hidden">
              <span class="absolute left-3.5 text-neutral-500"><Lock class="w-4 h-4" /></span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                class="bg-transparent text-white placeholder-neutral-500 text-sm pl-11 pr-4 py-3 w-full focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            class="w-full bg-brand-red hover:bg-brand-dark-red disabled:bg-brand-red/50 text-white font-bold py-3 rounded-lg shadow-lg cursor-pointer hover:shadow-brand-red/10 transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Navigation to Register */}
        <div class="text-center mt-6 pt-4 border-t border-white/5 text-sm text-neutral-400">
          <span>New to CineSuggest? </span>
          <Link to="/register" class="text-brand-red hover:underline font-semibold">Sign Up Now</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
