'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Euro,
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart,
  Users,
  Car
} from 'lucide-react';

interface FinancialStats {
  totalRevenue: number;
  totalBookings: number;
  averageBookingValue: number;
  platformFee: number;
  driverEarnings: number;
  monthlyGrowth: number;
  topDrivers: Array<{
    name: string;
    earnings: number;
    rides: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    bookings: number;
  }>;
}

export default function AdminReportsPage() {
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedYear, setSelectedYear] = useState('2024');

  useEffect(() => {
    fetchFinancialStats();
  }, [selectedPeriod, selectedYear]);

  const fetchFinancialStats = async () => {
    try {
      // Mock data per demo
      const mockStats: FinancialStats = {
        totalRevenue: 48750.00,
        totalBookings: 234,
        averageBookingValue: 208.33,
        platformFee: 9750.00,
        driverEarnings: 39000.00,
        monthlyGrowth: 15.7,
        topDrivers: [
          { name: 'Mario Rossi', earnings: 8500.00, rides: 42 },
          { name: 'Luca Bianchi', earnings: 7200.00, rides: 38 },
          { name: 'Giuseppe Verdi', earnings: 6800.00, rides: 35 },
          { name: 'Paolo Neri', earnings: 5900.00, rides: 31 },
          { name: 'Andrea Gialli', earnings: 5400.00, rides: 28 }
        ],
        revenueByMonth: [
          { month: 'Gen', revenue: 32000, bookings: 145 },
          { month: 'Feb', revenue: 35500, bookings: 162 },
          { month: 'Mar', revenue: 39200, bookings: 178 },
          { month: 'Apr', revenue: 41000, bookings: 189 },
          { month: 'Mag', revenue: 43800, bookings: 203 },
          { month: 'Giu', revenue: 46500, bookings: 218 },
          { month: 'Lug', revenue: 48200, bookings: 227 },
          { month: 'Ago', revenue: 44000, bookings: 205 },
          { month: 'Set', revenue: 47300, bookings: 221 },
          { month: 'Ott', revenue: 48750, bookings: 234 }
        ]
      };

      setStats(mockStats);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    alert('Esportazione PDF in sviluppo...');
  };

  const handleExportExcel = () => {
    alert('Esportazione Excel in sviluppo...');
  };

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento report...</p>
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
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <BarChart3 className="w-8 h-8 mr-3 text-primary-600" />
                Report Finanziari
              </h1>
              <p className="text-gray-600 mt-1">
                Analisi dettagliata dei ricavi e delle performance
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleExportPDF}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                PDF
              </button>
              <button
                onClick={handleExportExcel}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Excel
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-2" />
                Periodo
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="week">Ultima Settimana</option>
                <option value="month">Ultimo Mese</option>
                <option value="quarter">Ultimo Trimestre</option>
                <option value="year">Anno Corrente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Anno
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Euro className="w-10 h-10 opacity-80" />
              <span className={`flex items-center text-sm font-medium ${
                stats.monthlyGrowth >= 0 ? 'bg-green-500' : 'bg-red-500'
              } bg-opacity-30 px-2 py-1 rounded`}>
                {stats.monthlyGrowth >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {Math.abs(stats.monthlyGrowth)}%
              </span>
            </div>
            <p className="text-sm opacity-90 mb-1">Ricavi Totali</p>
            <p className="text-3xl font-bold">€{stats.totalRevenue.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Car className="w-10 h-10 opacity-80" />
            </div>
            <p className="text-sm opacity-90 mb-1">Totale Corse</p>
            <p className="text-3xl font-bold">{stats.totalBookings}</p>
            <p className="text-sm opacity-75 mt-2">Valore medio: €{stats.averageBookingValue.toFixed(2)}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <PieChart className="w-10 h-10 opacity-80" />
            </div>
            <p className="text-sm opacity-90 mb-1">Commissioni Piattaforma (20%)</p>
            <p className="text-3xl font-bold">€{stats.platformFee.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-10 h-10 opacity-80" />
            </div>
            <p className="text-sm opacity-90 mb-1">Guadagni Autisti (80%)</p>
            <p className="text-3xl font-bold">€{stats.driverEarnings.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-primary-600" />
            Andamento Ricavi Mensili
          </h2>
          
          <div className="space-y-3">
            {stats.revenueByMonth.map((month, index) => {
              const maxRevenue = Math.max(...stats.revenueByMonth.map(m => m.revenue));
              const percentage = (month.revenue / maxRevenue) * 100;
              
              return (
                <div key={index} className="flex items-center">
                  <div className="w-12 text-sm font-medium text-gray-700">{month.month}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-primary-500 to-primary-600 h-full rounded-full flex items-center justify-end px-4 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    >
                      <span className="text-white font-semibold text-sm">
                        €{month.revenue.toLocaleString('it-IT')}
                      </span>
                    </div>
                  </div>
                  <div className="w-24 text-right text-sm text-gray-600 ml-4">
                    {month.bookings} corse
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Top Drivers */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Users className="w-6 h-6 mr-2 text-primary-600" />
              Top 5 Autisti
            </h2>
            
            <div className="space-y-4">
              {stats.topDrivers.map((driver, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-600' :
                      'bg-primary-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="ml-4">
                      <p className="font-semibold text-gray-900">{driver.name}</p>
                      <p className="text-sm text-gray-600">{driver.rides} corse completate</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-green-600">
                      €{driver.earnings.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500">guadagnati</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <PieChart className="w-6 h-6 mr-2 text-primary-600" />
              Distribuzione Ricavi
            </h2>
            
            <div className="space-y-6">
              {/* Platform Fee */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 font-medium">Commissioni Piattaforma</span>
                  <span className="text-gray-900 font-bold">20%</span>
                </div>
                <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div className="bg-purple-500 h-full" style={{ width: '20%' }}></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  €{stats.platformFee.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Driver Earnings */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 font-medium">Guadagni Autisti</span>
                  <span className="text-gray-900 font-bold">80%</span>
                </div>
                <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div className="bg-green-500 h-full" style={{ width: '80%' }}></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  €{stats.driverEarnings.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Summary */}
              <div className="pt-6 border-t border-gray-200">
                <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 mb-2">Riepilogo Finanziario</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Ricavi Totali:</span>
                      <span className="font-semibold text-gray-900">
                        €{stats.totalRevenue.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Corse Totali:</span>
                      <span className="font-semibold text-gray-900">{stats.totalBookings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Valore Medio Corsa:</span>
                      <span className="font-semibold text-gray-900">
                        €{stats.averageBookingValue.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-300">
                      <span className="text-sm font-medium text-gray-700">Crescita Mensile:</span>
                      <span className={`font-bold ${stats.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stats.monthlyGrowth >= 0 ? '+' : ''}{stats.monthlyGrowth}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Insights */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Insights e Raccomandazioni
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>✅ <strong>Performance Eccellente:</strong> La crescita del {stats.monthlyGrowth}% rispetto al mese precedente indica un trend molto positivo</li>
            <li>✅ <strong>Autisti Performanti:</strong> I top 5 autisti generano il 68% dei ricavi totali - considera programmi di incentivazione</li>
            <li>✅ <strong>Valore Medio Alto:</strong> Il valore medio di €{stats.averageBookingValue.toFixed(2)} per corsa è superiore alla media del settore</li>
            <li>⚠️ <strong>Opportunità:</strong> Agosto ha mostrato un calo - considera promozioni stagionali per i mesi estivi</li>
          </ul>
        </div>
      </div>
    </div>
  );
}