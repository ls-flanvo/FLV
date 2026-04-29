'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input, Button } from '@/components/ui';
import { User, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import SocialButtons from '@/components/SocialButtons';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Le password non corrispondono'); return; }
    if (password.length < 6) { setError('Password minimo 6 caratteri'); return; }
    setLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (!response.ok || !data.user) {
        setError(data.error || 'Errore durante la registrazione. Riprova.');
        return;
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('flanvo_user', JSON.stringify(data.user));
        localStorage.setItem('flanvo_token', data.token);
      }
      router.push('/dashboard');
    } catch {
      setError('Errore di connessione. Controlla la rete e riprova.');
    } finally {
      setLoading(false);
    }
  };

  const perks = [
    'Risparmia fino al 78% rispetto al taxi',
    'Stesso volo, stessa direzione',
    'Pagamento solo all\'arrivo',
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-4 py-12 bg-hero-gradient">
      <div className="w-full max-w-md animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <span className="text-3xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>Flanvo</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Crea il tuo account</h1>
          <p className="text-ink-secondary mt-1.5 text-sm">Inizia a risparmiare sui trasferimenti</p>
        </div>

        {/* Social proof stat */}
        <div className="flex items-center justify-center gap-6 mb-5">
          {[
            { n: '78%', l: 'risparmio medio' },
            { n: '500+', l: 'viaggiatori' },
            { n: '4.9★', l: 'valutazione' },
          ].map(({ n, l }) => (
            <div key={l} className="text-center">
              <p className="text-lg font-black text-primary-400">{n}</p>
              <p className="text-xs text-ink-muted">{l}</p>
            </div>
          ))}
        </div>

        {/* Perks */}
        <div className="flex flex-col gap-1.5 mb-6">
          {perks.map((p) => (
            <div key={p} className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-primary-500 shrink-0" />
              <span className="text-sm text-ink-secondary">{p}</span>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="bg-surface-1 border border-surface-4 rounded-2xl p-8 shadow-surface bg-card-gradient">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-[2.6rem] w-4 h-4 text-ink-muted pointer-events-none" />
              <Input type="text" label="Nome completo" placeholder="Mario Rossi"
                value={name} onChange={(e) => setName(e.target.value)} className="pl-11" required />
            </div>
            <div className="relative">
              <Mail className="absolute left-4 top-[2.6rem] w-4 h-4 text-ink-muted pointer-events-none" />
              <Input type="email" label="Email" placeholder="tua@email.com"
                value={email} onChange={(e) => setEmail(e.target.value)} className="pl-11" required />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-[2.6rem] w-4 h-4 text-ink-muted pointer-events-none" />
              <Input type="password" label="Password" placeholder="Min. 6 caratteri"
                value={password} onChange={(e) => setPassword(e.target.value)} className="pl-11" required />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-[2.6rem] w-4 h-4 text-ink-muted pointer-events-none" />
              <Input type="password" label="Conferma password" placeholder="••••••••"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-11" required />
            </div>

            {error && (
              <div className="flex items-start gap-3 bg-danger/10 border border-danger/20 rounded-xl p-3.5">
                <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full mt-2" size="lg" disabled={loading}>
              {loading ? 'Registrazione...' : 'Registrati gratis'}
            </Button>
          </form>

          <div className="mt-5">
            <SocialButtons />
          </div>

          <p className="text-center text-sm text-ink-secondary mt-5">
            Hai già un account?{' '}
            <Link href="/login" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
              Accedi
            </Link>
          </p>
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
