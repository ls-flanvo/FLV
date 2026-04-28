'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, MapPin, Clock, Car, Euro, Filter, Search,
  CheckCircle, XCircle, AlertCircle, Navigation, Phone, X, Users,
} from 'lucide-react';

interface AdminRide {
  id: string; flightNumber: string; status: string;
  scheduledTime: string; passengerCount: number;
  passengers: { name: string; email: string; phone: string }[];
  driver: { name: string; phone: string; vehicle: string; licensePlate: string } | null;
  pickup: { address: string; time: string };
  dropoff: { address: string };
  totalRevenue: number; createdAt: string;
}

interface RideStats {
  total: number; forming: number; confirmed: number;
  inProgress: number; completed: number; cancelled: number;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  forming:     { label: 'In formazione', cls: 'bg-warning/15 text-warning border-warning/20',    dot: 'bg-warning' },
  confirmed:   { label: 'Confermato',    cls: 'bg-primary-500/15 text-primary-400 border-primary-500/20', dot: 'bg-primary-500' },
  in_progress: { label: 'In corso',      cls: 'bg-success/15 text-success border-success/20',    dot: 'bg-success animate-pulse' },
  completed:   { label: 'Completato',    cls: 'bg-surface-3 text-ink-secondary border-surface-5', dot: 'bg-ink-muted' },
  cancelled:   { label: 'Cancellato',    cls: 'bg-danger/15 text-danger border-danger/20',       dot: 'bg-danger' },
};

const defaultStatus = { label: 'Sconosciuto', cls: 'bg-surface-3 text-ink-muted border-surface-5', dot: 'bg-surface-4' };

