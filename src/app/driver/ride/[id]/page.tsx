'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Map, { Marker, NavigationControl } from 'react-map-gl';
import { useAuthStore } from '@/store';
import DriverChat from '@/components/DriverChat';
import {
  Navigation, MapPin, Users, CheckCircle,
  ArrowDown, ArrowUp, Phone, X, AlertCircle, Loader2, Play, Clock, CheckCheck, MessageCircle,
} from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Passenger {
  id: string; name: string; phone: string;
  groupMemberId: string; // DB GroupMember.id per no-show
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
  const [atPickup, setAtPickup] = useState(false);
  const [atPickupTime, setAtPickupTime] = useState<Date | null>(null);
  const [noShowCountdown, setNoShowCountdown] = useState<number | null>(null); // minuti rimasti
  const [chatOpen, setChatOpen] = useState(false);
  const [flightStatus, setFlightStatus] = useState<string | null>(null);
  const [meetingPoint, setMeetingPoint] = useState<string | null>(null);
  const [meetingTime, setMeetingTime] = useState<string | null>(null);

  const { user, isAuthenticated, token } = useAuthStore();
  const router = useRouter();
  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

  const authToken = () => token || localStorage.getItem('flanvo_token') || '';

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'driver') { router.push('/driver/login'); return; }

    fetch('/api/driver/rides', { headers: { Authorization: `Bearer ${authToken()}` } })
      .then(r => r.json())
      .then(data => {
        const ride = data.rides?.find((r: { id: string; flightStatus?: string; meetingPoint?: string; meetingTime?: string }) => r.id === params.id);
        if (ride?.flightStatus) setFlightStatus(ride.flightStatus);
        if (ride?.meetingPoint) setMeetingPoint(ride.meetingPoint);
        if (ride?.meetingTime) setMeetingTime(ride.meetingTime);
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
            passenger: { ...ride.passengers[0], groupMemberId: ride.passengers[0].groupMemberId || '', status: 'waiting', luggage: 0, destination: { address: '', lat: 0, lng: 0 } },
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
      return () => clearInterval(id);
    }
  }, [isAuthenticated, user, router, params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAtPickup = async () => {
    setAtPickup(true);
    const now = new Date();
    setAtPickupTime(now);
    setNoShowCountdown(20);
    // Countdown: ogni minuto aggiorna i minuti rimasti
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - now.getTime()) / 60_000);
      const remaining = Math.max(0, 20 - elapsed);
      setNoShowCountdown(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 60_000);
    await fetch('/api/driver/rides', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken()}` },
      body: JSON.stringify({ rideId: params.id, status: 'at_pickup' }),
    }).catch(() => {});
  };

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

  // Schermata PRE-START
  if (rideStatus === 'pre_start') {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 bg-primary-500/10 border border-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Navigation className="w-10 h-10 text-primary-400" />
          </div>
          {/* Flight status badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6 ${
            flightStatus === 'landed' ? 'bg-success/15 text-success border border-success/20'
            : flightStatus === 'delayed' ? 'bg-warning/15 text-warning border border-warning/20'
            : flightStatus === 'cancelled' ? 'bg-danger/15 text-danger border border-danger/20'
            : 'bg-surface-2 text-ink-secondary border border-surface-5'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${flightStatus === 'landed' ? 'bg-success' : flightStatus === 'delayed' ? 'bg-warning' : 'bg-ink-muted'} ${flightStatus === 'landed' ? 'animate-pulse' : ''}`} />
            {flightStatus === 'landed' ? 'ATTERRATO' : flightStatus === 'delayed' ? 'IN RITARDO' : flightStatus === 'cancelled' ? 'CANCELLATO' : 'IN VOLO'}
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">
            {flightStatus === 'landed' ? 'Volo atterrato!' : 'In attesa del volo'}
          </h1>
          <p className="text-ink-secondary text-sm mb-6">
            {flightStatus === 'landed'
              ? `Dirigiti al punto di incontro${meetingTime ? ` entro le ${new Date(meetingTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}` : ''}.`
              : 'Riceverai una notifica quando il volo atterra.'}
          </p>

          {meetingPoint && (
            <div className="bg-primary-500/8 border border-primary-500/20 rounded-xl px-4 py-3 mb-5 text-left flex items-start gap-3">
              <MapPin className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-primary-400 mb-0.5">Punto di incontro</p>
                <p className="text-sm text-white">{meetingPoint}</p>
              </div>
            </div>
          )}

          {/* Passeggeri */}
          <div className="bg-surface-1 border border-surface-4 rounded-2xl p-4 mb-5 text-left space-y-2">
            <p className="text-xs font-bold text-ink-secondary mb-3">Passeggeri ({stops.filter(s => s.type === 'dropoff').length})</p>
            {stops.filter(s => s.type === 'dropoff').map(s => (
              <div key={s.id} className="flex items-center gap-3 py-1.5">
                <div className="w-7 h-7 bg-primary-500/15 rounded-lg flex items-center justify-center text-primary-400 text-xs font-bold shrink-0">
                  {s.passenger.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{s.passenger.name}</p>
                  <p className="text-xs text-ink-muted truncate">{s.address}</p>
                </div>
              </div>
            ))}
          </div>

          {/* "Sono al punto di incontro" — solo dopo atterraggio */}
          {flightStatus === 'landed' && !atPickup && (
            <button
              onClick={handleAtPickup}
              className="w-full py-3.5 mb-3 bg-surface-2 border border-primary-500/30 text-primary-400 font-bold rounded-2xl hover:bg-primary-500/10 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <CheckCheck className="w-4 h-4" />
              Sono al punto di incontro
            </button>
          )}
          {atPickup && (
            <div className="w-full mb-3 space-y-2">
              <div className="py-3 bg-success/10 border border-success/20 rounded-2xl flex items-center justify-center gap-2 text-success text-sm font-semibold">
                <CheckCircle className="w-4 h-4" /> Passeggeri avvisati del tuo arrivo
              </div>
              {noShowCountdown !== null && noShowCountdown > 0 && (
                <div className="py-2.5 px-4 bg-warning/8 border border-warning/20 rounded-xl flex items-center gap-2">
                  <Clock className="w-4 h-4 text-warning shrink-0" />
                  <p className="text-xs text-warning">
                    Attendi ancora <strong>{noShowCountdown} min</strong> prima di poter segnare un no-show
                  </p>
                </div>
              )}
              {noShowCountdown === 0 && (
                <div className="py-2 px-4 bg-danger/8 border border-danger/20 rounded-xl">
                  <p className="text-xs text-danger font-semibold mb-2">Tempo scaduto — puoi marcare i passeggeri assenti:</p>
                  {stops.filter(s => s.type === 'dropoff' && s.passenger.status === 'waiting').map(s => (
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
                        setStops(prev => prev.filter(st => st.passenger.id !== s.passenger.id));
                      }}
                      className="w-full mb-1 py-2 px-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-xs font-medium hover:bg-danger/20 transition-all text-left"
                    >
                      ✗ No-show: {s.passenger.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleStartRide}
            disabled={starting}
            className="w-full py-4 bg-primary-500 text-[#0B0B0B] font-bold rounded-2xl hover:bg-primary-400 active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {starting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            {starting ? 'Avvio in corso...' : 'Inizia corsa'}
          </button>
          <button onClick={() => router.push('/driver/dashboard')} className="mt-3 w-full py-3 text-ink-muted text-sm hover:text-white transition-colors">
            ← Torna alla dashboard
          </button>
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
