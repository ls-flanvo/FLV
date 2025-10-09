'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  MapPin,
  Clock,
  User,
  Car,
  Euro,
  Calendar,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Navigation,
  Phone,
  Mail
} from 'lucide-react';

interface Ride {
  id: string;
  bookingCode: string;
  passenger: {
    name: string;
    email: string;
    phone: string;
  };
  driver: {
    name: string;
    phone: string;
    vehicle: string;
    licensePlate: string;
  } | null;
  pickup: {
    address: string;
    time: string;
  };
  dropoff: {
    address: string;
  };
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  price: number;
  createdAt: string;
  flightNumber?: string;
}

export default function AdminMonitorRidesPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchRides();
    
    // Auto-refresh ogni 30 secondi
    const interval = setInterval(fetchRides, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRides = async () => {
    try {
      // Mock data per demo
      const mockRides: Ride[] = [
        {
          id: '1',
          bookingCode: 'FLV-2024-001',
          passenger: {
            name: 'Luca Sabato',
            email: 'luca.sabato@email.com',
            phone: '+39 333 1234567'
          },
          driver: {
            name: 'Mario Rossi',
            phone: '+39 334 7654321',
            vehicle: 'Mercedes Classe E',
            licensePlate: 'AB123CD'
          },
          pickup: {
            address: 'Aeroporto di Catania-Fontanarossa',
            time: '2024-10-08T14:30:00'
          },
          dropoff: {
            address: 'Via Roma 123, Messina'
          },
          status: 'in_progress',
          price: 185.50,
          createdAt: '2024-10-07T10:15:00',
          flightNumber: 'AZ1234'
        },
        {
          id: '2',
          bookingCode: 'FLV-2024-002',
          passenger: {
            name: 'Giulia Bianchi',
            email: 'giulia.bianchi@email.com',
            phone: '+39 335 9876543'
          },
          driver: {
            name: 'Luca Verdi',
            phone: '+39 336 5551234',
            vehicle: 'BMW Serie 5',
            licensePlate: 'EF456GH'
          },
          pickup: {
            address: 'Hotel Excelsior, Taormina',
            time: '2024-10-08T18:00:00'
          },
          dropoff: {
            address: 'Aeroporto di Catania-Fontanarossa'
          },
          status: 'confirmed',
          price: 95.00,
          createdAt: '2024-10-08T09:30:00'
        },
        {
          id: '3',
          bookingCode: 'FLV-2024-003',
          passenger: {
            name: 'Paolo Neri',
            email: 'paolo.neri@email.com',
            phone: '+39 337 4445678'
          },
          driver: null,
          pickup: {
            address: 'Stazione di Messina Centrale',
            time: '2024-10-09T10:00:00'
          },
          dropoff: {
            address: 'Centro Commerciale, Catania'
          },
          status: 'pending',
          price: 78.00,
          createdAt: '2024-10-08T11:45:00'
        },
        {
          id: '4',
          bookingCode: 'FLV-2024-004',
          passenger: {
            name: 'Anna Gialli',
            email: 'anna.gialli@email.com',
            phone: '+39 338 1112223'
          },
          driver: {
            name: 'Giuseppe Blu',
            phone: '+39 339 7778889',
            vehicle: 'Audi A6',
            licensePlate: 'IJ789KL'
          },
          pickup: {
            address: 'Via Etnea 50, Catania',
            time: '2024-10-07T20:00:00'
          },
          dropoff: {
            address: 'Teatro Greco, Taormina'
          },
          status: 'completed',
          price: 120.00,
          createdAt: '2024-10-07T15:20:00'
        },
        {
          id: '5',
          bookingCode: 'FLV-2024-005',
          passenger: {
            name: 'Marco Rossi',
            email: 'marco.rossi@email.com',
            phone: '+39 340 5556667'
          },
          driver: {
            name: 'Laura Verdi',
            phone: '+39 341 3334445',
            vehicle: 'Mercedes Vito',
            licensePlate: 'MN012OP'
          },
          pickup: {
            address: 'Porto di Milazzo',
            time: '2024-10-06T12:00:00'
          },
          dropoff: {
            address: 'Aeroporto di Reggio Calabria'
          },
          status: 'cancelled',
          price: 145.00,
          createdAt: '2024-10-06T08:00:00'
        }
      ];

      setRides(mockRides);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching rides:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status: Ride['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: Ride['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'in_progress':
        return <Navigation className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: Ride['status']) => {
    switch (status) {
      case 'pending':
        return 'In Attesa';
      case 'confirmed':
        return 'Confermata';
      case 'in_progress':
        return 'In Corso';
      case 'completed':
        return 'Completata';
      case 'cancelled':
        return 'Cancellata';
    }
  };

  const filteredRides = rides.filter(ride => {
    const matchesSearch = 
      ride.bookingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.passenger.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.driver?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.pickup.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.dropoff.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ride.status === statusFilter;
    
    const today = new Date();
    const rideDate = new Date(ride.pickup.time);
    let matchesDate = true;
    
    if (dateFilter === 'today') {
      matchesDate = rideDate.toDateString() === today.toDateString();
    } else if (dateFilter === 'upcoming') {
      matchesDate = rideDate > today;
    } else if (dateFilter === 'past') {
      matchesDate = rideDate < today;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const stats = {
    total: rides.length,
    pending: rides.filter(r => r.status === 'pending').length,
    confirmed: rides.filter(r => r.status === 'confirmed').length,
    inProgress: rides.filter(r => r.status === 'in_progress').length,
    completed: rides.filter(r => r.status === 'completed').length,
    cancelled: rides.filter(r => r.status === 'cancelled').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento corse...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/admin/dashboard"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alla Dashboard
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Navigation className="w-8 h-8 mr-3 text-primary-600" />
                Monitora Corse
              </h1>
              <p className="text-gray-600 mt-1">
                Visualizza e gestisci tutte le corse in tempo reale
              </p>
            </div>
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg flex items-center">
              <div className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse"></div>
              <span className="text-sm font-medium">Aggiornamento automatico</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Totale</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 shadow-sm border border-yellow-200">
            <p className="text-sm text-yellow-700 mb-1">In Attesa</p>
            <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 shadow-sm border border-blue-200">
            <p className="text-sm text-blue-700 mb-1">Confermate</p>
            <p className="text-2xl font-bold text-blue-900">{stats.confirmed}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 shadow-sm border border-purple-200">
            <p className="text-sm text-purple-700 mb-1">In Corso</p>
            <p className="text-2xl font-bold text-purple-900">{stats.inProgress}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 shadow-sm border border-green-200">
            <p className="text-sm text-green-700 mb-1">Completate</p>
            <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 shadow-sm border border-red-200">
            <p className="text-sm text-red-700 mb-1">Cancellate</p>
            <p className="text-2xl font-bold text-red-900">{stats.cancelled}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-2" />
                Cerca
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Codice, passeggero, autista, indirizzo..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-2" />
                Stato
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">Tutti gli stati</option>
                <option value="pending">In Attesa</option>
                <option value="confirmed">Confermate</option>
                <option value="in_progress">In Corso</option>
                <option value="completed">Completate</option>
                <option value="cancelled">Cancellate</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Periodo
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">Tutte le corse</option>
                <option value="today">Oggi</option>
                <option value="upcoming">Prossime</option>
                <option value="past">Passate</option>
              </select>
            </div>
          </div>
        </div>

        {/* Rides List */}
        <div className="space-y-4">
          {filteredRides.map((ride) => (
            <div key={ride.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold mr-4">
                    <Car className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{ride.bookingCode}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(ride.pickup.time).toLocaleString('it-IT', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-full border ${getStatusColor(ride.status)}`}>
                  {getStatusIcon(ride.status)}
                  <span className="ml-2">{getStatusText(ride.status)}</span>
                </span>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-4">
                {/* Passenger */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <User className="w-4 h-4 mr-2 text-primary-600" />
                    Passeggero
                  </h4>
                  <p className="text-gray-900 font-medium">{ride.passenger.name}</p>
                  <p className="text-sm text-gray-600 flex items-center mt-1">
                    <Phone className="w-3 h-3 mr-1" />
                    {ride.passenger.phone}
                  </p>
                </div>

                {/* Driver */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Car className="w-4 h-4 mr-2 text-primary-600" />
                    Autista
                  </h4>
                  {ride.driver ? (
                    <>
                      <p className="text-gray-900 font-medium">{ride.driver.name}</p>
                      <p className="text-sm text-gray-600">{ride.driver.vehicle}</p>
                      <p className="text-sm text-gray-600">{ride.driver.licensePlate}</p>
                    </>
                  ) : (
                    <p className="text-amber-600 font-medium flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      In attesa di autista
                    </p>
                  )}
                </div>

                {/* Route */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-primary-600" />
                    Percorso
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 mr-2"></div>
                      <p className="text-sm text-gray-600">{ride.pickup.address}</p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 mr-2"></div>
                      <p className="text-sm text-gray-600">{ride.dropoff.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  {ride.flightNumber && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium mr-2">Volo:</span>
                      <span>{ride.flightNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center text-lg font-bold text-green-600">
                    <Euro className="w-5 h-5 mr-1" />
                    {ride.price.toFixed(2)}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedRide(ride);
                    setShowDetailModal(true);
                  }}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  Vedi Dettagli
                </button>
              </div>
            </div>
          ))}

          {filteredRides.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Navigation className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nessuna corsa trovata</h3>
              <p className="text-gray-600">
                Non ci sono corse che corrispondono ai filtri selezionati.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedRide.bookingCode}</h2>
                <span className={`inline-flex items-center px-3 py-1 mt-2 text-sm font-medium rounded-full border ${getStatusColor(selectedRide.status)}`}>
                  {getStatusIcon(selectedRide.status)}
                  <span className="ml-2">{getStatusText(selectedRide.status)}</span>
                </span>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 text-3xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Passenger Details */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-primary-600" />
                  Informazioni Passeggero
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-gray-900 font-medium text-lg">{selectedRide.passenger.name}</p>
                  <div className="flex items-center text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    {selectedRide.passenger.email}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    {selectedRide.passenger.phone}
                  </div>
                </div>
              </div>

              {/* Driver Details */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Car className="w-5 h-5 mr-2 text-primary-600" />
                  Informazioni Autista
                </h3>
                {selectedRide.driver ? (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p className="text-gray-900 font-medium text-lg">{selectedRide.driver.name}</p>
                    <div className="flex items-center text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      {selectedRide.driver.phone}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Car className="w-4 h-4 mr-2" />
                      {selectedRide.driver.vehicle} - {selectedRide.driver.licensePlate}
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <div className="flex items-center text-amber-700">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      <p className="font-medium">Autista non ancora assegnato</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Trip Details */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-primary-600" />
                  Dettagli Viaggio
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Data e Ora Partenza</p>
                    <div className="flex items-center text-gray-900 font-medium">
                      <Clock className="w-4 h-4 mr-2" />
                      {new Date(selectedRide.pickup.time).toLocaleString('it-IT', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Partenza</p>
                    <div className="flex items-start bg-white p-3 rounded-lg border border-gray-200">
                      <div className="w-3 h-3 bg-green-500 rounded-full mt-1 mr-3"></div>
                      <p className="text-gray-900">{selectedRide.pickup.address}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Destinazione</p>
                    <div className="flex items-start bg-white p-3 rounded-lg border border-gray-200">
                      <div className="w-3 h-3 bg-red-500 rounded-full mt-1 mr-3"></div>
                      <p className="text-gray-900">{selectedRide.dropoff.address}</p>
                    </div>
                  </div>

                  {selectedRide.flightNumber && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Numero Volo</p>
                      <p className="text-gray-900 font-medium">{selectedRide.flightNumber}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Euro className="w-5 h-5 mr-2 text-primary-600" />
                  Dettagli Pagamento
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tariffa Corsa</span>
                    <span className="font-medium text-gray-900">€{selectedRide.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Commissione Piattaforma (20%)</span>
                    <span className="text-gray-700">€{(selectedRide.price * 0.2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Guadagno Autista (80%)</span>
                    <span className="text-gray-700">€{(selectedRide.price * 0.8).toFixed(2)}</span>
                  </div>
                  <div className="pt-3 border-t border-gray-300 flex justify-between">
                    <span className="font-bold text-gray-900">Totale</span>
                    <span className="font-bold text-green-600 text-xl">€{selectedRide.price.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-primary-600" />
                  Timeline
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Prenotazione Creata</p>
                        <p className="text-sm text-gray-600">
                          {new Date(selectedRide.createdAt).toLocaleString('it-IT')}
                        </p>
                      </div>
                    </div>

                    {selectedRide.driver && (
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Autista Assegnato</p>
                          <p className="text-sm text-gray-600">{selectedRide.driver.name}</p>
                        </div>
                      </div>
                    )}

                    {selectedRide.status === 'completed' && (
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Corsa Completata</p>
                          <p className="text-sm text-gray-600">Passeggero arrivato a destinazione</p>
                        </div>
                      </div>
                    )}

                    {selectedRide.status === 'cancelled' && (
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
                          <XCircle className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Corsa Cancellata</p>
                          <p className="text-sm text-gray-600">Cancellata dal passeggero</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {selectedRide.status === 'pending' && (
                <div className="pt-6 border-t border-gray-200">
                  <button
                    onClick={() => alert('Funzionalità di assegnazione manuale in sviluppo')}
                    className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                  >
                    Assegna Autista Manualmente
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}