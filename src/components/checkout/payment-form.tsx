'use client';

import { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui';
import { Lock, CreditCard } from 'lucide-react';

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function PaymentForm({ clientSecret, amount, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        onError(error.message || 'Payment failed');
      } else if (paymentIntent?.status === 'requires_capture') {
        // Payment authorized successfully!
        onSuccess();
      }
    } catch (err: any) {
      onError(err.message || 'An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        padding: '12px',
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Carta di credito o debito
        </label>
        <div className="border border-gray-300 rounded-lg p-4 bg-white">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <Lock className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">Pagamento sicuro con Stripe</p>
            <p className="text-xs text-blue-700 mt-1">
              I tuoi dati sono protetti e crittografati. Non salviamo i dettagli della carta.
            </p>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={!stripe || processing}
        size="lg"
        className="w-full"
      >
        {processing ? 'Elaborazione...' : `Paga €${amount.toFixed(2)}`}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        Per test usa: 4242 4242 4242 4242 | Qualsiasi data futura | Qualsiasi CVC
      </p>
    </form>
  );
}