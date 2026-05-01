'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Map, { Marker, NavigationControl } from 'react-map-gl';
import { useAuthStore } from '@/store';
import DriverChat from '@/components/DriverChat';
import {
  Navigation, MapPin, Users, CheckCircle,
  ArrowDown, ArrowUp, Phone, X, AlertCircle, Loader2, Play, Clock, CheckCheck, MessageCircle, FileText,
} from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Passenger {
  id: string; name: string; phone: string;
  groupMemberId: string;
  arrivedAtPickup?: string | null;
  status: 'waiting' | 'onboard' | 'dropped';
  luggage: number;
  destination: { address: string; lat: number; lng: number };
}

interface Stop {
  id: string; address: string; lat: number; lng: number;
  type: 'pickup' | 'dropoff'; passenger: Passenger; completed: boolean;
}

export default function DriverNavigationPage({ params }: { params: { id: string } }) {
  const [currentLocation, setCurrentLocation] = useState({ lat: 37.4668, lng: 15.0664 });
  const [stops, setStops] = useState<Stop[]>([]);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [viewState, setViewState] = useState({ longitude: 15.0664, latitude: 37.4668, zoom: 13 });
  const [showPanel, setShowPanel] = useState(true);
  const [rideStatus, setRideStatus] = useState<'pre_start' | 'in_progress' | 'completed'>('pre_start');
  const [completing, setCompleting] = useState(false);
  const [captureError, setCaptureError] = useState('');
  const [starting, setStarting] = useState(false);
  const [noShowMinsLeft, setNoShowMinsLeft] = useState<number | null>(null);
  const [atPickupZone, setAtPickupZone] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [docOpen, setDocOpen] = useState(false);
  const [arrivedCount, setArrivedCount] = useState(0);
  const [noShowAvailableAt, setNoShowAvailableAt] = useState<string | null>(null);
  const [flightStatus, setFlightStatus] = useState<string | null>(null);
  const [meetingPoint, setMeetingPoint] = useState<string | null>(null);
  const [meetingTime, setMeetingTime] = useState<string | null>(null);
  const [rideGroupId, setRideGroupId] = useState<string | null>(null);
  const [flightCode, setFlightCode] = useState<string | null>(null);
  const [pickupTime, setPickupTime] = useState<string | null>(null);

  const { user, isAuthenticated, token } = useAuthStore();
  const router = useRouter();

  // Countdown automatico al no-show — da noShowAvailableAt del server, nessun tap driver
  useEffect(() => {
    if (!noShowAvailableAt) return;
    const target = new Date(noShowAvailableAt).getTime();
    const calc = () => Math.max(0, Math.ceil((target - Date.now()) / 60_000));
    setNoShowMinsLeft(calc());
    const id = setInterval(() => {
      const rem = calc();
      setNoShowMinsLeft(rem);
      if (rem === 0) clearInterval(id);
    }, 30_000);
    return () => clearInterval(id);
  }, [noShowAvailableAt]);
  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

  const authToken = () => token || localStorage.getItem('flanvo_token') || '';

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'driver') { router.push('/driver/login'); return; }

    fetch('/api/driver/rides', { headers: { Authorization: `Bearer ${authToken()}` } })
      .then(r => r.json())
      .then(data => {
        const ride = data.rides?.find((r: { id: string; flightStatus?: string; meetingPoint?: string; meetingTime?: string; pickupTime?: string; flight?: { code?: string }; arrivedCount?: number }) => r.id === params.id);
        if (ride?.flightStatus) setFlightStatus(ride.flightStatus);
        if (ride?.meetingPoint) setMeetingPoint(ride.meetingPoint);
        if (ride?.meetingTime) setMeetingTime(ride.meetingTime);
        if (ride?.id) setRideGroupId(ride.id);
        if (ride?.flight?.code) setFlightCode(ride.flight.code);
        if (ride?.pickupTime) setPickupTime(ride.pickupTime);
        if (ride?.arrivedCount !== undefined) setArrivedCount(ride.arrivedCount);
        if (ride?.noShowAvailableAt) setNoShowAvailableAt(ride.noShowAvailableAt);
        if (!ride) return;

        const builtStops: Stop[] = [];

        // Pickup unico: aeroporto
        const pickupAddr = ride.flight?.arrivalAirport ? `Aeroporto ${ride.flight.arrivalAirport}` : 'Aeroporto';
        if (ride.passengers?.length > 0) {
          builtStops.push({
            id: 'pickup-0',
            address: pickupAddr,
            lat: 37.4668, lng: 15.0664,
            type: 'pickup',
            completed: false,
            passenger: {
              ...ride.passengers[0],
              groupMemberId: ride.passengers[0].groupMemberId || '',
              arrivedAtPickup: ride.passengers[0].arrivedAtPickup ?? null,
              status: 'waiting', luggage: 0,
              destination: { address: '', lat: 0, lng: 0 },
            },
          });
        }

        // Un dropoff per ogni passeggero
        ride.destinations?.forEach((d: { city: string; address: string; lat?: number; lng?: number }, i: number) => {
          const pax = ride.passengers?.[i];
          if (!pax) return;
          builtStops.push({
            id: `drop-${i}`,
            address: d.address || d.city,
            lat: d.lat || 37.5, lng: d.lng || 15.1,
            type: 'dropoff',
            completed: false,
            passenger: {
              id: pax.id, name: pax.name, phone: pax.phone || '',
              groupMemberId: pax.groupMemberId || '',
              status: 'waiting', luggage: 0,
              destination: { address: d.address, lat: d.lat || 0, lng: d.lng || 0 },
            },
          });
        });

        if (builtStops.length) {
          setStops(builtStops);
          setViewState({ longitude: builtStops[0].lng, latitude: builtStops[0].lat, zoom: 13 });
        }
      }).catch(() => {});

    // Polling arrivedCount ogni 30s quando siamo in pre_start e volo atterrato
    const pollArrived = setInterval(() => {
      if (rideStatus !== 'pre_start') { clearInterval(pollArrived); return; }
      fetch('/api/driver/rides', { headers: { Authorization: `Bearer ${authToken()}` } })
        .then(r => r.json())
        .then(data => {
          const r = data.rides?.find((x: { id: string }) => x.id === params.id);
          if (r?.arrivedCount !== undefined) setArrivedCount(r.arrivedCount);
          if (r?.flightStatus) setFlightStatus(r.flightStatus);
        }).catch(() => {});
    }, 30_000);

    // GPS live ogni 10s
    if (navigator.geolocation) {
      const send = (pos: GeolocationPosition) => {
        setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        fetch('/api/driver/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken()}` },
          body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        }).catch(() => {});
      };
      navigator.geolocation.getCurrentPosition(send, () => {});
      const id = setInterval(() => navigator.geolocation.getCurrentPosition(send, () => {}), 10000);
      return () => { clearInterval(id); clearInterval(pollArrived); };
    }
    return () => clearInterval(pollArrived);
  }, [isAuthenticated, user, router, params.id, rideStatus]); // eslint-disable-line react-hooks/exhaustive-deps

