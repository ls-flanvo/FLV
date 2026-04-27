import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import ClientProvider from '@/components/ClientProvider';
import { ToastContainer } from '@/components/ui/Toast';

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
  themeColor: '#0ea5e9',
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
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
            <footer className="bg-white border-t border-gray-200 py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-gray-500">&copy; 2025 Flanvo. Tutti i diritti riservati.</p>
                  <div className="flex gap-6 text-xs text-gray-400">
                    <span>hello@flanvo.com</span>
                    <span>www.flanvo.com</span>
                  </div>
                </div>
              </div>
            </footer>
          </div>
          <ToastContainer />
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
