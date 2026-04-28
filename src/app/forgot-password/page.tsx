'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      setError('Errore di connessione. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-4 py-12 bg-hero-gradient">
      <div className="w-full max-w-md animate-fade-up">
        <div className="text-center mb-8">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink-secondary mb-6 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Torna al login
          </Link>
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-500/10 border border-primary-500/20 rounded-2xl mb-5">
            <Mail className="w-7 h-7 text-primary-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Password dimenticata?</h1>
          <p className="text-ink-secondary text-sm mt-1.5">Ti inviamo un link per reimpostarla</p>
        </div>

        {sent ? (
          <div className="bg-surface-1 border border-success/20 rounded-2xl p-8 text-center">
            <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-success" />
            </div>
            <h2 className="font-bold text-white mb-2">Email inviata!</h2>
            <p className="text-ink-secondary text-sm mb-1">
              Se l&apos;email <strong className="text-white">{email}</strong> è registrata, riceverai un link entro pochi minuti.
            </p>
            <p className="text-ink-muted text-xs mt-3">Controlla anche la cartella spam.</p>
            <Link href="/login">
              <button className="mt-6 w-full py-3 bg-primary-500 text-[#0B0B0B] font-bold rounded-xl hover:bg-primary-400 transition-all text-sm">
                Torna al login
              </button>
            </Link>
          </div>
        ) : (
          <div className="bg-surface-1 border border-surface-4 rounded-2xl p-8 bg-card-gradient">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-ink-secondary mb-1.5">Email del tuo account</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="tua@email.com"
                    className="w-full pl-11 pr-4 py-3 bg-surface-2 border border-surface-5 rounded-xl text-white placeholder-ink-muted focus:outline-none focus:border-primary-500 transition-colors" />
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-danger shrink-0" />
                  <p className="text-sm text-danger">{error}</p>
                </div>
              )}
              <button type="submit" disabled={loading || !email}
                className="w-full py-3.5 bg-primary-500 text-[#0B0B0B] font-bold rounded-xl hover:bg-primary-400 transition-all disabled:opacity-40 text-sm">
                {loading ? 'Invio...' : 'Invia link di reset'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
