'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useBookingStore } from '@/store';
import { Card, Button } from '@/components/ui';
import { Check, Users, MapPin, AlertCircle } from 'lucide-react';
import { StripeProvider } from '@/components/providers/stripe-provider';
import { PaymentForm } from '@/components/checkout/payment-form';

export default function CheckoutPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [success, setSuccess] = useState(false);

  const { user, token, setToken } = useAuthStore();
  const { selectedMatch, currentFlight } = useBookingStore();
  const router = useRouter();

  useEffect(() => {
    // ✅ Controlla token da localStorage
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('flanvo_token') : null;
    
    if (!storedToken) {
      router.push('/login');
      return;
    }

    // Setta token nello store se manca
    if (!token) {
      setToken(storedToken);
    }

    // Usa memberId dall'URL
    const memberIdFromUrl = params.id;
    setMemberId(memberIdFromUrl);
    createPaymentIntent(memberIdFromUrl, storedToken);
  }, [params.id]);

  const createPaymentIntent = async (memberIdToUse: string, authToken: string) => {
    try {
      setLoading(true);
      console.log('🎯 Creando payment intent per memberId:', memberIdToUse);
      
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ memberId: memberIdToUse }),
      });

      const data = await response.json();
      console.log('💳 Payment intent response:', data);

      if (data.success) {
        setClientSecret(data.clientSecret);
        setPaymentAmount(data.amount);
      } else {
        setError(data.error || 'Failed to initialize payment');
      }
    } catch (err) {
      console.error('❌ Payment intent error:', err);
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setSuccess(true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Pagamento autorizzato!</h2>
          <p className="text-gray-600 mb-6">
            La tua prenotazione è stata confermata con successo.
          </p>
          <p className="text-sm text-gray-500">Reindirizzamento alla dashboard...</p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparazione pagamento...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Errore</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.push('/flight-search')}>
            Torna alla ricerca
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Completa la prenotazione</h1>
        <p className="text-gray-600">Autorizza il pagamento per confermare il tuo posto</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Metodo di pagamento</h2>

            {clientSecret && (
              <StripeProvider>
                <PaymentForm
                  clientSecret={clientSecret}
                  amount={paymentAmount}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </StripeProvider>
            )}
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Riepilogo</h3>

            <div className="space-y-4 mb-6">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Volo</p>
                  <p className="font-semibold text-gray-900">{currentFlight?.code || 'N/A'}</p>
                </div>
              </div>

              {selectedMatch && (
                <div className="flex items-start space-x-3">
                  <Users className="w-5 h-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Compagni</p>
                    <p className="font-semibold text-gray-900">
                      {selectedMatch.passengers?.length || 0} passeggeri
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tariffa corsa</span>
                <span className="font-medium text-gray-900">
                  €{paymentAmount > 0 ? (paymentAmount - 1).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Protection fee</span>
                <span className="font-medium text-gray-900">€1.00</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200">
                <span className="text-gray-900">Totale</span>
                <span className="text-primary-600">€{paymentAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs font-medium text-yellow-900">
                ⚠️ Il pagamento sarà addebitato solo al drop-off effettivo
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}