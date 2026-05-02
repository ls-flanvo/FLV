'use client';

import { useState } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Info,
  Plane,
  Users,
} from 'lucide-react';

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  bookingStatus?: string;
  flightStatus: 'scheduled' | 'cancelled' | 'diverted' | 'delayed' | 'normal';
  divertedTo?: string;
  isPaid?: boolean;
  onConfirmCancel: (refundEligible: boolean) => void;
  onFindNewRide?: () => void;
}

export default function CancellationModal({
  isOpen,
  onClose,
  bookingStatus,
  flightStatus,
  divertedTo,
  isPaid = false,
  onConfirmCancel,
  onFindNewRide,
}: CancellationModalProps) {
  const [understandNoRefund, setUnderstandNoRefund] = useState(false);
  const [step, setStep] = useState<'main' | 'diverted-options' | 'refund-confirm'>('main');

  if (!isOpen) return null;

  const isRefundEligible = flightStatus === 'cancelled' || flightStatus === 'diverted';
  const isDiverted = flightStatus === 'diverted';
  const isGroupFormed = bookingStatus === 'CONFIRMED';

  const handleCancel = () => {
    if (isDiverted) { setStep('diverted-options'); return; }
    if (isRefundEligible) { setStep('refund-confirm'); return; }
    onConfirmCancel(false);
  };

  const handleFindNewRide = () => {
    onFindNewRide?.();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-surface-1 border border-surface-4 rounded-2xl shadow-2xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-surface-4">
            <h2 className="text-lg font-bold text-white">Cancella prenotazione</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-surface-3 rounded-xl transition-colors"
            >
              <X className="w-4 h-4 text-ink-muted" />
            </button>
          </div>

          <div className="px-6 py-5">
            {/* ── STEP MAIN ── */}
            {step === 'main' && (
              <div className="space-y-5">

                {/* SCENARIO: volo cancellato */}
                {flightStatus === 'cancelled' && (
                  <div className="bg-success/8 border border-success/25 rounded-xl p-4 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white mb-1">Rimborso garantito</p>
                      <p className="text-sm text-ink-secondary">
                        Il tuo volo è stato cancellato dalla compagnia. Hai diritto al rimborso completo — lo riceverai sullo stesso metodo di pagamento entro 5–7 giorni lavorativi.
                      </p>
                    </div>
                  </div>
                )}

                {/* SCENARIO: volo dirottato */}
                {flightStatus === 'diverted' && (
                  <div className="bg-warning/8 border border-warning/25 rounded-xl p-4 flex items-start gap-3">
                    <Plane className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white mb-1">Volo dirottato</p>
                      <p className="text-sm text-ink-secondary">
                        Il tuo volo è atterrato a <strong className="text-white">{divertedTo}</strong>. Puoi cercare un nuovo trasferimento oppure cancellare con rimborso completo.
                      </p>
                    </div>
                  </div>
                )}

                {/* SCENARIO: pagato (no rimborso) */}
                {!isRefundEligible && isPaid && (
                  <div className="bg-surface-2 border border-surface-4 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white mb-1">Il pagamento non verrà rimborsato</p>
                      <p className="text-sm text-ink-secondary mb-2">
                        Hai già completato il pagamento. Puoi comunque cancellare, ma non riceverai un rimborso automatico (Policy Flanvo §4).
                      </p>
                      <p className="text-sm text-ink-muted">
                        Hai 24 ore dall'orario di pickup per aprire una disputa in caso di forza maggiore documentata (emergenza medica, volo cancellato, ecc.).
                      </p>
                    </div>
                  </div>
                )}

                {/* SCENARIO: non pagato, gruppo formato */}
                {!isRefundEligible && !isPaid && isGroupFormed && (
                  <div className="bg-surface-2 border border-surface-4 rounded-xl p-4 flex items-start gap-3">
                    <Users className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white mb-1">Nessun addebito</p>
                      <p className="text-sm text-ink-secondary mb-2">
                        Non hai ancora pagato nulla — puoi uscire liberamente senza alcun costo.
                      </p>
                      <p className="text-sm text-ink-muted">
                        Il gruppo tornerà aperto: un altro passeggero potrà unirsi e il driver verrà rinotificato quando il van è di nuovo al completo.
                      </p>
                    </div>
                  </div>
                )}

                {/* SCENARIO: non pagato, gruppo in formazione */}
                {!isRefundEligible && !isPaid && !isGroupFormed && (
                  <div className="bg-surface-2 border border-surface-4 rounded-xl p-4 flex items-start gap-3">
                    <Info className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white mb-1">Nessun addebito</p>
                      <p className="text-sm text-ink-secondary">
                        Non hai ancora pagato nulla — puoi uscire senza alcun costo. Il tuo posto nel gruppo verrà liberato per altri passeggeri.
                      </p>
                    </div>
                  </div>
                )}

                {/* Checkbox no-rimborso — solo se già pagato */}
                {!isRefundEligible && isPaid && (
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={understandNoRefund}
                      onChange={(e) => setUnderstandNoRefund(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-surface-5 bg-surface-3 text-primary-500 focus:ring-primary-500 focus:ring-offset-0 shrink-0"
                    />
                    <span className="text-sm text-ink-secondary group-hover:text-white transition-colors">
                      Ho capito — confermo la cancellazione sapendo che il pagamento non verrà rimborsato automaticamente.
                    </span>
                  </label>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 bg-surface-3 border border-surface-5 text-ink-secondary font-semibold rounded-xl hover:text-white hover:border-surface-4 transition-all text-sm"
                  >
                    Torna indietro
                  </button>

                  {isDiverted ? (
                    <button
                      onClick={() => setStep('diverted-options')}
                      className="flex-1 py-3 bg-primary-500 text-[#0B0B0B] font-bold rounded-xl hover:bg-primary-400 transition-all text-sm"
                    >
                      Vedi opzioni
                    </button>
                  ) : isRefundEligible ? (
                    <button
                      onClick={() => setStep('refund-confirm')}
                      className="flex-1 py-3 bg-success text-[#0B0B0B] font-bold rounded-xl hover:opacity-90 transition-all text-sm"
                    >
                      Continua
                    </button>
                  ) : (
                    <button
                      onClick={handleCancel}
                      disabled={isPaid && !understandNoRefund}
                      className="flex-1 py-3 bg-danger/90 text-white font-bold rounded-xl hover:bg-danger transition-all text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {isPaid ? 'Cancella prenotazione' : isGroupFormed ? 'Sì, esco dal gruppo' : 'Conferma cancellazione'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP DIVERTED-OPTIONS ── */}
            {step === 'diverted-options' && (
              <div className="space-y-4">
                <p className="text-sm text-ink-secondary text-center">
                  Il tuo volo è atterrato a <strong className="text-white">{divertedTo}</strong>. Cosa vuoi fare?
                </p>

                <button
                  onClick={handleFindNewRide}
                  className="w-full p-4 bg-surface-2 border-2 border-primary-500/40 rounded-xl hover:border-primary-500 transition-all text-left group"
                >
                  <div className="flex items-start gap-3">
                    <RefreshCw className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white mb-0.5">Cerca un nuovo trasferimento</p>
                      <p className="text-sm text-ink-muted">La prenotazione rimane attiva — prenoti un nuovo NCC dall'aeroporto di dirottamento.</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setStep('refund-confirm')}
                  className="w-full p-4 bg-surface-2 border border-surface-5 rounded-xl hover:border-surface-4 transition-all text-left"
                >
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white mb-0.5">Cancella e ricevi il rimborso</p>
                      <p className="text-sm text-ink-muted">Rimborso completo entro 5–7 giorni lavorativi.</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-3 text-sm text-ink-muted hover:text-ink-secondary transition-colors"
                >
                  ← Torna indietro
                </button>
              </div>
            )}

            {/* ── STEP REFUND-CONFIRM ── */}
            {step === 'refund-confirm' && (
              <div className="space-y-5">
                <div className="text-center">
                  <div className="w-14 h-14 bg-success/10 border border-success/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-7 h-7 text-success" />
                  </div>
                  <p className="font-bold text-white text-lg mb-1">Conferma rimborso</p>
                  <p className="text-sm text-ink-secondary">
                    Motivo: <span className="text-white">{flightStatus === 'cancelled' ? 'Volo cancellato dalla compagnia' : 'Volo dirottato'}</span>
                  </p>
                </div>

                <div className="bg-surface-2 border border-surface-4 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between text-ink-secondary">
                    <span>Rimborso</span>
                    <span className="text-success font-semibold">100%</span>
                  </div>
                  <div className="flex justify-between text-ink-secondary">
                    <span>Metodo</span>
                    <span className="text-white">Stesso metodo di pagamento</span>
                  </div>
                  <div className="flex justify-between text-ink-secondary">
                    <span>Tempistiche</span>
                    <span className="text-white">5–7 giorni lavorativi</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('main')}
                    className="flex-1 py-3 bg-surface-3 border border-surface-5 text-ink-secondary font-semibold rounded-xl hover:text-white transition-all text-sm"
                  >
                    Indietro
                  </button>
                  <button
                    onClick={() => onConfirmCancel(true)}
                    className="flex-1 py-3 bg-success text-[#0B0B0B] font-bold rounded-xl hover:opacity-90 transition-all text-sm"
                  >
                    Conferma e rimborsa
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
