'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store';
import { Card, Button, Badge } from '@/components/ui';
import { 
  Users, 
  Car, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Shield
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalDrivers: number;
  activeRides: number;
  totalRevenue: number;
  todayRides: number;
  pendingApprovals: number;
}

interface RecentActivity {
  id: string;
  type: 'booking' | 'driver_signup' | 'ride_completed' | 'cancellation';
  user: string;
  description: string;
  timestamp: string;
  status: 'success' | 'pending' | 'warning';
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalDrivers: 0,
    activeRides: 0,
    totalRevenue: 0,
    todayRides: 0,
    pendingApprovals: 0,
  });
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'drivers' | 'rides'>('overview');

  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }

    if (user?.role !== 'admin') {
      router.push('/login');
      return;
    }

    fetchAdminData();
  }, [isAuthenticated, user, router]);

  const fetchAdminData = async () => {
    try {
      // Mock data - sostituire con chiamate API reali
      setStats({
        totalUsers: 1247,
        totalDrivers: 89,
        activeRides: 34,
        totalRevenue: 45890,
        todayRides: 142,
        pendingApprovals: 7,
      });

      setActivities([
        {
          id: '1',
          type: 'booking',
          user: 'Marco Rossi',
          description: 'Nuova prenotazione per volo AZ1234',
          timestamp: new Date().toISOString(),
          status: 'success'
        },
        {
          id: '2',
          type: 'driver_signup',
          user: 'Laura Bianchi',
          description: 'Richiesta registrazione autista',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'pending'
        },
        {
          id: '3',
          type: 'ride_completed',
          user: 'Giovanni Verdi',
          description: 'Corsa completata - €45',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          status: 'success'
        },
        {
          id: '4',
          type: 'cancellation',
          user: 'Anna Neri',
          description: 'Cancellazione prenotazione',
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          status: 'warning'
        },
      ]);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'driver_signup':
        return <Car className="w-5 h-5 text-blue-600" />;
      case 'ride_completed':
        return <MapPin className="w-5 h-5 text-primary-600" />;
      case 'cancellation':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Dashboard Admin</h1>
            <p className="text-gray-600">Benvenuto, {user?.name}! 👨‍✈️</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-4 rounded-full">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Utenti Totali</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-4">
            <div className="bg-primary-100 p-4 rounded-full">
              <Car className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Autisti Attivi</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalDrivers}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-4">
            <div className="bg-green-100 p-4 rounded-full">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Revenue Totale</p>
              <p className="text-3xl font-bold text-gray-900">€{stats.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-4">
            <div className="bg-accent-100 p-4 rounded-full">
              <TrendingUp className="w-8 h-8 text-accent-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Corse Oggi</p>
              <p className="text-3xl font-bold text-gray-900">{stats.todayRides}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Corse Attive</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeRides}</p>
            </div>
            <MapPin className="w-10 h-10 text-primary-500" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Approvazioni Pending</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pendingApprovals}</p>
            </div>
            <Clock className="w-10 h-10 text-yellow-500" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tasso Completamento</p>
              <p className="text-3xl font-bold text-gray-900">94%</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-6">
          {['overview', 'users', 'drivers', 'rides'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors capitalize ${
                activeTab === tab
                  ? 'border-accent-600 text-accent-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Attività Recenti */}
          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Attività Recenti</h2>
              {loading ? (
                <p className="text-center text-gray-600 py-8">Caricamento...</p>
              ) : (
                <div className="space-y-4">
                  {activities.map(activity => (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-shrink-0 mt-1">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {activity.user}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(activity.timestamp).toLocaleString('it-IT')}
                        </p>
                      </div>
                      <Badge variant={
                        activity.status === 'success' ? 'success' :
                        activity.status === 'pending' ? 'warning' : 'danger'
                      }>
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Quick Actions */}
<div>
  <Card>
    <h2 className="text-xl font-bold text-gray-900 mb-6">Azioni Rapide</h2>
    <div className="flex flex-col gap-4">
      <Link href="/admin/users" className="block">
        <Button className="w-full justify-start text-sm py-2">
          <Users className="w-4 h-4 mr-2" />
          Gestisci Utenti
        </Button>
      </Link>
      <Link href="/admin/drivers/approve" className="block">
        <Button variant="secondary" className="w-full justify-start text-sm py-2">
          <Car className="w-4 h-4 mr-2" />
          Approva Autisti
        </Button>
      </Link>
      <Link href="/admin/reports" className="block">
        <Button variant="secondary" className="w-full justify-start text-sm py-2">
          <DollarSign className="w-4 h-4 mr-2" />
          Report Finanziari
        </Button>
      </Link>
      <Link href="/admin/rides/monitor" className="block">
        <Button variant="secondary" className="w-full justify-start text-sm py-2">
          <MapPin className="w-4 h-4 mr-2" />
          Monitora Corse
        </Button>
      </Link>
    </div>
  </Card>

            <Card className="mt-6 bg-yellow-50 border-yellow-200">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    Richieste in Attesa
                  </h3>
                  <p className="text-xs text-gray-600 mb-3">
                    Ci sono {stats.pendingApprovals} richieste di autisti da approvare
                  </p>
                  <Button size="sm" onClick={() => setActiveTab('drivers')}>
                    Rivedi Richieste
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab !== 'overview' && (
        <Card className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Sezione {activeTab} in sviluppo
          </h3>
          <p className="text-gray-600">
            Questa funzionalità sarà disponibile a breve
          </p>
        </Card>
      )}
    </div>
  );
}