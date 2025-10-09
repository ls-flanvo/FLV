'use client';

import { useState } from 'react';
import { Button, Badge } from '@/components/ui';
import { 
  X, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Info,
  Plane
} from 'lucide-react';

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  flightStatus: 'scheduled' | 'cancelled' | 'diverted' | 'delayed' | 'normal';
  divertedTo?: string; // Aeroporto di dirottamento
  onConfirmCancel: (refundEligible: boolean) => void;
  onFindNewRide?: () => void;
}

export default function CancellationModal({
  isOpen,
  onClose,
  bookingId,
  flightStatus,
  divertedTo,
  onConfirmCancel,
  onFindNewRide
}: CancellationModalProps) {
  const [cancellationReason, setCancellationReason] = useState('');
  const [understandNoRefund, setUnderstandNoRefund] = useState(false);
  const [step, setStep] = useState<'reason' | 'confirm' | 'diverted-options'>('reason');

  if (!isOpen) return null;

  // Determina se c'è diritto al rimborso
  const isRefundEligible = flightStatus === 'cancelled' || flightStatus === 'diverted';
  const isDiverted = flightStatus === 'diverted';

  const handleInitialCancel = () => {
    if (isDiverted) {
      setStep('diverted-options');
    } else if (isRefundEligible) {
      setStep('confirm');
    } else {
      setStep('confirm');
    }
  };

  const handleConfirmCancellation = () => {
    onConfirmCancel(isRefundEligible);
  };

  const handleFindNewRide = () => {
    if (onFindNewRide) {
      onFindNewRide();
    }
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <AlertTriangle className="w-6 h-6 mr-2 text-yellow-500" />
              Cancella Prenotazione
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Step 1: Motivo cancellazione */}
            {step === 'reason' && (
              <div className="space-y-6">
                {/* Status Badge */}
                {flightStatus === 'cancelled' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-red-900 mb-1">
                          Volo Cancellato dalla Compagnia
                        </h3>
                        <p className="text-sm text-red-700">
                          Hai diritto al rimborso completo della prenotazione.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {flightStatus === 'diverted' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Plane className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-yellow-900 mb-1">
                          Volo Dirottato
                        </h3>
                        <p className="text-sm text-yellow-700">
                          Il tuo volo è stato dirottato a <strong>{divertedTo}</strong>.
                          Puoi cercare un nuovo NCC o cancellare con rimborso completo.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!isRefundEligible && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-blue-900 mb-1">
                          Cancellazione Volontaria
                        </h3>
                        <p className="text-sm text-blue-700">
                          Le cancellazioni volontarie non prevedono rimborso secondo i nostri termini di servizio.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Motivo (opzionale per cancellazioni volontarie) */}
                {!isRefundEligible && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motivo cancellazione (opzionale)
                    </label>
                    <textarea
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      placeholder="Aiutaci a migliorare il servizio..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    />
                  </div>
                )}

                {/* Checkbox conferma no rimborso */}
                {!isRefundEligible && (
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="no-refund"
                      checked={understandNoRefund}
                      onChange={(e) => setUnderstandNoRefund(e.target.checked)}
                      className="mt-1 w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    />
                    <label htmlFor="no-refund" className="text-sm text-gray-700">
                      Comprendo che questa cancellazione <strong>non prevede alcun rimborso</strong> e accetto di perdere l'intero importo pagato.
                    </label>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Annulla
                  </Button>
                  <Button
                    onClick={handleInitialCancel}
                    disabled={!isRefundEligible && !understandNoRefund}
                    className="flex-1"
                    variant="danger"
                  >
                    Continua
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Opzioni volo dirottato */}
            {step === 'diverted-options' && isDiverted && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <RefreshCw className="w-8 h-8 text-yellow-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Cosa vuoi fare?
                  </h3>
                  <p className="text-gray-600">
                    Il tuo volo è stato dirottato a <strong>{divertedTo}</strong>
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Opzione 1: Trova nuovo NCC */}
                  <button
                    onClick={handleFindNewRide}
                    className="w-full p-4 border-2 border-primary-500 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors text-left"
                  >
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">
                          Cerca Nuovo NCC
                        </h4>
                        <p className="text-sm text-gray-600">
                          Trova un trasferimento dall'aeroporto di dirottamento. La tua prenotazione rimane attiva.
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Opzione 2: Cancella con rimborso */}
                  <button
                    onClick={() => setStep('confirm')}
                    className="w-full p-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-start space-x-3">
                      <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">
                          Cancella e Ottieni Rimborso
                        </h4>
                        <p className="text-sm text-gray-600">
                          Cancella la prenotazione e ricevi il rimborso completo entro 5-7 giorni lavorativi.
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                <Button
                  variant="secondary"
                  onClick={onClose}
                  className="w-full"
                >
                  Torna Indietro
                </Button>
              </div>
            )}

            {/* Step 3: Conferma finale */}
            {step === 'confirm' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    isRefundEligible ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {isRefundEligible ? (
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    ) : (
                      <XCircle className="w-8 h-8 text-red-600" />
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Conferma Cancellazione
                  </h3>
                  <p className="text-gray-600">
                    {isRefundEligible 
                      ? 'Riceverai il rimborso completo entro 5-7 giorni lavorativi.'
                      : 'Questa azione è irreversibile e non prevede alcun rimborso.'
                    }
                  </p>
                </div>

                {/* Riepilogo rimborso */}
                {isRefundEligible && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-2">
                      Dettagli Rimborso
                    </h4>
                    <div className="space-y-1 text-sm text-green-800">
                      <p>• Rimborso: 100% dell'importo pagato</p>
                      <p>• Metodo: Stesso metodo di pagamento</p>
                      <p>• Tempistiche: 5-7 giorni lavorativi</p>
                      <p>• Motivo: {flightStatus === 'cancelled' ? 'Volo cancellato' : 'Volo dirottato'}</p>
                    </div>
                  </div>
                )}

                {/* Warning no rimborso */}
                {!isRefundEligible && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-900 mb-2 flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      Attenzione
                    </h4>
                    <p className="text-sm text-red-800">
                      Procedendo con la cancellazione perderai l'intero importo pagato. Questa azione non può essere annullata.
                    </p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setStep('reason')}
                    className="flex-1"
                  >
                    Indietro
                  </Button>
                  <Button
                    onClick={handleConfirmCancellation}
                    className="flex-1"
                    variant="danger"
                  >
                    {isRefundEligible ? 'Conferma e Rimborsa' : 'Conferma Cancellazione'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}