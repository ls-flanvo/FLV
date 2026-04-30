import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ClientProvider from '@/components/ClientProvider';
import { ToastContainer } from '@/components/ui/Toast';
import SupportChat from '@/components/SupportChat';
import PushSetup from '@/components/PushSetup';
import ErrorBoundary from '@/components/ErrorBoundary';

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
          <PushSetup />
          <div className="min-h-screen bg-[#0B0B0B] flex flex-col">
            <Navbar />
            <main className="flex-grow">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </main>
            <Footer />
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
