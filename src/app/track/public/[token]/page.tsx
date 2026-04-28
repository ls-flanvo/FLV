'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { MapPin, Navigation, Car, Clock, Phone, Star, AlertCircle } from 'lucide-react';

interface PublicTracking {
  status: string; message?: string; flightNumber?: string;
  vehicle?: { brand: string; model: string; plate: string };
  currentLocation?: { lat: number; lng: number };
  destination?: { address: string; lat: number; lng: number };
  estimatedArrival?: string;
  driver?: { name: string; phone: string; rating: number };
}

export default function PublicTrackingPage({ params }: { params: { token: string } }) {
  const [tracking, setTracking] = useState<PublicTracking | null>(null);
  const [error, setError] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTracking = async () => {
    try {
      const res = await fetch(`/api/track/public/${params.token}`);
      const json = await res.json();
      if (res.ok && json.tracking) setTracking(json.tracking);
      else setError(json.error || 'Link non valido o scaduto');
    } catch {
      setError('Impossibile caricare il tracking');
    }
  };

  useEffect(() => {
    fetchTracking();
    intervalRef.current = setInterval(fetchTracking, 10000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [params.token]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex flex-col">
      {/* Header */}
      <div className="bg-surface-1 border-b border-surface-4 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <svg width="14" height="19" viewBox="0 0 56 72" fill="none">
            <path d="M8 0 L48 0 L30 30 L48 30 L8 72 L22 40 L4 40 Z" fill="#00D1B2"/>
          </svg>
          <span className="text-sm font-bold text-white">flanvo</span>
        </Link>
        <span className="text-xs text-ink-muted">Tracking condiviso</span>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        {error ? (
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-danger/10 border border-danger/20 rounded-full flex items-center justify-center mx-auto mb-5">
              <AlertCircle className="w-8 h-8 text-danger" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Link non disponibile</h2>
            <p className="text-ink-secondary text-sm mb-2">{error}</p>
            <p className="text-ink-muted text-xs">I link di tracking scadono dopo 48 ore</p>
          </div>
        ) : !tracking ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500 mx-auto mb-4" />
            <p className="text-ink-secondary text-sm">Caricamento tracking...</p>
          </div>
        ) : tracking.status === 'not_started' ? (
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-warning/10 border border-warning/20 rounded-full flex items-center justify-center mx-auto mb-5">
              <Clock className="w-8 h-8 text-warning" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Corsa non ancora iniziata</h2>
            {tracking.flightNumber && (
              <p className="text-ink-secondary text-sm mb-1">Volo {tracking.flightNumber}</p>
            )}
            <p className="text-ink-muted text-sm">{tracking.message}</p>
          </div>
        ) : (
          <div className="w-full max-w-sm space-y-3">
            {/* Status badge */}
            <div className="bg-surface-1 border border-surface-4 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-white">In viaggio</p>
                {tracking.flightNumber && (
                  <p className="text-ink-secondary text-sm">Volo {tracking.flightNumber}</p>
                )}
              </div>
              <div className="flex items-center gap-2 bg-success/10 border border-success/20 rounded-full px-3 py-1.5">
                <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-success">Live</span>
              </div>
            </div>

            {/* Driver */}
            {tracking.driver && (
              <div className="bg-surface-1 border border-surface-4 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 bg-primary-500/15 border border-primary-500/20 rounded-xl flex items-center justify-center text-primary-400 font-bold text-lg">
                    {tracking.driver.name.charAt(0)}
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
              <div className="bg-surface-1 border border-surface-4 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-surface-3 rounded-xl flex items-center justify-center shrink-0">
                  <Car className="w-5 h-5 text-ink-secondary" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{tracking.vehicle.brand} {tracking.vehicle.model}</p>
                  <p className="text-xs font-mono text-ink-muted">{tracking.vehicle.plate}</p>
                </div>
              </div>
            )}

            {/* Destination */}
            {tracking.destination && (
              <div className="bg-surface-1 border border-surface-4 rounded-2xl p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 bg-primary-500/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <Navigation className="w-4 h-4 text-primary-400" />
                  </div>
                  <div>
                    <p className="text-xs text-ink-muted mb-0.5">Destinazione</p>
                    <p className="font-semibold text-white text-sm">{tracking.destination.address}</p>
                  </div>
                </div>
                {tracking.estimatedArrival && (
                  <div className="flex items-center gap-3 pt-3 border-t border-surface-4">
                    <div className="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-warning" />
                    </div>
                    <div>
                      <p className="text-xs text-ink-muted mb-0.5">Arrivo stimato</p>
                      <p className="font-semibold text-white text-sm">
                        {new Date(tracking.estimatedArrival).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <p className="text-center text-xs text-ink-muted">
              Posizione aggiornata ogni 10 secondi · Powered by{' '}
              <span className="text-primary-400 font-semibold">flanvo</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
