'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, useBookingStore } from '@/store';
import { Card, Button, StatCard } from '@/components/ui';
import BookingCard from '@/components/BookingCard';
import { Plane, TrendingUp, DollarSign, Plus, Sparkles } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState({ totalRides: 0, totalSavings: 0, upcomingRides: 0 });
  const { user, isAuthenticated } = useAuthStore();
  const { bookings } = useBookingStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    const completed = bookings.filter((b) => b.status === 'COMPLETED').length;
    const upcoming = bookings.filter((b) =>
      ['IN_PROGRESS', 'CONFIRMED', 'MATCHED'].includes(b.status)
    ).length;
    // Risparmio reale: confronto prezzo condiviso vs stima taxi (×2.5)
    const savings = bookings
      .filter((b) => b.status === 'COMPLETED')
      .reduce((sum, b) => {
        const paid = b.estimatedPrice ?? b.sharePrice ?? 0;
        const solo = paid * 2.5;
        return sum + (solo - paid);
      }, 0);
    setStats({ totalRides: completed, totalSavings: Math.round(savings), upcomingRides: upcoming });
  }, [isAuthenticated, bookings, router]);

  if (!isAuthenticated) return null;

  const firstName = user?.name?.split(' ')[0] || 'Utente';

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Hero header */}
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-ink-muted text-sm mb-1">Ciao,</p>
          <h1 className="text-3xl font-bold text-white">{firstName} 👋</h1>
          <p className="text-ink-secondary text-sm mt-1">
            {bookings.length === 0
              ? 'Pronto per la tua prima corsa condivisa?'
              : `${stats.upcomingRides > 0 ? `${stats.upcomingRides} ${stats.upcomingRides === 1 ? 'corsa imminente' : 'corse imminenti'}` : 'Nessuna corsa attiva'}`}
          </p>
        </div>
        <Link href="/flight-search">
          <Button size="lg">
            <Plus className="w-4 h-4" />
            Nuova corsa
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Corse completate"
          value={stats.totalRides}
          icon={<Plane className="w-5 h-5 text-ink-secondary" />}
        />
        <StatCard
          label="Risparmi stimati"
          value={`€${stats.totalSavings}`}
          sub="vs taxi privato"
          icon={<DollarSign className="w-5 h-5 text-primary-400" />}
          accent
        />
        <StatCard
          label="Corse attive"
          value={stats.upcomingRides}
          icon={<TrendingUp className="w-5 h-5 text-ink-secondary" />}
        />
      </div>

      {/* Bookings */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Le tue prenotazioni</h2>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-surface-1 border border-surface-4 rounded-2xl p-12 text-center bg-card-gradient mt-4">
          <div className="w-16 h-16 bg-primary-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Sparkles className="w-8 h-8 text-primary-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Inizia il tuo primo viaggio
          </h3>
          <p className="text-ink-secondary text-sm mb-6 max-w-xs mx-auto">
            Inserisci il codice volo e trova compagni di viaggio. Risparmia fino al 78%.
          </p>
          <Link href="/flight-search">
            <Button size="lg">
              <Plane className="w-4 h-4" />
              Cerca una corsa
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {bookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}

      {/* Tip banner */}
      {bookings.length > 0 && (
        <Card className="mt-8 border-primary-500/20 bg-primary-500/5">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary-500/15 rounded-xl">
              <Sparkles className="w-4 h-4 text-primary-400" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Prenota in anticipo</p>
              <p className="text-ink-secondary text-xs mt-0.5">
                Più prenotazioni anticipate = più compagni disponibili = risparmio maggiore.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
