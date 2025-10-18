'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useBookingStore } from '@/store';
import { RideMatch } from '@/lib/types';
import RideMatchCard from '@/components/RideMatchCard';
import { Card } from '@/components/ui';
import { Loader2, Search } from 'lucide-react';

export default function MatchingPage() {
  const [matches, setMatches] = useState<RideMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creatingBooking, setCreatingBooking] = useState(false);

  const { user, isAuthenticated, token } = useAuthStore();
  const { currentFlight, setSelectedMatch } = useBookingStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!currentFlight) {
      router.push('/flight-search');
      return;
    }

    findMatches();
  }, [isAuthenticated, currentFlight, router]);

  const findMatches = async () => {
    setLoading(true);
    setError('');

    try {
      const destinationStr = localStorage.getItem('flanvo_destination');
      const destination = destinationStr ? JSON.parse(destinationStr) : null;

      const response = await fetch('/api/matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flightId: currentFlight?.id,
          flightCode: currentFlight?.code,
          userId: user?.id,
          destination,
        }),
      });

      if (!response.ok) {
        throw new Error('Errore nella risposta del server');
      }

      const data = await response.json();

      if (data.matches) {
        setMatches(data.matches);
      } else {
        setError('Nessun match disponibile');
      }
    } catch (err) {
      console.error('Errore:', err);
      setError('Errore nella ricerca di match');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMatch = async (match: RideMatch) => {
    try {
      setCreatingBooking(true);
      setSelectedMatch(match);

      console.log('📦 Creando booking per match:', match.id);

      // Prendi destinazione da localStorage
      const destinationStr = localStorage.getItem('flanvo_destination');
      const destination = destinationStr ? JSON.parse(destinationStr) : null;

      if (!destination) {
        setError('Destinazione mancante. Riprova dalla ricerca volo.');
        setCreatingBooking(false);
        return;
      }

      // ✅ Crea il booking nel database
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // ✅ JWT token!
        },
        body: JSON.stringify({
          pickupLocation: destination.address,
          pickupLat: destination.lat,
          pickupLng: destination.lng,
          dropoffLocation: 'Aeroporto Fiumicino', // O usa currentFlight.airport
          dropoffLat: 41.8003,
          dropoffLng: 12.2389,
          pickupTime: currentFlight?.departure || new Date().toISOString(),
          flightNumber: currentFlight?.code || 'UNKNOWN',
          flightDate: currentFlight?.departure || new Date().toISOString(),
          direction: 'TO_AIRPORT', // O 'FROM_AIRPORT' a seconda del flow
          passengers: 1,
          luggage: 2,
        }),
      });

      const data = await response.json();
      console.log('✅ Booking response:', data);

      if (!data.success || !data.groupMember?.id) {
        setError('Errore nella creazione del booking');
        setCreatingBooking(false);
        return;
      }

      // ✅ Usa il vero memberId dal database!
      const memberId = data.groupMember.id;
      console.log('✅ Reindirizzo a checkout con memberId:', memberId);

      // ✅ Vai al checkout con ID REALE
      router.push(`/checkout/${memberId}`);

    } catch (err) {
      console.error('❌ Errore creazione booking:', err);
      setError('Errore nella creazione della prenotazione');
      setCreatingBooking(false);
    }
  };

  if (!isAuthenticated || !currentFlight) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Opzioni disponibili per te
        </h1>
        <p className="text-gray-600">
          Abbiamo trovato {matches.length} opzioni di viaggio condiviso per il tuo volo{' '}
          <strong>{currentFlight.code}</strong>
        </p>
      </div>

      {/* Loading durante creazione booking */}
      {creatingBooking && (
        <Card className="flex flex-col items-center justify-center py-16 mb-8">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
          <p className="text-gray-600 font-medium">Sto creando la tua prenotazione...</p>
          <p className="text-sm text-gray-500 mt-2">Un momento, per favore</p>
        </Card>
      )}

      {loading ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
          <p className="text-gray-600 font-medium">Stiamo cercando i migliori match per te...</p>
          <p className="text-sm text-gray-500 mt-2">Analisi di destinazioni, prezzi e tempi</p>
        </Card>
      ) : error ? (
        <Card className="bg-red-50 border-red-200">
          <div className="flex items-center space-x-3">
            <div className="text-red-600">
              <Search className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Errore</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </Card>
      ) : matches.length === 0 ? (
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="flex items-center space-x-3">
            <div className="text-yellow-600">
              <Search className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">Nessun match trovato</h3>
              <p className="text-yellow-700">Non ci sono opzioni disponibili al momento</p>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {matches.map((match) => (
              <RideMatchCard
                key={match.id}
                match={match}
                onSelect={handleSelectMatch}
                disabled={creatingBooking}
              />
            ))}
          </div>

          <Card className="bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Come funziona il punteggio?</h3>
            <p className="text-sm text-blue-800">
              Il punteggio di match considera: vicinanza delle destinazioni, tempi di viaggio simili,
              numero di passeggeri e costo totale. Un punteggio più alto significa un viaggio più
              conveniente e ottimizzato per te.
            </p>
          </Card>
        </>
      )}
    </div>
  );
}