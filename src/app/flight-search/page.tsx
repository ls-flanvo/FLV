'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useBookingStore } from '@/store';
import { Input, Button, Card, Badge } from '@/components/ui';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { Flight } from '@/lib/types';
import { Plane, MapPin, Calendar, Clock, Users, Luggage } from 'lucide-react';

export default function FlightSearchPage() {
  const [flightCode, setFlightCode] = useState('');
  const [destination, setDestination] = useState('');
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [passengers, setPassengers] = useState(1);
  const [luggage, setLuggage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [flight, setFlight] = useState<Flight | null>(null);
  const [error, setError] = useState('');
  const [destinationError, setDestinationError] = useState('');

  const { user, isAuthenticated } = useAuthStore();
  const { setCurrentFlight } = useBookingStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setFlight(null);

    try {
      const response = await fetch(`/api/flights/${flightCode.toUpperCase()}`);
      const data = await response.json();

      if (data.flight) {
        setFlight(data.flight);
      } else {
        setError('Volo non trovato');
      }
    } catch (err) {
      setError('Errore nella ricerca del volo');
    } finally {
      setLoading(false);
    }
  };

  const handleDestinationChange = (address: string, coords?: { lat: number; lng: number }) => {
    setDestination(address);
    setDestinationError('');
    if (coords) {
      setDestinationCoords(coords);
    }
  };

  const handleFindMatches = async () => {
    if (!flight) return;
    
    // Validazione destinazione
    if (!destination || destination.length < 5) {
      setDestinationError('Inserisci un indirizzo di destinazione valido');
      return;
    }

    setCurrentFlight(flight);
    
    const destinationObj = {
      address: destination,
      lat: destinationCoords?.lat || 45.4642,
      lng: destinationCoords?.lng || 9.1900,
      city: destination.split(',')[0] || destination,
    };

    // Salva anche bagagli e passeggeri
    const bookingData = {
      destination: destinationObj,
      passengers,
      luggage,
    };

    localStorage.setItem('flanvo_destination', JSON.stringify(destinationObj));
    localStorage.setItem('flanvo_booking_info', JSON.stringify(bookingData));
    
    router.push('/matching');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      scheduled: 'info',
      boarding: 'warning',
      departed: 'success',
      landed: 'success',
      cancelled: 'danger',
      delayed: 'warning',
    };
    return variants[status] || 'default';
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Cerca la tua corsa</h1>
        <p className="text-gray-600">Inserisci il codice volo e i dettagli del tuo viaggio</p>
      </div>

      <Card className="mb-8">
        <form onSubmit={handleSearch} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Codice Volo */}
            <Input
              type="text"
              label="Codice Volo"
              placeholder="ES: AZ1234"
              value={flightCode}
              onChange={(e) => setFlightCode(e.target.value.toUpperCase())}
              required
            />

            {/* Numero Passeggeri */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numero Passeggeri
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={passengers}
                  onChange={(e) => setPassengers(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  required
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'passeggero' : 'passeggeri'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Autocomplete Destinazione */}
            <div className="md:col-span-1">
              <AddressAutocomplete
                value={destination}
                onChange={handleDestinationChange}
                placeholder="es. Via Roma 123, Milano"
                label="Destinazione Finale"
                required
                error={destinationError}
              />
            </div>

            {/* Numero Bagagli */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numero Bagagli
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <Luggage className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={luggage}
                  onChange={(e) => setLuggage(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  required
                >
                  {[0, 1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'bagaglio' : 'bagagli'}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Include solo bagagli da stiva (non bagaglio a mano)
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full md:w-auto">
            {loading ? 'Ricerca in corso...' : 'Cerca Volo'}
          </Button>
        </form>
      </Card>

      {flight && (
        <Card className="animate-fadeIn">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Volo {flight.code}
              </h2>
              <p className="text-gray-600">{flight.airline}</p>
            </div>
            <Badge variant={getStatusBadge(flight.status)}>
              {flight.status.toUpperCase()}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Plane className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Partenza</p>
                  <p className="font-semibold text-gray-900">{flight.departureAirport}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Arrivo</p>
                  <p className="font-semibold text-gray-900">{flight.arrivalAirport}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Orario Previsto</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(flight.scheduledTime).toLocaleString('it-IT')}
                  </p>
                </div>
              </div>

              {flight.delayMins > 0 && (
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-yellow-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Ritardo</p>
                    <p className="font-semibold text-yellow-600">{flight.delayMins} minuti</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Riepilogo prenotazione */}
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Riepilogo viaggio</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Destinazione</p>
                <p className="font-medium text-gray-900 truncate">{destination || 'Non specificata'}</p>
              </div>
              <div>
                <p className="text-gray-600">Passeggeri</p>
                <p className="font-medium text-gray-900">{passengers}</p>
              </div>
              <div>
                <p className="text-gray-600">Bagagli</p>
                <p className="font-medium text-gray-900">{luggage}</p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <Button
              onClick={handleFindMatches}
              disabled={!destination}
              size="lg"
              className="w-full"
            >
              Trova Compagni di Viaggio
            </Button>
          </div>
        </Card>
      )}

      <Card className="mt-8 bg-gradient-to-br from-accent-50 to-primary-50 border-accent-200">
        <h3 className="font-semibold text-gray-900 mb-3">💡 Voli Demo</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>Prova questi codici volo: <strong>AZ1234</strong>, <strong>FR5678</strong>, <strong>BA9012</strong></p>
          <p className="text-xs">L'autocomplete cercherà indirizzi reali in Italia tramite Mapbox</p>
        </div>
      </Card>
    </div>
  );
}