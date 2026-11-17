import { Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import type { UserProfile } from '../types.ts';

interface AuthViewProps {
  onSuccess: (profile: UserProfile) => void;
}

export function AuthView({ onSuccess }: AuthViewProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'register' && !fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const profile =
        mode === 'login'
          ? await login(email.trim(), password)
          : await register(email.trim(), password, fullName.trim());
      onSuccess(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="max-w-md mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="rounded-2xl border border-[#EFE1EA] bg-white p-6 sm:p-8">
        <div className="mb-6">
          <p className="text-xs font-medium text-[#8B5E78] mb-1">ChikiSel Account</p>
          <h1 className="font-display text-2xl font-semibold text-[#2B1D26]">
            {mode === 'login' ? 'Welcome back' : 'Create your snack account'}
          </h1>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-[#F6ECF2] rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              mode === 'login' ? 'bg-white text-[#2B1D26] shadow-xs' : 'text-[#6E5A67]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              mode === 'register' ? 'bg-white text-[#2B1D26] shadow-xs' : 'text-[#6E5A67]'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-[#F3C6D4] bg-[#FFF2F6] px-4 py-3 text-xs text-[#9D2954]"
            >
              {error}
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label htmlFor="auth-fullname" className="block text-xs font-semibold text-[#2B1D26] mb-1.5">
                Full Name
              </label>
              <input
                id="auth-fullname"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Siti Rahma"
                className="w-full h-11 px-3.5 rounded-lg border border-[#E8D7E2] text-sm text-[#2B1D26] focus:border-[#BE3E6E] focus:outline-none"
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-semibold text-[#2B1D26] mb-1.5">
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-11 px-3.5 rounded-lg border border-[#E8D7E2] text-sm text-[#2B1D26] focus:border-[#BE3E6E] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-xs font-semibold text-[#2B1D26] mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full h-11 pl-3.5 pr-10 rounded-lg border border-[#E8D7E2] text-sm text-[#2B1D26] focus:border-[#BE3E6E] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#7D6674] hover:text-[#2B1D26] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-lg bg-[#BE3E6E] hover:bg-[#A4325D] disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            {submitting
              ? mode === 'login'
                ? 'Signing In...'
                : 'Creating Account...'
              : mode === 'login'
                ? 'Sign In'
                : 'Create Account'}
          </button>
        </form>
      </div>
    </section>
  );
}
