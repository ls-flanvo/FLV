'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { AlertTriangle, X, Plane, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface CancellationAlertProps {
  bookingId: string;
  flightCode: string;
  flightStatus: 'cancelled' | 'diverted';
  divertedTo?: string;
  onDismiss: () => void;
}

export default function CancellationAlertBanner({
  bookingId,
  flightCode,
  flightStatus,
  divertedTo,
  onDismiss
}: CancellationAlertProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss();
    // Salva in localStorage che l'utente ha visto l'alert
    localStorage.setItem(`alert_dismissed_${bookingId}`, 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-20 left-4 right-4 z-40 animate-fadeIn">
      <div className={`max-w-4xl mx-auto rounded-xl shadow-2xl border-2 ${
        flightStatus === 'cancelled' 
          ? 'bg-red-50 border-red-300' 
          : 'bg-yellow-50 border-yellow-300'
      }`}>
        <div className="p-6">
          <div className="flex items-start space-x-4">
            {/* Icon */}
            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
              flightStatus === 'cancelled' 
                ? 'bg-red-500' 
                : 'bg-yellow-500'
            }`}>
              {flightStatus === 'cancelled' ? (
                <X className="w-6 h-6 text-white" />
              ) : (
                <RefreshCw className="w-6 h-6 text-white" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className={`text-xl font-bold mb-1 ${
                    flightStatus === 'cancelled' ? 'text-red-900' : 'text-yellow-900'
                  }`}>
                    {flightStatus === 'cancelled' 
                      ? '⚠️ Volo Cancellato' 
                      : '⚠️ Volo Dirottato'
                    }
                  </h3>
                  <p className={`text-sm ${
                    flightStatus === 'cancelled' ? 'text-red-700' : 'text-yellow-700'
                  }`}>
                    Volo <strong>{flightCode}</strong>
                  </p>
                </div>
                <button
                  onClick={handleDismiss}
                  className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {flightStatus === 'cancelled' && (
                <div className="mb-4">
                  <p className="text-red-800 mb-2">
                    La compagnia aerea ha cancellato il tuo volo. 
                    <strong> Hai diritto al rimborso completo</strong> della prenotazione Flanvo.
                  </p>
                  <ul className="text-sm text-red-700 space-y-1 ml-4">
                    <li>• Rimborso: 100% dell'importo pagato</li>
                    <li>• Tempistiche: 5-7 giorni lavorativi</li>
                    <li>• Metodo: Stesso metodo di pagamento originale</li>
                  </ul>
                </div>
              )}

              {flightStatus === 'diverted' && divertedTo && (
                <div className="mb-4">
                  <p className="text-yellow-800 mb-2">
                    Il tuo volo è stato dirottato a <strong>{divertedTo}</strong>.
                  </p>
                  <p className="text-sm text-yellow-700 mb-2">
                    Puoi scegliere tra:
                  </p>
                  <ul className="text-sm text-yellow-700 space-y-1 ml-4">
                    <li>✈️ Cercare un nuovo trasferimento da {divertedTo}</li>
                    <li>💰 Cancellare e ricevere il rimborso completo</li>
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <Link href={`/booking/${bookingId}`}>
                  <Button size="sm" className="bg-accent-500 hover:bg-accent-600">
                    {flightStatus === 'cancelled' 
                      ? 'Richiedi Rimborso' 
                      : 'Vedi Opzioni'
                    }
                  </Button>
                </Link>
                
                {flightStatus === 'diverted' && (
                  <Link href="/flight-search">
                    <Button size="sm" variant="secondary">
                      <Plane className="w-4 h-4 mr-2" />
                      Cerca Nuovo Trasferimento
                    </Button>
                  </Link>
                )}

                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={handleDismiss}
                >
                  Chiudi
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}