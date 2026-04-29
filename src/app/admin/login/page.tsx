'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store';
import { Input, Button } from '@/components/ui';
import { Shield, Lock, Mail, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.user?.role === 'admin') {
        login(data.user);
        if (data.token) {
          localStorage.setItem('flanvo_user', JSON.stringify(data.user));
          localStorage.setItem('flanvo_token', data.token);
        }
        router.push('/admin/dashboard');
      } else if (data.user) {
        setError('Permessi amministratore richiesti');
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
            <span className="text-2xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>Flanvo</span>
          </Link>
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-500/10 border border-primary-500/20 rounded-2xl mb-4">
            <Shield className="w-7 h-7 text-primary-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Area Admin</h1>
          <p className="text-ink-secondary text-sm mt-1">Accesso riservato agli amministratori</p>
        </div>

        <div className="bg-surface-1 border border-surface-4 rounded-2xl p-8 shadow-surface bg-card-gradient">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-[2.6rem] w-4 h-4 text-ink-muted pointer-events-none" />
              <Input type="email" label="Email amministratore" placeholder="admin@flanvo.com"
                value={email} onChange={(e) => setEmail(e.target.value)} className="pl-11" required />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-[2.6rem] w-4 h-4 text-ink-muted pointer-events-none" />
              <Input type="password" label="Password" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} className="pl-11" required />
            </div>

            {error && (
              <div className="flex items-start gap-3 bg-danger/10 border border-danger/20 rounded-xl p-3.5">
                <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full mt-2" size="lg" disabled={loading}>
              {loading ? 'Accesso...' : 'Accedi'}
            </Button>
          </form>
        </div>

        <div className="mt-4 bg-surface-1 border border-warning/20 rounded-xl p-4 flex items-start gap-3">
          <Shield className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-ink-muted">
            Area protetta. Tutti gli accessi vengono registrati e monitorati.
          </p>
        </div>

        <div className="mt-5 flex justify-center gap-6 text-xs text-ink-muted">
          <Link href="/login" className="hover:text-ink-secondary transition-colors">Area Passeggeri</Link>
          <Link href="/driver/login" className="hover:text-ink-secondary transition-colors">Area Autisti</Link>
        </div>
      </div>
    </div>
  );
}
