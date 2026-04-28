'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { LogOut, Menu, X, Plane, LayoutDashboard, Car, Shield } from 'lucide-react';
import { useState } from 'react';

const FlanvoLogo = () => (
  <div className="flex items-center gap-2.5">
    <div className="relative">
      <svg width="26" height="34" viewBox="0 0 56 72" fill="none">
        <path d="M8 0 L48 0 L30 30 L48 30 L8 72 L22 40 L4 40 Z" fill="#00D1B2"/>
      </svg>
    </div>
    <span className="text-xl font-bold tracking-tight text-white">flanvo</span>
  </div>
);

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setOpen(false);
    router.push('/');
  };

  const navLink = 'text-sm font-medium text-ink-secondary hover:text-white transition-colors duration-150';
  const mobileLink = 'flex items-center gap-3 px-4 py-3 rounded-xl text-ink-secondary hover:text-white hover:bg-surface-2 transition-all font-medium';

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-surface-4 bg-[#0B0B0B]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" onClick={() => setOpen(false)}>
              <FlanvoLogo />
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-6">
              {isAuthenticated ? (
                <>
                  {user?.role === 'user' && (
                    <>
                      <Link href="/flight-search" className={navLink}>
                        Cerca corsa
                      </Link>
                      <Link href="/dashboard" className={navLink}>
                        Le mie prenotazioni
                      </Link>
                    </>
                  )}
                  {user?.role === 'driver' && (
                    <Link href="/driver/dashboard" className={navLink}>
                      Dashboard Driver
                    </Link>
                  )}
                  {user?.role === 'admin' && (
                    <Link href="/admin/dashboard" className={navLink}>
                      Admin
                    </Link>
                  )}

                  <div className="h-5 w-px bg-surface-5" />

                  {/* User chip */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2.5 bg-surface-2 border border-surface-5 rounded-xl px-3 py-1.5">
                      <div className="w-6 h-6 rounded-lg bg-primary-500/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary-400">
                          {user?.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-white">{user?.name?.split(' ')[0]}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-2 rounded-lg text-ink-muted hover:text-danger hover:bg-danger/10 transition-all"
                      title="Logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link href="/login" className={navLink}>Accedi</Link>
                  <Link
                    href="/signup"
                    className="bg-primary-500 text-[#0B0B0B] font-semibold text-sm px-5 py-2 rounded-xl hover:bg-primary-400 transition-all shadow-teal"
                  >
                    Inizia gratis
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden p-2 rounded-lg text-ink-secondary hover:text-white hover:bg-surface-2 transition-all"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-30 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="absolute top-16 left-0 right-0 bg-surface-1 border-b border-surface-4 p-4 animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {isAuthenticated ? (
              <div className="space-y-1">
                {/* User info */}
                <div className="flex items-center gap-3 px-4 py-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
                    <span className="text-base font-bold text-primary-400">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">{user?.name}</p>
                    <p className="text-xs text-ink-muted capitalize">{user?.role}</p>
                  </div>
                </div>

                <div className="h-px bg-surface-4 mx-4 mb-2" />

                {user?.role === 'user' && (
                  <>
                    <Link href="/flight-search" className={mobileLink} onClick={() => setOpen(false)}>
                      <Plane className="w-4 h-4 text-primary-500" />
                      Cerca corsa
                    </Link>
                    <Link href="/dashboard" className={mobileLink} onClick={() => setOpen(false)}>
                      <LayoutDashboard className="w-4 h-4 text-primary-500" />
                      Le mie prenotazioni
                    </Link>
                  </>
                )}
                {user?.role === 'driver' && (
                  <Link href="/driver/dashboard" className={mobileLink} onClick={() => setOpen(false)}>
                    <Car className="w-4 h-4 text-primary-500" />
                    Dashboard Driver
                  </Link>
                )}
                {user?.role === 'admin' && (
                  <Link href="/admin/dashboard" className={mobileLink} onClick={() => setOpen(false)}>
                    <Shield className="w-4 h-4 text-primary-500" />
                    Admin
                  </Link>
                )}

                <div className="h-px bg-surface-4 mx-4 my-2" />

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-danger hover:bg-danger/10 transition-all font-medium w-full"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link href="/login" className={mobileLink} onClick={() => setOpen(false)}>
                  Accedi
                </Link>
                <Link
                  href="/signup"
                  className="flex items-center justify-center mx-4 py-3 bg-primary-500 text-[#0B0B0B] font-semibold rounded-xl hover:bg-primary-400 transition-all"
                  onClick={() => setOpen(false)}
                >
                  Inizia gratis
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
