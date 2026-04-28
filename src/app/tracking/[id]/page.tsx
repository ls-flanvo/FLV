'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import TrackingMap from '@/components/TrackingMap';
import { Phone, MapPin, Clock, Navigation, Car, Star } from 'lucide-react';

interface TrackingData {
  status: string; message?: string;
  vehicle?: { brand: string; model: string; plate: string };
  currentLocation?: { lat: number; lng: number };
  destination?: { address: string; lat: number; lng: number };
  route?: { lat: number; lng: number }[];
  estimatedArrival?: string;
  driver?: { name: string; phone: string; rating: number };
}

export default function TrackingPage({ params }: { params: { id: string } }) {
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [error, setError] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTracking = async () => {
    try {
      const res = await fetch(`/api/tracking/${params.id}`);
      const json = await res.json();
      if (json.tracking) setTracking(json.tracking);
      else setError(json.error || 'Errore nel tracking');
    } catch {
      setError('Impossibile caricare il tracking');
    }
  };

  useEffect(() => {
    fetchTracking();
    intervalRef.current = setInterval(fetchTracking, 10000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-4">
        <div className="text-center">
          <Navigation className="w-12 h-12 text-ink-muted mx-auto mb-4" />
          <p className="text-white font-semibold mb-1">Tracking non disponibile</p>
          <p className="text-ink-muted text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!tracking) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (tracking.status === 'not_started') {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-surface-2 border border-surface-5 rounded-full flex items-center justify-center mx-auto mb-5">
            <Clock className="w-8 h-8 text-ink-muted" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Corsa non ancora iniziata</h2>
          <p className="text-ink-secondary text-sm mb-4">{tracking.message}</p>
          {tracking.destination && (
            <div className="bg-surface-1 border border-surface-4 rounded-xl px-4 py-3 inline-flex items-center gap-2 text-sm text-ink-secondary">
              <MapPin className="w-3.5 h-3.5 text-primary-400" />
              {tracking.destination.address}
            </div>
          )}
          <p className="text-xs text-ink-muted mt-6">Aggiornamento automatico ogni 10s</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      {/* Header */}
      <div className="bg-surface-1 border-b border-surface-4 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <svg width="14" height="19" viewBox="0 0 56 72" fill="none">
              <path d="M8 0 L48 0 L30 30 L48 30 L8 72 L22 40 L4 40 Z" fill="#00D1B2"/>
            </svg>
            <span className="text-sm font-bold text-white">flanvo</span>
          </Link>
          <div className="flex items-center gap-2 bg-success/10 border border-success/20 rounded-full px-3 py-1.5">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-success">In viaggio</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Map — main */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-surface-1 border border-surface-4 rounded-2xl overflow-hidden h-80 lg:h-96">
              {tracking.currentLocation && tracking.destination ? (
                <TrackingMap
                  currentLocation={tracking.currentLocation}
                  destination={tracking.destination}
                  route={tracking.route}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-ink-muted text-sm">
                  Posizione non disponibile
                </div>
              )}
            </div>

            {/* Route details */}
            <div className="bg-surface-1 border border-surface-4 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-400" /> Dettagli percorso
              </h3>
              <div className="space-y-3">
                {tracking.destination && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary-500/10 border border-primary-500/20 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-primary-500 rounded-full" />
                    </div>
                    <div>
                      <p className="text-xs text-ink-muted mb-0.5">Destinazione</p>
                      <p className="text-sm font-semibold text-white">{tracking.destination.address}</p>
                    </div>
                  </div>
                )}
                {tracking.estimatedArrival && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-warning/10 border border-warning/20 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-4 h-4 text-warning" />
                    </div>
                    <div>
                      <p className="text-xs text-ink-muted mb-0.5">Arrivo stimato</p>
                      <p className="text-sm font-semibold text-white">
                        {new Date(tracking.estimatedArrival).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Driver */}
            {tracking.driver && (
              <div className="bg-surface-1 border border-surface-4 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-primary-400" /> Il tuo autista
                </h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary-500/15 border border-primary-500/20 rounded-xl flex items-center justify-center text-primary-400 font-bold text-lg">
                    {tracking.driver.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{tracking.driver.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3 h-3 text-warning fill-warning" />
                      <span className="text-xs text-warning font-medium">{tracking.driver.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                {tracking.driver.phone && (
                  <a href={`tel:${tracking.driver.phone}`}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-primary-500 text-[#0B0B0B] font-bold rounded-xl hover:bg-primary-400 transition-all text-sm">
                    <Phone className="w-4 h-4" /> Chiama autista
                  </a>
                )}
              </div>
            )}

            {/* Vehicle */}
            {tracking.vehicle && (
              <div className="bg-surface-1 border border-surface-4 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Car className="w-4 h-4 text-primary-400" /> Veicolo
                </h3>
                <div className="space-y-3">
                  <div className="bg-surface-2 rounded-xl px-4 py-3">
                    <p className="text-xs text-ink-muted mb-1">Modello</p>
                    <p className="text-sm font-semibold text-white">{tracking.vehicle.brand} {tracking.vehicle.model}</p>
                  </div>
                  <div className="bg-surface-2 rounded-xl px-4 py-3">
                    <p className="text-xs text-ink-muted mb-1">Targa</p>
                    <p className="font-mono font-bold text-white tracking-wider">{tracking.vehicle.plate}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Live indicator */}
            <div className="bg-surface-1 border border-surface-4 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-500/10 rounded-lg flex items-center justify-center shrink-0">
                <Navigation className="w-4 h-4 text-primary-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Tracking live</p>
                <p className="text-xs text-ink-muted">Posizione aggiornata ogni 10s</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
