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
} from 'lucide-react';

interface AdminRide {
  id: string;
  flightNumber: string;
  status: string;
  scheduledTime: string;
  passengerCount: number;
  passengers: { name: string; email: string; phone: string }[];
  driver: { name: string; phone: string; vehicle: string; licensePlate: string } | null;
  pickup: { address: string; time: string };
  dropoff: { address: string };
  totalRevenue: number;
  createdAt: string;
}

interface RideStats {
  total: number;
  forming: number;
  confirmed: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

export default function AdminMonitorRidesPage() {
  const [rides, setRides] = useState<AdminRide[]>([]);
  const [stats, setStats] = useState<RideStats>({
    total: 0, forming: 0, confirmed: 0, inProgress: 0, completed: 0, cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRide, setSelectedRide] = useState<AdminRide | null>(null);

  useEffect(() => {
    fetchRides();
    const interval = setInterval(fetchRides, 30000);
    return () => clearInterval(interval);
  }, [statusFilter, searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRides = async () => {
    try {
      const token = localStorage.getItem('flanvo_token');
      const params = new URLSearchParams({
        status: statusFilter,
        search: searchTerm,
      });
      const res = await fetch(`/api/admin/rides?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setRides(data.rides ?? []);
        setStats(data.stats ?? stats);
      }
    } catch (error) {
      console.error('Error fetching rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'forming': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      forming: 'In formazione',
      confirmed: 'Confermato',
      in_progress: 'In corso',
      completed: 'Completato',
      cancelled: 'Cancellato',
    };
    return map[status] ?? status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Caricamento corse...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="/admin/dashboard" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alla Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Navigation className="w-8 h-8 mr-3 text-primary-600" />
                Monitora Corse
              </h1>
              <p className="text-gray-600 mt-1">Corse in tempo reale — aggiornamento ogni 30s</p>
            </div>
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg flex items-center">
              <div className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse" />
              <span className="text-sm font-medium">Live</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Totale', value: stats.total, cls: 'bg-white border-gray-200' },
            { label: 'In formazione', value: stats.forming, cls: 'bg-yellow-50 border-yellow-200' },
            { label: 'Confermate', value: stats.confirmed, cls: 'bg-blue-50 border-blue-200' },
            { label: 'In corso', value: stats.inProgress, cls: 'bg-purple-50 border-purple-200' },
            { label: 'Completate', value: stats.completed, cls: 'bg-green-50 border-green-200' },
            { label: 'Cancellate', value: stats.cancelled, cls: 'bg-red-50 border-red-200' },
          ].map((s) => (
            <div key={s.label} className={`rounded-lg p-4 shadow-sm border ${s.cls}`}>
              <p className="text-sm text-gray-600 mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-2" />
                Cerca
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Volo, passeggero, autista..."
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
                <option value="all">Tutti</option>
                <option value="FORMING">In formazione</option>
                <option value="CONFIRMED">Confermato</option>
                <option value="IN_PROGRESS">In corso</option>
                <option value="COMPLETED">Completato</option>
                <option value="CANCELLED">Cancellato</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {rides.map((ride) => (
            <div key={ride.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mr-4">
                    <Car className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Volo {ride.flightNumber} · {ride.passengerCount} pax
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(ride.scheduledTime).toLocaleString('it-IT', {
                        day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-full border ${getStatusColor(ride.status)}`}>
                  {ride.status === 'in_progress' ? <Navigation className="w-4 h-4 mr-1" /> :
                   ride.status === 'completed' ? <CheckCircle className="w-4 h-4 mr-1" /> :
                   ride.status === 'cancelled' ? <XCircle className="w-4 h-4 mr-1" /> :
                   <Clock className="w-4 h-4 mr-1" />}
                  {getStatusText(ride.status)}
                </span>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <User className="w-4 h-4 mr-2 text-primary-600" />
                    Passeggeri
                  </h4>
                  {ride.passengers.slice(0, 3).map((p, i) => (
                    <p key={i} className="text-sm text-gray-700">{p.name}</p>
                  ))}
                </div>
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
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-primary-600" />
                    Percorso
                  </h4>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 mr-2" />
                    <p className="text-sm text-gray-600">{ride.pickup.address}</p>
                  </div>
                  <div className="flex items-start mt-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 mr-2" />
                    <p className="text-sm text-gray-600">{ride.dropoff.address}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center text-lg font-bold text-green-600">
                  <Euro className="w-5 h-5 mr-1" />
                  {ride.totalRevenue.toFixed(2)}
                </div>
                <button
                  onClick={() => setSelectedRide(ride)}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  Vedi Dettagli
                </button>
              </div>
            </div>
          ))}

          {rides.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Navigation className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nessuna corsa trovata</h3>
              <p className="text-gray-600">Non ci sono corse che corrispondono ai filtri.</p>
            </div>
          )}
        </div>
      </div>

      {selectedRide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Volo {selectedRide.flightNumber}</h2>
                <span className={`inline-flex items-center px-3 py-1 mt-2 text-sm font-medium rounded-full border ${getStatusColor(selectedRide.status)}`}>
                  {getStatusText(selectedRide.status)}
                </span>
              </div>
              <button onClick={() => setSelectedRide(null)} className="text-gray-400 hover:text-gray-600 text-3xl">×</button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Passeggeri</h3>
                {selectedRide.passengers.map((p, i) => (
                  <div key={i} className="bg-gray-50 p-3 rounded-lg mb-2">
                    <p className="font-medium text-gray-900">{p.name}</p>
                    <p className="text-sm text-gray-600">{p.email}</p>
                    {p.phone && (
                      <a href={`tel:${p.phone}`} className="text-sm text-primary-600 flex items-center mt-1">
                        <Phone className="w-3 h-3 mr-1" />{p.phone}
                      </a>
                    )}
                  </div>
                ))}
              </div>
              {selectedRide.driver && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Autista</h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium text-gray-900">{selectedRide.driver.name}</p>
                    <p className="text-sm text-gray-600">{selectedRide.driver.vehicle} — {selectedRide.driver.licensePlate}</p>
                    {selectedRide.driver.phone && (
                      <a href={`tel:${selectedRide.driver.phone}`} className="text-sm text-primary-600 flex items-center mt-1">
                        <Phone className="w-3 h-3 mr-1" />{selectedRide.driver.phone}
                      </a>
                    )}
                  </div>
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                  <Euro className="w-5 h-5 mr-2 text-primary-600" />
                  Ricavo totale gruppo
                </h3>
                <p className="text-2xl font-bold text-green-600">€{selectedRide.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Creato: {new Date(selectedRide.createdAt).toLocaleString('it-IT')}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Pickup: {new Date(selectedRide.pickup.time).toLocaleString('it-IT')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
