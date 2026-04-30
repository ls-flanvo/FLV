'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { LogOut, Menu, X, Plane, LayoutDashboard, Car, Shield, Settings, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import NotificationBell from './NotificationBell';

const FlanvoLogo = () => (
  <span style={{ fontWeight: 700, fontSize: '1.35rem', letterSpacing: '-0.02em', color: '#ffffff', fontFamily: 'inherit' }}>
    Flanvo
  </span>
);

const DROPDOWNS = {
  viaggia: {
    label: 'Viaggia',
    links: [
      { label: 'Come funziona', href: '/#come-funziona', desc: 'Scopri come funziona il carpooling aeroportuale' },
      { label: 'Cerca una corsa', href: '/flight-search', desc: 'Inserisci il tuo volo e trova compagni' },
      { label: 'Aeroporti serviti', href: '/#aeroporti', desc: 'Gli scali dove siamo attivi' },
      { label: 'Prezzi', href: '/#prezzi', desc: 'Quanto costa e come si calcola' },
    ],
  },
  guida: {
    label: 'Guida con noi',
    links: [
      { label: 'Registrati come autista', href: '/driver/signup', desc: 'Unisciti alla rete di driver Flanvo' },
      { label: 'Accedi', href: '/driver/login', desc: 'Entra nella tua dashboard autista' },
    ],
  },
  info: {
    label: 'Info',
    links: [
      { label: 'Chi siamo', href: '/about', desc: 'La storia e la missione di Flanvo' },
      { label: 'Blog', href: '/blog', desc: 'Notizie e consigli di viaggio' },
      { label: "Dati dell'azienda", href: '/about#dati', desc: 'Ragione sociale e riferimenti legali' },
      { label: 'Sicurezza', href: '/sicurezza', desc: 'Come proteggiamo passeggeri e autisti' },
      { label: 'Sostenibilità', href: '/sostenibilita', desc: 'Il nostro impatto ambientale' },
      { label: 'Contatti', href: 'mailto:hello@flanvo.com', desc: 'Scrivici a hello@flanvo.com' },
    ],
  },
} as const;

