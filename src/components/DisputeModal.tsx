'use client';

import { useState } from 'react';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';

const REASONS = [
  { value: 'LOST_LUGGAGE', label: 'Bagaglio smarrito' },
  { value: 'MEDICAL',      label: 'Emergenza medica' },
  { value: 'FLIGHT_ISSUE', label: 'Problemi con il volo' },
  { value: 'DRIVER_ISSUE', label: 'Problemi con il driver' },
  { value: 'OTHER',        label: 'Altro' },
];

interface Props {
  bookingId: string;
  flightNumber: string;
  onClose: () => void;
}

export default function DisputeModal({ bookingId, flightNumber, onClose }: Props) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || description.length < 20) {
      setError('Seleziona un motivo e descrivi il problema (min. 20 caratteri).');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('flanvo_token');
      const res = await fetch(`/api/bookings/${bookingId}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ reason, description }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Errore nell\'invio.'); return; }
      setSuccess(true);
    } catch {
      setError('Errore di rete. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-surface-1 border border-surface-4 rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-4">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span className="font-bold text-white text-sm">Segnala un problema</span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-ink-muted hover:text-white hover:bg-surface-2 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          {success ? (
            <div className="p-6 text-center">
              <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
              <p className="font-bold text-white mb-1">Segnalazione inviata</p>
              <p className="text-sm text-ink-secondary mb-4">
                Il team Flanvo esaminerà il tuo caso entro 24 ore lavorative e ti risponderà via email.
              </p>
              <button onClick={onClose} className="px-5 py-2.5 bg-surface-2 border border-surface-5 rounded-xl text-sm font-semibold text-white hover:bg-surface-3 transition-all">
                Chiudi
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <p className="text-xs text-ink-muted">Volo <strong className="text-white">{flightNumber}</strong> — usa questo modulo solo per cause di forza maggiore al pickup (bagagli smarriti, emergenze, etc.).</p>

              <div>
                <label className="text-xs font-semibold text-ink-secondary block mb-2">Motivo</label>
                <div className="space-y-2">
                  {REASONS.map((r) => (
                    <label key={r.value} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="reason"
                        value={r.value}
                        checked={reason === r.value}
                        onChange={() => setReason(r.value)}
                        className="accent-primary-500"
                      />
                      <span className={`text-sm ${reason === r.value ? 'text-white font-medium' : 'text-ink-secondary group-hover:text-white'} transition-colors`}>
                        {r.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-secondary block mb-1.5">
                  Descrizione <span className="text-ink-muted font-normal">(min. 20 caratteri)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Descrivi cosa è successo al momento del pickup..."
                  className="w-full bg-surface-2 border border-surface-5 rounded-xl px-3 py-2.5 text-sm text-white placeholder-ink-muted resize-none focus:outline-none focus:border-primary-500 transition-colors"
                />
                <p className="text-xs text-ink-muted mt-1">{description.length}/1000</p>
              </div>

              {error && <p className="text-xs text-danger">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-surface-2 border border-surface-5 rounded-xl text-sm font-semibold text-white hover:bg-surface-3 transition-all">
                  Annulla
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-warning text-[#0B0B0B] rounded-xl text-sm font-bold hover:bg-yellow-400 disabled:opacity-40 transition-all">
                  {loading ? 'Invio...' : 'Invia segnalazione'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
