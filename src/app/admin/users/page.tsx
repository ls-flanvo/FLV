'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Search, 
  Filter, 
  UserCheck, 
  UserX, 
  Mail, 
  Phone, 
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'driver' | 'admin';
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
  totalBookings?: number;
  totalSpent?: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      
      // Mock data per demo
      const mockUsers: User[] = [
        {
          id: '1',
          name: 'Luca Sabato',
          email: 'luca.sabato@email.com',
          phone: '+39 333 1234567',
          role: 'user',
          status: 'active',
          createdAt: '2024-01-15',
          totalBookings: 12,
          totalSpent: 850.50
        },
        {
          id: '2',
          name: 'Mario Rossi',
          email: 'mario.rossi@email.com',
          phone: '+39 334 7654321',
          role: 'driver',
          status: 'active',
          createdAt: '2024-02-20',
          totalBookings: 45,
          totalSpent: 0
        },
        {
          id: '3',
          name: 'Giulia Bianchi',
          email: 'giulia.bianchi@email.com',
          phone: '+39 335 9876543',
          role: 'user',
          status: 'active',
          createdAt: '2024-03-10',
          totalBookings: 8,
          totalSpent: 620.00
        },
        {
          id: '4',
          name: 'Paolo Verdi',
          email: 'paolo.verdi@email.com',
          phone: '+39 336 5551234',
          role: 'driver',
          status: 'pending',
          createdAt: '2024-10-01',
          totalBookings: 0,
          totalSpent: 0
        },
        {
          id: '5',
          name: 'Anna Neri',
          email: 'anna.neri@email.com',
          phone: '+39 337 4445678',
          role: 'user',
          status: 'suspended',
          createdAt: '2024-05-22',
          totalBookings: 3,
          totalSpent: 180.00
        }
      ];

      setUsers(mockUsers);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const handleSuspendUser = async (userId: string) => {
    if (!confirm('Sei sicuro di voler sospendere questo utente?')) return;
    
    try {
      await fetch(`/api/admin/users/${userId}/suspend`, { method: 'POST' });
      setUsers(users.map(u => 
        u.id === userId ? { ...u, status: 'suspended' as const } : u
      ));
      setShowActionMenu(null);
      alert('Utente sospeso con successo');
    } catch (error) {
      alert('Errore durante la sospensione');
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      await fetch(`/api/admin/users/${userId}/activate`, { method: 'POST' });
      setUsers(users.map(u => 
        u.id === userId ? { ...u, status: 'active' as const } : u
      ));
      setShowActionMenu(null);
      alert('Utente attivato con successo');
    } catch (error) {
      alert('Errore durante l\'attivazione');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo utente? Questa azione è irreversibile.')) return;
    
    try {
      await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      setUsers(users.filter(u => u.id !== userId));
      setShowActionMenu(null);
      alert('Utente eliminato con successo');
    } catch (error) {
      alert('Errore durante l\'eliminazione');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm);
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    pending: users.filter(u => u.status === 'pending').length,
    drivers: users.filter(u => u.role === 'driver').length,
    passengers: users.filter(u => u.role === 'user').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento utenti...</p>
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
                <Users className="w-8 h-8 mr-3 text-primary-600" />
                Gestisci Utenti
              </h1>
              <p className="text-gray-600 mt-1">
                Visualizza e gestisci tutti gli utenti della piattaforma
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Totale</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 shadow-sm border border-green-200">
            <p className="text-sm text-green-700 mb-1">Attivi</p>
            <p className="text-2xl font-bold text-green-900">{stats.active}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 shadow-sm border border-red-200">
            <p className="text-sm text-red-700 mb-1">Sospesi</p>
            <p className="text-2xl font-bold text-red-900">{stats.suspended}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 shadow-sm border border-yellow-200">
            <p className="text-sm text-yellow-700 mb-1">In Attesa</p>
            <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 shadow-sm border border-blue-200">
            <p className="text-sm text-blue-700 mb-1">Autisti</p>
            <p className="text-2xl font-bold text-blue-900">{stats.drivers}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 shadow-sm border border-purple-200">
            <p className="text-sm text-purple-700 mb-1">Passeggeri</p>
            <p className="text-2xl font-bold text-purple-900">{stats.passengers}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-2" />
                Cerca
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome, email o telefono..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-2" />
                Ruolo
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">Tutti i ruoli</option>
                <option value="user">Passeggeri</option>
                <option value="driver">Autisti</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Status Filter */}
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
                <option value="active">Attivi</option>
                <option value="suspended">Sospesi</option>
                <option value="pending">In Attesa</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Utente</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Contatti</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Ruolo</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Stato</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Statistiche</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Registrato</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold mr-3">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-4 h-4 mr-2" />
                          {user.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2" />
                          {user.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                        user.role === 'driver' 
                          ? 'bg-blue-100 text-blue-800'
                          : user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role === 'driver' ? '🚗 Autista' : user.role === 'admin' ? '👑 Admin' : '👤 Passeggero'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : user.status === 'suspended'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {user.status === 'suspended' && <Ban className="w-3 h-3 mr-1" />}
                        {user.status === 'active' ? 'Attivo' : user.status === 'suspended' ? 'Sospeso' : 'In Attesa'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'user' ? (
                        <div className="text-sm">
                          <p className="text-gray-900 font-medium">{user.totalBookings} corse</p>
                          <p className="text-gray-500">€{user.totalSpent?.toFixed(2)}</p>
                        </div>
                      ) : (
                        <div className="text-sm">
                          <p className="text-gray-900 font-medium">{user.totalBookings} corse</p>
                          <p className="text-gray-500">Completate</p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(user.createdAt).toLocaleDateString('it-IT')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center relative">
                        <button
                          onClick={() => setShowActionMenu(showActionMenu === user.id ? null : user.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-600" />
                        </button>

                        {showActionMenu === user.id && (
                          <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-48">
                            <button
                              onClick={() => alert('Funzionalità in sviluppo')}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center text-sm text-gray-700"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Modifica
                            </button>
                            
                            {user.status === 'active' ? (
                              <button
                                onClick={() => handleSuspendUser(user.id)}
                                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center text-sm text-orange-600"
                              >
                                <Ban className="w-4 h-4 mr-2" />
                                Sospendi
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivateUser(user.id)}
                                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center text-sm text-green-600"
                              >
                                <UserCheck className="w-4 h-4 mr-2" />
                                Attiva
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center text-sm text-red-600 border-t border-gray-200"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Elimina
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nessun utente trovato</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}