type DropdownKey = keyof typeof DROPDOWNS;

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<DropdownKey | null>(null);
  const [mobileSection, setMobileSection] = useState<DropdownKey | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // Chiudi dropdown su click esterno
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    router.push('/');
  };

  const toggleDropdown = (key: DropdownKey) => {
    setActiveDropdown(prev => prev === key ? null : key);
  };

  const closeAll = () => {
    setActiveDropdown(null);
    setMobileOpen(false);
  };

  const mobileLink = 'flex items-center gap-3 px-4 py-3 rounded-xl text-ink-secondary hover:text-white hover:bg-surface-2 transition-all font-medium text-sm';

  return (
    <>
      <nav ref={navRef} className="sticky top-0 z-40 border-b border-surface-4 bg-[#0B0B0B]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-8">

            {/* Logo */}
            <Link href="/" onClick={closeAll} className="shrink-0">
              <FlanvoLogo />
            </Link>

            {/* Desktop — non autenticato: dropdowns */}
            {!isAuthenticated && (
              <div className="hidden md:flex items-center gap-1 flex-1">
                {(Object.keys(DROPDOWNS) as DropdownKey[]).map((key) => {
                  const d = DROPDOWNS[key];
                  const isOpen = activeDropdown === key;
                  return (
                    <div key={key} className="relative">
                      <button
                        onClick={() => toggleDropdown(key)}
                        className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                          isOpen ? 'text-white bg-surface-2' : 'text-ink-secondary hover:text-white hover:bg-surface-2'
                        }`}
                      >
                        {d.label}
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isOpen && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-surface-1 border border-surface-4 rounded-2xl shadow-2xl overflow-hidden animate-fade-up z-50">
                          {d.links.map((link) => (
                            <Link
                              key={link.label}
                              href={link.href}
                              onClick={closeAll}
                              className="flex flex-col px-4 py-3 hover:bg-surface-2 transition-colors group border-b border-surface-4 last:border-0"
                            >
                              <span className="text-sm font-semibold text-white group-hover:text-primary-400 transition-colors">
                                {link.label}
                              </span>
                              <span className="text-xs text-ink-muted mt-0.5">{link.desc}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Desktop — autenticato: link ruolo */}
            {isAuthenticated && (
              <div className="hidden md:flex items-center gap-5 flex-1">
                {user?.role === 'user' && (
                  <>
                    <Link href="/flight-search" className="text-sm font-medium text-ink-secondary hover:text-white transition-colors">Cerca corsa</Link>
                    <Link href="/dashboard" className="text-sm font-medium text-ink-secondary hover:text-white transition-colors">Le mie prenotazioni</Link>
                  </>
                )}
                {user?.role === 'driver' && (
                  <Link href="/driver/dashboard" className="text-sm font-medium text-ink-secondary hover:text-white transition-colors">Dashboard Driver</Link>
                )}
                {user?.role === 'admin' && (
                  <Link href="/admin/dashboard" className="text-sm font-medium text-ink-secondary hover:text-white transition-colors">Admin</Link>
                )}
              </div>
            )}

            {/* Desktop right */}
            <div className="hidden md:flex items-center gap-3 shrink-0">
              {isAuthenticated ? (
                <>
                  <NotificationBell />
                  <div className="h-5 w-px bg-surface-5" />
                  <div className="flex items-center gap-2.5 bg-surface-2 border border-surface-5 rounded-xl px-3 py-1.5">
                    <div className="w-6 h-6 rounded-lg bg-primary-500/20 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary-400">{user?.name?.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="text-sm font-medium text-white hidden lg:inline">{user?.name?.split(' ')[0]}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg text-ink-muted hover:text-danger hover:bg-danger/10 transition-all"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  {/* IT statico */}
                  <span className="text-xs font-semibold text-ink-muted border border-surface-5 rounded-lg px-2 py-1">IT</span>

                  {/* Assistenza */}
                  <button
                    onClick={() => { window.dispatchEvent(new Event('open-support-chat')); closeAll(); }}
                    className="text-sm font-medium text-ink-secondary hover:text-white transition-colors"
                  >
                    Assistenza
                  </button>

                  <div className="h-5 w-px bg-surface-5" />

                  <Link href="/login" className="text-sm font-medium text-ink-secondary hover:text-white transition-colors">
                    Accedi
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-primary-500 text-[#0B0B0B] font-semibold text-sm px-4 py-2 rounded-xl hover:bg-primary-400 transition-all shadow-teal"
                  >
                    Inizia gratis
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-ink-secondary hover:text-white hover:bg-surface-2 transition-all"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="absolute top-16 left-0 right-0 bottom-0 bg-surface-1 border-t border-surface-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 space-y-1">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
                      <span className="text-base font-bold text-primary-400">{user?.name?.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">{user?.name}</p>
                      <p className="text-xs text-ink-muted capitalize">{user?.role}</p>
                    </div>
                  </div>
                  <div className="h-px bg-surface-4 mx-4 mb-2" />
                  {user?.role === 'user' && (
                    <>
                      <Link href="/flight-search" className={mobileLink} onClick={closeAll}><Plane className="w-4 h-4 text-primary-500" />Cerca corsa</Link>
                      <Link href="/dashboard" className={mobileLink} onClick={closeAll}><LayoutDashboard className="w-4 h-4 text-primary-500" />Le mie prenotazioni</Link>
                      <Link href="/account" className={mobileLink} onClick={closeAll}><Settings className="w-4 h-4 text-primary-500" />Il mio account</Link>
                    </>
                  )}
                  {user?.role === 'driver' && (
                    <Link href="/driver/dashboard" className={mobileLink} onClick={closeAll}><Car className="w-4 h-4 text-primary-500" />Dashboard Driver</Link>
                  )}
                  {user?.role === 'admin' && (
                    <Link href="/admin/dashboard" className={mobileLink} onClick={closeAll}><Shield className="w-4 h-4 text-primary-500" />Admin</Link>
                  )}
                  <div className="h-px bg-surface-4 mx-4 my-2" />
                  <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-danger hover:bg-danger/10 transition-all font-medium w-full text-sm">
                    <LogOut className="w-4 h-4" />Logout
                  </button>
                </>
              ) : (
                <>
                  {/* Sezioni accordion */}
                  {(Object.keys(DROPDOWNS) as DropdownKey[]).map((key) => {
                    const d = DROPDOWNS[key];
                    const isOpen = mobileSection === key;
                    return (
                      <div key={key}>
                        <button
                          onClick={() => setMobileSection(isOpen ? null : key)}
                          className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-semibold text-white hover:bg-surface-2 transition-all"
                        >
                          {d.label}
                          <ChevronDown className={`w-4 h-4 text-ink-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isOpen && (
                          <div className="ml-4 mb-1 space-y-0.5">
                            {d.links.map((link) => (
                              <Link key={link.label} href={link.href} onClick={closeAll}
                                className="block px-4 py-2.5 rounded-xl text-sm text-ink-secondary hover:text-white hover:bg-surface-2 transition-all">
                                {link.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="h-px bg-surface-4 mx-4 my-3" />

                  <button
                    onClick={() => { window.dispatchEvent(new Event('open-support-chat')); closeAll(); }}
                    className={mobileLink + ' w-full'}
                  >
                    Assistenza
                  </button>

                  <div className="h-px bg-surface-4 mx-4 my-2" />

                  <Link href="/login" className={mobileLink} onClick={closeAll}>Accedi</Link>
                  <Link
                    href="/signup"
                    onClick={closeAll}
                    className="flex items-center justify-center mx-4 py-3 bg-primary-500 text-[#0B0B0B] font-semibold rounded-xl hover:bg-primary-400 transition-all text-sm mt-1"
                  >
                    Inizia gratis
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
