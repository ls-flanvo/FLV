'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useBookingStore } from '@/store';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { Flight } from '@/lib/types';
import {
  Plane, MapPin, ChevronRight, CheckCircle2,
  AlertCircle, Loader2, Clock, AlertTriangle, Sparkles
} from 'lucide-react';

type Step = 'flight' | 'destination' | 'passengers' | 'searching';

const PAX_OPTIONS = [1, 2, 3, 4, 5, 6, 7];
const BAG_OPTIONS = [
  { value: 0, label: '0', sub: 'Solo a mano' },
  { value: 1, label: '1', sub: '1 valigia' },
  { value: 2, label: '2', sub: '2 valigie' },
  { value: 3, label: '3+', sub: '3+ valigie' },
];

const STATUS_CONFIG = {
  scheduled: { label: 'In orario', color: 'text-success', bg: 'bg-success/10 border-success/20' },
  departed:  { label: 'In volo',   color: 'text-primary-400', bg: 'bg-primary-500/10 border-primary-500/20' },
  landed:    { label: 'Atterrato', color: 'text-success', bg: 'bg-success/10 border-success/20' },
  delayed:   { label: 'In ritardo', color: 'text-warning', bg: 'bg-warning/10 border-warning/20' },
  cancelled: { label: 'Cancellato', color: 'text-danger', bg: 'bg-danger/10 border-danger/20' },
  diverted:  { label: 'Dirottato', color: 'text-warning', bg: 'bg-warning/10 border-warning/20' },
  boarding:  { label: 'Imbarco', color: 'text-primary-400', bg: 'bg-primary-500/10 border-primary-500/20' },
};

const SEARCH_STEPS = [
  { text: 'Verifica volo in tempo reale', ms: 0 },
  { text: 'Analisi destinazioni simili', ms: 500 },
  { text: 'Calcolo prezzo ottimale', ms: 1000 },
  { text: 'Composizione del gruppo', ms: 1400 },
];

