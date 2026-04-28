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

  const { isAuthenticated, token } = useAuthStore();
  const { currentFlight, setSelectedMatch } = useBookingStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (!currentFlight) { router.push('/flight-search'); return; }
    findMatches();
  }, [isAuthenticated, currentFlight, router]); // eslint-disable-line react-hooks/exhaustive-deps

  const findMatches = async () => {
    setLoading(true);
    setError('');
    try {
      const destinationStr = localStorage.getItem('flanvo_destination');
      const destination = destinationStr ? JSON.parse(destinationStr) : null;
      if (!destination) {
        router.push('/flight-search');
        return;
      }

      const authToken = token || localStorage.getItem('flanvo_token');
      const response = await fetch('/api/matching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          flightCode: currentFlight?.code,
          destination,
          arrivalAirport: currentFlight?.arrivalAirport, // ← aeroporto reale del volo
        }),
      });

      if (!response.ok) throw new Error('Errore nella risposta del server');

      const data = await response.json();
      setMatches(data.matches ?? []);
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

      const destinationStr = localStorage.getItem('flanvo_destination');
      const destination = destinationStr ? JSON.parse(destinationStr) : null;
      if (!destination) {
        setError('Destinazione mancante. Riprova dalla ricerca volo.');
        setCreatingBooking(false);
        return;
      }

      // Leggi passengers e luggage salvati da flight-search
      const bookingInfoStr = localStorage.getItem('flanvo_booking_info');
      const bookingInfo = bookingInfoStr ? JSON.parse(bookingInfoStr) : {};
      const passengers = Math.max(2, bookingInfo.passengers ?? 2); // minimo 2
      const luggage = bookingInfo.luggage ?? 1;

      const authToken = token || localStorage.getItem('flanvo_token');
      if (!authToken) {
        setError('Sessione scaduta. Effettua di nuovo il login.');
        setCreatingBooking(false);
        return;
      }

      // Flanvo = FROM airport: pickup = aeroporto, dropoff = destinazione utente
      const flight = currentFlight!;
      const airportName = flight.arrivalAirportName || flight.arrivalAirport || 'Aeroporto';
      const airportLat = flight.arrivalLat ?? 37.4668; // fallback CTA
      const airportLng = flight.arrivalLng ?? 15.0664;

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          // Pickup = aeroporto d'arrivo
          pickupLocation: airportName,
          pickupLat: airportLat,
          pickupLng: airportLng,
          // Dropoff = casa/destinazione dell'utente
          dropoffLocation: destination.address,
          dropoffLat: destination.lat,
          dropoffLng: destination.lng,
          pickupTime: flight.scheduledTime,
          flightNumber: flight.code,
          flightDate: flight.scheduledTime,
          direction: 'FROM_AIRPORT', // Flanvo: dall'aeroporto verso casa
          passengers,
          luggage,
          estimatedPrice: match.pricePerPerson,
          rideGroupId: match.id,
        }),
      });

      const data = await response.json();

      if (!data.success || !data.groupMember?.id) {
        setError(data.error || 'Errore nella creazione del booking');
        setCreatingBooking(false);
        return;
      }

      router.push(`/checkout/${data.groupMember.id}`);
    } catch (err) {
      console.error('Errore creazione booking:', err);
      setError('Errore nella creazione della prenotazione');
      setCreatingBooking(false);
    }
  };

  if (!isAuthenticated || !currentFlight) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Opzioni disponibili per te</h1>
        <p className="text-gray-600">
          {matches.length > 0
            ? `${matches.length} gruppi trovati per il volo `
            : 'Ricerca in corso per il volo '}
          <strong>{currentFlight.code}</strong>
          {currentFlight.arrivalAirportName && (
            <span className="text-gray-500"> → {currentFlight.arrivalAirportName}</span>
          )}
        </p>
      </div>

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
          <p className="text-sm text-gray-500 mt-2">Analisi destinazioni e ottimizzazione percorso</p>
        </Card>
      ) : error ? (
        <Card className="bg-red-50 border-red-200">
          <div className="flex items-center space-x-3">
            <Search className="w-8 h-8 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Errore</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </Card>
      ) : matches.length === 0 ? (
        <Card className="bg-yellow-50 border-yellow-200 text-center py-12">
          <Search className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="font-semibold text-yellow-900 mb-2">Nessun gruppo disponibile</h3>
          <p className="text-yellow-700 text-sm">
            Non ci sono ancora altri passeggeri per il volo {currentFlight.code}.
            <br />Puoi creare il primo gruppo — altri si aggiungeranno!
          </p>
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
              Il punteggio considera vicinanza delle destinazioni, tempi di viaggio e numero di passeggeri.
              Più alto = viaggio più ottimizzato e conveniente.
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
