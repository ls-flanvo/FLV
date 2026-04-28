import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import ClientProvider from '@/components/ClientProvider';
import { ToastContainer } from '@/components/ui/Toast';
import SupportChat from '@/components/SupportChat';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Flanvo - Shared Airport Transfers',
  description: 'Your next move, faster: shared airport transfers made seamless.',
  applicationName: 'Flanvo',
  keywords: ['airport transfer', 'shared ride', 'carpooling', 'NCC', 'trasferimento aeroporto'],
  authors: [{ name: 'Flanvo' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Flanvo',
  },
  openGraph: {
    type: 'website',
    siteName: 'Flanvo',
    title: 'Flanvo - Shared Airport Transfers',
    description: 'Your next move, faster: shared airport transfers made seamless.',
  },
};

export const viewport: Viewport = {
  themeColor: '#00D1B2',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Flanvo" />
      </head>
      <body className={inter.className}>
        <ClientProvider>
          <div className="min-h-screen bg-[#0B0B0B] flex flex-col">
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
            <footer className="border-t border-surface-4 py-5">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <svg width="16" height="21" viewBox="0 0 56 72" fill="none">
                    <path d="M8 0 L48 0 L30 30 L48 30 L8 72 L22 40 L4 40 Z" fill="#00D1B2"/>
                  </svg>
                  <span className="text-sm font-semibold text-ink-secondary">flanvo</span>
                </div>
                <p className="text-xs text-ink-muted">&copy; 2026 Flanvo. Tutti i diritti riservati.</p>
                <div className="flex gap-4 text-xs text-ink-muted">
                  <span>hello@flanvo.com</span>
                  <span>flanvo.com</span>
                </div>
              </div>
            </footer>
          </div>
          <ToastContainer />
          <SupportChat />
        </ClientProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
