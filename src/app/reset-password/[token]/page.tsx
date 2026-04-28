'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Le password non corrispondono'); return; }
    if (password.length < 6) { setError('Minimo 6 caratteri'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: params.token, password }),
      });
      const data = await res.json();
      if (res.ok) { setDone(true); setTimeout(() => router.push('/login'), 2500); }
      else setError(data.error || 'Link scaduto. Richiedine uno nuovo.');
    } catch {
      setError('Errore di connessione.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-4 py-12 bg-hero-gradient">
      <div className="w-full max-w-md animate-fade-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-500/10 border border-primary-500/20 rounded-2xl mb-5">
            <Lock className="w-7 h-7 text-primary-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Nuova password</h1>
          <p className="text-ink-secondary text-sm mt-1.5">Scegli una password sicura per il tuo account</p>
        </div>

        {done ? (
          <div className="bg-surface-1 border border-success/20 rounded-2xl p-8 text-center">
            <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
            <h2 className="font-bold text-white mb-2">Password aggiornata!</h2>
            <p className="text-ink-secondary text-sm">Reindirizzamento al login...</p>
          </div>
        ) : (
          <div className="bg-surface-1 border border-surface-4 rounded-2xl p-8 bg-card-gradient">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-ink-secondary mb-1.5">Nuova password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                  <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                    placeholder="Minimo 6 caratteri"
                    className="w-full pl-11 pr-11 py-3 bg-surface-2 border border-surface-5 rounded-xl text-white placeholder-ink-muted focus:outline-none focus:border-primary-500 transition-colors" />
                  <button type="button" onClick={() => setShow(s => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted hover:text-white">
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-ink-secondary mb-1.5">Conferma password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                  <input type={show ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} required
                    placeholder="Ripeti la password"
                    className="w-full pl-11 pr-4 py-3 bg-surface-2 border border-surface-5 rounded-xl text-white placeholder-ink-muted focus:outline-none focus:border-primary-500 transition-colors" />
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-danger shrink-0" />
                  <p className="text-sm text-danger">{error}</p>
                </div>
              )}
              <button type="submit" disabled={loading || !password || !confirm}
                className="w-full py-3.5 bg-primary-500 text-[#0B0B0B] font-bold rounded-xl hover:bg-primary-400 transition-all disabled:opacity-40 text-sm">
                {loading ? 'Aggiornamento...' : 'Salva nuova password'}
              </button>
            </form>
            <p className="text-center text-xs text-ink-muted mt-5">
              Link scaduto?{' '}
              <Link href="/forgot-password" className="text-primary-400 hover:underline">Richiedine uno nuovo</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
