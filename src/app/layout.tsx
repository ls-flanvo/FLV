import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import ClientProvider from '@/components/ClientProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Flanvo - Condividi il tuo viaggio',
  description: 'Connetti passeggeri dello stesso volo per condividere corse dall\'aeroporto',
  themeColor: '#0ea5e9',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body className={inter.className}>
        <ClientProvider>
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
            <footer className="bg-white border-t border-gray-200 py-8">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center text-gray-600">
                  <p>&copy; 2025 Flanvo. Tutti i diritti riservati.</p>
                  <p className="text-sm mt-2">Prototipo dimostrativo - Non utilizzare dati reali</p>
                </div>
              </div>
            </footer>
          </div>
        </ClientProvider>
      </body>
    </html>
  );
}