export default function AdminMonitorRidesPage() {
  const [rides, setRides] = useState<AdminRide[]>([]);
  const [stats, setStats] = useState<RideStats>({ total: 0, forming: 0, confirmed: 0, inProgress: 0, completed: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRide, setSelectedRide] = useState<AdminRide | null>(null);

  useEffect(() => {
    fetchRides();
    const interval = setInterval(fetchRides, 30000);
    return () => clearInterval(interval);
  }, [statusFilter, searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRides = async () => {
    try {
      const token = localStorage.getItem('flanvo_token');
      const params = new URLSearchParams({ status: statusFilter, search: searchTerm });
      const res = await fetch(`/api/admin/rides?${params}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (res.ok) { const data = await res.json(); setRides(data.rides ?? []); setStats(data.stats ?? stats); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-7">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink-secondary mb-4">
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-surface-2 border border-surface-5 rounded-xl">
                <Navigation className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Monitora Corse</h1>
                <p className="text-ink-muted text-xs">Aggiornamento automatico ogni 30s</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-success/10 border border-success/20 rounded-xl px-3 py-1.5">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-success">Live</span>
            </div>
          </div>
        </div>

        {/* Stats mini-grid */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {[
            { label: 'Totale', value: stats.total, color: 'text-white' },
            { label: 'In formazione', value: stats.forming, color: 'text-warning' },
            { label: 'Confermate', value: stats.confirmed, color: 'text-primary-400' },
            { label: 'In corso', value: stats.inProgress, color: 'text-success' },
            { label: 'Completate', value: stats.completed, color: 'text-ink-secondary' },
            { label: 'Cancellate', value: stats.cancelled, color: 'text-danger' },
          ].map(s => (
            <div key={s.label} className="bg-surface-1 border border-surface-4 rounded-xl p-3">
              <p className="text-xs text-ink-muted mb-1">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-surface-1 border border-surface-4 rounded-xl p-4 mb-5 grid md:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Volo, passeggero, autista..."
              className="w-full pl-9 pr-4 py-2.5 bg-surface-2 border border-surface-5 rounded-lg text-white text-sm placeholder-ink-muted focus:outline-none focus:border-primary-500" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-surface-2 border border-surface-5 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500 appearance-none">
              <option value="all">Tutti gli stati</option>
              <option value="FORMING">In formazione</option>
              <option value="CONFIRMED">Confermato</option>
              <option value="IN_PROGRESS">In corso</option>
              <option value="COMPLETED">Completato</option>
              <option value="CANCELLED">Cancellato</option>
            </select>
          </div>
        </div>

        {/* Rides */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          </div>
        ) : rides.length === 0 ? (
          <div className="bg-surface-1 border border-surface-4 rounded-2xl p-12 text-center">
            <Navigation className="w-10 h-10 text-ink-muted mx-auto mb-3" />
            <p className="text-white font-semibold">Nessuna corsa trovata</p>
            <p className="text-ink-muted text-sm mt-1">Modifica i filtri per vedere altre corse</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rides.map(ride => {
              const sc = STATUS_CONFIG[ride.status] ?? defaultStatus;
              return (
                <div key={ride.id} className="bg-surface-1 border border-surface-4 rounded-2xl p-5 hover:border-surface-5 transition-all">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary-500/10 rounded-xl">
                        <Car className="w-4 h-4 text-primary-400" />
                      </div>
                      <div>
                        <p className="font-bold text-white">Volo {ride.flightNumber} · {ride.passengerCount} pax</p>
                        <p className="text-xs text-ink-muted">
                          {new Date(ride.scheduledTime).toLocaleString('it-IT', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border ${sc.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                      {sc.label}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs font-semibold text-ink-secondary mb-1.5 flex items-center gap-1">
                        <Users className="w-3 h-3" /> Passeggeri
                      </p>
                      <div className="space-y-1">
                        {ride.passengers.slice(0, 3).map((p, i) => (
                          <p key={i} className="text-xs text-ink-secondary">{p.name}</p>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-ink-secondary mb-1.5 flex items-center gap-1">
                        <Car className="w-3 h-3" /> Autista
                      </p>
                      {ride.driver ? (
                        <>
                          <p className="text-xs font-medium text-white">{ride.driver.name}</p>
                          <p className="text-xs text-ink-muted">{ride.driver.vehicle} · {ride.driver.licensePlate}</p>
                        </>
                      ) : (
                        <p className="text-xs text-warning flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> In attesa
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-ink-secondary mb-1.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Percorso
                      </p>
                      <div className="flex items-start gap-1.5 mb-1">
                        <span className="w-1.5 h-1.5 bg-success rounded-full mt-1 shrink-0" />
                        <p className="text-xs text-ink-muted leading-tight">{ride.pickup.address}</p>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="w-1.5 h-1.5 bg-danger rounded-full mt-1 shrink-0" />
                        <p className="text-xs text-ink-muted leading-tight">{ride.dropoff.address}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-surface-4">
                    <div className="flex items-center gap-1 text-sm font-bold text-success">
                      <Euro className="w-4 h-4" /> {ride.totalRevenue.toFixed(2)}
                    </div>
                    <button onClick={() => setSelectedRide(ride)}
                      className="px-4 py-2 bg-surface-2 border border-surface-5 text-sm text-ink-secondary rounded-xl hover:text-white hover:border-surface-4 transition-all">
                      Vedi dettagli
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedRide && (
        <div className="fixed inset-0 bg-[#0B0B0B]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-1 border border-surface-4 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-surface-1 border-b border-surface-4 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-white">Volo {selectedRide.flightNumber}</h2>
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border mt-1 ${(STATUS_CONFIG[selectedRide.status] ?? defaultStatus).cls}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${(STATUS_CONFIG[selectedRide.status] ?? defaultStatus).dot}`} />
                  {(STATUS_CONFIG[selectedRide.status] ?? defaultStatus).label}
                </span>
              </div>
              <button onClick={() => setSelectedRide(null)} className="p-2 text-ink-muted hover:text-white rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <p className="text-xs font-bold text-ink-secondary mb-3">Passeggeri</p>
                <div className="space-y-2">
                  {selectedRide.passengers.map((p, i) => (
                    <div key={i} className="bg-surface-2 rounded-xl px-4 py-3">
                      <p className="text-sm font-medium text-white">{p.name}</p>
                      <p className="text-xs text-ink-muted">{p.email}</p>
                      {p.phone && (
                        <a href={`tel:${p.phone}`} className="text-xs text-primary-400 flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3" />{p.phone}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {selectedRide.driver && (
                <div>
                  <p className="text-xs font-bold text-ink-secondary mb-3">Autista</p>
                  <div className="bg-surface-2 rounded-xl px-4 py-3">
                    <p className="text-sm font-medium text-white">{selectedRide.driver.name}</p>
                    <p className="text-xs text-ink-muted">{selectedRide.driver.vehicle} — {selectedRide.driver.licensePlate}</p>
                    {selectedRide.driver.phone && (
                      <a href={`tel:${selectedRide.driver.phone}`} className="text-xs text-primary-400 flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3" />{selectedRide.driver.phone}
                      </a>
                    )}
                  </div>
                </div>
              )}
              <div className="bg-surface-2 rounded-xl px-4 py-4">
                <p className="text-xs text-ink-muted mb-1">Ricavo totale gruppo</p>
                <p className="text-2xl font-black text-success">€{selectedRide.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Creato: {new Date(selectedRide.createdAt).toLocaleString('it-IT')}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />Pickup: {new Date(selectedRide.pickup.time).toLocaleString('it-IT')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
