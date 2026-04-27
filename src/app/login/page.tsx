'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store';
import { Input, Button, Card } from '@/components/ui';
import { Plane } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { loginWithCredentials, setToken } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await loginWithCredentials(email, password, 'user');
      
      if (user) {
        // Redirect in base al ruolo
        if (user.role === 'driver') {
          setError('Questo account è registrato come autista. Usa l\'area autisti per accedere.');
        } else if (user.role === 'admin') {
          setError('Questo account è registrato come amministratore. Usa l\'area admin per accedere.');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError('Credenziali non valide');
      }
    } catch (err) {
      setError('Errore durante l\'accesso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center space-x-2 mb-4">
            <svg width="36" height="48" viewBox="0 0 56 72" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 0 L48 0 L30 30 L48 30 L8 72 L22 40 L4 40 Z" fill="#00C2B5"/>
            </svg>
            <span className="text-3xl font-bold text-gray-900">flanvo</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Bentornato!</h2>
          <p className="text-gray-600 mt-2">Accedi al tuo account passeggero</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              type="email"
              label="Email"
              placeholder="tua@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            <Input
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Non hai un account?{' '}
              <Link href="/signup" className="text-primary-600 hover:text-primary-700 font-semibold">
                Registrati
              </Link>
            </p>
          </div>
        </Card>

        {/* Link altre aree */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Card className="bg-primary-50 border-primary-200 hover:shadow-md transition-shadow">
            <Link href="/driver/login" className="block">
              <div className="text-center py-3">
                <p className="text-sm font-semibold text-gray-900 mb-1">🚗 Sei un autista?</p>
                <p className="text-xs text-gray-600">Accedi all'area driver</p>
              </div>
            </Link>
          </Card>

          <Card className="bg-accent-50 border-accent-200 hover:shadow-md transition-shadow">
            <Link href="/admin/login" className="block">
              <div className="text-center py-3">
                <p className="text-sm font-semibold text-gray-900 mb-1">👨‍✈️ Amministratore?</p>
                <p className="text-xs text-gray-600">Accedi all'area admin</p>
              </div>
            </Link>
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