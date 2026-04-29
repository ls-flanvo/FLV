'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useBookingStore } from '@/store';
import { RideMatch } from '@/lib/types';
import RideMatchCard from '@/components/RideMatchCard';
import { Loader2, Search, Plane, ArrowLeft } from 'lucide-react';

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
      if (!destination) { router.push('/flight-search'); return; }

      const authToken = token || localStorage.getItem('flanvo_token');
      const res = await fetch('/api/matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          flightCode: currentFlight?.code,
          destination,
          arrivalAirport: currentFlight?.arrivalAirport,
        }),
      });
      if (!res.ok) throw new Error('Errore server');
      const data = await res.json();
      setMatches(data.matches ?? []);
    } catch {
      setError('Errore nella ricerca di match');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    setCreatingBooking(true);
    try {
      const destinationStr = localStorage.getItem('flanvo_destination');
      const destination = destinationStr ? JSON.parse(destinationStr) : null;
      if (!destination) { setError('Destinazione mancante'); setCreatingBooking(false); return; }
      const bookingInfoStr = localStorage.getItem('flanvo_booking_info');
      const bookingInfo = bookingInfoStr ? JSON.parse(bookingInfoStr) : {};
      const passengers = bookingInfo.passengers ?? 1;
      const luggage = bookingInfo.luggage ?? 1;
      const authToken = token || localStorage.getItem('flanvo_token');
      const flight = currentFlight!;
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          pickupLocation: flight.arrivalAirportName || flight.arrivalAirport || 'Aeroporto',
          pickupLat: flight.arrivalLat ?? 37.4668,
          pickupLng: flight.arrivalLng ?? 15.0664,
          dropoffLocation: destination.address,
          dropoffLat: destination.lat,
          dropoffLng: destination.lng,
          pickupTime: flight.scheduledTime,
          flightNumber: flight.code,
          flightDate: flight.scheduledTime,
          direction: 'FROM_AIRPORT',
          passengers,
          luggage,
          estimatedPrice: null,
        }),
      });
      const data = await res.json();
      if (!data.success || !data.groupMember?.id) {
        setError(data.error || 'Errore nella prenotazione');
        setCreatingBooking(false);
        return;
      }
      router.push(`/checkout/${data.groupMember.id}`);
    } catch {
      setError('Errore nella creazione del gruppo');
      setCreatingBooking(false);
    }
  };

  const handleSelectMatch = async (match: RideMatch) => {
    setCreatingBooking(true);
    setSelectedMatch(match);
    try {
      const destinationStr = localStorage.getItem('flanvo_destination');
      const destination = destinationStr ? JSON.parse(destinationStr) : null;
      if (!destination) { setError('Destinazione mancante'); setCreatingBooking(false); return; }

      const bookingInfoStr = localStorage.getItem('flanvo_booking_info');
      const bookingInfo = bookingInfoStr ? JSON.parse(bookingInfoStr) : {};
      const passengers = bookingInfo.passengers ?? 1;
      const luggage = bookingInfo.luggage ?? 1;

      const authToken = token || localStorage.getItem('flanvo_token');
      const flight = currentFlight!;
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          pickupLocation: flight.arrivalAirportName || flight.arrivalAirport || 'Aeroporto',
          pickupLat: flight.arrivalLat ?? 37.4668,
          pickupLng: flight.arrivalLng ?? 15.0664,
          dropoffLocation: destination.address,
          dropoffLat: destination.lat,
          dropoffLng: destination.lng,
          pickupTime: flight.scheduledTime,
          flightNumber: flight.code,
          flightDate: flight.scheduledTime,
          direction: 'FROM_AIRPORT',
          passengers,
          luggage,
          estimatedPrice: match.pricePerPerson,
          rideGroupId: match.id,
        }),
      });
      const data = await res.json();
      if (!data.success || !data.groupMember?.id) {
        setError(data.error || 'Errore nella prenotazione');
        setCreatingBooking(false);
        return;
      }
      router.push(`/checkout/${data.groupMember.id}`);
    } catch {
      setError('Errore nella creazione della prenotazione');
      setCreatingBooking(false);
    }
  };

  if (!isAuthenticated || !currentFlight) return null;

  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-[#0B0B0B]/90 backdrop-blur border-b border-surface-4 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push('/flight-search')}
            className="p-2 rounded-xl text-ink-secondary hover:text-white hover:bg-surface-2 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-primary-500/10 rounded-lg">
              <Plane className="w-4 h-4 text-primary-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{currentFlight.code}</p>
              <p className="text-xs text-ink-muted">{currentFlight.arrivalAirportName}</p>
            </div>
          </div>
          {!loading && (
            <div className="ml-auto">
              <span className="text-xs font-semibold text-primary-400 bg-primary-500/10 px-2.5 py-1 rounded-full">
                {matches.length} {matches.length === 1 ? 'gruppo' : 'gruppi'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Creating booking overlay */}
        {creatingBooking && (
          <div className="fixed inset-0 z-50 bg-[#0B0B0B]/90 backdrop-blur flex items-center justify-center">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-16 h-16 mb-5">
                <div className="absolute inset-0 rounded-full bg-primary-500/10 animate-pulse" />
                <Loader2 className="w-8 h-8 text-primary-400 animate-spin relative z-10" />
              </div>
              <p className="text-white font-bold text-lg">Creando prenotazione...</p>
              <p className="text-ink-secondary text-sm mt-1">Un momento</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative inline-flex items-center justify-center w-16 h-16 mb-6">
              <div className="absolute inset-0 rounded-full bg-primary-500/10 animate-pulse" />
              <Loader2 className="w-8 h-8 text-primary-400 animate-spin relative z-10" />
            </div>
            <p className="text-white font-semibold text-lg mb-1">Cerco i tuoi compagni...</p>
            <p className="text-ink-secondary text-sm">Analisi destinazioni e prezzi</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Search className="w-12 h-12 text-ink-muted mb-4" />
            <p className="text-white font-semibold mb-1">Qualcosa è andato storto</p>
            <p className="text-ink-secondary text-sm mb-5">{error}</p>
            <button
              onClick={findMatches}
              className="px-5 py-2.5 bg-surface-2 border border-surface-5 rounded-xl text-sm text-white font-medium hover:border-primary-500/30 transition-all"
            >
              Riprova
            </button>
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-16 h-16 bg-primary-500/10 border border-primary-500/20 rounded-2xl flex items-center justify-center mb-5">
              <Plane className="w-8 h-8 text-primary-400" />
            </div>
            <p className="text-white font-bold text-xl mb-2">Nessun gruppo disponibile</p>
            <p className="text-ink-secondary text-sm mb-1 max-w-xs">
              Sei il primo per il volo <strong className="text-white">{currentFlight.code}</strong>.<br />
              Crea il gruppo — altri si aggiungeranno!
            </p>
            <p className="text-xs text-ink-muted mt-4 mb-6 max-w-xs">
              La tua prenotazione resterà attiva finché non viene trovato un match.
            </p>
            <button
              onClick={handleCreateGroup}
              disabled={creatingBooking}
              className="px-8 py-4 bg-primary-500 text-[#0B0B0B] font-bold rounded-2xl hover:bg-primary-400 active:scale-[0.98] transition-all shadow-teal disabled:opacity-40">
              Crea il gruppo e prenota →
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-ink-secondary mb-4">
              Scegli il gruppo che preferisci — prezzo, tempo, compagni
            </p>
            <div className="space-y-4">
              {matches.map((match) => (
                <RideMatchCard
                  key={match.id}
                  match={match}
                  onSelect={handleSelectMatch}
                  disabled={creatingBooking}
                />
              ))}
            </div>
            <p className="text-center text-xs text-ink-muted mt-6">
              Il pagamento avviene solo al drop-off · Pre-autorizzazione richiesta
            </p>
          </>
        )}
      </div>
    </div>
  );
}
