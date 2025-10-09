'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store';
import { Input, Button, Card } from '@/components/ui';
import { Car, Lock, Mail, AlertCircle } from 'lucide-react';

export default function DriverLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Chiamata API per login driver
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          role: 'driver' // Specifica che è login driver
        }),
      });

      const data = await response.json();

      if (data.user && data.user.role === 'driver') {
        login(data.user);
        router.push('/driver/dashboard');
      } else if (data.user && data.user.role !== 'driver') {
        setError('Questo account non è registrato come autista');
      } else {
        setError(data.error || 'Credenziali non valide');
      }
    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  // Funzione demo per login rapido
  const handleDemoLogin = () => {
    const demoDriver = {
      id: 'driver-demo',
      email: 'driver@flanvo.com',
      name: 'Marco Rossi',
      role: 'driver' as const,
    };
    login(demoDriver);
    router.push('/driver/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo e titolo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl mb-4 shadow-lg">
            <Car className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Area Autisti
          </h1>
          <p className="text-gray-600">
            Accedi per gestire le tue corse
          </p>
        </div>

        {/* Form Card */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
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

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
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

            {/* Errore */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Pulsante Login */}
            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="w-full"
            >
              {loading ? 'Accesso in corso...' : 'Accedi come Autista'}
            </Button>

            {/* Link recupero password */}
            <div className="text-center">
              <Link 
                href="/driver/forgot-password" 
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Password dimenticata?
              </Link>
            </div>
          </form>

          {/* Demo Login */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleDemoLogin}
              className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              🚀 Login Demo (Prova subito)
            </button>
          </div>
        </Card>

        {/* Info aggiuntive */}
        <div className="mt-6 space-y-3">
          <Card className="bg-primary-50 border-primary-200">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">💡</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">
                  Sei un passeggero?
                </h3>
                <p className="text-xs text-gray-600 mb-2">
                  Accedi dall'area passeggeri per prenotare le tue corse
                </p>
                <Link 
                  href="/login" 
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
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
                <h3 className="font-semibold text-gray-900 text-sm mb-1">
                  Vuoi diventare autista?
                </h3>
                <p className="text-xs text-gray-600 mb-2">
                  Registrati per guidare con Flanvo
                </p>
                <Link 
                  href="/driver/signup" 
                  className="text-sm text-accent-600 hover:text-accent-700 font-medium"
                >
                  Registrati come autista →
                </Link>
              </div>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link 
            href="/" 
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Torna alla homepage
          </Link>
        </div>
      </div>
    </div>
  );
}