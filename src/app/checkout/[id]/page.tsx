'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useBookingStore } from '@/store';
import { Card, Button } from '@/components/ui';
import { StripeProvider } from '@/components/providers/stripe-provider';
import { PaymentForm } from '@/components/checkout/payment-form';
import { Check, AlertCircle, Plane, MapPin, Users, ShieldCheck, Loader2 } from 'lucide-react';

export default function CheckoutPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [breakdown, setBreakdown] = useState<{
    driverShare: number; flanvoFee: number; protectionFee: number; kmOnboard: number;
  } | null>(null);
  const [success, setSuccess] = useState(false);

  const { token, setToken } = useAuthStore();
  const { selectedMatch, currentFlight } = useBookingStore();
  const router = useRouter();

  useEffect(() => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('flanvo_token') : null;
    if (!storedToken) { router.push('/login'); return; }
    if (!token) setToken(storedToken);
    createPaymentIntent(params.id, storedToken);
  }, [params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const createPaymentIntent = async (memberIdToUse: string, authToken: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ memberId: memberIdToUse }),
      });
      const data = await res.json();
      if (data.success) {
        setClientSecret(data.clientSecret);
        setPaymentAmount(data.amount);
        if (data.breakdown) setBreakdown(data.breakdown);
      } else {
        setError(data.error || 'Impossibile inizializzare il pagamento');
      }
    } catch {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center animate-fade-up">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-success/10 border border-success/20 rounded-3xl mb-6">
          <Check className="w-10 h-10 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Prenotazione confermata!</h2>
        <p className="text-ink-secondary text-sm mb-8">Riceverai una email di conferma a breve.</p>

        <div className="bg-surface-1 border border-surface-4 rounded-2xl p-5 text-left space-y-4 mb-6">
          <p className="text-xs font-bold text-ink-secondary mb-3">Cosa succede ora?</p>
          {[
            { step: '1', text: 'Il gruppo si forma con altri passeggeri del tuo volo', color: 'bg-primary-500' },
            { step: '2', text: 'Ricevi conferma autista e van via email', color: 'bg-primary-500' },
            { step: '3', text: 'Il driver ti aspetta al Terminal Arrivi con cartello Flanvo', color: 'bg-primary-500' },
            { step: '4', text: 'Paghi solo quando arrivi a destinazione', color: 'bg-success' },
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

  if (loading) return (
    <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-primary-400 animate-spin mx-auto mb-4" />
        <p className="text-ink-secondary">Preparazione pagamento...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Pagamento non disponibile</h2>
        <p className="text-ink-secondary text-sm mb-6">{error}</p>
        <Button onClick={() => router.push('/flight-search')}>Torna alla ricerca</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Completa la prenotazione</h1>
          <p className="text-ink-secondary text-sm mt-1">Pre-autorizzazione carta di credito</p>
        </div>

        {/* Pre-auth explanation — prominent */}
        <div className="mb-6 bg-primary-500/8 border border-primary-500/20 rounded-2xl px-5 py-4 flex items-start gap-3">
          <div className="w-8 h-8 bg-primary-500/15 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4 text-primary-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white mb-1">La tua carta non viene addebitata ora</p>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Autorizziamo temporaneamente l&apos;importo su Stripe per garantire il tuo posto nel gruppo.
              L&apos;addebito reale avviene <strong className="text-white">solo quando arrivi a destinazione</strong>.
              Se il gruppo non si forma, l&apos;autorizzazione decade automaticamente.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Payment form — larger on desktop */}
          <div className="lg:col-span-3">
            <div className="bg-surface-1 border border-surface-4 rounded-2xl p-6 shadow-surface bg-card-gradient">
              <h2 className="text-lg font-bold text-white mb-5">Metodo di pagamento</h2>
              {clientSecret && (
                <StripeProvider>
                  <PaymentForm
                    clientSecret={clientSecret}
                    amount={paymentAmount}
                    onSuccess={() => { setSuccess(true); setTimeout(() => router.push('/dashboard'), 2000); }}
                    onError={setError}
                  />
                </StripeProvider>
              )}
            </div>
          </div>

          {/* Summary — sticky on desktop */}
          <div className="lg:col-span-2">
            <div className="bg-surface-1 border border-surface-4 rounded-2xl p-5 lg:sticky lg:top-24 bg-card-gradient">
              <h3 className="font-bold text-white mb-4">Riepilogo</h3>

              {/* Flight info */}
              <div className="space-y-3 mb-5">
                {currentFlight && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-1.5 bg-surface-3 rounded-lg shrink-0">
                      <Plane className="w-3.5 h-3.5 text-primary-400" />
                    </div>
                    <span className="text-white font-medium">{currentFlight.code}</span>
                    <span className="text-ink-muted">{currentFlight.arrivalAirport}</span>
                  </div>
                )}
                {selectedMatch && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-1.5 bg-surface-3 rounded-lg shrink-0">
                      <Users className="w-3.5 h-3.5 text-ink-secondary" />
                    </div>
                    <span className="text-ink-secondary">{selectedMatch.passengers?.length || 0} compagni · Van 7 posti</span>
                  </div>
                )}
              </div>

              {/* Price breakdown */}
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
                  <span className="font-bold text-white">Pre-autorizzato</span>
                  <span className="text-2xl font-black text-primary-400">€{paymentAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Trust badges */}
              <div className="space-y-2">
                {[
                  'Addebito solo al drop-off',
                  'Cancellazione pre-match gratuita',
                  'Pagamento sicuro Stripe',
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