function SearchingStep({ flight, destination }: { flight: Flight | null; destination: string }) {
  const [visible, setVisible] = useState<number[]>([]);
  const [done, setDone] = useState<number[]>([]);

  useEffect(() => {
    SEARCH_STEPS.forEach(({ ms }, i) => {
      setTimeout(() => setVisible(v => [...v, i]), ms);
      setTimeout(() => setDone(v => [...v, i]), ms + 400);
    });
  }, []);

  return (
    <div className="w-full text-center animate-fade-up">
      <div className="relative inline-flex items-center justify-center w-20 h-20 mb-8">
        <div className="absolute inset-0 rounded-full bg-primary-500/10 animate-pulse" />
        <div className="absolute inset-2 rounded-full bg-primary-500/15 animate-pulse" />
        <Loader2 className="w-10 h-10 text-primary-400 animate-spin relative z-10" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Stiamo cercando...</h2>
      <p className="text-ink-secondary text-sm mb-8">
        Passeggeri sul volo <span className="text-white font-semibold">{flight?.code}</span> diretti
        verso <span className="text-white font-semibold">{destination.split(',')[0]}</span>
      </p>
      <div className="space-y-3 text-left max-w-xs mx-auto">
        {SEARCH_STEPS.map(({ text }, i) => (
          <div key={i} className={`flex items-center gap-3 transition-all duration-500 ${
            visible.includes(i) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${
              done.includes(i)
                ? 'bg-primary-500 border-primary-500'
                : 'border-surface-5 bg-surface-2'
            }`}>
              {done.includes(i) && (
                <CheckCircle2 className="w-3 h-3 text-[#0B0B0B]" />
              )}
            </div>
            <span className={`text-sm transition-colors duration-300 ${done.includes(i) ? 'text-white' : 'text-ink-muted'}`}>
              {text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FlightSearchPage() {
  const [step, setStep] = useState<Step>('flight');
  const [flightCode, setFlightCode] = useState('');
  const [flight, setFlight] = useState<Flight | null>(null);
  const [flightLoading, setFlightLoading] = useState(false);
  const [flightError, setFlightError] = useState('');
  const [destination, setDestination] = useState('');
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destError, setDestError] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [luggage, setLuggage] = useState(1);
  const [aiAddressMode, setAiAddressMode] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');

  const { isAuthenticated } = useAuthStore();
  const { setCurrentFlight } = useBookingStore();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (step === 'flight') inputRef.current?.focus();
  }, [step]);

  // Auto-search con debounce 350ms
  const handleFlightInput = (val: string) => {
    const code = val.toUpperCase().replace(/\s/g, '');
    setFlightCode(code);
    setFlightError('');
    setFlight(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (code.length < 4 || code.length > 8) return;
    if (!/^[A-Z0-9]{2}[0-9]{1,4}$/.test(code)) return;

    debounceRef.current = setTimeout(async () => {
      setFlightLoading(true);
      try {
        const res = await fetch(`/api/flights/${code}`);
        const data = await res.json();
        if (data.flight) setFlight(data.flight);
        else setFlightError('Volo non trovato. Controlla il codice.');
      } catch {
        setFlightError('Errore nella ricerca. Riprova.');
      } finally {
        setFlightLoading(false);
      }
    }, 350);
  };

  const resolveAddressWithAI = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    setAiSuggestion('');
    try {
      const res = await fetch('/api/support/address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: aiInput, flightAirport: flight?.arrivalAirportName }),
      });
      const data = await res.json();
      if (data.query) {
        setAiSuggestion(data.query);
        setDestination(data.query);
        setAiAddressMode(false);
      }
    } catch { /* silent */ }
    finally { setAiLoading(false); }
  };

  const confirmFlight = () => {
    if (!flight) return;
    if (flight.status === 'cancelled') {
      setFlightError('Questo volo è stato cancellato.');
      return;
    }
    setStep('destination');
  };

  const confirmDestination = () => {
    if (!destinationCoords) { setDestError('Seleziona un indirizzo dalla lista'); return; }
    if (!destination || destination.length < 5) { setDestError('Indirizzo troppo breve'); return; }
    setStep('passengers');
  };

  const confirmPassengers = () => {
    if (!flight || !destinationCoords) return;
    setCurrentFlight(flight);
    const destinationObj = {
      address: destination,
      lat: destinationCoords.lat,
      lng: destinationCoords.lng,
      city: destination.split(',')[0] || destination,
    };
    localStorage.setItem('flanvo_destination', JSON.stringify(destinationObj));
    localStorage.setItem('flanvo_booking_info', JSON.stringify({ destination: destinationObj, passengers, luggage }));
    setStep('searching');
    setTimeout(() => router.push('/matching'), 1800);
  };

  const statusCfg = flight ? STATUS_CONFIG[flight.status] || STATUS_CONFIG.scheduled : null;

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex flex-col">
      {/* Progress bar */}
      <div className="h-0.5 bg-surface-4">
        <div
          className="h-full bg-primary-500 transition-all duration-500"
          style={{
            width: step === 'flight' ? '25%' : step === 'destination' ? '50%' : step === 'passengers' ? '75%' : '100%',
          }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-lg mx-auto w-full">

        {/* ── STEP 1: FLIGHT ─────────────────────────── */}
        {step === 'flight' && (
          <div className="w-full animate-fade-up">
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-500/10 border border-primary-500/20 rounded-2xl mb-5">
                <Plane className="w-7 h-7 text-primary-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Qual è il tuo volo?</h1>
              <p className="text-ink-secondary text-sm">Inserisci il codice — lo trovi sul biglietto</p>
            </div>

            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={flightCode}
                onChange={(e) => handleFlightInput(e.target.value)}
                placeholder="es. AZ1234"
                maxLength={8}
                className="w-full text-center text-4xl font-bold tracking-widest py-6 px-4
                  bg-surface-2 border border-surface-5 rounded-2xl text-white placeholder-surface-5
                  focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15
                  transition-all uppercase"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              {flightLoading && (
                <div className="absolute right-5 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                </div>
              )}
              {flight && !flightLoading && (
                <div className="absolute right-5 top-1/2 -translate-y-1/2">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                </div>
              )}
            </div>

            {/* Flight card — mostra subito il risultato */}
            {flight && !flightLoading && (
              <div className="mt-5 animate-fade-up">
                <div className="bg-surface-1 border border-surface-4 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-2xl font-bold text-white tracking-tight">{flight.code}</p>
                      <p className="text-ink-secondary text-sm">{flight.airline}</p>
                    </div>
                    {statusCfg && (
                      <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${statusCfg.bg} ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-xl font-bold text-white">{flight.departureAirport}</p>
                      <p className="text-xs text-ink-muted">Partenza</p>
                    </div>
                    <div className="flex-1 flex items-center gap-1">
                      <div className="h-px flex-1 bg-surface-5" />
                      <Plane className="w-4 h-4 text-primary-400" />
                      <div className="h-px flex-1 bg-surface-5" />
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-white">{flight.arrivalAirport}</p>
                      <p className="text-xs text-ink-muted">{flight.arrivalAirportName || 'Arrivo'}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-surface-4 flex items-center gap-2 text-sm text-ink-secondary">
                    <Clock className="w-4 h-4" />
                    <span>
                      {new Date(flight.scheduledTime).toLocaleString('it-IT', {
                        day: 'numeric', month: 'short',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                    {flight.delayMins > 0 && (
                      <span className="text-warning ml-auto font-medium">
                        +{flight.delayMins} min ritardo
                      </span>
                    )}
                  </div>
                </div>

                {flight.status === 'cancelled' ? (
                  <div className="mt-3 flex items-center gap-2 text-sm text-danger bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Volo cancellato — non è possibile prenotare
                  </div>
                ) : (
                  <button
                    onClick={confirmFlight}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-4 bg-primary-500 text-[#0B0B0B] font-bold text-lg rounded-2xl hover:bg-primary-400 active:scale-[0.98] transition-all shadow-teal"
                  >
                    Questo è il mio volo <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {flightError && (
              <div className="mt-4 flex items-center gap-2.5 text-sm text-danger bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {flightError}
              </div>
            )}

            <p className="text-center text-xs text-ink-muted mt-6">
              Es: AZ1234 · FR9901 · U26452
            </p>
          </div>
        )}

        {/* ── STEP 2: DESTINATION ───────────────────── */}
        {step === 'destination' && (
          <div className="w-full animate-fade-up">
            {/* Mini flight recap */}
            <button
              onClick={() => setStep('flight')}
              className="flex items-center gap-2 text-xs text-ink-muted mb-6 hover:text-ink-secondary transition-colors"
            >
              <Plane className="w-3.5 h-3.5" />
              {flight?.code} — {flight?.arrivalAirport} · modifica
            </button>

            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-500/10 border border-primary-500/20 rounded-2xl mb-5">
                <MapPin className="w-7 h-7 text-primary-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Dove ti porto?</h2>
              <p className="text-ink-secondary text-sm">
                L&apos;aeroporto di {flight?.arrivalAirportName || flight?.arrivalAirport} al tuo indirizzo
              </p>
            </div>

            <AddressAutocomplete
              value={destination}
              onChange={(addr, coords) => {
                setDestination(addr);
                setDestError('');
                if (coords) setDestinationCoords(coords);
              }}
              placeholder="Via, città o CAP..."
              label=""
              error={destError}
            />

            {destinationCoords && destination && !aiAddressMode && (
              <div className="mt-3 flex items-center gap-2 text-xs text-success">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Indirizzo trovato
              </div>
            )}

            {/* AI address helper */}
            {!aiAddressMode ? (
              <button
                type="button"
                onClick={() => setAiAddressMode(true)}
                className="mt-4 flex items-center gap-1.5 text-xs text-ink-muted hover:text-primary-400 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Non sai l&apos;indirizzo esatto? Descrivi in italiano
              </button>
            ) : (
              <div className="mt-4 bg-surface-2 border border-primary-500/20 rounded-xl p-3.5 animate-fade-up">
                <div className="flex items-center gap-1.5 text-xs text-primary-400 font-medium mb-2.5">
                  <Sparkles className="w-3.5 h-3.5" /> Descrivi la tua destinazione
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiInput}
                    onChange={e => setAiInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && resolveAddressWithAI()}
                    placeholder="Es: vicino alla stazione centrale di Palermo"
                    className="flex-1 px-3 py-2.5 bg-surface-3 border border-surface-5 rounded-lg text-sm text-white placeholder-ink-muted focus:outline-none focus:border-primary-500 transition-colors"
                    autoFocus
                  />
                  <button
                    onClick={resolveAddressWithAI}
                    disabled={!aiInput.trim() || aiLoading}
                    className="px-3.5 py-2.5 bg-primary-500 text-[#0B0B0B] rounded-lg font-bold text-sm hover:bg-primary-400 transition-all disabled:opacity-40 shrink-0"
                  >
                    {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cerca'}
                  </button>
                </div>
                {aiSuggestion && (
                  <p className="mt-2 text-xs text-success flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ricercato: {aiSuggestion}
                  </p>
                )}
                <button
                  onClick={() => { setAiAddressMode(false); setAiInput(''); setAiSuggestion(''); }}
                  className="mt-2 text-xs text-ink-muted hover:text-ink-secondary transition-colors"
                >
                  ← Torna alla ricerca normale
                </button>
              </div>
            )}

            <button
              onClick={confirmDestination}
              disabled={!destinationCoords}
              className="mt-6 w-full flex items-center justify-center gap-2 py-4 bg-primary-500 text-[#0B0B0B] font-bold text-lg rounded-2xl hover:bg-primary-400 active:scale-[0.98] transition-all shadow-teal disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Confermo la destinazione <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ── STEP 3: PASSENGERS ───────────────────── */}
        {step === 'passengers' && (
          <div className="w-full animate-fade-up">
            <button
              onClick={() => setStep('destination')}
              className="flex items-center gap-2 text-xs text-ink-muted mb-6 hover:text-ink-secondary transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" />
              {destination.split(',')[0]} · modifica
            </button>

            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Quanti siete?</h2>
              <p className="text-ink-secondary text-sm">Van da 7 posti — viaggi da solo o in gruppo</p>
            </div>

            {/* Passengers chips */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {PAX_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setPassengers(n)}
                  className={`py-5 rounded-2xl font-bold text-2xl transition-all active:scale-95 ${
                    passengers === n
                      ? 'bg-primary-500 text-[#0B0B0B] shadow-teal'
                      : 'bg-surface-2 text-ink-secondary border border-surface-5 hover:border-primary-500/40'
                  }`}
                >
                  {n}
                  <span className="block text-xs font-normal mt-0.5 opacity-70">
                    {n === 7 ? 'max' : 'pax'}
                  </span>
                </button>
              ))}
            </div>

            {/* Luggage */}
            <p className="text-sm font-semibold text-white mb-3">Bagagli da stiva</p>
            <div className="grid grid-cols-4 gap-2 mb-8">
              {BAG_OPTIONS.map((b) => (
                <button
                  key={b.value}
                  onClick={() => setLuggage(b.value)}
                  className={`py-3 rounded-xl transition-all active:scale-95 ${
                    luggage === b.value
                      ? 'bg-primary-500/15 border border-primary-500 text-primary-400'
                      : 'bg-surface-2 border border-surface-5 text-ink-secondary hover:border-surface-5'
                  }`}
                >
                  <p className="font-bold text-lg">{b.label}</p>
                  <p className="text-xs opacity-60">{b.sub}</p>
                </button>
              ))}
            </div>

            {/* Summary pill */}
            <div className="bg-surface-2 border border-surface-5 rounded-2xl px-5 py-4 flex items-center justify-between mb-6">
              <div>
                <p className="text-xs text-ink-muted mb-0.5">Riepilogo</p>
                <p className="text-white font-semibold">
                  {flight?.code} → {destination.split(',')[0]}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary-400">{passengers}</p>
                <p className="text-xs text-ink-muted">passeggeri</p>
              </div>
            </div>

            <button
              onClick={confirmPassengers}
              className="w-full py-4 bg-primary-500 text-[#0B0B0B] font-bold text-lg rounded-2xl hover:bg-primary-400 active:scale-[0.98] transition-all shadow-teal"
            >
              Cerca i miei compagni di viaggio →
            </button>
          </div>
        )}

        {/* ── STEP 4: SEARCHING ─────────────────────── */}
        {step === 'searching' && (
          <SearchingStep flight={flight} destination={destination} />
        )}
      </div>
    </div>
  );
}
