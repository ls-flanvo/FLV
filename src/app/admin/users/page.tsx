'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, Search, Filter, UserCheck, Ban,
  Mail, Phone, Calendar, MoreVertical, Trash2, ArrowLeft, CheckCircle
} from 'lucide-react';

interface AdminUser {
  id: string; name: string; email: string; phone: string;
  role: 'user' | 'driver' | 'admin';
  status: 'active' | 'suspended' | 'pending';
  createdAt: string; totalBookings?: number; totalSpent?: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  useEffect(() => { fetchUsers(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('flanvo_token');
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (roleFilter !== 'all') params.set('role', roleFilter);
      const res = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.users) {
        setUsers(data.users.map((u: { id: string; name: string; email: string; phone: string; role: string; isVerified: boolean; createdAt: string; _count: { bookings: number } }) => ({
          id: u.id, name: u.name, email: u.email, phone: u.phone || '',
          role: u.role, status: u.isVerified ? 'active' : 'pending',
          createdAt: u.createdAt, totalBookings: u._count?.bookings ?? 0,
        })));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const patch = async (userId: string, action: string) => {
    const token = localStorage.getItem('flanvo_token');
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId, action }),
    });
    return res.ok;
  };

  const handleSuspend = async (id: string) => {
    if (!confirm('Sospendere questo utente?')) return;
    if (await patch(id, 'suspend')) {
      setUsers(u => u.map(x => x.id === id ? { ...x, status: 'suspended' as const } : x));
      setActionMenu(null);
    }
  };
  const handleActivate = async (id: string) => {
    if (await patch(id, 'activate')) {
      setUsers(u => u.map(x => x.id === id ? { ...x, status: 'active' as const } : x));
      setActionMenu(null);
    }
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questo utente? Azione irreversibile.')) return;
    if (await patch(id, 'delete')) {
      setUsers(u => u.filter(x => x.id !== id));
      setActionMenu(null);
    }
  };

  const filtered = users.filter(u => {
    const s = searchTerm.toLowerCase();
    const matchSearch = !s || u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    pending: users.filter(u => u.status === 'pending').length,
  };

  const statusBadge = (s: string) => {
    if (s === 'active') return 'bg-success/10 text-success border border-success/20';
    if (s === 'suspended') return 'bg-danger/10 text-danger border border-danger/20';
    return 'bg-warning/10 text-warning border border-warning/20';
  };
  const roleBadge = (r: string) => {
    if (r === 'driver') return 'bg-primary-500/10 text-primary-400 border border-primary-500/20';
    if (r === 'admin') return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
    return 'bg-surface-3 text-ink-secondary border border-surface-5';
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0B0B] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink-secondary mb-4">
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-surface-2 border border-surface-5 rounded-xl">
              <Users className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Gestione Utenti</h1>
              <p className="text-ink-muted text-xs">{users.length} utenti totali</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Totale', value: stats.total, color: 'text-white' },
            { label: 'Attivi', value: stats.active, color: 'text-success' },
            { label: 'Sospesi', value: stats.suspended, color: 'text-danger' },
            { label: 'In attesa', value: stats.pending, color: 'text-warning' },
          ].map(s => (
            <div key={s.label} className="bg-surface-1 border border-surface-4 rounded-xl p-4">
              <p className="text-xs text-ink-muted mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-surface-1 border border-surface-4 rounded-xl p-4 mb-5 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
            <input
              type="text" value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); fetchUsers(); }}
              placeholder="Nome, email..."
              className="w-full pl-9 pr-4 py-2.5 bg-surface-2 border border-surface-5 rounded-lg text-white text-sm placeholder-ink-muted focus:outline-none focus:border-primary-500"
            />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2.5 bg-surface-2 border border-surface-5 rounded-lg text-sm text-white focus:outline-none focus:border-primary-500">
            <option value="all">Tutti i ruoli</option>
            <option value="user">Passeggeri</option>
            <option value="driver">Autisti</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-surface-2 border border-surface-5 rounded-lg text-sm text-white focus:outline-none focus:border-primary-500">
            <option value="all">Tutti gli stati</option>
            <option value="active">Attivi</option>
            <option value="suspended">Sospesi</option>
            <option value="pending">In attesa</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-surface-1 border border-surface-4 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-2 border-b border-surface-4">
                <tr>
                  {['Utente', 'Contatti', 'Ruolo', 'Stato', 'Corse', 'Registrato', ''].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-4">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-surface-2/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-400 text-sm font-bold shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <p className="font-medium text-white text-sm">{u.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-ink-secondary">
                          <Mail className="w-3 h-3" />{u.email}
                        </div>
                        {u.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                            <Phone className="w-3 h-3" />{u.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${roleBadge(u.role)}`}>
                        {u.role === 'driver' ? 'Autista' : u.role === 'admin' ? 'Admin' : 'Passeggero'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(u.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-success' : u.status === 'suspended' ? 'bg-danger' : 'bg-warning'}`} />
                        {u.status === 'active' ? 'Attivo' : u.status === 'suspended' ? 'Sospeso' : 'In attesa'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-ink-secondary">{u.totalBookings ?? 0}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                        <Calendar className="w-3 h-3" />
                        {new Date(u.createdAt).toLocaleDateString('it-IT')}
                      </div>
                    </td>
                    <td className="px-5 py-4 relative">
                      <button
                        onClick={() => setActionMenu(actionMenu === u.id ? null : u.id)}
                        className="p-1.5 rounded-lg text-ink-muted hover:text-white hover:bg-surface-3 transition-all"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {actionMenu === u.id && (
                        <div className="absolute right-4 top-12 bg-surface-2 border border-surface-5 rounded-xl shadow-surface z-20 w-44 overflow-hidden">
                          {u.status === 'active' ? (
                            <button onClick={() => handleSuspend(u.id)}
                              className="w-full px-4 py-2.5 text-left text-sm text-warning hover:bg-surface-3 flex items-center gap-2">
                              <Ban className="w-3.5 h-3.5" /> Sospendi
                            </button>
                          ) : (
                            <button onClick={() => handleActivate(u.id)}
                              className="w-full px-4 py-2.5 text-left text-sm text-success hover:bg-surface-3 flex items-center gap-2">
                              <UserCheck className="w-3.5 h-3.5" /> Attiva
                            </button>
                          )}
                          <div className="h-px bg-surface-4" />
                          <button onClick={() => handleDelete(u.id)}
                            className="w-full px-4 py-2.5 text-left text-sm text-danger hover:bg-surface-3 flex items-center gap-2">
                            <Trash2 className="w-3.5 h-3.5" /> Elimina
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-10 h-10 text-ink-muted mx-auto mb-3" />
                <p className="text-ink-muted text-sm">Nessun utente trovato</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
