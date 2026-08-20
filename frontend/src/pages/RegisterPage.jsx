import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { User, Mail, Lock, Building, AlertCircle, ArrowRight } from 'lucide-react';
import GlassCard from '../components/GlassCard';

const RegisterPage = () => {
  const { register } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const nextPath = searchParams.get('next') || searchParams.get('redirect') || '/dashboard';
  const loginLink = `/login${location.search}`;

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [organizationName, setOrganizationName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !email || !password) {
      setError('Please fill in all standard credentials.');
      return;
    }
    if (role === 'organization' && !organizationName) {
      setError('Please specify your Institution / School name.');
      return;
    }

    setLoading(true);
    try {
      await register(username, email, password, role, organizationName);
      setLoading(false);
      navigate(nextPath);
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Error creating account. Please try again.');
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
          <h2 className="text-2xl font-bold tracking-tight text-[#f7f7f4]">Create your account</h2>
          <p className="text-sm text-zinc-400 mt-1">Get started with AI-powered assessment generation</p>
        </div>

        <GlassCard className="p-8 border border-white/10 shadow-2xl">
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Role selector */}
          <div className="flex rounded-full bg-[#1c1c1c] p-1 border border-white/10 mb-6">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`flex-1 py-2 text-xs font-bold rounded-full transition-all ${
                role === 'student'
                  ? 'bg-lime-300 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Student / Learner
            </button>
            <button
              type="button"
              onClick={() => setRole('organization')}
              className={`flex-1 py-2 text-xs font-bold rounded-full transition-all ${
                role === 'organization'
                  ? 'bg-lime-300 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Institution / School
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Full Name / Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  className="w-full pl-10 pr-4 py-3 bg-[#1c1c1c] border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-lime-300 focus:border-lime-300 transition-colors"
                />
              </div>
            </div>

            {role === 'organization' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Institution / Academy Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="e.g. Stanford Prep Academy"
                    className="w-full pl-10 pr-4 py-3 bg-[#1c1c1c] border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-lime-300 focus:border-lime-300 transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-[#1c1c1c] border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-lime-300 focus:border-lime-300 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-[#1c1c1c] border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-lime-300 focus:border-lime-300 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 rounded-full bg-lime-300 text-zinc-950 text-sm font-bold hover:bg-lime-200 active:scale-95 disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Creating account...' : 'Create Free Account'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </GlassCard>

        <p className="text-center text-sm text-zinc-400 mt-6">
          Already have an account?{' '}
          <Link to={loginLink} className="text-lime-300 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
