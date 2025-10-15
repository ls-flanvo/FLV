'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store';
import { Card, Button, Badge } from '@/components/ui';
import DriverChat from '@/components/DriverChat';
import { DriverRide } from '@/lib/types';
import { 
  Car, 
  Users, 
  MapPin, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  XCircle,
  Navigation,
  Phone,
  MessageCircle,
  Luggage,
  TrendingUp
} from 'lucide-react';

export default function DriverDashboardPage() {
  const [rides, setRides] = useState<DriverRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'completed'>('pending');
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedPassenger, setSelectedPassenger] = useState<{ name: string; phone: string } | null>(null);
  const [stats, setStats] = useState({
    todayRides: 0,
    earnings: 0,
    rating: 4.8,
    totalTrips: 42,
  });

  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/driver/login');
      return;
    }

    if (user?.role !== 'driver') {
      router.push('/dashboard');
      return;
    }

    fetchRides();
  }, [isAuthenticated, user, router]);

  const fetchRides = async () => {
    try {
      const response = await fetch('/api/driver/rides');
      const data = await response.json();

      if (data.rides) {
        setRides(data.rides);
        setStats({
          todayRides: data.rides.filter((r: DriverRide) => r.status === 'accepted').length,
          earnings: data.rides.reduce((sum: number, r: DriverRide) => sum + r.totalPrice, 0),
          rating: 4.8,
          totalTrips: 42,
        });
      }
    } catch (error) {
      console.error('Error fetching rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRide = async (rideId: string) => {
    try {
      await fetch('/api/driver/rides', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId, status: 'accepted' }),
      });

      setRides(rides.map(r => 
        r.id === rideId ? { ...r, status: 'accepted' as const } : r
      ));
    } catch (error) {
      console.error('Error accepting ride:', error);
    }
  };

  const handleRejectRide = async (rideId: string) => {
    try {
      await fetch('/api/driver/rides', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId, status: 'rejected' }),
      });

      setRides(rides.filter(r => r.id !== rideId));
    } catch (error) {
      console.error('Error rejecting ride:', error);
    }
  };

  const filteredRides = rides.filter(r => r.status === activeTab);

  if (!isAuthenticated || user?.role !== 'driver') {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Dashboard Autista
        </h1>
        <p className="text-gray-600">Benvenuto, {user?.name}! 🚗</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="flex items-center space-x-4">
            <div className="bg-primary-100 p-4 rounded-full">
              <Car className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Corse oggi</p>
              <p className="text-3xl font-bold text-gray-900">{stats.todayRides}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-4">
            <div className="bg-green-100 p-4 rounded-full">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Guadagni oggi</p>
              <p className="text-3xl font-bold text-gray-900">€{stats.earnings}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-4">
            <div className="bg-yellow-100 p-4 rounded-full">
              <span className="text-3xl">⭐</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Rating</p>
              <p className="text-3xl font-bold text-gray-900">{stats.rating}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-4">
            <div className="bg-accent-100 p-4 rounded-full">
              <TrendingUp className="w-8 h-8 text-accent-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Corse totali</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalTrips}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Azioni rapide</h2>
        <div className="flex flex-wrap gap-4">
          <Button 
            size="lg"
            onClick={() => alert('Funzionalità mappa in arrivo!')}
          >
            <MapPin className="w-5 h-5 mr-2" />
            Visualizza mappa corse
          </Button>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => alert('Storico corse in arrivo!')}
          >
            <Clock className="w-5 h-5 mr-2" />
            Storico corse
          </Button>
        </div>
      </Card>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'pending'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            In attesa ({rides.filter(r => r.status === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('accepted')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'accepted'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Accettate ({rides.filter(r => r.status === 'accepted').length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'completed'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Completate
          </button>
        </div>
      </div>

      {/* Rides List */}
      <div>
        {loading ? (
          <Card>
            <p className="text-center text-gray-600 py-8">Caricamento...</p>
          </Card>
        ) : filteredRides.length === 0 ? (
          <Card className="text-center py-12">
            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nessuna corsa {activeTab === 'pending' ? 'in attesa' : activeTab === 'accepted' ? 'accettata' : 'completata'}
            </h3>
            <p className="text-gray-600">
              {activeTab === 'pending' && 'Le nuove richieste appariranno qui'}
              {activeTab === 'accepted' && 'Accetta una richiesta per iniziare'}
              {activeTab === 'completed' && 'Le corse completate verranno mostrate qui'}
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredRides.map((ride) => (
              <Card key={ride.id} className="hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Volo {ride.flight.code}
                    </h3>
                    <p className="text-sm text-gray-500">{ride.flight.airline}</p>
                  </div>
                  <Badge variant={
                    ride.status === 'accepted' ? 'success' : 
                    ride.status === 'completed' ? 'info' : 'warning'
                  }>
                    {ride.status === 'accepted' ? 'Accettata' : 
                     ride.status === 'completed' ? 'Completata' : 'In attesa'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  {/* Passeggeri */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                      <Users className="w-5 h-5 text-primary-600" />
                      <span>Passeggeri ({ride.passengers.length})</span>
                    </div>
                    {ride.passengers.slice(0, 3).map((passenger, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-accent-400 to-accent-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {passenger.name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{passenger.name}</p>
                            {/* ✅ FIX: Rimosso passenger.luggage che non esiste */}
                            <p className="text-xs text-gray-500">
                              <Luggage className="w-3 h-3 inline mr-1" />
                              1 bagaglio
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          {/* ✅ FIX: phone non disponibile, disabilitato */}
                          <button
                            onClick={() => alert('Numero non disponibile. Usa la chat per contattare il passeggero.')}
                            className="p-1 hover:bg-gray-200 rounded transition-colors opacity-50"
                            title="Telefono non disponibile"
                          >
                            <Phone className="w-4 h-4 text-gray-400" />
                          </button>
                          <button
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Chat"
                            onClick={() => {
                              setSelectedPassenger({
                                name: passenger.name,
                                phone: '+39 340 0000000' // ✅ FIX: placeholder
                              });
                              setChatOpen(true);
                            }}
                          >
                            <MessageCircle className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Destinazioni */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                      <MapPin className="w-5 h-5 text-primary-600" />
                      <span>Fermate</span>
                    </div>
                    {ride.destinations.map((dest, i) => (
                      <div key={i} className="flex items-start space-x-2 p-2 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{dest.city}</p>
                          <p className="text-xs text-gray-500 truncate">{dest.address}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Info corsa */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-primary-50 rounded-lg">
                      <Clock className="w-5 h-5 text-primary-600" />
                      <div>
                        <p className="text-xs text-gray-500">Pickup</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {new Date(ride.pickupTime).toLocaleString('it-IT', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-xs text-gray-500">Compenso</p>
                        <p className="text-xl font-bold text-green-600">€{ride.totalPrice}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-accent-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Distanza stimata</p>
                      <p className="text-sm font-semibold text-gray-900">~45 km</p>
                    </div>
                  </div>
                </div>

                {/* Azioni */}
                {ride.status === 'pending' && (
                  <div className="flex gap-4 pt-4 border-t border-gray-200">
                    <Button
                      onClick={() => handleAcceptRide(ride.id)}
                      className="flex-1"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Accetta corsa
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleRejectRide(ride.id)}
                      className="flex-1"
                    >
                      <XCircle className="w-5 h-5 mr-2" />
                      Rifiuta
                    </Button>
                  </div>
                )}

                {ride.status === 'accepted' && (
                  <div className="flex gap-4 pt-4 border-t border-gray-200">
                    <Link href={`/driver/ride/${ride.id}`} className="flex-1">
                      <Button className="w-full">
                        <Navigation className="w-5 h-5 mr-2" />
                        Inizia navigazione
                      </Button>
                    </Link>
                    <Button 
                      variant="secondary" 
                      className="flex-1"
                      onClick={() => alert('Chat di gruppo con i passeggeri in arrivo!')}
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Contatta passeggeri
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal Chat con passeggero */}
      {selectedPassenger && (
        <DriverChat
          isOpen={chatOpen}
          onClose={() => {
            setChatOpen(false);
            setSelectedPassenger(null);
          }}
          driverName={selectedPassenger.name}
          driverPhone={selectedPassenger.phone}
          bookingId="driver-chat"
        />
      )}
    </div>
  );
}