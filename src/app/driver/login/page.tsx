'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store';
import { Card } from '@/components/ui';
import { Car, Lock, Mail, AlertCircle } from 'lucide-react';

export default function DriverLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, setToken } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.status === 403) {
        setError(data.error || 'Account in attesa di approvazione');
        return;
      }

      if (data.user && data.token) {
        if (data.user.role !== 'driver') {
          setError('Questo account non è registrato come autista');
          return;
        }
        login(data.user);
        setToken(data.token);
        if (typeof window !== 'undefined') {
          localStorage.setItem('flanvo_user', JSON.stringify(data.user));
          localStorage.setItem('flanvo_token', data.token);
        }
        router.push('/driver/dashboard');
      } else {
        setError(data.error || 'Credenziali non valide');
      }
    } catch {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl mb-4 shadow-lg">
            <Car className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Area Autisti</h1>
          <p className="text-gray-600">Accedi per gestire le tue corse</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="autista@esempio.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Accesso in corso...' : 'Accedi come Autista'}
            </button>
          </form>
        </Card>

        <div className="mt-6 space-y-3">
          <Card className="bg-primary-50 border-primary-200">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">💡</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">Sei un passeggero?</h3>
                <p className="text-xs text-gray-600 mb-2">Accedi dall'area passeggeri per prenotare le tue corse</p>
                <Link href="/login" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Vai al login passeggeri →
                </Link>
              </div>
            </div>
          </Card>

          <Card className="bg-accent-50 border-accent-200">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">👨‍✈️</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">Vuoi diventare autista?</h3>
                <p className="text-xs text-gray-600 mb-2">Registrati per guidare con Flanvo</p>
                <Link href="/driver/signup" className="text-sm text-accent-600 hover:text-accent-700 font-medium">
                  Registrati come autista →
                </Link>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← Torna alla homepage</Link>
        </div>
      </div>
    </div>
  );
}
