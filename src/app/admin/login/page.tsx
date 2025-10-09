'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store';
import { Input, Button, Card } from '@/components/ui';
import { Shield, Lock, Mail, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
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
      // Chiamata API per login admin
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          role: 'admin' // Specifica che è login admin
        }),
      });

      const data = await response.json();

      if (data.user && data.user.role === 'admin') {
        login(data.user);
        router.push('/admin/dashboard');
      } else if (data.user && data.user.role !== 'admin') {
        setError('Accesso negato: permessi amministratore richiesti');
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
    const demoAdmin = {
      id: 'admin-demo',
      email: 'admin@flanvo.com',
      name: 'Admin Flanvo',
      role: 'admin' as const,
    };
    login(demoAdmin);
    router.push('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-50 via-white to-primary-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo e titolo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Area Amministratori
          </h1>
          <p className="text-gray-600">
            Accesso riservato agli amministratori Flanvo
          </p>
        </div>

        {/* Form Card */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Amministratore
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@flanvo.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-gray-900"
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-gray-900"
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
              variant="primary"
              className="w-full bg-accent-500 hover:bg-accent-600"
            >
              {loading ? 'Accesso in corso...' : 'Accedi come Admin'}
            </Button>
          </form>

          {/* Demo Login */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleDemoLogin}
              className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              🚀 Login Demo Admin
            </button>
          </div>
        </Card>

        {/* Avviso Sicurezza */}
        <Card className="mt-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">
                Accesso Protetto
              </h3>
              <p className="text-xs text-gray-600">
                Questa area è riservata esclusivamente al personale amministrativo autorizzato. 
                Tutti gli accessi vengono registrati e monitorati.
              </p>
            </div>
          </div>
        </Card>

        {/* Link altre aree */}
        <div className="mt-6 flex justify-center space-x-4 text-sm">
          <Link 
            href="/login" 
            className="text-gray-600 hover:text-gray-900"
          >
            Area Passeggeri
          </Link>
          <span className="text-gray-300">|</span>
          <Link 
            href="/driver/login" 
            className="text-gray-600 hover:text-gray-900"
          >
            Area Autisti
          </Link>
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