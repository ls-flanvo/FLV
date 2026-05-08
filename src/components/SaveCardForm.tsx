'use client';

import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ShieldCheck, Loader2, CreditCard } from 'lucide-react';

const CARD_STYLE = {
  style: {
    base: {
      color: '#ffffff',
      fontFamily: 'inherit',
      fontSize: '15px',
      '::placeholder': { color: '#6b7280' },
    },
    invalid: { color: '#ef4444' },
  },
};

interface SaveCardFormProps {
  onSuccess: (last4: string, brand: string) => void;
  onSkip: () => void;
}

export default function SaveCardForm({ onSuccess, onSkip }: SaveCardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('flanvo_token');

      // 1. Crea SetupIntent
      const intentRes = await fetch('/api/payments/setup-intent', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const { clientSecret } = await intentRes.json();
      if (!clientSecret) throw new Error('Impossibile inizializzare');

      // 2. Conferma con la carta inserita
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Elemento carta non trovato');

      const { setupIntent, error: stripeError } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (stripeError) throw new Error(stripeError.message);
      if (!setupIntent?.payment_method) throw new Error('Carta non salvata');

      // 3. Salva su DB
      const saveRes = await fetch('/api/payments/save-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paymentMethodId: setupIntent.payment_method }),
      });
      const { last4, brand } = await saveRes.json();

      onSuccess(last4 ?? '••••', brand ?? 'card');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore durante il salvataggio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-surface-2 border border-surface-5 rounded-xl p-4">
        <CardElement options={CARD_STYLE} />
      </div>

      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}

      <div className="flex items-center gap-2 text-xs text-ink-muted">
        <ShieldCheck className="w-3.5 h-3.5 text-success shrink-0" />
        Nessun addebito ora — carta salvata in modo sicuro da Stripe
      </div>

      <button
        onClick={handleSave}
        disabled={loading || !stripe}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary-500 text-[#0B0B0B] font-bold rounded-xl hover:bg-primary-400 transition-all disabled:opacity-40 text-sm"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
        {loading ? 'Salvataggio...' : 'Salva carta'}
      </button>

      <button
        onClick={onSkip}
        className="w-full text-xs text-ink-muted hover:text-ink-secondary transition-colors py-2"
      >
        Salta — inserirò la carta al momento del pagamento
      </button>
    </div>
  );
}
