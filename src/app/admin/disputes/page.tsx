'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Dispute {
  id: string;
  reason: string;
  description: string;
  status: string;
  refundAmount?: number;
  resolution?: string;
  createdAt: string;
  user: { name: string; email: string };
  booking: {
    flightNumber: string;
    pickupTime: string;
    groupMember?: { totalPrice?: number; paymentStatus?: string };
  };
}

const REASON_LABELS: Record<string, string> = {
  LOST_LUGGAGE: 'Bagaglio smarrito',
  MEDICAL: 'Emergenza medica',
  FLIGHT_ISSUE: 'Problemi volo',
  DRIVER_ISSUE: 'Problemi driver',
  OTHER: 'Altro',
};

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchDisputes = async () => {
    const token = localStorage.getItem('flanvo_token');
    const res = await fetch('/api/admin/disputes?status=PENDING', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const data = await res.json();
    setDisputes(data.disputes ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchDisputes(); }, []);

  const handleResolve = async (action: 'APPROVED' | 'REJECTED') => {
    if (!selected || !resolution.trim()) return;
    setProcessing(true);
    const token = localStorage.getItem('flanvo_token');
    await fetch('/api/admin/disputes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({
        disputeId: selected.id,
        action,
        resolution,
        refundAmount: refundAmount ? parseFloat(refundAmount) : undefined,
      }),
    });
    setSelected(null);
    setResolution('');
    setRefundAmount('');
    setProcessing(false);
    fetchDisputes();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <AlertTriangle className="w-5 h-5 text-warning" />
        <h1 className="text-2xl font-bold text-white">Dispute aperte</h1>
        {disputes.length > 0 && (
          <span className="bg-warning/20 text-warning text-xs font-bold px-2.5 py-0.5 rounded-full">
            {disputes.length}
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-ink-muted text-sm">Caricamento...</p>
      ) : disputes.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">Nessuna disputa aperta</p>
          <p className="text-ink-muted text-sm">Tutte le segnalazioni sono state gestite.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((d) => (
            <div key={d.id} className="bg-surface-1 border border-surface-4 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-warning bg-warning/10 border border-warning/20 rounded-full px-2 py-0.5">
                      {REASON_LABELS[d.reason] ?? d.reason}
                    </span>
                    <span className="text-xs text-ink-muted">
                      {new Date(d.createdAt).toLocaleDateString('it-IT')}
                    </span>
                  </div>
                  <p className="font-semibold text-white">{d.user.name}</p>
                  <p className="text-xs text-ink-muted">{d.user.email} · Volo {d.booking.flightNumber}</p>
                </div>
                {d.booking.groupMember?.totalPrice && (
                  <div className="text-right">
                    <p className="text-xs text-ink-muted">Importo</p>
                    <p className="font-bold text-white">€{d.booking.groupMember.totalPrice.toFixed(2)}</p>
                    <p className="text-xs text-ink-muted">{d.booking.groupMember.paymentStatus}</p>
                  </div>
                )}
              </div>
              <p className="text-sm text-ink-secondary leading-relaxed mb-4 bg-surface-2 rounded-xl px-3 py-2.5">
                {d.description}
              </p>
              <button
                onClick={() => { setSelected(d); setRefundAmount(d.booking.groupMember?.totalPrice?.toString() ?? ''); }}
                className="flex items-center gap-2 text-sm font-semibold text-primary-400 hover:text-primary-300 transition-colors"
              >
                <Clock className="w-3.5 h-3.5" /> Gestisci disputa
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal risoluzione */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50" onClick={() => setSelected(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-surface-1 border border-surface-4 rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-bold text-white mb-1">Risolvi disputa</h3>
              <p className="text-xs text-ink-muted mb-4">{selected.user.name} · {REASON_LABELS[selected.reason]}</p>

              <div className="mb-3">
                <label className="text-xs font-semibold text-ink-secondary block mb-1.5">Rimborso (€)</label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full bg-surface-2 border border-surface-5 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div className="mb-4">
                <label className="text-xs font-semibold text-ink-secondary block mb-1.5">Motivazione decisione</label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  rows={3}
                  placeholder="Spiega la decisione al passeggero..."
                  className="w-full bg-surface-2 border border-surface-5 rounded-xl px-3 py-2 text-sm text-white placeholder-ink-muted resize-none focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => handleResolve('REJECTED')} disabled={processing || !resolution.trim()}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/15 disabled:opacity-40 transition-all">
                  <XCircle className="w-4 h-4" /> Respingi
                </button>
                <button onClick={() => handleResolve('APPROVED')} disabled={processing || !resolution.trim()}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-success/10 border border-success/20 rounded-xl text-sm font-semibold text-success hover:bg-success/15 disabled:opacity-40 transition-all">
                  <CheckCircle className="w-4 h-4" /> Approva rimborso
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
