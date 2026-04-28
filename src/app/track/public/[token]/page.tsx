'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Car, Clock, Phone } from 'lucide-react';

interface PublicTracking {
  status: string;
  message?: string;
  flightNumber?: string;
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
      if (res.ok && json.tracking) {
        setTracking(json.tracking);
      } else {
        setError(json.error || 'Link non valido o scaduto');
      }
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex flex-col">
      {/* Header Flanvo branding */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg width="24" height="32" viewBox="0 0 56 72" fill="none">
            <path d="M8 0 L48 0 L30 30 L48 30 L8 72 L22 40 L4 40 Z" fill="#00C2B5"/>
          </svg>
          <span className="text-xl font-bold text-gray-900">flanvo</span>
        </div>
        <span className="text-xs text-gray-400">Tracking condiviso</span>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        {error ? (
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Link non disponibile</h2>
            <p className="text-gray-500 text-sm">{error}</p>
            <p className="text-gray-400 text-xs mt-2">I link di tracking scadono dopo 48 ore</p>
          </div>
        ) : !tracking ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Caricamento tracking...</p>
          </div>
        ) : tracking.status === 'not_started' ? (
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Corsa non ancora iniziata</h2>
            {tracking.flightNumber && (
              <p className="text-gray-600 text-sm mb-1">Volo {tracking.flightNumber}</p>
            )}
            <p className="text-gray-500 text-sm">{tracking.message}</p>
          </div>
        ) : (
          <div className="w-full max-w-md space-y-4">
            {/* Status banner */}
            <div className="bg-primary-500 text-white rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-lg">In viaggio</p>
                {tracking.flightNumber && (
                  <p className="text-primary-100 text-sm">Volo {tracking.flightNumber}</p>
                )}
              </div>
              <div className="flex items-center bg-white/20 px-3 py-1 rounded-full">
                <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse mr-2" />
                <span className="text-sm font-medium">Live</span>
              </div>
            </div>

            {/* Driver info */}
            {tracking.driver && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {tracking.driver.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{tracking.driver.name}</p>
                    <p className="text-sm text-yellow-600">★ {tracking.driver.rating.toFixed(1)}</p>
                  </div>
                </div>
                {tracking.driver.phone && (
                  <a
                    href={`tel:${tracking.driver.phone}`}
                    className="flex items-center justify-center space-x-2 w-full bg-primary-50 text-primary-700 border border-primary-200 px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Chiama l&apos;autista</span>
                  </a>
                )}
              </div>
            )}

            {/* Vehicle */}
            {tracking.vehicle && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center space-x-3">
                <Car className="w-8 h-8 text-gray-400" />
                <div>
                  <p className="font-semibold text-gray-900">
                    {tracking.vehicle.brand} {tracking.vehicle.model}
                  </p>
                  <p className="text-sm font-mono text-gray-500">{tracking.vehicle.plate}</p>
                </div>
              </div>
            )}

            {/* Destination */}
            {tracking.destination && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-start space-x-3">
                  <Navigation className="w-5 h-5 text-primary-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Destinazione</p>
                    <p className="font-medium text-gray-900">{tracking.destination.address}</p>
                  </div>
                </div>
                {tracking.estimatedArrival && (
                  <div className="flex items-center space-x-3 mt-3 pt-3 border-t border-gray-100">
                    <Clock className="w-5 h-5 text-accent-500" />
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Arrivo stimato</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(tracking.estimatedArrival).toLocaleTimeString('it-IT', {
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <p className="text-center text-xs text-gray-400">
              Posizione aggiornata ogni 10 secondi · Powered by Flanvo
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
