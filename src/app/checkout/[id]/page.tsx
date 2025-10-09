'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useBookingStore } from '@/store';
import { Card, Button, Input } from '@/components/ui';
import { CreditCard, Lock, Check, Users, MapPin, DollarSign } from 'lucide-react';

export default function CheckoutPage({ params }: { params: { id: string } }) {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const { user, isAuthenticated } = useAuthStore();
  const { selectedMatch, currentFlight, addBooking } = useBookingStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!selectedMatch || !currentFlight) {
      router.push('/flight-search');
    }
  }, [isAuthenticated, selectedMatch, currentFlight, router]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const destinationStr = localStorage.getItem('flanvo_destination');
      const destination = destinationStr ? JSON.parse(destinationStr) : null;

      const bookingData = {
        rideGroupId: selectedMatch?.id,
        userId: user?.id,
        sharePrice: selectedMatch?.pricePerPerson,
        destination,
        flight: currentFlight,
      };

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();

      if (data.booking) {
        addBooking(data.booking);
        setSuccess(true);

        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Booking error:', error);
    } finally {
      setProcessing(false);
    }
  };

  if (!isAuthenticated || !selectedMatch || !currentFlight) {
    return null;
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Prenotazione confermata!</h2>
          <p className="text-gray-600 mb-6">
            La tua corsa è stata prenotata con successo.
          </p>
          <p className="text-sm text-gray-500">Reindirizzamento alla dashboard...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Completa la prenotazione</h1>
        <p className="text-gray-600">Inserisci i dati di pagamento per confermare</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Metodo di pagamento</h2>

            <form onSubmit={handlePayment} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 border-2 rounded-lg flex items-center justify-center space-x-2 transition-all ${
                    paymentMethod === 'card'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="font-medium">Carta</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('paypal')}
                  className={`p-4 border-2 rounded-lg flex items-center justify-center space-x-2 transition-all ${
                    paymentMethod === 'paypal'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <DollarSign className="w-5 h-5" />
                  <span className="font-medium">PayPal</span>
                </button>
              </div>

              {paymentMethod === 'card' && (
                <div className="space-y-4">
                  <Input
                    type="text"
                    label="Numero carta"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="text"
                      label="Scadenza"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                    />
                    <Input
                      type="text"
                      label="CVC"
                      placeholder="123"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Lock className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Pagamento sicuro (Mock)</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Nessun pagamento reale verrà effettuato.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={processing}
                size="lg"
                className="w-full"
              >
                {processing ? 'Elaborazione...' : `Paga €${selectedMatch.pricePerPerson}`}
              </Button>
            </form>
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
                  <p className="font-semibold text-gray-900">{currentFlight.code}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Users className="w-5 h-5 text-gray-400 mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Compagni</p>
                  <p className="font-semibold text-gray-900">
                    {selectedMatch.passengers.length} passeggeri
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Costo totale</span>
                <span className="font-medium text-gray-900">€{selectedMatch.totalPrice}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200">
                <span className="text-gray-900">La tua quota</span>
                <span className="text-primary-600">€{selectedMatch.pricePerPerson}</span>
              </div>
            </div>

            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm font-medium text-green-900">
                Risparmi €{(selectedMatch.totalPrice * 0.4).toFixed(2)}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}