'use client';

import { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Lock, Loader2 } from 'lucide-react';

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

export function PaymentForm({ clientSecret, amount, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    setProcessing(true);
    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (error) {
        onError(error.message || 'Pagamento non riuscito');
      } else if (paymentIntent?.status === 'requires_capture') {
        onSuccess(paymentIntent.id);
      } else {
        onError('Stato pagamento non atteso. Riprova.');
      }
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Errore imprevisto');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-ink-secondary mb-2 uppercase tracking-wide">
          Carta di credito o debito
        </label>
        <div className="border border-surface-5 rounded-xl p-4 bg-surface-2 focus-within:border-primary-500/50 transition-colors">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#ffffff',
                  fontFamily: 'system-ui, sans-serif',
                  '::placeholder': { color: '#6b7280' },
                  iconColor: '#00D1B2',
                },
                invalid: { color: '#f87171', iconColor: '#f87171' },
              },
            }}
          />
        </div>
      </div>

      <div className="flex items-start gap-2.5 bg-surface-2 border border-surface-5 rounded-xl px-4 py-3">
        <Lock className="w-4 h-4 text-ink-muted shrink-0 mt-0.5" />
        <p className="text-xs text-ink-muted leading-relaxed">
          Dati crittografati da Stripe. Non salviamo i dettagli della carta.
        </p>
      </div>

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full py-4 bg-primary-500 text-[#0B0B0B] font-bold rounded-xl hover:bg-primary-400 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
      >
        {processing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Elaborazione...
          </>
        ) : (
          `Paga €${amount.toFixed(2)}`
        )}
      </button>

      <p className="text-xs text-ink-muted text-center">
        La carta viene addebitata solo al completamento della corsa
      </p>
    </form>
  );
}