const handleStartRide = async () => {
    setStarting(true);
    try {
      const res = await fetch('/api/driver/rides', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken()}` },
        body: JSON.stringify({ rideId: params.id, status: 'started' }),
      });
      if (res.ok) setRideStatus('in_progress');
    } catch { /* silent */ }
    setStarting(false);
  };

  const handleOnboard = (id: string) =>
    setStops(s => s.map(stop =>
      stop.passenger.id === id && stop.type === 'pickup'
        ? { ...stop, completed: true, passenger: { ...stop.passenger, status: 'onboard' } }
        : stop
    ));

  const handleDropped = (id: string) =>
    setStops(s => s.map(stop =>
      stop.passenger.id === id && stop.type === 'dropoff'
        ? { ...stop, completed: true, passenger: { ...stop.passenger, status: 'dropped' } }
        : stop
    ));

  const handleNext = () => {
    const next = stops.findIndex((s, i) => i > currentStopIndex && !s.completed);
    if (next !== -1) {
      setCurrentStopIndex(next);
      setViewState({ longitude: stops[next].lng, latitude: stops[next].lat, zoom: 14 });
    } else {
      setRideStatus('completed');
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    setCaptureError('');
    try {
      const res = await fetch('/api/payments/capture-dropoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken()}` },
        body: JSON.stringify({ rideGroupId: params.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCaptureError(data.error || 'Errore nel completamento. Contatta il supporto.');
        setCompleting(false);
        return;
      }
      router.push('/driver/dashboard');
    } catch {
      setCaptureError('Errore di connessione. Riprova o contatta il supporto.');
      setCompleting(false);
    }
  };

  if (!isAuthenticated || user?.role !== 'driver') return null;

  // Foglio di servizio overlay
  const ServiceDocument = () => (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setDocOpen(false)}>
      <div className="bg-white text-black rounded-2xl max-w-sm w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Flanvo — Foglio di Servizio</p>
            <p className="text-xs text-gray-500">Legge 21/1992 — NCC</p>
          </div>
          <button onClick={() => setDocOpen(false)} className="text-gray-400 hover:text-black">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="border-t border-gray-200 pt-4 space-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">Numero prenotazione</p>
            <p className="font-mono font-bold text-sm">{rideGroupId?.slice(-8).toUpperCase() ?? '—'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">Volo</p>
            <p className="font-bold text-sm">{flightCode ?? '—'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">Data e ora servizio</p>
            <p className="font-bold text-sm">
              {pickupTime
                ? new Date(pickupTime).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">Passeggeri (prenotati)</p>
            <div className="space-y-1">
              {stops.filter(s => s.type === 'dropoff').map(s => (
                <div key={s.id} className="flex items-center justify-between">
                  <p className="text-sm font-medium">{s.passenger.name}</p>
                  <p className="text-xs text-gray-500 truncate ml-2">{s.address.split(',')[0]}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">Autista</p>
            <p className="font-bold text-sm">{user?.name ?? '—'}</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Il presente documento attesta la prenotazione del servizio ai sensi dell&apos;art. 11 L. 21/1992 e delle ordinanze ENAC vigenti. Esibire su richiesta degli organi di vigilanza.
          </p>
        </div>
      </div>
    </div>
  );

  // Variabili derivate per la schermata pre_start
  const dropoffStops = stops.filter(s => s.type === 'dropoff');
  // Passeggeri ancora attivi (non marcati no-show)
  const activeStops = dropoffStops.filter(s => s.passenger.status !== 'dropped');
  const activePax = activeStops.length;
  const passengersWaiting = activeStops.filter(s => !s.passenger.arrivedAtPickup);
  const noShowAvailable = noShowMinsLeft === 0;
  // Soglia spostamento al punto di incontro:
  // - 1-2 passeggeri: tutti (gruppo piccolo, attesa breve)
  // - 3-4 passeggeri: 75% (il driver parte, gli altri arrivano mentre si sposta)
  // - 5-7 passeggeri: 60% (stesso principio, più flessibilità)
  const moveThreshold = activePax <= 2
    ? activePax
    : activePax <= 4
    ? Math.ceil(activePax * 0.75)
    : Math.ceil(activePax * 0.6);
  const activeArrived = activeStops.filter(s => s.passenger.arrivedAtPickup).length;
  const shouldMove = activePax > 0 && activeArrived >= moveThreshold;
  // Tutti no-show: nessun passeggero attivo rimasto
  const allNoShow = activePax === 0 && dropoffStops.length > 0;

  // Schermata PRE-START
  if (rideStatus === 'pre_start') {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex flex-col items-center justify-center px-4 py-8">
        {docOpen && <ServiceDocument />}
        <div className="w-full max-w-sm">

          {/* Volo badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-5 ${
            flightStatus === 'landed'   ? 'bg-success/15 text-success border border-success/20'
            : flightStatus === 'delayed'  ? 'bg-warning/15 text-warning border border-warning/20'
            : flightStatus === 'cancelled'? 'bg-red-500/15 text-red-400 border border-red-500/20'
            : 'bg-surface-2 text-ink-secondary border border-surface-5'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              flightStatus === 'landed' ? 'bg-success animate-pulse'
              : flightStatus === 'delayed' ? 'bg-warning'
              : 'bg-ink-muted'
            }`} />
            {flightStatus === 'landed' ? 'ATTERRATO' : flightStatus === 'delayed' ? 'IN RITARDO' : flightStatus === 'cancelled' ? 'CANCELLATO' : 'IN VOLO'}
          </div>

          {/* Titolo e istruzione principale */}
          {flightStatus !== 'landed' ? (
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">In attesa del volo</h1>
              <p className="text-ink-secondary text-sm">
                Riceverai una notifica quando il volo {flightCode} atterra. Tieniti pronto.
              </p>
            </div>
          ) : (
            <div className="mb-5">
              <h1 className="text-2xl font-bold text-white mb-2">Volo atterrato</h1>
              <div className="bg-surface-1 border border-surface-4 rounded-2xl px-4 py-3 flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-primary-400 mb-0.5">Aspetta nel polmone NCC</p>
                  <p className="text-sm text-white">{meetingPoint ?? 'Area NCC dedicata'}</p>
                  <p className="text-xs text-ink-muted mt-1">
                    Ti sposti all&apos;accosto solo quando i passeggeri premono &quot;Sono qui&quot;
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Countdown no-show automatico */}
          {flightStatus === 'landed' && noShowMinsLeft !== null && noShowMinsLeft > 0 && (
            <div className="bg-warning/8 border border-warning/20 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
              <Clock className="w-4 h-4 text-warning shrink-0" />
              <div>
                <p className="text-xs font-bold text-warning">No-show disponibile tra {noShowMinsLeft} min</p>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  {meetingTime
                    ? `Scadenza: ${new Date(new Date(meetingTime).getTime() + 20 * 60_000).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`
                    : 'In attesa del meetingTime'}
                </p>
              </div>
            </div>
          )}

          {/* Lista passeggeri con badge "sono qui" */}
          <div className="bg-surface-1 border border-surface-4 rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-ink-secondary">Passeggeri ({activePax})</p>
              {arrivedCount > 0 && (
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                  arrivedCount === activePax
                    ? 'bg-success/15 text-success border border-success/25'
                    : 'bg-warning/15 text-warning border border-warning/25'
                }`}>
                  {arrivedCount === activePax ? '✓ Tutti all\'uscita' : `${arrivedCount}/${activePax} all'uscita`}
                </span>
              )}
            </div>
            <div className="space-y-2">
              {dropoffStops.map(s => (
                <div key={s.id} className="flex items-center gap-3 py-1">
                  <div className="w-7 h-7 bg-primary-500/15 rounded-lg flex items-center justify-center text-primary-400 text-xs font-bold shrink-0">
                    {s.passenger.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-white">{s.passenger.name}</p>
                      {s.passenger.arrivedAtPickup
                        ? <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-success/15 border border-success/25 rounded-md text-[10px] font-bold text-success">
                            <CheckCircle className="w-2.5 h-2.5" /> All&apos;uscita
                          </span>
                        : noShowAvailable
                        ? <span className="text-[10px] font-bold text-red-400">Non si è presentato</span>
                        : null}
                    </div>
                    <p className="text-xs text-ink-muted truncate">{s.address}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stato spostamento — cambia in base a quanti hanno premuto */}
          {flightStatus === 'landed' && activeArrived > 0 && (
            <div className={`rounded-2xl px-4 py-3 mb-4 flex items-start gap-3 ${
              activeArrived === activePax
                ? 'bg-success/10 border border-success/25'
                : shouldMove
                ? 'bg-primary-500/8 border border-primary-500/25'
                : 'bg-surface-1 border border-surface-4'
            }`}>
              <ArrowDown className={`w-4 h-4 shrink-0 mt-0.5 ${
                activeArrived === activePax ? 'text-success' : shouldMove ? 'text-primary-400' : 'text-ink-muted'
              }`} />
              <div className="flex-1">
                <p className={`text-sm font-bold ${
                  activeArrived === activePax ? 'text-success' : shouldMove ? 'text-primary-400' : 'text-ink-secondary'
                }`}>
                  {activeArrived === activePax
                    ? 'Tutti pronti — spostati al punto di incontro'
                    : shouldMove
                    ? `${activeArrived}/${activePax} pronti — vai al punto di incontro`
                    : `${activeArrived}/${activePax} all'uscita — aspetta ancora (mancano ${moveThreshold - activeArrived})`}
                </p>
                {shouldMove && meetingPoint && (
                  <p className="text-xs text-ink-muted mt-1">{meetingPoint}</p>
                )}
              </div>
            </div>
          )}

          {/* Fix 2: "Sono al punto di incontro" — solo quando soglia raggiunta, segnala ai passeggeri */}
          {shouldMove && !atPickupZone && (
            <button
              onClick={async () => {
                setAtPickupZone(true);
                // Notifica passeggeri che il driver è arrivato al punto di incontro
                await fetch('/api/driver/rides', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken()}` },
                  body: JSON.stringify({ rideId: params.id, status: 'at_pickup' }),
                }).catch(() => {});
              }}
              className="w-full py-3.5 mb-4 bg-surface-2 border border-primary-500/30 text-primary-400 font-bold rounded-2xl hover:bg-primary-500/10 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <CheckCheck className="w-4 h-4" />
              Sono al punto di incontro
            </button>
          )}
          {atPickupZone && (
            <div className="py-3 px-4 bg-success/10 border border-success/20 rounded-2xl flex items-center gap-2 text-success text-sm font-semibold mb-4">
              <CheckCircle className="w-4 h-4" /> I passeggeri sanno che sei al punto di incontro
            </div>
          )}

          {/* No-show buttons — appaiono automaticamente a tempo scaduto */}
          {noShowAvailable && passengersWaiting.length > 0 && (
            <div className="bg-red-500/8 border border-red-500/20 rounded-2xl p-4 mb-4">
              <p className="text-xs font-bold text-red-400 mb-3">
                Tempo scaduto — segna i passeggeri non presentati:
              </p>
              <div className="space-y-2">
                {passengersWaiting.map(s => (
                  <button
                    key={s.passenger.id}
                    onClick={async () => {
                      const memberId = s.passenger.groupMemberId;
                      if (!memberId) return;
                      await fetch('/api/payments/handle-no-show', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken()}` },
                        body: JSON.stringify({ memberId }),
                      });
                      setStops(prev => prev.map(st =>
                        st.passenger.id === s.passenger.id
                          ? { ...st, passenger: { ...st.passenger, status: 'dropped' } }
                          : st
                      ));
                    }}
                    className="w-full py-2.5 px-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-all text-left flex items-center gap-2"
                  >
                    <X className="w-4 h-4 shrink-0" />
                    No-show: {s.passenger.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fix 5: tutti no-show → chiudi servizio */}
          {allNoShow ? (
            <button
              onClick={async () => {
                await fetch('/api/driver/rides', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken()}` },
                  body: JSON.stringify({ rideId: params.id, status: 'cancelled_no_show' }),
                }).catch(() => {});
                router.push('/driver/dashboard');
              }}
              className="w-full py-4 bg-surface-2 border border-surface-5 text-ink-secondary font-bold rounded-2xl hover:text-white transition-all flex items-center justify-center gap-2 mb-3 text-sm"
            >
              Chiudi servizio — nessun passeggero presente
            </button>
          ) : (
            /* Inizia corsa — abilitato solo quando la soglia è raggiunta */
            <button
              onClick={handleStartRide}
              disabled={starting || !shouldMove}
              className="w-full py-4 bg-primary-500 text-[#0B0B0B] font-bold rounded-2xl hover:bg-primary-400 active:scale-[0.98] transition-all disabled:opacity-30 flex items-center justify-center gap-2 mb-3"
            >
              {starting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
              {starting
                ? 'Avvio in corso...'
                : !shouldMove
                ? `Aspetta — ${Math.max(0, moveThreshold - activeArrived)} passeggeri ancora attesi`
                : 'Inizia corsa'}
            </button>
          )}

          <div className="flex gap-2">
            <button onClick={() => router.push('/driver/dashboard')} className="flex-1 py-3 text-ink-muted text-sm hover:text-white transition-colors">
              ← Dashboard
            </button>
            <button
              onClick={() => setDocOpen(true)}
              className="flex items-center gap-1.5 px-4 py-3 bg-surface-2 border border-surface-5 rounded-xl text-ink-secondary text-xs font-semibold hover:border-primary-500/30 hover:text-white transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              Foglio di servizio
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Schermata COMPLETATA
  if (rideStatus === 'completed') {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 bg-success/10 border border-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Tutti consegnati!</h1>
          <p className="text-ink-secondary text-sm mb-8">
            Premi il tasto per addebitare i pagamenti e accreditare i tuoi guadagni.
          </p>
          {captureError && (
            <div className="mb-4 bg-danger/10 border border-danger/20 rounded-xl px-4 py-3 flex items-start gap-2 text-left">
              <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
              <p className="text-xs text-danger">{captureError}</p>
            </div>
          )}
          <button
            onClick={handleComplete}
            disabled={completing}
            className="w-full py-4 bg-primary-500 text-[#0B0B0B] font-bold rounded-2xl hover:bg-primary-400 transition-all disabled:opacity-40 flex items-center justify-center gap-2 mb-3"
          >
            {completing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            {completing ? 'Addebito in corso...' : 'Conferma completamento'}
          </button>
          {captureError && (
            <button onClick={() => router.push('/driver/dashboard')} className="w-full py-3 bg-surface-2 border border-surface-5 text-ink-secondary font-medium rounded-xl hover:text-white transition-all text-sm">
              Torna alla dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  const currentStop = stops[currentStopIndex];
  const uniqueIds = Array.from(new Set(stops.filter(s => s.type === 'dropoff').map(s => s.passenger.id)));
  const allPassengers = uniqueIds.map(id => stops.find(s => s.passenger.id === id)?.passenger).filter(Boolean) as Passenger[];

  // Schermata NAVIGAZIONE
  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <Map
        {...viewState}
        onMove={e => setViewState(e.viewState)}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" />

        <Marker longitude={currentLocation.lng} latitude={currentLocation.lat} anchor="center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary-500 rounded-full opacity-30 animate-ping" />
            <div className="relative bg-primary-500 rounded-full p-2.5 shadow-teal border-2 border-[#0B0B0B]">
              <Navigation className="w-5 h-5 text-[#0B0B0B]" />
            </div>
          </div>
        </Marker>

        {stops.map((stop, i) => (
          <Marker key={stop.id} longitude={stop.lng} latitude={stop.lat} anchor="bottom">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 border-[#0B0B0B] ${
                stop.completed ? 'bg-success text-white'
                : i === currentStopIndex ? 'bg-primary-500 text-[#0B0B0B] animate-pulse'
                : 'bg-surface-3 text-ink-secondary'
              }`}>{i + 1}</div>
              <div className={`w-0.5 h-3 ${stop.completed ? 'bg-success' : 'bg-surface-4'}`} />
              <div className={`w-1.5 h-1.5 rounded-full ${stop.completed ? 'bg-success' : i === currentStopIndex ? 'bg-primary-500' : 'bg-surface-4'}`} />
            </div>
          </Marker>
        ))}
      </Map>

      {/* Current stop bar */}
      <div className="absolute top-4 left-4 right-16 z-10">
        <div className="bg-[#0B0B0B]/90 backdrop-blur border border-surface-4 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              currentStop?.type === 'pickup' ? 'bg-primary-500/20 text-primary-400' : 'bg-warning/15 text-warning'
            }`}>
              {currentStop?.type === 'pickup' ? 'RITIRO' : 'CONSEGNA'}
            </span>
            <span className="text-xs text-ink-muted">Fermata {currentStopIndex + 1}/{stops.length}</span>
          </div>
          <p className="font-bold text-white text-sm mb-1">{currentStop?.passenger.name}</p>
          <div className="flex items-center gap-1.5 text-xs text-ink-secondary">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{currentStop?.address}</span>
          </div>
          {currentStop?.passenger.phone && (
            <a href={`tel:${currentStop.passenger.phone}`}
              className="mt-3 flex items-center gap-2 py-2 px-3 bg-primary-500/10 border border-primary-500/20 rounded-xl text-primary-400 text-xs font-medium">
              <Phone className="w-3.5 h-3.5" /> Chiama passeggero
            </a>
          )}
        </div>
      </div>

      {/* Panel toggle */}
      <button onClick={() => setShowPanel(!showPanel)}
        className="absolute top-4 right-4 z-10 p-3 bg-[#0B0B0B]/90 backdrop-blur border border-surface-4 rounded-xl text-ink-secondary hover:text-white transition-all">
        <Users className="w-5 h-5" />
      </button>

      {/* Chat button */}
      <button onClick={() => setChatOpen(true)}
        className="absolute top-20 right-4 z-10 p-3 bg-[#0B0B0B]/90 backdrop-blur border border-surface-4 rounded-xl text-ink-secondary hover:text-white transition-all">
        <MessageCircle className="w-5 h-5" />
      </button>

      <DriverChat
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        driverName="Tu (Driver)"
        groupId={params.id}
      />

      {/* Passengers panel */}
      {showPanel && (
        <div className="absolute top-4 right-4 bottom-28 w-72 z-10 overflow-hidden">
          <div className="h-full flex flex-col bg-[#0B0B0B]/95 backdrop-blur border border-surface-4 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-4">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-primary-400" /> Passeggeri ({allPassengers.length})
              </span>
              <button onClick={() => setShowPanel(false)} className="p-1 text-ink-muted hover:text-white rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {allPassengers.map(p => (
                <div key={p.id} className={`rounded-xl p-3 border transition-all ${
                  p.status === 'onboard' ? 'bg-success/5 border-success/20'
                  : p.status === 'dropped' ? 'bg-surface-2 border-surface-4 opacity-60'
                  : 'bg-surface-2 border-surface-5'
                }`}>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-primary-500/15 rounded-lg flex items-center justify-center text-primary-400 text-sm font-bold">
                        {p.name.charAt(0)}
                      </div>
                      <p className="text-sm font-medium text-white">{p.name}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      p.status === 'onboard' ? 'bg-success/15 text-success'
                      : p.status === 'dropped' ? 'bg-surface-3 text-ink-muted'
                      : 'bg-warning/15 text-warning'
                    }`}>
                      {p.status === 'onboard' ? 'A bordo' : p.status === 'dropped' ? 'Consegnato' : 'In attesa'}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted mb-2.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{p.destination.address}
                  </p>
                  <div className="flex gap-2">
                    {p.status === 'waiting' && (
                      <>
                        <button onClick={() => handleOnboard(p.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-medium rounded-lg hover:bg-primary-500/20 transition-all">
                          <ArrowUp className="w-3.5 h-3.5" /> A bordo
                        </button>
                        <button onClick={async () => {
                          const memberId = p.groupMemberId;
                          if (!memberId) return;
                          await fetch('/api/payments/handle-no-show', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken()}` },
                            body: JSON.stringify({ memberId }),
                          });
                          setStops(s => s.filter(st => st.passenger.id !== p.id));
                        }}
                          className="p-1.5 bg-danger/10 border border-danger/20 rounded-lg text-danger hover:bg-danger/20 transition-all text-xs"
                          title="No-show">
                          ✗
                        </button>
                      </>
                    )}
                    {p.status === 'onboard' && (
                      <button onClick={() => handleDropped(p.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-warning/10 border border-warning/20 text-warning text-xs font-medium rounded-lg hover:bg-warning/20 transition-all">
                        <ArrowDown className="w-3.5 h-3.5" /> Sceso
                      </button>
                    )}
                    {p.phone && (
                      <a href={`tel:${p.phone}`}
                        className="p-1.5 bg-surface-3 border border-surface-5 rounded-lg text-ink-muted hover:text-white transition-all">
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom action bar */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="bg-[#0B0B0B]/95 backdrop-blur border border-surface-4 rounded-2xl p-4">
          {currentStop && !currentStop.completed && (
            <div className="flex items-center gap-2 mb-3 text-xs text-warning">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {currentStop.type === 'pickup' ? 'Conferma ritiro prima di procedere' : 'Conferma discesa prima di procedere'}
            </div>
          )}
          <button
            onClick={handleNext}
            disabled={!!(currentStop && !currentStop.completed)}
            className="w-full py-3.5 bg-primary-500 text-[#0B0B0B] font-bold rounded-xl hover:bg-primary-400 transition-all disabled:opacity-40 text-sm flex items-center justify-center gap-2"
          >
            {currentStopIndex >= stops.length - 1
              ? <><CheckCircle className="w-4 h-4" /> Completa corsa</>
              : <><Navigation className="w-4 h-4" /> Prossima fermata</>
            }
          </button>
        </div>
      </div>

      <style jsx global>{`
        .mapboxgl-ctrl-group { background: #141414 !important; border: 1px solid #2A2A2A !important; }
        .mapboxgl-ctrl-group button { background: transparent !important; color: #A1A1AA !important; }
        .mapboxgl-ctrl-group button:hover { background: #1A1A1A !important; color: #fff !important; }
      `}</style>
    </div>
  );
}
