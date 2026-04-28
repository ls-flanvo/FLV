'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Euro, Calendar, BarChart3, Users, Car, Filter } from 'lucide-react';

interface AnalyticsData {
  totalRevenue: number; platformFee: number; driverEarnings: number;
  totalBookings: number; completedRides: number; matchRate: number;
  avgGroupSize: number; averageBookingValue: number;
  topDrivers: { name: string; earnings: number; rides: number; rating: number }[];
  revenueByDay: { date: string; revenue: number; rides: number }[];
}

const PERIODS = [
  { v: 'week', l: 'Settimana' },
  { v: 'month', l: 'Mese' },
  { v: 'quarter', l: 'Trimestre' },
  { v: 'year', l: 'Anno' },
];

export default function AdminReportsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem('flanvo_token');
    fetch(`/api/admin/analytics?period=${period}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, [period]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
      </div>
    );
  }

  const maxRevenue = data.revenueByDay.length ? Math.max(...data.revenueByDay.map(d => d.revenue), 1) : 1;

  return (
    <div className="min-h-screen bg-[#0B0B0B] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-7">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink-secondary mb-4">
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-surface-2 border border-surface-5 rounded-xl">
              <BarChart3 className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Report & Analytics</h1>
              <p className="text-ink-muted text-xs">Dati reali dal database</p>
            </div>
          </div>
        </div>

        {/* Period filter */}
        <div className="bg-surface-1 border border-surface-4 rounded-xl p-4 mb-6 flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-ink-muted shrink-0" />
          <span className="text-xs text-ink-secondary font-medium">Periodo:</span>
          {PERIODS.map(p => (
            <button key={p.v} onClick={() => setPeriod(p.v)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                period === p.v ? 'bg-primary-500 text-[#0B0B0B]' : 'bg-surface-2 border border-surface-5 text-ink-secondary hover:text-white'
              }`}>
              {p.l}
            </button>
          ))}
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
          {[
            { label: 'Ricavi totali', value: `€${data.totalRevenue.toFixed(0)}`, icon: <Euro className="w-4 h-4 text-primary-400" />, accent: true },
            { label: 'Corse completate', value: data.completedRides, sub: `su ${data.totalBookings}`, icon: <Car className="w-4 h-4 text-ink-muted" /> },
            { label: 'Commissioni Flanvo', value: `€${data.platformFee.toFixed(0)}`, icon: <TrendingUp className="w-4 h-4 text-success" /> },
            { label: 'Match Rate', value: `${data.matchRate}%`, sub: `~${data.avgGroupSize} pax/gruppo`, icon: <Users className="w-4 h-4 text-ink-muted" /> },
          ].map((s) => (
            <div key={s.label} className={`bg-surface-1 border rounded-2xl p-5 ${s.accent ? 'border-primary-500/20' : 'border-surface-4'}`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-ink-muted">{s.label}</p>
                {s.icon}
              </div>
              <p className={`text-2xl font-black ${s.accent ? 'text-primary-400' : 'text-white'}`}>{s.value}</p>
              {s.sub && <p className="text-xs text-ink-muted mt-0.5">{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* Revenue chart */}
        {data.revenueByDay.length > 0 && (
          <div className="bg-surface-1 border border-surface-4 rounded-2xl p-6 mb-6">
            <h2 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary-400" /> Ricavi per giorno
            </h2>
            <div className="space-y-2.5">
              {data.revenueByDay.slice(-14).map((day, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-20 text-xs text-ink-muted text-right shrink-0">
                    {new Date(day.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                  </div>
                  <div className="flex-1 bg-surface-3 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="bg-primary-500 h-full rounded-full flex items-center justify-end px-2.5 transition-all duration-500 min-w-[2%]"
                      style={{ width: `${Math.max((day.revenue / maxRevenue) * 100, 2)}%` }}>
                      {day.revenue > 0 && (
                        <span className="text-[#0B0B0B] font-bold text-xs">€{day.revenue.toFixed(0)}</span>
                      )}
                    </div>
                  </div>
                  <div className="w-14 text-right text-xs text-ink-muted shrink-0">{day.rides} corse</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-5">
          {/* Top drivers */}
          <div className="bg-surface-1 border border-surface-4 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-400" /> Top Autisti
            </h2>
            {data.topDrivers.length === 0 ? (
              <p className="text-ink-muted text-sm">Nessun dato disponibile</p>
            ) : (
              <div className="space-y-3">
                {data.topDrivers.map((driver, i) => (
                  <div key={i} className="flex items-center justify-between bg-surface-2 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        i === 0 ? 'bg-warning text-[#0B0B0B]' : i === 1 ? 'bg-surface-4 text-white' : 'bg-surface-3 text-ink-secondary'
                      }`}>
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{driver.name}</p>
                        <p className="text-xs text-ink-muted">{driver.rides} corse · ★ {driver.rating.toFixed(1)}</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-success">€{driver.earnings.toFixed(0)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-surface-1 border border-surface-4 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary-400" /> Riepilogo periodo
            </h2>
            <div className="space-y-3">
              {[
                { label: 'Ricavi totali', value: `€${data.totalRevenue.toFixed(2)}` },
                { label: 'Guadagni autisti', value: `€${data.driverEarnings.toFixed(2)}` },
                { label: 'Commissioni Flanvo', value: `€${data.platformFee.toFixed(2)}` },
                { label: 'Prenotazioni totali', value: String(data.totalBookings) },
                { label: 'Valore medio prenotazione', value: `€${data.averageBookingValue.toFixed(2)}` },
                { label: 'Dimensione media gruppo', value: `${data.avgGroupSize} pax` },
                { label: 'Match Rate', value: `${data.matchRate}%` },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2.5 border-b border-surface-4 last:border-0">
                  <span className="text-xs text-ink-secondary">{label}</span>
                  <span className="text-sm font-semibold text-white">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-ink-muted">
              <Calendar className="w-3 h-3" /> Dati in tempo reale dal database
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
