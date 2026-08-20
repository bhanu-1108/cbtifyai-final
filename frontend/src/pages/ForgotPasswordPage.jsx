import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Mail, CheckCircle, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import GlassCard from '../components/GlassCard';

const ForgotPasswordPage = () => {
  const { forgotPassword } = useApp();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      try {
        forgotPassword(email);
        setLoading(false);
        setSuccess('We have sent password recovery instructions to your email address.');
      } catch (err) {
        setLoading(false);
        setError('No account found with this email.');
      }
    }, 1000);
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
          <h2 className="text-2xl font-bold tracking-tight text-[#f7f7f4]">Reset password</h2>
          <p className="text-sm text-zinc-400 mt-1">Enter your email address to receive reset instructions</p>
        </div>

        <GlassCard className="p-8 border border-white/10 shadow-2xl">
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2.5 p-3.5 mb-6 rounded-xl bg-lime-300/15 border border-lime-300/30 text-lime-300 text-xs font-semibold">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-lime-300 text-zinc-950 text-sm font-bold hover:bg-lime-200 active:scale-95 disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Sending link...' : 'Send Recovery Link'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-lime-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to sign in</span>
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
