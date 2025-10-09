'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl';
import { useAuthStore } from '@/store';
import { Card, Button, Badge } from '@/components/ui';
import { 
  Navigation, 
  MapPin, 
  Users, 
  CheckCircle, 
  ArrowDown,
  ArrowUp,
  Phone,
  MessageCircle,
  X,
  Clock,
  AlertCircle
} from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Passenger {
  id: string;
  name: string;
  phone: string;
  status: 'waiting' | 'onboard' | 'dropped';
  luggage: number;
  destination: {
    address: string;
    lat: number;
    lng: number;
  };
}

interface Stop {
  id: string;
  address: string;
  lat: number;
  lng: number;
  type: 'pickup' | 'dropoff';
  passenger: Passenger;
  completed: boolean;
}

export default function DriverNavigationPage({ params }: { params: { id: string } }) {
  const [currentLocation, setCurrentLocation] = useState({ lat: 45.4642, lng: 9.1900 });
  const [stops, setStops] = useState<Stop[]>([]);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [viewState, setViewState] = useState({
    longitude: 9.1900,
    latitude: 45.4642,
    zoom: 13
  });
  const [showPassengerPanel, setShowPassengerPanel] = useState(true);
  const [rideStatus, setRideStatus] = useState<'in_progress' | 'completed'>('in_progress');
  
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const mapRef = useRef<any>(null);

  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoibHMtZmxhbnZvIiwiYSI6ImNtZzI1cTVxbzBwaGEycXF3bWV5dHozZTYifQ.c1Vys9aYtGHK6UW4LkHK4A';

  // Mock data - sostituire con dati reali dall'API
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'driver') {
      router.push('/driver/login');
      return;
    }

    // Simula dati corsa
    const mockStops: Stop[] = [
      {
        id: '1',
        address: 'Terminal 1, Aeroporto Malpensa',
        lat: 45.6301,
        lng: 8.7281,
        type: 'pickup',
        passenger: {
          id: 'p1',
          name: 'Marco Bianchi',
          phone: '+39 340 1234567',
          status: 'waiting',
          luggage: 2,
          destination: { address: 'Via Dante 45, Milano', lat: 45.4654, lng: 9.1859 }
        },
        completed: false
      },
      {
        id: '2',
        address: 'Terminal 1, Aeroporto Malpensa',
        lat: 45.6301,
        lng: 8.7281,
        type: 'pickup',
        passenger: {
          id: 'p2',
          name: 'Laura Rossi',
          phone: '+39 345 9876543',
          status: 'waiting',
          luggage: 1,
          destination: { address: 'Piazza Duomo, Milano', lat: 45.4642, lng: 9.1900 }
        },
        completed: false
      },
      {
        id: '3',
        address: 'Via Dante 45, Milano',
        lat: 45.4654,
        lng: 9.1859,
        type: 'dropoff',
        passenger: {
          id: 'p1',
          name: 'Marco Bianchi',
          phone: '+39 340 1234567',
          status: 'waiting',
          luggage: 2,
          destination: { address: 'Via Dante 45, Milano', lat: 45.4654, lng: 9.1859 }
        },
        completed: false
      },
      {
        id: '4',
        address: 'Piazza Duomo, Milano',
        lat: 45.4642,
        lng: 9.1900,
        type: 'dropoff',
        passenger: {
          id: 'p2',
          name: 'Laura Rossi',
          phone: '+39 345 9876543',
          status: 'waiting',
          luggage: 1,
          destination: { address: 'Piazza Duomo, Milano', lat: 45.4642, lng: 9.1900 }
        },
        completed: false
      }
    ];

    setStops(mockStops);
    
    // Centra mappa sulla prima fermata
    setViewState({
      longitude: mockStops[0].lng,
      latitude: mockStops[0].lat,
      zoom: 13
    });
  }, [isAuthenticated, user, router]);

  // Simula aggiornamento posizione GPS
  useEffect(() => {
    const interval = setInterval(() => {
      // Simula movimento verso la destinazione
      setCurrentLocation(prev => ({
        lat: prev.lat + (Math.random() - 0.5) * 0.001,
        lng: prev.lng + (Math.random() - 0.5) * 0.001
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const currentStop = stops[currentStopIndex];
  const allPassengers = Array.from(new Set(stops.map(s => s.passenger.id)))
    .map(id => stops.find(s => s.passenger.id === id)?.passenger)
    .filter(Boolean) as Passenger[];

  const handlePassengerOnboard = (passengerId: string) => {
    setStops(stops.map(stop => 
      stop.passenger.id === passengerId && stop.type === 'pickup'
        ? { ...stop, completed: true, passenger: { ...stop.passenger, status: 'onboard' } }
        : stop
    ));
  };

  const handlePassengerDropped = (passengerId: string) => {
    setStops(stops.map(stop => 
      stop.passenger.id === passengerId && stop.type === 'dropoff'
        ? { ...stop, completed: true, passenger: { ...stop.passenger, status: 'dropped' } }
        : stop
    ));
  };

  const handleNextStop = () => {
    const nextIndex = stops.findIndex((stop, index) => index > currentStopIndex && !stop.completed);
    
    if (nextIndex !== -1) {
      setCurrentStopIndex(nextIndex);
      setViewState({
        longitude: stops[nextIndex].lng,
        latitude: stops[nextIndex].lat,
        zoom: 14
      });
    } else {
      setRideStatus('completed');
    }
  };

  const handleCompleteRide = async () => {
    // Chiamata API per completare la corsa
    try {
      await fetch(`/api/driver/rides/${params.id}/complete`, {
        method: 'POST'
      });
      router.push('/driver/dashboard');
    } catch (error) {
      console.error('Error completing ride:', error);
    }
  };

  if (!isAuthenticated || user?.role !== 'driver') {
    return null;
  }

  if (rideStatus === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-primary-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Corsa Completata!
          </h1>
          <p className="text-gray-600 mb-8">
            Tutti i passeggeri sono stati consegnati alle loro destinazioni.
          </p>
          <div className="space-y-3">
            <Button onClick={handleCompleteRide} size="lg" className="w-full">
              Conferma e torna alla dashboard
            </Button>
            <Button 
              variant="secondary" 
              size="lg" 
              className="w-full"
              onClick={() => router.push('/driver/dashboard')}
            >
              Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Mappa a schermo intero */}
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" />

        {/* Marker posizione corrente driver */}
        <Marker
          longitude={currentLocation.lng}
          latitude={currentLocation.lat}
          anchor="center"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-accent-500 rounded-full opacity-30 animate-ping"></div>
            <div className="relative bg-accent-500 rounded-full p-3 shadow-lg border-4 border-white">
              <Navigation className="w-6 h-6 text-white" />
            </div>
          </div>
        </Marker>

        {/* Marker fermate */}
        {stops.map((stop, index) => (
          <Marker
            key={stop.id}
            longitude={stop.lng}
            latitude={stop.lat}
            anchor="bottom"
          >
            <div className="relative">
              <div className={`px-3 py-1 rounded-full text-xs font-bold mb-1 ${
                stop.completed 
                  ? 'bg-green-500 text-white' 
                  : index === currentStopIndex
                  ? 'bg-accent-500 text-white animate-pulse'
                  : 'bg-white text-gray-700 border-2 border-gray-300'
              }`}>
                {index + 1}
              </div>
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                  fill={stop.completed ? '#10b981' : index === currentStopIndex ? '#5B4FFF' : '#9ca3af'}
                  stroke="white"
                  strokeWidth="2"
                />
                {stop.type === 'pickup' ? (
                  <ArrowUp className="w-3 h-3 text-white" style={{ position: 'absolute', top: '6px', left: '8.5px' }} />
                ) : (
                  <ArrowDown className="w-3 h-3 text-white" style={{ position: 'absolute', top: '6px', left: '8.5px' }} />
                )}
              </svg>
            </div>
          </Marker>
        ))}
      </Map>

      {/* Header Info Corrente */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <Badge variant={currentStop?.type === 'pickup' ? 'info' : 'warning'}>
                  {currentStop?.type === 'pickup' ? 'RITIRO' : 'CONSEGNA'}
                </Badge>
                <span className="text-sm text-gray-500">
                  Fermata {currentStopIndex + 1} di {stops.length}
                </span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                {currentStop?.passenger.name}
              </h2>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="line-clamp-1">{currentStop?.address}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <a
                href={`tel:${currentStop?.passenger.phone}`}
                className="p-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                <Phone className="w-5 h-5" />
              </a>
              <button
                onClick={() => setShowPassengerPanel(!showPassengerPanel)}
                className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Users className="w-5 h-5" />
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Pannello Passeggeri (laterale) */}
      {showPassengerPanel && (
        <div className="absolute top-4 right-4 bottom-24 w-80 z-10 overflow-hidden">
          <Card className="h-full flex flex-col bg-white/95 backdrop-blur-sm shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-900 flex items-center">
                <Users className="w-5 h-5 mr-2 text-primary-600" />
                Passeggeri ({allPassengers.length})
              </h3>
              <button
                onClick={() => setShowPassengerPanel(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {allPassengers.map(passenger => (
                <div
                  key={passenger.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    passenger.status === 'onboard'
                      ? 'bg-green-50 border-green-300'
                      : passenger.status === 'dropped'
                      ? 'bg-gray-50 border-gray-300 opacity-60'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                        {passenger.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{passenger.name}</p>
                        <p className="text-xs text-gray-500">🧳 {passenger.luggage} bagagli</p>
                      </div>
                    </div>
                    <Badge variant={
                      passenger.status === 'onboard' ? 'success' :
                      passenger.status === 'dropped' ? 'info' : 'warning'
                    }>
                      {passenger.status === 'onboard' ? 'A bordo' :
                       passenger.status === 'dropped' ? 'Consegnato' : 'In attesa'}
                    </Badge>
                  </div>

                  <div className="text-xs text-gray-600 mb-3">
                    <MapPin className="w-3 h-3 inline mr-1" />
                    {passenger.destination.address}
                  </div>

                  <div className="flex space-x-2">
                    {passenger.status === 'waiting' && (
                      <Button
                        size="sm"
                        onClick={() => handlePassengerOnboard(passenger.id)}
                        className="flex-1"
                      >
                        <ArrowUp className="w-4 h-4 mr-1" />
                        A bordo
                      </Button>
                    )}
                    {passenger.status === 'onboard' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handlePassengerDropped(passenger.id)}
                        className="flex-1"
                      >
                        <ArrowDown className="w-4 h-4 mr-1" />
                        Sceso
                      </Button>
                    )}
                    <a
                      href={`tel:${passenger.phone}`}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <Phone className="w-4 h-4 text-gray-600" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
          <div className="flex items-center space-x-4">
            {currentStop && !currentStop.completed && (
              <div className="flex-1 flex items-center space-x-2 text-sm text-gray-600">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <span>
                  {currentStop.type === 'pickup' 
                    ? 'Conferma il ritiro del passeggero prima di procedere'
                    : 'Conferma la discesa del passeggero prima di procedere'
                  }
                </span>
              </div>
            )}
            
            <Button
              size="lg"
              onClick={handleNextStop}
              disabled={currentStop && !currentStop.completed}
              className="min-w-[200px]"
            >
              {currentStopIndex === stops.length - 1 ? 'Completa Corsa' : 'Prossima Fermata'}
            </Button>
          </div>
        </Card>
      </div>

      {/* Stili per i controlli Mapbox */}
      <style jsx global>{`
        .mapboxgl-ctrl-group button {
          background-color: white !important;
          color: #1a1a1a !important;
        }
        .mapboxgl-ctrl-group button:hover {
          background-color: #f3f4f6 !important;
        }
      `}</style>
    </div>
  );
}