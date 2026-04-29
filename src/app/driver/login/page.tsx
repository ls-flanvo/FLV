'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store';
import { Input, Button } from '@/components/ui';
import { Car, Lock, Mail, AlertCircle, Clock } from 'lucide-react';

export default function DriverLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pendingApproval, setPendingApproval] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, setToken } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPendingApproval(false);
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.status === 403) { setPendingApproval(true); setLoading(false); return; }
      if (data.user && data.token) {
        if (data.user.role !== 'driver') { setError('Account non registrato come autista'); setLoading(false); return; }
        login(data.user);
        setToken(data.token);
        localStorage.setItem('flanvo_user', JSON.stringify(data.user));
        localStorage.setItem('flanvo_token', data.token);
        router.push('/driver/dashboard');
      } else {
        setError(data.error || 'Credenziali non valide');
      }
    } catch {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-4 py-12 bg-hero-gradient">
      <div className="w-full max-w-md animate-fade-up">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <span className="text-3xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>Flanvo</span>
          </Link>
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-500/10 border border-primary-500/20 rounded-2xl mb-4">
            <Car className="w-7 h-7 text-primary-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Area Autisti</h1>
          <p className="text-ink-secondary text-sm mt-1">Accedi per gestire le tue corse</p>
        </div>

        <div className="bg-surface-1 border border-surface-4 rounded-2xl p-8 shadow-surface bg-card-gradient">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-[2.6rem] w-4 h-4 text-ink-muted pointer-events-none" />
              <Input type="email" label="Email" placeholder="autista@esempio.com"
                value={email} onChange={(e) => setEmail(e.target.value)} className="pl-11" required />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-[2.6rem] w-4 h-4 text-ink-muted pointer-events-none" />
              <Input type="password" label="Password" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} className="pl-11" required />
            </div>

            {pendingApproval && (
              <div className="flex items-start gap-3 bg-warning/10 border border-warning/20 rounded-xl p-4">
                <Clock className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-warning">In attesa di approvazione</p>
                  <p className="text-xs text-ink-secondary mt-1">
                    Il tuo profilo è in revisione. Riceverai un&apos;email quando sarà approvato.
                  </p>
                </div>
              </div>
            )}
            {error && !pendingApproval && (
              <div className="flex items-start gap-3 bg-danger/10 border border-danger/20 rounded-xl p-3.5">
                <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full mt-2" size="lg" disabled={loading}>
              {loading ? 'Accesso...' : 'Accedi come Autista'}
            </Button>
          </form>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <Link href="/login" className="bg-surface-1 border border-surface-4 rounded-xl p-4 text-center hover:border-primary-500/30 transition-all group">
            <p className="text-sm font-semibold text-white group-hover:text-primary-400 transition-colors">Sei passeggero?</p>
            <p className="text-xs text-ink-muted mt-0.5">Area utenti</p>
          </Link>
          <Link href="/driver/signup" className="bg-surface-1 border border-surface-4 rounded-xl p-4 text-center hover:border-primary-500/30 transition-all group">
            <p className="text-sm font-semibold text-white group-hover:text-primary-400 transition-colors">Vuoi guidare?</p>
            <p className="text-xs text-ink-muted mt-0.5">Registrati</p>
          </Link>
        </div>
        <p className="text-center mt-6">
          <Link href="/" className="text-xs text-ink-muted hover:text-ink-secondary transition-colors">← Torna alla homepage</Link>
        </p>
      </div>
    </div>
  );
}
