'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store';
import { ArrowLeft, User, Lock, CheckCircle, AlertCircle, Phone, Mail } from 'lucide-react';

export default function AccountPage() {
  const { token, user, isAuthenticated, login } = useAuthStore();
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    const t = token || localStorage.getItem('flanvo_token');
    fetch('/api/account', { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then(d => { if (d.user) { setName(d.user.name || ''); setPhone(d.user.phone || ''); } });
  }, [isAuthenticated, token, router]);

  if (!isAuthenticated) return null;

  const authHeader = { Authorization: `Bearer ${token || localStorage.getItem('flanvo_token')}` };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true); setProfileMsg(null);
    try {
      const res = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfileMsg({ ok: true, text: 'Profilo aggiornato' });
        if (user) login({ ...user, name: data.user.name });
      } else {
        setProfileMsg({ ok: false, text: data.error || 'Errore' });
      }
    } finally { setProfileLoading(false); }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { setPassMsg({ ok: false, text: 'Minimo 6 caratteri' }); return; }
    setPassLoading(true); setPassMsg(null);
    try {
      const res = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) { setPassMsg({ ok: true, text: 'Password aggiornata' }); setCurrentPassword(''); setNewPassword(''); }
      else setPassMsg({ ok: false, text: data.error || 'Errore' });
    } finally { setPassLoading(false); }
  };

  const inputCls = 'w-full px-4 py-3 bg-surface-2 border border-surface-5 rounded-xl text-white placeholder-ink-muted focus:outline-none focus:border-primary-500 text-sm transition-colors';

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-7">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink-secondary mb-4 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-white">Il mio account</h1>
        <p className="text-ink-muted text-sm mt-1">{user?.email}</p>
      </div>

      {/* Profile */}
      <div className="bg-surface-1 border border-surface-4 rounded-2xl p-6 mb-5 bg-card-gradient">
        <h2 className="font-bold text-white mb-5 flex items-center gap-2">
          <User className="w-4 h-4 text-primary-400" /> Informazioni personali
        </h2>
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="block text-xs text-ink-secondary mb-1.5">Nome completo</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Mario Rossi"
                className={`${inputCls} pl-11`} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-ink-secondary mb-1.5">Numero di telefono</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+39 333 1234567" type="tel"
                className={`${inputCls} pl-11`} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-ink-secondary mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
              <input value={user?.email || ''} disabled
                className={`${inputCls} pl-11 opacity-50 cursor-not-allowed`} />
            </div>
            <p className="text-xs text-ink-muted mt-1">L&apos;email non può essere modificata</p>
          </div>
          {profileMsg && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${profileMsg.ok ? 'bg-success/10 border border-success/20 text-success' : 'bg-danger/10 border border-danger/20 text-danger'}`}>
              {profileMsg.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {profileMsg.text}
            </div>
          )}
          <button type="submit" disabled={profileLoading}
            className="w-full py-3 bg-primary-500 text-[#0B0B0B] font-bold rounded-xl hover:bg-primary-400 transition-all disabled:opacity-40 text-sm">
            {profileLoading ? 'Salvataggio...' : 'Salva modifiche'}
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="bg-surface-1 border border-surface-4 rounded-2xl p-6 bg-card-gradient">
        <h2 className="font-bold text-white mb-5 flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary-400" /> Cambia password
        </h2>
        <form onSubmit={savePassword} className="space-y-4">
          <div>
            <label className="block text-xs text-ink-secondary mb-1.5">Password attuale</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
              placeholder="••••••••" className={inputCls} required />
          </div>
          <div>
            <label className="block text-xs text-ink-secondary mb-1.5">Nuova password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              placeholder="Minimo 6 caratteri" className={inputCls} required />
          </div>
          {passMsg && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${passMsg.ok ? 'bg-success/10 border border-success/20 text-success' : 'bg-danger/10 border border-danger/20 text-danger'}`}>
              {passMsg.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {passMsg.text}
            </div>
          )}
          <button type="submit" disabled={passLoading || !currentPassword || !newPassword}
            className="w-full py-3 bg-surface-3 border border-surface-5 text-white font-semibold rounded-xl hover:border-primary-500/30 transition-all disabled:opacity-40 text-sm">
            {passLoading ? 'Aggiornamento...' : 'Aggiorna password'}
          </button>
        </form>
      </div>
    </div>
  );
}
