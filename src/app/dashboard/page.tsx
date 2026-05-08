'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, useBookingStore } from '@/store';
import { StatCard } from '@/components/ui';
import BookingCard from '@/components/BookingCard';
import { Plane, TrendingUp, DollarSign, Plus, Sparkles, ArrowRight, Clock, AlertTriangle } from 'lucide-react';

// Skeleton card
function SkeletonCard() {
  return (
    <div className="bg-surface-1 border border-surface-4 rounded-2xl overflow-hidden animate-pulse">
      <div className="px-5 pt-5 pb-4 border-b border-surface-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-surface-3 rounded-xl" />
          <div className="space-y-1.5">
            <div className="w-20 h-3.5 bg-surface-3 rounded" />
            <div className="w-14 h-2.5 bg-surface-3 rounded" />
          </div>
        </div>
        <div className="w-16 h-3 bg-surface-3 rounded" />
      </div>
      <div className="px-5 py-4 space-y-3">
        <div className="w-full h-3 bg-surface-3 rounded" />
        <div className="w-2/3 h-3 bg-surface-3 rounded" />
        <div className="flex justify-between">
          <div className="w-16 h-3 bg-surface-3 rounded" />
          <div className="w-12 h-5 bg-surface-3 rounded" />
        </div>
      </div>
      <div className="px-5 pb-5">
        <div className="w-full h-10 bg-surface-3 rounded-xl" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState({ totalRides: 0, totalSavings: 0, upcomingRides: 0 });
  const [hydrated, setHydrated] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const { bookings, fetchBookings } = useBookingStore();
  const router = useRouter();

  // Carica bookings e aggiorna ogni 20s per rilevare cambi di stato
  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    const token = localStorage.getItem('flanvo_token');
    if (token) fetchBookings(token).then(() => setHydrated(true));
    else setHydrated(true);

    const interval = setInterval(() => {
      const t = localStorage.getItem('flanvo_token');
      if (t) fetchBookings(t);
    }, 20_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, router]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const completed = bookings.filter((b) => b.status === 'COMPLETED').length;
    const upcoming = bookings.filter((b) =>
      ['IN_PROGRESS', 'CONFIRMED', 'MATCHED', 'PENDING'].includes(b.status)
    ).length;
    const savings = bookings
      .filter((b) => b.status === 'COMPLETED')
      .reduce((sum, b) => {
        const paid = b.estimatedPrice ?? b.sharePrice ?? 0;
        return sum + (paid * 2.5 - paid);
      }, 0);
    setStats({ totalRides: completed, totalSavings: Math.round(savings), upcomingRides: upcoming });
  }, [bookings]);

  if (!isAuthenticated) return null;

  const firstName = user?.name?.split(' ')[0] || 'Utente';
  const hasBookings = bookings.length > 0;
  const paymentPendingBookings = bookings.filter(b => b.status === 'MATCHED');

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Banner urgente — finestra pagamento aperta */}
      {paymentPendingBookings.length > 0 && (
        <div className="mb-6 bg-warning/8 border border-warning/20 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
            <div>
              <p className="font-bold text-warning text-sm">
                {paymentPendingBookings.length === 1
                  ? 'Il tuo gruppo è chiuso — Paga entro 20 minuti'
                  : `${paymentPendingBookings.length} gruppi chiusi — Paga entro 20 minuti`}
              </p>
              <p className="text-xs text-ink-muted mt-0.5">Dopo la scadenza il posto viene liberato automaticamente</p>
            </div>
          </div>
          <Link href={`/checkout/${paymentPendingBookings[0].groupMember?.id ?? ''}`}>
            <button className="whitespace-nowrap bg-warning text-[#0B0B0B] px-4 py-2 rounded-xl text-sm font-bold hover:bg-warning/90 transition-all flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Paga ora
            </button>
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-ink-muted text-sm mb-1">Ciao,</p>
          <h1 className="text-3xl font-bold text-white">{firstName} 👋</h1>
          {hasBookings && (
            <p className="text-ink-secondary text-sm mt-1">
              {stats.upcomingRides > 0
                ? `${stats.upcomingRides} ${stats.upcomingRides === 1 ? 'corsa imminente' : 'corse imminenti'}`
                : 'Nessuna corsa attiva al momento'}
            </p>
          )}
        </div>
        {hasBookings && (
          <button
            onClick={() => router.push('/flight-search')}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-[#0B0B0B] font-bold rounded-xl hover:bg-primary-400 transition-all text-sm shadow-teal"
          >
            <Plus className="w-4 h-4" /> Nuova corsa
          </button>
        )}
      </div>

      {/* Empty state — zero friction CTA */}
      {!hydrated ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : !hasBookings ? (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 animate-fade-up">
          {/* Big icon */}
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-primary-500/10 border border-primary-500/20 rounded-3xl flex items-center justify-center mx-auto">
              <Plane className="w-12 h-12 text-primary-400" />
            </div>
            <div className="absolute -top-1 -right-1 w-7 h-7 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-[#0B0B0B] font-black text-sm">+</span>
            </div>
          </div>

          {/* Copy */}
          <h2 className="text-2xl font-bold text-white mb-3">
            Dove voli la prossima volta?
          </h2>
          <p className="text-ink-secondary text-base mb-2 max-w-sm">
            Inserisci il codice volo e trova compagni di viaggio diretti nella tua stessa zona.
          </p>
          <p className="text-primary-400 font-semibold text-sm mb-8">
            Risparmio medio: 40–78% rispetto al taxi
          </p>

          {/* Main CTA */}
          <button
            onClick={() => router.push('/flight-search')}
            className="flex items-center gap-3 px-8 py-4 bg-primary-500 text-[#0B0B0B] font-bold text-lg rounded-2xl hover:bg-primary-400 active:scale-[0.98] transition-all shadow-teal mb-4"
          >
            Cerca la mia corsa <ArrowRight className="w-5 h-5" />
          </button>

          {/* Mini how-it-works */}
          <div className="flex items-center gap-6 mt-6 text-xs text-ink-muted">
            {['Codice volo', '→', 'Trova compagni', '→', 'Gruppo chiuso · Paga'].map((s, i) => (
              <span key={i} className={s === '→' ? 'text-surface-5' : ''}>{s}</span>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Stats — only when there are bookings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <StatCard label="Corse completate" value={stats.totalRides}
              icon={<Plane className="w-5 h-5 text-ink-secondary" />} />
            <StatCard label="Risparmi stimati" value={`€${stats.totalSavings}`} sub="vs taxi privato"
              icon={<DollarSign className="w-5 h-5 text-primary-400" />} accent />
            <StatCard label="Corse attive" value={stats.upcomingRides}
              icon={<TrendingUp className="w-5 h-5 text-ink-secondary" />} />
          </div>

          {/* Bookings grid */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Le tue prenotazioni</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>

          {/* Tip */}
          <div className="mt-8 bg-primary-500/5 border border-primary-500/15 rounded-2xl p-4 flex items-start gap-3">
            <div className="p-2 bg-primary-500/15 rounded-xl shrink-0">
              <Sparkles className="w-4 h-4 text-primary-400" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Prenota in anticipo</p>
              <p className="text-ink-secondary text-xs mt-0.5">
                Più prenotazioni anticipate = più compagni disponibili = risparmio maggiore.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
