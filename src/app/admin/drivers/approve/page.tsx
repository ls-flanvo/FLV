'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserCheck, ArrowLeft, Car, Mail, Phone, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';

interface PendingDriver {
  id: string; name: string; surname: string;
  email: string; phone: string;
  driverLicense: string; licenseExpiry: string;
  vehicleBrand: string; vehicleModel: string; vehicleYear: string;
  licensePlate: string; vehicleColor: string;
  submittedAt: string; status: 'pending' | 'reviewing' | 'approved' | 'rejected';
}

export default function AdminApproveDriversPage() {
  const [drivers, setDrivers] = useState<PendingDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PendingDriver | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [acting, setActing] = useState(false);

  useEffect(() => { fetchDrivers(); }, []);

  const fetchDrivers = async () => {
    try {
      const token = localStorage.getItem('flanvo_token');
      const res = await fetch('/api/admin/drivers?status=pending', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.drivers) {
        setDrivers(data.drivers.map((d: { id: string; user: { name: string; email: string; phone: string }; licenseNumber: string; vehiclePlate: string; vehicleModel: string; vehicleYear: number; vehicleColor: string; createdAt: string }) => ({
          id: d.id,
          name: d.user.name.split(' ')[0] || d.user.name,
          surname: d.user.name.split(' ').slice(1).join(' ') || '',
          email: d.user.email, phone: d.user.phone || '',
          driverLicense: d.licenseNumber, licenseExpiry: '',
          vehicleBrand: d.vehicleModel?.split(' ')[0] || '',
          vehicleModel: d.vehicleModel || '',
          vehicleYear: String(d.vehicleYear),
          licensePlate: d.vehiclePlate, vehicleColor: d.vehicleColor || '',
          submittedAt: d.createdAt, status: 'pending' as const,
        })));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Approvare questo autista?')) return;
    setActing(true);
    try {
      const token = localStorage.getItem('flanvo_token');
      const res = await fetch('/api/admin/drivers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ driverId: id, action: 'approve' }),
      });
      if (res.ok) { setDrivers(d => d.filter(x => x.id !== id)); setSelected(null); }
    } finally { setActing(false); }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) return;
    setActing(true);
    try {
      const token = localStorage.getItem('flanvo_token');
      const res = await fetch('/api/admin/drivers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ driverId: id, action: 'reject', reason: rejectionReason }),
      });
      if (res.ok) {
        setDrivers(d => d.filter(x => x.id !== id));
        setSelected(null); setShowReject(false); setRejectionReason('');
      }
    } finally { setActing(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0B0B] py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink-secondary mb-4">
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-surface-2 border border-surface-5 rounded-xl">
                <UserCheck className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Approva Autisti</h1>
                <p className="text-ink-muted text-xs">{drivers.length} richieste in attesa</p>
              </div>
            </div>
            {drivers.length > 0 && (
              <div className="flex items-center gap-2 bg-warning/10 border border-warning/20 rounded-xl px-3 py-1.5">
                <Clock className="w-3.5 h-3.5 text-warning" />
                <span className="text-xs font-semibold text-warning">{drivers.length} pending</span>
              </div>
            )}
          </div>
        </div>

        {drivers.length === 0 ? (
          <div className="bg-surface-1 border border-surface-4 rounded-2xl p-12 text-center">
            <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
            <p className="text-white font-bold text-lg mb-1">Tutto approvato!</p>
            <p className="text-ink-secondary text-sm">Nessuna richiesta in attesa.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {drivers.map((d) => (
              <div key={d.id} className="bg-surface-1 border border-surface-4 rounded-2xl p-5 hover:border-surface-5 transition-all">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-500/10 border border-primary-500/20 rounded-xl flex items-center justify-center text-primary-400 font-bold text-lg">
                      {d.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-white">{d.name} {d.surname}</p>
                      <div className="flex items-center gap-3 text-xs text-ink-muted mt-0.5">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{d.email}</span>
                        {d.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{d.phone}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelected(selected?.id === d.id ? null : d)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-surface-3 border border-surface-5 rounded-xl text-sm text-ink-secondary hover:text-white hover:border-primary-500/30 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" /> Dettagli
                    </button>
                    <button
                      onClick={() => handleApprove(d.id)}
                      disabled={acting}
                      className="flex items-center gap-1.5 px-3 py-2 bg-success/10 border border-success/20 rounded-xl text-sm text-success hover:bg-success/20 transition-all disabled:opacity-40"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approva
                    </button>
                    <button
                      onClick={() => { setSelected(d); setShowReject(true); }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-danger/10 border border-danger/20 rounded-xl text-sm text-danger hover:bg-danger/20 transition-all"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Rifiuta
                    </button>
                  </div>
                </div>

                {selected?.id === d.id && !showReject && (
                  <div className="mt-5 pt-5 border-t border-surface-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Licenza', value: d.driverLicense },
                      { label: 'Veicolo', value: `${d.vehicleModel} ${d.vehicleYear}` },
                      { label: 'Targa', value: d.licensePlate },
                      { label: 'Colore', value: d.vehicleColor },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-surface-2 rounded-xl px-4 py-3">
                        <p className="text-xs text-ink-muted mb-1">{label}</p>
                        <p className="text-sm font-semibold text-white">{value || '—'}</p>
                      </div>
                    ))}
                  </div>
                )}

                {showReject && selected?.id === d.id && (
                  <div className="mt-5 pt-5 border-t border-surface-4">
                    <p className="text-sm font-semibold text-white mb-2.5">Motivo del rifiuto</p>
                    <textarea
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      placeholder="Es: Documenti incompleti, veicolo non conforme..."
                      rows={3}
                      className="w-full bg-surface-2 border border-surface-5 rounded-xl px-4 py-3 text-sm text-white placeholder-ink-muted focus:outline-none focus:border-danger resize-none mb-3"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setShowReject(false); setRejectionReason(''); }}
                        className="px-4 py-2.5 bg-surface-3 border border-surface-5 rounded-xl text-sm text-ink-secondary hover:text-white transition-all"
                      >
                        Annulla
                      </button>
                      <button
                        onClick={() => handleReject(d.id)}
                        disabled={!rejectionReason.trim() || acting}
                        className="px-4 py-2.5 bg-danger/10 border border-danger/20 rounded-xl text-sm text-danger hover:bg-danger/20 transition-all disabled:opacity-40"
                      >
                        Conferma rifiuto
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-3 flex items-center gap-1.5 text-xs text-ink-muted">
                  <Car className="w-3 h-3" />
                  Van 7 posti · Candidatura del{' '}
                  {new Date(d.submittedAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
