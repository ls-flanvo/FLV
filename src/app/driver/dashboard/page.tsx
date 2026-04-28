'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store';
import { StatCard, Badge } from '@/components/ui';
import DriverChat from '@/components/DriverChat';
import { DriverRide } from '@/lib/types';
import {
  Car, Users, MapPin, Clock, DollarSign,
  CheckCircle, XCircle, Navigation, MessageCircle,
  TrendingUp, Star, AlertTriangle, Zap
} from 'lucide-react';

const TABS = [
  { key: 'pending', label: 'In attesa' },
  { key: 'accepted', label: 'Accettate' },
  { key: 'completed', label: 'Completate' },
] as const;

export default function DriverDashboardPage() {
  const [rides, setRides] = useState<DriverRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'completed'>('pending');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatGroupId, setChatGroupId] = useState('');
  const [selectedPassenger, setSelectedPassenger] = useState<{ name: string; phone: string } | null>(null);
  const [stripeStatus, setStripeStatus] = useState<'loading' | 'not_started' | 'incomplete' | 'pending_verification' | 'active'>('loading');
  const [stats, setStats] = useState({ todayRides: 0, earnings: 0, rating: 5.0, totalTrips: 0 });

  const { user, isAuthenticated, token } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) { router.push('/driver/login'); return; }
    if (user?.role !== 'driver') { router.push('/dashboard'); return; }
    fetchRides();
    fetchStripeStatus();
    startLocationTracking();
  }, [isAuthenticated, user, router]); // eslint-disable-line react-hooks/exhaustive-deps

  const startLocationTracking = () => {
    if (!navigator.geolocation) return;
    const send = (pos: GeolocationPosition) => {
      const t = token || localStorage.getItem('flanvo_token');
      fetch('/api/driver/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) },
        body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      }).catch(() => {});
    };
    navigator.geolocation.getCurrentPosition(send, () => {});
    setInterval(() => navigator.geolocation.getCurrentPosition(send, () => {}), 10000);
  };

  const fetchStripeStatus = async () => {
    try {
      const t = token || localStorage.getItem('flanvo_token');
      const res = await fetch('/api/stripe-connect/status', {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) setStripeStatus((await res.json()).status);
    } catch { setStripeStatus('not_started'); }
  };

  const handleStripeOnboard = async () => {
    const t = token || localStorage.getItem('flanvo_token');
    const res = await fetch('/api/stripe-connect/onboard', {
      method: 'POST', headers: { Authorization: `Bearer ${t}` },
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  const fetchRides = async () => {
    try {
      const t = token || localStorage.getItem('flanvo_token');
      const res = await fetch('/api/driver/rides', { headers: { Authorization: `Bearer ${t}` } });
      const data = await res.json();
      if (data.rides) {
        setRides(data.rides);
        setStats({
          todayRides: data.rides.filter((r: DriverRide) => r.status === 'accepted').length,
          earnings: data.driverStats?.totalEarnings ?? 0,
          rating: data.driverStats?.rating ?? 5.0,
          totalTrips: data.driverStats?.totalRides ?? 0,
        });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleAccept = async (rideId: string) => {
    const t = token || localStorage.getItem('flanvo_token');
    const res = await fetch('/api/driver/rides', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ rideId, status: 'accepted' }),
    });
    if (res.ok) setRides(r => r.map(x => x.id === rideId ? { ...x, status: 'accepted' as const } : x));
  };

  const handleReject = async (rideId: string) => {
    const t = token || localStorage.getItem('flanvo_token');
    const res = await fetch('/api/driver/rides', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ rideId, status: 'rejected' }),
    });
    if (res.ok) setRides(r => r.filter(x => x.id !== rideId));
  };

  const filtered = rides.filter(r => r.status === activeTab);
  if (!isAuthenticated || user?.role !== 'driver') return null;

  const pendingCount = rides.filter(r => r.status === 'pending').length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Stripe Connect banner */}
      {stripeStatus !== 'active' && stripeStatus !== 'loading' && (
        <div className={`mb-5 p-4 rounded-2xl border flex items-center justify-between gap-4 ${
          stripeStatus === 'pending_verification'
            ? 'bg-warning/8 border-warning/20'
            : 'bg-danger/8 border-danger/20'
        }`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-5 h-5 shrink-0 ${stripeStatus === 'pending_verification' ? 'text-warning' : 'text-danger'}`} />
            <div>
              <p className="font-semibold text-white text-sm">
                {stripeStatus === 'pending_verification' ? 'Verifica identità in corso' : 'Configura i pagamenti'}
              </p>
              <p className="text-xs text-ink-secondary mt-0.5">
                {stripeStatus === 'pending_verification'
                  ? 'Stripe sta verificando i documenti.'
                  : 'Collega il tuo IBAN per ricevere i pagamenti.'}
              </p>
            </div>
          </div>
          {stripeStatus !== 'pending_verification' && (
            <button onClick={handleStripeOnboard}
              className="whitespace-nowrap bg-primary-500 text-[#0B0B0B] px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary-400 transition-all">
              Configura
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-ink-muted text-sm mb-0.5">Ciao,</p>
          <h1 className="text-2xl font-bold text-white">{user?.name?.split(' ')[0]} 👋</h1>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 rounded-xl px-3 py-2">
            <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-primary-400">{pendingCount} nuov{pendingCount === 1 ? 'a' : 'e'} richiesta{pendingCount !== 1 ? 'e' : ''}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
        <StatCard label="Corse oggi" value={stats.todayRides} icon={<Car className="w-4 h-4 text-ink-muted" />} />
        <StatCard label="Guadagni" value={`€${stats.earnings.toFixed(0)}`} icon={<DollarSign className="w-4 h-4 text-primary-400" />} accent />
        <StatCard label="Rating" value={stats.rating.toFixed(1)} icon={<Star className="w-4 h-4 text-warning" />} />
        <StatCard label="Corse totali" value={stats.totalTrips} icon={<TrendingUp className="w-4 h-4 text-ink-muted" />} />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-4 mb-5">
        {TABS.map(t => {
          const count = rides.filter(r => r.status === t.key).length;
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all mr-1 ${
                activeTab === t.key
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-ink-muted hover:text-ink-secondary'
              }`}
            >
              {t.label}
              {count > 0 && (
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === t.key ? 'bg-primary-500/20 text-primary-400' : 'bg-surface-3 text-ink-muted'
                }`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Rides */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-1 border border-surface-4 rounded-2xl p-12 text-center bg-card-gradient">
          <Car className="w-12 h-12 text-ink-muted mx-auto mb-4" />
          <p className="text-white font-semibold mb-1">
            Nessuna corsa {activeTab === 'pending' ? 'in attesa' : activeTab === 'accepted' ? 'accettata' : 'completata'}
          </p>
          <p className="text-ink-muted text-sm">
            {activeTab === 'pending' ? 'Le nuove richieste appaiono qui' : 'Accetta una corsa per iniziare'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((ride) => (
            <div key={ride.id} className="bg-surface-1 border border-surface-4 rounded-2xl overflow-hidden bg-card-gradient">
              {/* Ride header */}
              <div className="px-5 pt-5 pb-4 border-b border-surface-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-500/10 rounded-xl">
                    <Navigation className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="font-bold text-white">Volo {ride.flight.code}</p>
                    <p className="text-xs text-ink-muted">{ride.flight.airline}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-primary-400">€{ride.totalPrice}</p>
                  <p className="text-xs text-ink-muted">compenso totale</p>
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  {/* Passengers */}
                  <div>
                    <p className="text-xs font-semibold text-ink-secondary mb-2 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Passeggeri ({ride.passengers.length})
                    </p>
                    <div className="space-y-2">
                      {ride.passengers.slice(0, 3).map((p, i) => (
                        <div key={i} className="flex items-center justify-between bg-surface-2 rounded-xl px-3 py-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-primary-500/15 rounded-lg flex items-center justify-center text-primary-400 text-xs font-bold">
                              {p.name.charAt(0)}
                            </div>
                            <span className="text-sm text-white font-medium">{p.name}</span>
                          </div>
                          <button
                            onClick={() => { setSelectedPassenger({ name: p.name, phone: '' }); setChatGroupId(ride.rideGroupId); setChatOpen(true); }}
                            className="p-1.5 rounded-lg text-ink-muted hover:text-primary-400 hover:bg-primary-500/10 transition-all"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stops */}
                  <div>
                    <p className="text-xs font-semibold text-ink-secondary mb-2 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> Fermate
                    </p>
                    <div className="space-y-2">
                      {ride.destinations.map((d, i) => (
                        <div key={i} className="flex items-start gap-2 bg-surface-2 rounded-xl px-3 py-2">
                          <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center text-[#0B0B0B] text-xs font-bold shrink-0 mt-0.5">
                            {i + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{d.city}</p>
                            <p className="text-xs text-ink-muted truncate">{d.address}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pickup time */}
                    <div className="mt-2 flex items-center gap-2 text-xs text-ink-secondary">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(ride.pickupTime).toLocaleString('it-IT', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {ride.status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t border-surface-4">
                    <button onClick={() => handleAccept(ride.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-success/10 border border-success/20 text-success font-bold rounded-xl hover:bg-success/20 transition-all">
                      <CheckCircle className="w-4 h-4" /> Accetta
                    </button>
                    <button onClick={() => handleReject(ride.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-danger/10 border border-danger/20 text-danger font-bold rounded-xl hover:bg-danger/20 transition-all">
                      <XCircle className="w-4 h-4" /> Rifiuta
                    </button>
                  </div>
                )}

                {ride.status === 'accepted' && (
                  <div className="flex gap-3 pt-4 border-t border-surface-4">
                    <Link href={`/driver/ride/${ride.id}`} className="flex-1">
                      <button className="w-full flex items-center justify-center gap-2 py-3 bg-primary-500 text-[#0B0B0B] font-bold rounded-xl hover:bg-primary-400 transition-all">
                        <Zap className="w-4 h-4" /> Inizia navigazione
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPassenger && chatGroupId && (
        <DriverChat isOpen={chatOpen} onClose={() => { setChatOpen(false); setSelectedPassenger(null); setChatGroupId(''); }}
          driverName={selectedPassenger.name} driverPhone={selectedPassenger.phone} groupId={chatGroupId} />
      )}
    </div>
  );
}
