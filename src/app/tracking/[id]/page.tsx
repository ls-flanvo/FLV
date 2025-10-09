'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { Card } from '@/components/ui';
import TrackingMap from '@/components/TrackingMap';
import { Phone, MapPin, Clock, Navigation } from 'lucide-react';

export default function TrackingPage() {
  const [tracking, setTracking] = useState<any>(null);
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchTracking();
  }, [isAuthenticated, router]);

  async function fetchTracking() {
    const res = await fetch('/api/tracking/booking-123');
    const json = await res.json();
    const payload = json?.data ?? json?.tracking ?? null;
    if (payload) setTracking(payload);
  }

  if (!isAuthenticated || !tracking) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <Card>
          <p className="text-gray-600">Caricamento...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header con status */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl shadow-lg p-6 text-white mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Tracking Corsa</h1>
            <p className="text-primary-100">Segui il tuo viaggio in tempo reale</p>
          </div>
          <div className="flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
            <span className="font-semibold">In viaggio</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonna principale - Mappa e dettagli */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mappa */}
          <Card className="p-0 overflow-hidden">
            <TrackingMap
              currentLocation={tracking.currentLocation}
              destination={tracking.destination}
              route={tracking.route}
            />
          </Card>

          {/* Dettagli percorso */}
          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-primary-600" />
              Dettagli Percorso
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">Destinazione</p>
                  <p className="font-semibold text-gray-900">{tracking.destination.address}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-accent-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-accent-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">Arrivo stimato</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(tracking.estimatedArrival).toLocaleTimeString('it-IT', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar - Info driver e veicolo */}
        <div className="space-y-6">
          {/* Card Autista */}
          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Navigation className="w-5 h-5 mr-2 text-primary-600" />
              Il tuo autista
            </h3>
            
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {tracking.driver.name.split(' ').map((n: string) => n[0]).join('')}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{tracking.driver.name}</p>
                <p className="text-sm text-gray-500">Autista professionista</p>
              </div>
            </div>

            <a
              href={`tel:${tracking.driver.phone}`}
              className="flex items-center justify-center space-x-2 w-full bg-primary-500 text-white px-4 py-3 rounded-lg hover:bg-primary-600 transition-colors shadow-md hover:shadow-lg"
            >
              <Phone className="w-5 h-5" />
              <span className="font-semibold">Chiama Autista</span>
            </a>
          </Card>

          {/* Card Veicolo */}
          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Veicolo</h3>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">Modello</p>
                <p className="font-semibold text-gray-900">
                  {tracking.vehicle.brand} {tracking.vehicle.model}
                </p>
              </div>
              
              <div className="pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Targa</p>
                <p className="font-mono font-bold text-lg text-gray-900">
                  {tracking.vehicle.plate}
                </p>
              </div>
            </div>
          </Card>

          {/* Info aggiuntive */}
          <Card className="bg-gradient-to-br from-accent-50 to-primary-50 border-accent-200">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-accent-500 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Tracking attivo</h4>
                <p className="text-sm text-gray-600">
                  La posizione viene aggiornata automaticamente ogni 30 secondi
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}