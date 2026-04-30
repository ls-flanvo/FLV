'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface FooterLink {
  label: string;
  href: string;
  action?: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

const columns: FooterColumn[] = [
  {
    title: 'Azienda',
    links: [
      { label: 'Chi siamo', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: "Dati dell'azienda", href: '/about#dati' },
    ],
  },
  {
    title: 'Prodotti',
    links: [
      { label: 'Viaggia', href: '/flight-search' },
      { label: 'Come funziona', href: '/#come-funziona' },
      { label: 'Cerca una corsa', href: '/flight-search' },
      { label: 'Aeroporti serviti', href: '/aeroporti' },
      { label: 'Prezzi', href: '/prezzi' },
    ],
  },
  {
    title: 'Guida con noi',
    links: [
      { label: 'Registrati come autista', href: '/driver/signup' },
      { label: 'Accedi', href: '/driver/login' },
    ],
  },
  {
    title: 'Per tutti',
    links: [
      { label: 'Sicurezza', href: '/sicurezza' },
      { label: 'Sostenibilità', href: '/sostenibilita' },
      { label: 'Assistenza', href: '#', action: 'chat' },
      { label: 'Contatti', href: 'mailto:hello@flanvo.com' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Termini', href: '/terms' },
    ],
  },
];

export default function Footer() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setInstallPrompt(null);
  };

  const handleLinkClick = (action?: string) => {
    if (action === 'chat') {
      window.dispatchEvent(new Event('open-support-chat'));
    }
  };

  return (
    <footer className="border-t border-surface-4 bg-[#0B0B0B]">
      {/* Colonne principali */}
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-10">
        {columns.map((col) => (
          <div key={col.title}>
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-widest mb-4">
              {col.title}
            </p>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  {link.action ? (
                    <button
                      onClick={() => handleLinkClick(link.action)}
                      className="text-sm text-ink-secondary hover:text-white transition-colors text-left"
                    >
                      {link.label}
                    </button>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-ink-secondary hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-surface-4">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-base font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
              Flanvo
            </span>
            <span className="text-xs text-ink-muted">
              &copy; 2026 Flanvo. Tutti i diritti riservati.
            </span>
          </div>

          {!installed && installPrompt && (
            <button
              onClick={handleInstall}
              className="flex items-center gap-2 px-4 py-2 bg-surface-2 border border-surface-5 rounded-xl text-sm font-semibold text-white hover:border-primary-500/30 hover:bg-surface-3 transition-all"
            >
              <Download className="w-4 h-4 text-primary-400" />
              Installa app
            </button>
          )}
        </div>
      </div>
    </footer>
  );
}
