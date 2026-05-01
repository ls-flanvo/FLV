'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useBookingStore } from '@/store';
import { RideMatch } from '@/lib/types';
import RideMatchCard from '@/components/RideMatchCard';
import { Loader2, Search, Plane, ArrowLeft, CheckCircle, TrendingDown } from 'lucide-react';

export default function MatchingPage() {
  const [matches, setMatches] = useState<RideMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);

  const { isAuthenticated, token } = useAuthStore();
  const { currentFlight } = useBookingStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (!currentFlight) { router.push('/flight-search'); return; }
    findMatches();
  }, [isAuthenticated, currentFlight, router]); // eslint-disable-line react-hooks/exhaustive-deps

  const findMatches = async () => {
    setLoading(true); setError('');
    try {
      const destinationStr = localStorage.getItem('flanvo_destination');
      const destination = destinationStr ? JSON.parse(destinationStr) : null;
      if (!destination) { router.push('/flight-search'); return; }
      const authToken = token || localStorage.getItem('flanvo_token');
      const res = await fetch('/api/matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ flightCode: currentFlight?.code, destination, arrivalAirport: currentFlight?.arrivalAirport }),
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

  // Registra richiesta (con o senza rideGroupId) — NESSUN checkout immediato
  const registerRequest = async (rideGroupId?: string) => {
    setRegistering(true);
    try {
      const destinationStr = localStorage.getItem('flanvo_destination');
      const destination = destinationStr ? JSON.parse(destinationStr) : null;
      if (!destination) { setError('Destinazione mancante'); setRegistering(false); return; }

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
          arrivalAirport: flight.arrivalAirport || 'CTA',
          passengers,
          luggage,
          estimatedPrice: rideGroupId
            ? matches.find(m => m.id === rideGroupId)?.pricePerPerson ?? null
            : null,
          ...(rideGroupId ? { rideGroupId } : {}),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Errore nella registrazione');
        setRegistering(false);
        return;
      }

      // Mostra conferma e vai alla dashboard
      setRegistered(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch {
      setError('Errore nella registrazione della richiesta');
      setRegistering(false);
    }
  };

  if (!isAuthenticated || !currentFlight) return null;

  if (registered) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-4">
        <div className="text-center animate-fade-up">
          <div className="w-20 h-20 bg-success/10 border border-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Richiesta registrata!</h2>
          <p className="text-ink-secondary text-sm">
            Ti avvisiamo via email appena il gruppo è completo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-[#0B0B0B]/90 backdrop-blur border-b border-surface-4 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => router.push('/flight-search')}
            className="p-2 rounded-xl text-ink-secondary hover:text-white hover:bg-surface-2 transition-all">
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
        {registering && (
          <div className="fixed inset-0 z-50 bg-[#0B0B0B]/90 backdrop-blur flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-primary-400 animate-spin mx-auto mb-4" />
              <p className="text-white font-bold">Registrazione in corso...</p>
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
            <button onClick={findMatches}
              className="px-5 py-2.5 bg-surface-2 border border-surface-5 rounded-xl text-sm text-white font-medium hover:border-primary-500/30 transition-all">
              Riprova
            </button>
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-16 h-16 bg-primary-500/10 border border-primary-500/20 rounded-2xl flex items-center justify-center mb-5">
              <Plane className="w-8 h-8 text-primary-400" />
            </div>
            <p className="text-white font-bold text-xl mb-2">Nessun gruppo disponibile ora</p>
            <p className="text-ink-secondary text-sm mb-1 max-w-xs">
              Sei tra i primi per il volo <strong className="text-white">{currentFlight.code}</strong>.
              Registra la tua richiesta — ti avvisiamo quando il gruppo è pronto.
            </p>
            <p className="text-xs text-ink-muted mt-2 mb-8 max-w-xs">
              Nessun pagamento ora. Paghi solo dopo aver visto e accettato il gruppo.
            </p>
            <button onClick={() => registerRequest()} disabled={registering}
              className="px-8 py-4 bg-primary-500 text-[#0B0B0B] font-bold rounded-2xl hover:bg-primary-400 active:scale-[0.98] transition-all shadow-teal disabled:opacity-40">
              Registra la mia richiesta — è gratis
            </button>
          </div>
        ) : (
          <>
            {/* Confronto prezzo — usa il prezzo del primo match disponibile */}
            {matches[0]?.pricePerPerson > 0 && (() => {
              const flanvoPrice = matches[0].pricePerPerson;
              const taxiEstimate = Math.round(flanvoPrice * 2.8);
              const saving = taxiEstimate - Math.round(flanvoPrice);
              const pct = Math.round((saving / taxiEstimate) * 100);
              return (
                <div className="mb-5 bg-surface-1 border border-surface-4 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingDown className="w-4 h-4 text-primary-400" />
                    <p className="text-xs font-bold text-white">Quanto risparmi con Flanvo</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-surface-2 rounded-xl px-3 py-3">
                      <p className="text-[10px] text-ink-muted mb-1">Taxi privato</p>
                      <p className="text-base font-bold text-ink-secondary line-through">~€{taxiEstimate}</p>
                      <p className="text-[10px] text-ink-muted">a persona</p>
                    </div>
                    <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl px-3 py-3 flex flex-col items-center justify-center">
                      <p className="text-[10px] font-bold text-primary-400 mb-0.5">Risparmi</p>
                      <p className="text-lg font-black text-primary-400">-{pct}%</p>
                      <p className="text-[10px] text-primary-400">€{saving} in meno</p>
                    </div>
                    <div className="bg-success/8 border border-success/20 rounded-xl px-3 py-3">
                      <p className="text-[10px] text-ink-muted mb-1">Con Flanvo</p>
                      <p className="text-base font-bold text-success">~€{Math.round(flanvoPrice)}</p>
                      <p className="text-[10px] text-ink-muted">a persona</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-ink-muted text-center mt-2">
                    Stima taxi basata su tariffe medie aeroportuali · prezzo Flanvo varia con il gruppo
                  </p>
                </div>
              );
            })()}

            <div className="mb-5 bg-surface-2 border border-surface-5 rounded-xl px-4 py-3 flex items-start gap-3">
              <div className="w-2 h-2 bg-success rounded-full mt-1.5 shrink-0 animate-pulse" />
              <p className="text-xs text-ink-secondary leading-relaxed">
                <strong className="text-white">Unisciti al gruppo</strong> — nessun pagamento ora.
                Riceverai una email di conferma con il prezzo finale. L&apos;addebito avviene quando il driver accetta la corsa.
              </p>
            </div>
            <div className="space-y-4">
              {matches.map((match) => (
                <RideMatchCard
                  key={match.id}
                  match={match}
                  onSelect={(m) => registerRequest(m.id)}
                  disabled={registering}
                />
              ))}
            </div>
            <p className="text-center text-xs text-ink-muted mt-6">
              Addebito all&apos;accettazione del driver · Nessun addebito prima del match
            </p>
          </>
        )}
      </div>
    </div>
  );
}
