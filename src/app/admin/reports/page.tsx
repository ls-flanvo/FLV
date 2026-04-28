'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  TrendingUp,
  Euro,
  Calendar,
  BarChart3,
  PieChart,
  Users,
  Car,
  Filter,
} from 'lucide-react';

interface AnalyticsData {
  totalRevenue: number;
  platformFee: number;
  driverEarnings: number;
  totalBookings: number;
  completedRides: number;
  matchRate: number;
  avgGroupSize: number;
  averageBookingValue: number;
  topDrivers: { name: string; earnings: number; rides: number; rating: number }[];
  revenueByDay: { date: string; revenue: number; rides: number }[];
}

export default function AdminReportsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('flanvo_token');
      const res = await fetch(`/api/admin/analytics?period=${selectedPeriod}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setData(await res.json());
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Caricamento report...</p>
        </div>
      </div>
    );
  }

  const maxRevenue = data.revenueByDay.length
    ? Math.max(...data.revenueByDay.map((d) => d.revenue), 1)
    : 1;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="/admin/dashboard" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alla Dashboard
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <BarChart3 className="w-8 h-8 mr-3 text-primary-600" />
                Report e Analytics
              </h1>
              <p className="text-gray-600 mt-1">Dati reali dal database</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <div className="flex items-center gap-4">
            <Filter className="w-4 h-4 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Periodo:</label>
            {['week', 'month', 'quarter', 'year'].map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === p
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {p === 'week' ? 'Settimana' : p === 'month' ? 'Mese' : p === 'quarter' ? 'Trimestre' : 'Anno'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
            <Euro className="w-10 h-10 opacity-80 mb-4" />
            <p className="text-sm opacity-90 mb-1">Ricavi Totali</p>
            <p className="text-3xl font-bold">€{data.totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
            <Car className="w-10 h-10 opacity-80 mb-4" />
            <p className="text-sm opacity-90 mb-1">Corse completate</p>
            <p className="text-3xl font-bold">{data.completedRides}</p>
            <p className="text-sm opacity-75 mt-2">su {data.totalBookings} prenotazioni</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
            <PieChart className="w-10 h-10 opacity-80 mb-4" />
            <p className="text-sm opacity-90 mb-1">Commissioni Flanvo</p>
            <p className="text-3xl font-bold">€{data.platformFee.toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg">
            <TrendingUp className="w-10 h-10 opacity-80 mb-4" />
            <p className="text-sm opacity-90 mb-1">Match Rate</p>
            <p className="text-3xl font-bold">{data.matchRate}%</p>
            <p className="text-sm opacity-75 mt-2">Gruppo medio: {data.avgGroupSize} pax</p>
          </div>
        </div>

        {data.revenueByDay.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <TrendingUp className="w-6 h-6 mr-2 text-primary-600" />
              Ricavi per Giorno
            </h2>
            <div className="space-y-3">
              {data.revenueByDay.slice(-14).map((day, i) => (
                <div key={i} className="flex items-center">
                  <div className="w-24 text-xs text-gray-600">
                    {new Date(day.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-full h-7 relative overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-primary-500 to-primary-600 h-full rounded-full flex items-center justify-end px-3 transition-all duration-500"
                      style={{ width: `${Math.max((day.revenue / maxRevenue) * 100, 2)}%` }}
                    >
                      {day.revenue > 0 && (
                        <span className="text-white font-semibold text-xs">€{day.revenue.toFixed(0)}</span>
                      )}
                    </div>
                  </div>
                  <div className="w-16 text-right text-xs text-gray-500 ml-2">
                    {day.rides} corse
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Users className="w-6 h-6 mr-2 text-primary-600" />
              Top Autisti
            </h2>
            {data.topDrivers.length === 0 ? (
              <p className="text-gray-500 text-sm">Nessun dato disponibile</p>
            ) : (
              <div className="space-y-4">
                {data.topDrivers.map((driver, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-primary-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="ml-4">
                        <p className="font-semibold text-gray-900">{driver.name}</p>
                        <p className="text-sm text-gray-600">{driver.rides} corse · ★ {driver.rating.toFixed(1)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-green-600">€{driver.earnings.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">guadagnati</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <PieChart className="w-6 h-6 mr-2 text-primary-600" />
              Riepilogo
            </h2>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {[
                  { label: 'Ricavi totali', value: `€${data.totalRevenue.toFixed(2)}` },
                  { label: 'Guadagni autisti (80%)', value: `€${data.driverEarnings.toFixed(2)}` },
                  { label: 'Commissioni Flanvo (20%)', value: `€${data.platformFee.toFixed(2)}` },
                  { label: 'Prenotazioni totali', value: String(data.totalBookings) },
                  { label: 'Valore medio prenotazione', value: `€${data.averageBookingValue.toFixed(2)}` },
                  { label: 'Dimensione media gruppo', value: `${data.avgGroupSize} pax` },
                  { label: 'Match Rate', value: `${data.matchRate}%` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-sm text-gray-600">{label}</span>
                    <span className="font-semibold text-gray-900">{value}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <p className="text-xs text-gray-500 flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  Dati aggiornati in tempo reale dal database
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
