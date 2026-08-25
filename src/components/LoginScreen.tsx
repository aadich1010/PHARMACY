import React, { useState } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { ShieldCheck, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';

/**
 * Full-screen sign-in gate shown by <App/> whenever there is no authenticated
 * user. On success the PharmacyContext stores the session token and loads the
 * user's data; failures surface as a toast (handled inside login()).
 */
export const LoginScreen: React.FC = () => {
  const { login } = usePharmacy();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    await login(email.trim(), password);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#eef2f3] text-[#1e293b] flex items-center justify-center font-sans relative overflow-hidden px-4">
      {/* Ambient background orbs (match main app aesthetic) */}
      <div className="fixed -top-24 -left-24 w-96 h-96 bg-cyan-200/40 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="fixed top-1/3 -right-24 w-80 h-80 bg-blue-200/40 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed -bottom-12 left-1/3 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 mb-3">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-black text-cyan-950 tracking-tight">PharmaCentral</h1>
          <p className="text-sm text-slate-500 mt-1">Multi-Tenant Pharmacy Platform</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl shadow-xl shadow-cyan-900/5 p-7"
        >
          <h2 className="text-lg font-bold text-slate-800 mb-1">Sign in to your account</h2>
          <p className="text-xs text-slate-500 mb-6">Enter your email and password to continue.</p>

          {/* Email */}
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
          <div className="relative mb-4">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@pharmacy.com"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/80 border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400"
            />
          </div>

          {/* Password */}
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
          <div className="relative mb-6">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-white/80 border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting || !email || !password}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-bold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-[11px] text-slate-400 mt-5">
          Secure access • Role-based permissions
        </p>
      </div>
    </div>
  );
};
