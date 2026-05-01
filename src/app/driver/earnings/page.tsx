'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store';
import { ArrowLeft, TrendingUp, Star, MapPin, Calendar } from 'lucide-react';

interface EarningsStats {
  totalEarnings: number;
  monthEarnings: number;
  totalRides: number;
  rating: number;
}

interface RideEarning {
  flightNumber: string;
  date: string;
  dropoff: string;
  passengers: number;
  driverTotal: number;
  capturedAt: string | null;
}

export default function DriverEarningsPage() {
  const [stats, setStats] = useState<EarningsStats | null>(null);
  const [rides, setRides] = useState<RideEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user, token } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'driver') { router.push('/driver/login'); return; }
    const t = token || localStorage.getItem('flanvo_token');
    fetch('/api/driver/earnings', { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then(data => { setStats(data.stats); setRides(data.rides ?? []); })
      .finally(() => setLoading(false));
  }, [isAuthenticated, user, token, router]);

  if (loading) return (
    <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0B0B] px-4 py-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/driver/dashboard" className="p-2 bg-surface-2 rounded-xl border border-surface-5 hover:border-surface-4 transition-all">
          <ArrowLeft className="w-4 h-4 text-ink-secondary" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Guadagni</h1>
          <p className="text-xs text-ink-muted">Storico pagamenti ricevuti</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-surface-1 border border-surface-4 rounded-2xl p-4">
          <p className="text-xs text-ink-muted mb-1">Totale guadagnato</p>
          <p className="text-2xl font-black text-primary-400">€{stats?.totalEarnings.toFixed(2) ?? '0.00'}</p>
        </div>
        <div className="bg-surface-1 border border-surface-4 rounded-2xl p-4">
          <p className="text-xs text-ink-muted mb-1">Questo mese</p>
          <p className="text-2xl font-black text-white">€{stats?.monthEarnings.toFixed(2) ?? '0.00'}</p>
        </div>
        <div className="bg-surface-1 border border-surface-4 rounded-2xl p-4 flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-primary-400 shrink-0" />
          <div>
            <p className="text-xs text-ink-muted">Corse completate</p>
            <p className="text-lg font-bold text-white">{stats?.totalRides ?? 0}</p>
          </div>
        </div>
        <div className="bg-surface-1 border border-surface-4 rounded-2xl p-4 flex items-center gap-3">
          <Star className="w-5 h-5 text-warning shrink-0" />
          <div>
            <p className="text-xs text-ink-muted">Valutazione media</p>
            <p className="text-lg font-bold text-white">{stats?.rating.toFixed(1) ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Rides list */}
      <h2 className="text-sm font-semibold text-ink-secondary mb-3">Storico corse</h2>
      {rides.length === 0 ? (
        <div className="bg-surface-1 border border-surface-4 rounded-2xl p-8 text-center">
          <TrendingUp className="w-10 h-10 text-ink-muted mx-auto mb-3" />
          <p className="text-sm text-ink-secondary">Nessuna corsa completata ancora.</p>
          <p className="text-xs text-ink-muted mt-1">I guadagni appaiono qui dopo ogni corsa completata.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rides.map((r, i) => (
            <div key={i} className="bg-surface-1 border border-surface-4 rounded-2xl px-4 py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white">{r.flightNumber}</span>
                    <span className="text-xs text-ink-muted px-2 py-0.5 bg-surface-3 rounded-full">
                      {r.passengers} {r.passengers === 1 ? 'pax' : 'pax'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-ink-muted mb-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{r.dropoff}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                    <Calendar className="w-3 h-3 shrink-0" />
                    <span>{r.capturedAt ? new Date(r.capturedAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-lg font-black text-primary-400">€{r.driverTotal.toFixed(2)}</p>
                  <p className="text-xs text-ink-muted">guadagnato</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-center mt-6 text-xs text-ink-muted">
        I pagamenti vengono trasferiti sul tuo account Stripe entro 2 giorni lavorativi dall'accettazione della corsa.
      </p>
    </div>
  );
}
