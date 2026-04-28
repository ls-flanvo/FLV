'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Map, { Marker, NavigationControl } from 'react-map-gl';
import { useAuthStore } from '@/store';
import {
  Navigation, MapPin, Users, CheckCircle,
  ArrowDown, ArrowUp, Phone, X, AlertCircle
} from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Passenger {
  id: string; name: string; phone: string;
  status: 'waiting' | 'onboard' | 'dropped';
  luggage: number;
  destination: { address: string; lat: number; lng: number };
}

interface Stop {
  id: string; address: string; lat: number; lng: number;
  type: 'pickup' | 'dropoff'; passenger: Passenger; completed: boolean;
}

export default function DriverNavigationPage({ params }: { params: { id: string } }) {
  const [currentLocation, setCurrentLocation] = useState({ lat: 45.4642, lng: 9.1900 });
  const [stops, setStops] = useState<Stop[]>([]);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [viewState, setViewState] = useState({ longitude: 9.1900, latitude: 45.4642, zoom: 13 });
  const [showPanel, setShowPanel] = useState(true);
  const [rideStatus, setRideStatus] = useState<'in_progress' | 'completed'>('in_progress');

  const { user, isAuthenticated, token } = useAuthStore();
  const router = useRouter();
  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'driver') { router.push('/driver/login'); return; }

    const t = token || localStorage.getItem('flanvo_token');
    fetch(`/api/driver/rides`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then(data => {
        const ride = data.rides?.find((r: { id: string }) => r.id === params.id);
        if (!ride) return;
        const builtStops: Stop[] = [];
        ride.passengers?.forEach((p: { id: string; name: string; phone: string; luggage?: number; destination?: { address: string; lat: number; lng: number } }, i: number) => {
          builtStops.push({
            id: `pick-${i}`, address: ride.destinations?.[0]?.address || 'Aeroporto',
            lat: ride.destinations?.[0]?.lat || 45.63, lng: ride.destinations?.[0]?.lng || 8.73,
            type: 'pickup', completed: false,
            passenger: { id: p.id, name: p.name, phone: p.phone || '', status: 'waiting', luggage: p.luggage || 0,
              destination: p.destination || { address: '', lat: 0, lng: 0 } },
          });
        });
        ride.destinations?.forEach((d: { city: string; address: string; lat?: number; lng?: number }, i: number) => {
          const pax = ride.passengers?.[i];
          if (!pax) return;
          builtStops.push({
            id: `drop-${i}`, address: d.address || d.city, lat: d.lat || 45.46, lng: d.lng || 9.19,
            type: 'dropoff', completed: false,
            passenger: { id: pax.id, name: pax.name, phone: pax.phone || '', status: 'waiting', luggage: 0,
              destination: { address: d.address, lat: d.lat || 0, lng: d.lng || 0 } },
          });
        });
        if (builtStops.length) {
          setStops(builtStops);
          setViewState({ longitude: builtStops[0].lng, latitude: builtStops[0].lat, zoom: 13 });
        }
      }).catch(() => {});

    if (navigator.geolocation) {
      const send = (pos: GeolocationPosition) => {
        setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        const t2 = token || localStorage.getItem('flanvo_token');
        fetch('/api/driver/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(t2 ? { Authorization: `Bearer ${t2}` } : {}) },
          body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        }).catch(() => {});
      };
      navigator.geolocation.getCurrentPosition(send, () => {});
      const geoInterval = setInterval(() => navigator.geolocation.getCurrentPosition(send, () => {}), 10000);
      return () => clearInterval(geoInterval);
    }
  }, [isAuthenticated, user, router, params.id, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentStop = stops[currentStopIndex];
  const uniqueIds = Array.from(new Set(stops.map(s => s.passenger.id)));
  const allPassengers = uniqueIds.map(id => stops.find(s => s.passenger.id === id)?.passenger).filter(Boolean) as Passenger[];

  const handleOnboard = (id: string) =>
    setStops(s => s.map(stop => stop.passenger.id === id && stop.type === 'pickup'
      ? { ...stop, completed: true, passenger: { ...stop.passenger, status: 'onboard' } } : stop));

  const handleDropped = (id: string) =>
    setStops(s => s.map(stop => stop.passenger.id === id && stop.type === 'dropoff'
      ? { ...stop, completed: true, passenger: { ...stop.passenger, status: 'dropped' } } : stop));

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
    const t = token || localStorage.getItem('flanvo_token');
    await fetch(`/api/payments/capture-dropoff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ rideId: params.id }),
    }).catch(() => {});
    router.push('/driver/dashboard');
  };

  if (!isAuthenticated || user?.role !== 'driver') return null;

  if (stops.length === 0 && !rideStatus) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-surface-2 border border-surface-4 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Navigation className="w-8 h-8 text-ink-muted" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Nessun percorso disponibile</h2>
          <p className="text-ink-secondary text-sm mb-6">
            Il percorso per questa corsa non è ancora stato generato. Torna alla dashboard e riprova.
          </p>
          <button onClick={() => window.history.back()}
            className="px-6 py-3 bg-primary-500 text-[#0B0B0B] font-bold rounded-xl hover:bg-primary-400 transition-all text-sm">
            ← Torna indietro
          </button>
        </div>
      </div>
    );
  }

  if (rideStatus === 'completed') {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 bg-success/10 border border-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Corsa completata!</h1>
          <p className="text-ink-secondary text-sm mb-8">
            Tutti i passeggeri sono stati consegnati. Il pagamento verrà accreditato sul tuo conto.
          </p>
          <button onClick={handleComplete}
            className="w-full py-3.5 bg-primary-500 text-[#0B0B0B] font-bold rounded-xl hover:bg-primary-400 transition-all mb-3">
            Conferma e torna alla dashboard
          </button>
          <button onClick={() => router.push('/driver/dashboard')}
            className="w-full py-3.5 bg-surface-2 border border-surface-5 text-ink-secondary font-medium rounded-xl hover:text-white transition-all">
            Dashboard
          </button>
        </div>
      </div>
    );
  }

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

        {/* Driver position marker */}
        <Marker longitude={currentLocation.lng} latitude={currentLocation.lat} anchor="center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary-500 rounded-full opacity-30 animate-ping" />
            <div className="relative bg-primary-500 rounded-full p-2.5 shadow-teal border-2 border-[#0B0B0B]">
              <Navigation className="w-5 h-5 text-[#0B0B0B]" />
            </div>
          </div>
        </Marker>

        {/* Stop markers */}
        {stops.map((stop, i) => (
          <Marker key={stop.id} longitude={stop.lng} latitude={stop.lat} anchor="bottom">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 border-[#0B0B0B] ${
                stop.completed ? 'bg-success text-white' : i === currentStopIndex ? 'bg-primary-500 text-[#0B0B0B] animate-pulse' : 'bg-surface-3 text-ink-secondary'
              }`}>{i + 1}</div>
              <div className={`w-0.5 h-3 ${stop.completed ? 'bg-success' : 'bg-surface-4'}`} />
              <div className={`w-1.5 h-1.5 rounded-full ${stop.completed ? 'bg-success' : i === currentStopIndex ? 'bg-primary-500' : 'bg-surface-4'}`} />
            </div>
          </Marker>
        ))}
      </Map>

      {/* Top current stop bar */}
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

      {/* Passengers toggle */}
      <button onClick={() => setShowPanel(!showPanel)}
        className="absolute top-4 right-4 z-10 p-3 bg-[#0B0B0B]/90 backdrop-blur border border-surface-4 rounded-xl text-ink-secondary hover:text-white transition-all">
        <Users className="w-5 h-5" />
      </button>

      {/* Passengers side panel */}
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
                      <div>
                        <p className="text-sm font-medium text-white">{p.name}</p>
                        <p className="text-xs text-ink-muted">{p.luggage} bag.</p>
                      </div>
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
                      <button onClick={() => handleOnboard(p.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-medium rounded-lg hover:bg-primary-500/20 transition-all">
                        <ArrowUp className="w-3.5 h-3.5" /> A bordo
                      </button>
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
              {currentStop.type === 'pickup'
                ? 'Conferma ritiro prima di procedere'
                : 'Conferma discesa prima di procedere'}
            </div>
          )}
          <button onClick={handleNext} disabled={currentStop && !currentStop.completed}
            className="w-full py-3.5 bg-primary-500 text-[#0B0B0B] font-bold rounded-xl hover:bg-primary-400 transition-all disabled:opacity-40 text-sm flex items-center justify-center gap-2">
            {currentStopIndex >= stops.length - 1 ? (
              <><CheckCircle className="w-4 h-4" /> Completa corsa</>
            ) : (
              <><Navigation className="w-4 h-4" /> Prossima fermata</>
            )}
          </button>
        </div>
      </div>

      <style jsx global>{`
        .mapboxgl-ctrl-group { background: #141414 !important; border: 1px solid #2A2A2A !important; }
        .mapboxgl-ctrl-group button { background: transparent !important; color: #A1A1AA !important; }
        .mapboxgl-ctrl-group button:hover { background: #1A1A1A !important; color: #fff !important; }
        .mapboxgl-ctrl-group button + button { border-top: 1px solid #2A2A2A !important; }
      `}</style>
    </div>
  );
}
