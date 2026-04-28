'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store';
import { Input, Button } from '@/components/ui';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import SocialButtons from '@/components/SocialButtons';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, setToken } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok || !data.user) {
        setError(data.error || 'Credenziali non valide');
        return;
      }
      login(data.user);
      setToken(data.token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('flanvo_user', JSON.stringify(data.user));
        localStorage.setItem('flanvo_token', data.token);
      }
      if (data.user.role === 'driver') router.push('/driver/dashboard');
      else if (data.user.role === 'admin') router.push('/admin/dashboard');
      else router.push('/dashboard');
    } catch {
      setError('Errore di connessione. Controlla la rete e riprova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-4 py-12 bg-hero-gradient">
      <div className="w-full max-w-md animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <svg width="32" height="42" viewBox="0 0 56 72" fill="none">
              <path d="M8 0 L48 0 L30 30 L48 30 L8 72 L22 40 L4 40 Z" fill="#00D1B2"/>
            </svg>
            <span className="text-3xl font-bold tracking-tight text-white">flanvo</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Bentornato</h1>
          <p className="text-ink-secondary mt-1.5 text-sm">Accedi al tuo account</p>
        </div>

        {/* Form card */}
        <div className="bg-surface-1 border border-surface-4 rounded-2xl p-8 shadow-surface bg-card-gradient">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none mt-3.5" />
              <Input
                type="email"
                label="Email"
                placeholder="tua@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-11"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none mt-3.5" />
              <Input
                type="password"
                label="Password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-11"
                required
              />
            </div>

            {error && (
              <div className="flex items-start gap-3 bg-danger/10 border border-danger/20 rounded-xl p-3.5">
                <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-xs text-ink-muted hover:text-primary-400 transition-colors">
                Password dimenticata?
              </Link>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </Button>
          </form>

          <div className="mt-5">
            <SocialButtons />
          </div>

          <p className="text-center text-sm text-ink-secondary mt-5">
            Non hai un account?{' '}
            <Link href="/signup" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
              Registrati gratis
            </Link>
          </p>
        </div>

        {/* Driver / Admin links */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Link href="/driver/login" className="bg-surface-1 border border-surface-4 rounded-xl p-4 text-center hover:border-primary-500/30 transition-all group">
            <p className="text-sm font-semibold text-white group-hover:text-primary-400 transition-colors">Sei un autista?</p>
            <p className="text-xs text-ink-muted mt-0.5">Area driver</p>
          </Link>
          <Link href="/admin/login" className="bg-surface-1 border border-surface-4 rounded-xl p-4 text-center hover:border-primary-500/30 transition-all group">
            <p className="text-sm font-semibold text-white group-hover:text-primary-400 transition-colors">Amministratore?</p>
            <p className="text-xs text-ink-muted mt-0.5">Area admin</p>
          </Link>
        </div>

        <p className="text-center mt-6">
          <Link href="/" className="text-xs text-ink-muted hover:text-ink-secondary transition-colors">
            ← Torna alla homepage
          </Link>
        </p>
      </div>
    </div>
  );
}
