'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, useBookingStore } from '@/store';
import { Card, Button } from '@/components/ui';
import BookingCard from '@/components/BookingCard';
import { Plane, TrendingUp, DollarSign } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalRides: 0,
    totalSavings: 0,
    upcomingRides: 0,
  });

  const { user, isAuthenticated } = useAuthStore();
  const { bookings } = useBookingStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const completed = bookings.filter((b) => b.status === 'completed').length;
    const upcoming = bookings.filter((b) => 
      b.status === 'paid' || b.status === 'confirmed'
    ).length;
    const savings = bookings.reduce((sum, b) => sum + (b.sharePrice * 0.4), 0);

    setStats({
      totalRides: completed,
      totalSavings: Math.round(savings),
      upcomingRides: upcoming,
    });
  }, [isAuthenticated, bookings, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Benvenuto, {user?.name}!
        </h1>
        <p className="text-gray-600">Ecco un riepilogo delle tue attività</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="flex items-center space-x-4">
            <div className="bg-primary-100 p-4 rounded-full">
              <Plane className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Corse completate</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalRides}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-4">
            <div className="bg-green-100 p-4 rounded-full">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Risparmi totali</p>
              <p className="text-3xl font-bold text-gray-900">€{stats.totalSavings}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-4 rounded-full">
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Corse imminenti</p>
              <p className="text-3xl font-bold text-gray-900">{stats.upcomingRides}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Azioni rapide</h2>
        <div className="flex flex-wrap gap-4">
          <Link href="/flight-search">
            <Button size="lg">
              <Plane className="w-5 h-5 mr-2" />
              Nuova ricerca corsa
            </Button>
          </Link>
        </div>
      </Card>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Le tue prenotazioni</h2>
        
        {bookings.length === 0 ? (
          <Card className="text-center py-12">
            <Plane className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nessuna prenotazione ancora
            </h3>
            <p className="text-gray-600 mb-6">
              Inizia a risparmiare prenotando la tua prima corsa condivisa
            </p>
            <Link href="/flight-search">
              <Button size="lg">Cerca una corsa</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </div>

      <Card className="mt-8 bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
        <h3 className="font-semibold text-gray-900 mb-2">💡 Suggerimento</h3>
        <p className="text-sm text-gray-700">
          Prenota in anticipo per avere più opzioni di viaggio condiviso e risparmiare di più!
        </p>
      </Card>
    </div>
  );
}