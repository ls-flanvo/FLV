'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { User, LogOut, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import LanguageCurrencySelector from './LanguageCurrencySelector';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // DEBUG - Rimuovi dopo aver verificato
  useEffect(() => {
    console.log('🔍 DEBUG Navbar:');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('user:', user);
    console.log('user?.role:', user?.role);
  }, [isAuthenticated, user]);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <svg width="32" height="32" viewBox="0 0 100 100" fill="none">
              <path d="M20 30 Q30 20 40 30 L50 50 Q55 60 45 70 L35 80 Q25 75 20 65 Z" fill="#4DB8AC"/>
            </svg>
            <span className="text-2xl font-bold text-gray-900">flanvo</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Selettore Lingua e Valuta */}
            <LanguageCurrencySelector />

            {/* Divider */}
            <div className="h-6 w-px bg-gray-300" />

            {isAuthenticated ? (
              <>
                {/* MOSTRA SEMPRE per utenti autenticati (semplificato) */}
                {user?.role !== 'driver' && user?.role !== 'admin' && (
                  <>
                    <Link href="/dashboard" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                      Dashboard
                    </Link>
                    <Link href="/flight-search" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                      Cerca Corsa
                    </Link>
                  </>
                )}
                
                {/* Link solo per driver */}
                {user?.role === 'driver' && (
                  <Link href="/driver/dashboard" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                    Dashboard Driver
                  </Link>
                )}
                
                {/* Link solo per admin */}
                {user?.role === 'admin' && (
                  <Link href="/admin/dashboard" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                    Dashboard Admin
                  </Link>
                )}
                
                <div className="flex items-center space-x-3 pl-4 border-l border-gray-300">
                  <div className="flex items-center space-x-2 text-gray-700">
                    <User className="w-5 h-5" />
                    <span className="font-medium">{user?.name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-red-600 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                  Accedi
                </Link>
                <Link
                  href="/signup"
                  className="bg-accent-500 text-white px-5 py-2 rounded-lg hover:bg-accent-600 font-medium transition-colors shadow-md hover:shadow-lg"
                >
                  Registrati
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            {/* Selettore Mobile */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <LanguageCurrencySelector />
            </div>

            {isAuthenticated ? (
              <div className="space-y-3">
                {/* MOSTRA SEMPRE per utenti non-driver e non-admin */}
                {user?.role !== 'driver' && user?.role !== 'admin' && (
                  <>
                    <Link
                      href="/dashboard"
                      className="block text-gray-700 hover:text-primary-600 font-medium py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/flight-search"
                      className="block text-gray-700 hover:text-primary-600 font-medium py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Cerca Corsa
                    </Link>
                  </>
                )}
                
                {user?.role === 'driver' && (
                  <Link
                    href="/driver/dashboard"
                    className="block text-gray-700 hover:text-primary-600 font-medium py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard Driver
                  </Link>
                )}
                
                {user?.role === 'admin' && (
                  <Link
                    href="/admin/dashboard"
                    className="block text-gray-700 hover:text-primary-600 font-medium py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard Admin
                  </Link>
                )}
                
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">{user?.name}</p>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-red-600 font-medium"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Link
                  href="/login"
                  className="block text-gray-700 hover:text-primary-600 font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Accedi
                </Link>
                <Link
                  href="/signup"
                  className="block bg-accent-500 text-white px-5 py-2 rounded-lg hover:bg-accent-600 font-medium text-center transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Registrati
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}