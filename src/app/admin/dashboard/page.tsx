'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store';
import { StatCard, Badge } from '@/components/ui';
import {
  Users, Car, DollarSign, TrendingUp, AlertCircle,
  CheckCircle, XCircle, Clock, MapPin, Shield, Navigation, BarChart3, Settings
} from 'lucide-react';

interface AdminStats {
  totalUsers: number; totalDrivers: number; activeRides: number;
  totalRevenue: number; todayRides: number; pendingApprovals: number;
}
interface RecentActivity {
  id: string; type: string; user: string;
  description: string; timestamp: string; status: 'success' | 'pending' | 'warning';
}

const QUICK_ACTIONS = [
  { href: '/admin/users', icon: Users, label: 'Gestisci utenti' },
  { href: '/admin/drivers/approve', icon: Car, label: 'Approva autisti' },
  { href: '/admin/rides/monitor', icon: Navigation, label: 'Monitora corse' },
  { href: '/admin/map', icon: MapPin, label: 'Mappa live' },
  { href: '/admin/reports', icon: BarChart3, label: 'Analytics' },
  { href: '/admin/config', icon: Settings, label: 'Tariffe' },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0, totalDrivers: 0, activeRides: 0,
    totalRevenue: 0, todayRides: 0, pendingApprovals: 0,
  });
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const { user, isAuthenticated, token } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) { router.push('/admin/login'); return; }
    if (user?.role !== 'admin') { router.push('/login'); return; }
    fetchAdminData();
  }, [isAuthenticated, user, router]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAdminData = async () => {
    try {
      const authToken = token || localStorage.getItem('flanvo_token');
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.stats) {
        setStats(data.stats);
        setActivities((data.activity || []).map((a: { id: string; type: string; user: string; description: string; timestamp: string; status: string }) => ({
          id: a.id, type: a.type, user: a.user,
          description: a.description, timestamp: a.timestamp,
          status: (a.status === 'pending' ? 'pending' : a.status === 'cancelled' ? 'warning' : 'success') as 'success' | 'pending' | 'warning',
        })));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (!isAuthenticated || user?.role !== 'admin') return null;

  const getActivityIcon = (type: string) => {
    const cls = 'w-4 h-4';
    if (type === 'booking') return <CheckCircle className={`${cls} text-success`} />;
    if (type === 'driver_signup') return <Car className={`${cls} text-primary-400`} />;
    if (type === 'ride_completed') return <MapPin className={`${cls} text-primary-400`} />;
    if (type === 'cancellation') return <XCircle className={`${cls} text-danger`} />;
    return <AlertCircle className={`${cls} text-ink-muted`} />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary-500/10 border border-primary-500/20 rounded-xl">
            <Shield className="w-6 h-6 text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-ink-muted text-sm">{user?.name}</p>
          </div>
        </div>
        {stats.pendingApprovals > 0 && (
          <Link href="/admin/drivers/approve">
            <div className="flex items-center gap-2 bg-warning/10 border border-warning/20 rounded-xl px-4 py-2.5">
              <span className="w-2 h-2 bg-warning rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-warning">
                {stats.pendingApprovals} autist{stats.pendingApprovals === 1 ? 'a' : 'i'} in attesa
              </span>
            </div>
          </Link>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {[
          { label: 'Utenti', value: stats.totalUsers, icon: <Users className="w-4 h-4 text-ink-muted" /> },
          { label: 'Autisti', value: stats.totalDrivers, icon: <Car className="w-4 h-4 text-ink-muted" /> },
          { label: 'Revenue', value: `€${stats.totalRevenue.toLocaleString()}`, icon: <DollarSign className="w-4 h-4 text-primary-400" />, accent: true },
          { label: 'Corse oggi', value: stats.todayRides, icon: <TrendingUp className="w-4 h-4 text-ink-muted" /> },
          { label: 'Attive ora', value: stats.activeRides, icon: <Navigation className="w-4 h-4 text-success" /> },
          { label: 'Pending', value: stats.pendingApprovals, icon: <Clock className="w-4 h-4 text-warning" /> },
        ].map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} accent={s.accent} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity feed */}
        <div className="lg:col-span-2">
          <div className="bg-surface-1 border border-surface-4 rounded-2xl p-6 bg-card-gradient">
            <h2 className="text-lg font-bold text-white mb-5">Attività recenti</h2>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
              </div>
            ) : activities.length === 0 ? (
              <p className="text-ink-muted text-sm text-center py-8">Nessuna attività recente</p>
            ) : (
              <div className="space-y-2">
                {activities.slice(0, 8).map((a) => (
                  <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-2 transition-all">
                    <div className="p-1.5 bg-surface-3 rounded-lg shrink-0 mt-0.5">
                      {getActivityIcon(a.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{a.description}</p>
                      <p className="text-xs text-ink-muted mt-0.5">
                        {new Date(a.timestamp).toLocaleString('it-IT', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <Badge variant={a.status === 'success' ? 'success' : a.status === 'pending' ? 'warning' : 'danger'} dot>
                      {a.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <div className="bg-surface-1 border border-surface-4 rounded-2xl p-6 bg-card-gradient">
            <h2 className="text-lg font-bold text-white mb-4">Azioni rapide</h2>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map(({ href, icon: Icon, label }) => (
                <Link key={href} href={href}>
                  <div className="flex flex-col items-center gap-2 p-4 bg-surface-2 border border-surface-5 rounded-xl hover:border-primary-500/30 hover:bg-surface-3 transition-all group cursor-pointer">
                    <Icon className="w-5 h-5 text-ink-secondary group-hover:text-primary-400 transition-colors" />
                    <span className="text-xs font-medium text-ink-secondary group-hover:text-white transition-colors text-center leading-tight">{label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
