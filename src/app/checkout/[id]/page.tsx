'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { StripeProvider } from '@/components/providers/stripe-provider';
import { PaymentForm } from '@/components/checkout/payment-form';
import { Check, AlertCircle, Plane, MapPin, Users, ShieldCheck, Loader2, Clock, XCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui';

function useCountdown(expiresAt: string | null) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (secondsLeft === null) return null;
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  return { secondsLeft, display: `${m}:${s.toString().padStart(2, '0')}`, expired: secondsLeft === 0 };
}

export default function CheckoutPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentWindowExpiresAt, setPaymentWindowExpiresAt] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<{
    driverShare: number; flanvoFee: number; protectionFee: number; kmOnboard: number;
  } | null>(null);
  const [rideInfo, setRideInfo] = useState<{
    flightNumber: string; groupSize: number; dropoffLocation: string;
  } | null>(null);
  const [success, setSuccess] = useState(false);
  const [savedCard, setSavedCard] = useState<{ last4: string; brand: string } | null>(null);
  const [oneTapLoading, setOneTapLoading] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);

  const { token, setToken } = useAuthStore();
  const router = useRouter();
  const countdown = useCountdown(paymentWindowExpiresAt);

  const confirmPayment = async (authToken: string) => {
    setOneTapLoading(true);
    try {
      // Chiama authorize direttamente (il PI è già stato creato e confermato automaticamente)
      const res = await fetch('/api/payments/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ memberId: params.id }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/dashboard'), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Errore nel pagamento');
        setShowCardForm(true);
      }
    } catch {
      setError('Errore di connessione');
      setShowCardForm(true);
    } finally {
      setOneTapLoading(false);
    }
  };

  const loadPaymentIntent = useCallback(async (authToken: string) => {
    try {
      setLoading(true);

      // Controlla carta salvata
      const cardRes = await fetch('/api/payments/save-method', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (cardRes.ok) {
        const cardData = await cardRes.json();
        if (cardData.hasSavedCard) {
          setSavedCard({ last4: cardData.last4, brand: cardData.brand });
        }
      }

      const res = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ memberId: params.id }),
      });
      const data = await res.json();
      if (data.success) {
        // Carta salvata → già confermato in automatico
        if (data.autoConfirmed) {
          setSuccess(true);
          setTimeout(() => router.push('/dashboard'), 3000);
          return;
        }
        setClientSecret(data.clientSecret);
        setPaymentAmount(data.amount);
        setPaymentWindowExpiresAt(data.paymentWindowExpiresAt ?? null);
        if (data.breakdown) setBreakdown(data.breakdown);
        if (data.flightNumber) setRideInfo({
          flightNumber: data.flightNumber,
          groupSize: data.groupSize ?? 0,
          dropoffLocation: data.dropoffLocation ?? '',
        });
      } else {
        setError(data.error || 'Impossibile inizializzare il pagamento');
      }
    } catch {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    const storedToken = localStorage.getItem('flanvo_token');
    if (!storedToken) { router.push('/login'); return; }
    if (!token) setToken(storedToken);
    loadPaymentIntent(storedToken);
  }, [params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── SUCCESSO ──────────────────────────────────────────────────────────────
  if (success) return (
    <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center animate-fade-up">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-success/10 border border-success/20 rounded-3xl mb-6">
          <Check className="w-10 h-10 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Posto confermato!</h2>
        <p className="text-ink-secondary text-sm mb-8">Riceverai una notifica non appena un driver accetta la corsa.</p>

        <div className="bg-surface-1 border border-surface-4 rounded-2xl p-5 text-left space-y-4 mb-6">
          <p className="text-xs font-bold text-ink-secondary mb-3">Cosa succede ora?</p>
          {[
            { step: '1', text: 'Il tuo posto nel gruppo è confermato e pagato', color: 'bg-success' },
            { step: '2', text: 'Un driver riceve la notifica e accetta la corsa', color: 'bg-primary-500' },
            { step: '3', text: 'Quando atterri premi "Sono qui" all\'uscita arrivi — il driver parte quando il gruppo è riunito', color: 'bg-primary-500' },
          ].map(({ step, text, color }) => (
            <div key={step} className="flex items-start gap-3">
              <div className={`w-5 h-5 ${color} rounded-full flex items-center justify-center text-[#0B0B0B] text-xs font-bold shrink-0 mt-0.5`}>{step}</div>
              <p className="text-sm text-ink-secondary">{text}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-ink-muted">Reindirizzamento alla dashboard...</p>
      </div>
    </div>
  );

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-primary-400 animate-spin mx-auto mb-4" />
        <p className="text-ink-secondary">Preparazione pagamento...</p>
      </div>
    </div>
  );

  // ── FINESTRA SCADUTA ──────────────────────────────────────────────────────
  if (countdown?.expired || error?.includes('scaduto') || error?.includes('liberato')) return (
    <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-4">
      <div className="text-center max-w-sm animate-fade-up">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-danger/10 border border-danger/20 rounded-3xl mb-6">
          <XCircle className="w-10 h-10 text-danger" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Tempo scaduto</h2>
        <p className="text-ink-secondary text-sm mb-6">
          Il tempo per confermare il pagamento è scaduto. Il tuo posto è stato liberato per altri passeggeri.
        </p>
        <Button onClick={() => router.push('/flight-search')}>Cerca un nuovo gruppo</Button>
      </div>
    </div>
  );

  // ── ERRORE GENERICO ───────────────────────────────────────────────────────
  if (error) return (
    <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Pagamento non disponibile</h2>
        <p className="text-ink-secondary text-sm mb-6">{error}</p>
        <Button onClick={() => router.push('/dashboard')}>Torna alla dashboard</Button>
      </div>
    </div>
  );

  // ── CHECKOUT ──────────────────────────────────────────────────────────────
  const isUrgent = countdown && countdown.secondsLeft <= 300; // ultimi 5 minuti

  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Countdown banner */}
        {countdown && !countdown.expired && (
          <div className={`mb-5 px-5 py-4 rounded-2xl border flex items-center justify-between gap-4 ${
            isUrgent
              ? 'bg-danger/8 border-danger/20'
              : 'bg-warning/8 border-warning/20'
          }`}>
            <div className="flex items-center gap-3">
              <Clock className={`w-5 h-5 shrink-0 ${isUrgent ? 'text-danger' : 'text-warning'}`} />
              <div>
                <p className={`font-bold text-sm ${isUrgent ? 'text-danger' : 'text-warning'}`}>
                  {isUrgent ? 'Sbrigati — il posto sta per essere liberato' : 'Completa il pagamento per confermare il posto'}
                </p>
                <p className="text-xs text-ink-muted mt-0.5">
                  Il gruppo non può aspettare — il driver viene notificato solo quando tutti hanno pagato
                </p>
              </div>
            </div>
            <div className={`text-3xl font-black tabular-nums shrink-0 ${isUrgent ? 'text-danger' : 'text-warning'}`}>
              {countdown.display}
            </div>
          </div>
        )}

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Conferma il posto</h1>
          <p className="text-ink-secondary text-sm mt-1">
            Il prezzo è definitivo — calcolato sul tuo gruppo di {rideInfo?.groupSize ?? '–'} persone
          </p>
        </div>

        {/* Info prezzo congelato */}
        <div className="mb-6 bg-primary-500/8 border border-primary-500/20 rounded-2xl px-5 py-4 flex items-start gap-3">
          <div className="w-8 h-8 bg-primary-500/15 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4 text-primary-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white mb-1">Prezzo congelato e garantito</p>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Questo importo è stato calcolato alla chiusura del tuo gruppo e non cambierà.
              Se il driver non si presenta, ricevi il <strong className="text-white">rimborso completo automatico</strong>.
              I dati della carta sono gestiti da Stripe — Flanvo non li archivia mai.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Form pagamento */}
          <div className="lg:col-span-3">
            <div className="bg-surface-1 border border-surface-4 rounded-2xl p-6 bg-card-gradient">
              <h2 className="text-lg font-bold text-white mb-5">Metodo di pagamento</h2>

              {/* 1-TAP con carta salvata */}
              {savedCard && !showCardForm ? (
                <div className="space-y-4">
                  <div className="bg-surface-2 border border-surface-5 rounded-xl px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-500/15 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-primary-400 text-sm font-bold">
                        {savedCard.brand === 'visa' ? 'V' : savedCard.brand === 'mastercard' ? 'M' : '💳'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white capitalize">{savedCard.brand} •••• {savedCard.last4}</p>
                      <p className="text-xs text-ink-muted">Carta salvata</p>
                    </div>
                    <button onClick={() => setShowCardForm(true)}
                      className="text-xs text-ink-muted hover:text-ink-secondary transition-colors">
                      Cambia
                    </button>
                  </div>

                  <button
                    onClick={() => { const t = localStorage.getItem('flanvo_token'); if (t) confirmPayment(t); }}
                    disabled={oneTapLoading || countdown?.expired}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-primary-500 text-[#0B0B0B] font-black text-lg rounded-2xl hover:bg-primary-400 transition-all disabled:opacity-40 shadow-teal"
                  >
                    {oneTapLoading
                      ? <Loader2 className="w-5 h-5 animate-spin" />
                      : <><Zap className="w-5 h-5" /> Conferma e paga €{paymentAmount.toFixed(2)}</>
                    }
                  </button>
                  <p className="text-center text-xs text-ink-muted">Addebito immediato · nessun inserimento richiesto</p>
                </div>
              ) : (
                /* Form carta normale */
                clientSecret && (
                  <>
                    {showCardForm && savedCard && (
                      <button onClick={() => setShowCardForm(false)}
                        className="text-xs text-ink-muted hover:text-ink-secondary mb-4 transition-colors">
                        ← Usa carta salvata •••• {savedCard.last4}
                      </button>
                    )}
                    <StripeProvider>
                      <PaymentForm
                        clientSecret={clientSecret}
                        amount={paymentAmount}
                        onSuccess={async () => {
                          const authToken = localStorage.getItem('flanvo_token');
                          await fetch('/api/payments/authorize', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                            },
                            body: JSON.stringify({ memberId: params.id }),
                          }).catch(() => {});
                          setSuccess(true);
                          setTimeout(() => router.push('/dashboard'), 3000);
                        }}
                        onError={setError}
                      />
                    </StripeProvider>
                  </>
                )
              )}
            </div>
          </div>

          {/* Riepilogo */}
          <div className="lg:col-span-2">
            <div className="bg-surface-1 border border-surface-4 rounded-2xl p-5 lg:sticky lg:top-24 bg-card-gradient">
              <h3 className="font-bold text-white mb-4">Riepilogo</h3>

              <div className="space-y-3 mb-5">
                {rideInfo?.flightNumber && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-1.5 bg-surface-3 rounded-lg shrink-0">
                      <Plane className="w-3.5 h-3.5 text-primary-400" />
                    </div>
                    <span className="text-white font-medium">{rideInfo.flightNumber}</span>
                  </div>
                )}
                {(rideInfo?.groupSize ?? 0) > 0 && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-1.5 bg-surface-3 rounded-lg shrink-0">
                      <Users className="w-3.5 h-3.5 text-ink-secondary" />
                    </div>
                    <span className="text-ink-secondary">
                      {rideInfo!.groupSize} {rideInfo!.groupSize === 1 ? 'passeggero' : 'passeggeri'} nel gruppo
                    </span>
                  </div>
                )}
                {rideInfo?.dropoffLocation && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-1.5 bg-surface-3 rounded-lg shrink-0">
                      <MapPin className="w-3.5 h-3.5 text-ink-secondary" />
                    </div>
                    <span className="text-ink-secondary truncate">{rideInfo.dropoffLocation}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-surface-4 pt-4 space-y-2.5 mb-4">
                {breakdown ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-ink-secondary">Quota trasporto</span>
                      <span className="text-white">€{breakdown.driverShare.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-ink-secondary">Servizio Flanvo</span>
                      <span className="text-white">€{breakdown.flanvoFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-ink-secondary">Protezione acquisto</span>
                      <span className="text-white">€{breakdown.protectionFee.toFixed(2)}</span>
                    </div>
                    {breakdown.kmOnboard > 0 && (
                      <p className="text-xs text-ink-muted">~{Math.round(breakdown.kmOnboard)} km stimati</p>
                    )}
                  </>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-secondary">Tariffa corsa</span>
                    <span className="text-white">€{paymentAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t border-surface-4">
                  <span className="font-bold text-white">Totale</span>
                  <span className="text-2xl font-black text-primary-400">€{paymentAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  'Prezzo definitivo — non cambia',
                  'Rimborso completo se il driver non accetta',
                  'Pagamento sicuro Stripe · PCI DSS Level 1',
                ].map((t) => (
                  <div key={t} className="flex items-center gap-2 text-xs text-ink-muted">
                    <ShieldCheck className="w-3.5 h-3.5 text-success shrink-0" />
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
