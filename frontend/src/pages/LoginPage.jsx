import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import GlassCard from '../components/GlassCard';

const LoginPage = () => {
  const { login } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const nextPath = searchParams.get('next') || searchParams.get('redirect') || '/dashboard';
  const registerLink = `/register${location.search}`;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      setLoading(false);
      navigate(nextPath);
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Invalid login credentials.');
    }
  };

  const autofill = (type) => {
    if (type === 'student') {
      setEmail('student@cbtify.ai');
      setPassword('password');
    } else {
      setEmail('school@cbtify.ai');
      setPassword('password');
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center px-4 py-16 bg-[#101010]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <span className="text-3xl font-black tracking-[-0.08em] text-white">
              CBTi<span className="text-lime-300"> f y. a i</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-[#f7f7f4]">Welcome back</h2>
          <p className="text-sm text-zinc-400 mt-1">Sign in to your account to continue</p>
        </div>

        <GlassCard className="p-8 border border-white/10 shadow-2xl">
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@institution.edu"
                  className="w-full pl-10 pr-4 py-3 bg-[#1c1c1c] border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-lime-300 focus:border-lime-300 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Password</label>
                <Link to="/forgot-password" className="text-xs text-zinc-400 hover:text-lime-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-[#1c1c1c] border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-lime-300 focus:border-lime-300 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 rounded-full bg-lime-300 text-zinc-950 text-sm font-bold hover:bg-lime-200 active:scale-95 disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-3 font-semibold">Demo Credentials</span>
            <div className="flex justify-center gap-2.5">
              <button
                type="button"
                onClick={() => autofill('student')}
                className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-300 hover:border-lime-300/40 hover:text-lime-300 hover:bg-lime-300/5 transition-all"
              >
                Student Demo
              </button>
              <button
                type="button"
                onClick={() => autofill('org')}
                className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-300 hover:border-lime-300/40 hover:text-lime-300 hover:bg-lime-300/5 transition-all"
              >
                Institute Demo
              </button>
            </div>
          </div>
        </GlassCard>

        <p className="text-center text-sm text-zinc-400 mt-6">
          Don't have an account?{' '}
          <Link to={registerLink} className="text-lime-300 font-semibold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
