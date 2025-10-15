'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Booking } from '@/lib/types';
import { Card, Badge, Button } from './ui';
import DriverChat from './DriverChat';
import CancellationModal from './CancellationModal';
import { 
  Plane,
  MapPin, 
  DollarSign, 
  MessageCircle, 
  Navigation,
  Luggage,
  Clock,
  Users,
  XCircle
} from 'lucide-react';

interface BookingCardProps {
  booking: Booking;
}

export default function BookingCard({ booking }: BookingCardProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const getStatusVariant = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      pending: 'warning',
      confirmed: 'info',
      paid: 'success',
      completed: 'success',
      cancelled: 'danger',
    };
    return variants[status] || 'default';
  };

  // ✅ Valori di default per campi non ancora nel DB
  const driver = {
    name: 'Da assegnare',
    phone: '+39 340 0000000',
    vehicle: 'In attesa di conferma'
  };

  const pickupPoint = {
    location: 'Terminal - Uscita Arrivi',
    time: '15 minuti dopo l\'atterraggio',
    instructions: 'Cerca un cartello con il logo Flanvo'
  };

  // ✅ Usa i campi reali del Booking
  const passengers = 1; // Default, aggiornare quando campo disponibile
  const luggage = booking.luggageCount || 1;

  const handleCancelBooking = async (refundEligible: boolean) => {
    try {
      const response = await fetch(`/api/bookings/${booking.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refundEligible })
      });

      if (response.ok) {
        setIsCancelModalOpen(false);
        alert(refundEligible 
          ? 'Cancellazione completata! Riceverai il rimborso entro 5-7 giorni.' 
          : 'Prenotazione cancellata.');
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  const handleFindNewRide = () => {
    window.location.href = '/flight-search';
  };

  // ✅ Mappa status corretto per CancellationModal
  const getFlightStatus = (): 'scheduled' | 'cancelled' | 'diverted' | 'delayed' | 'normal' => {
    const status = booking.status.toLowerCase();
    if (status === 'cancelled') return 'cancelled';
    if (status === 'confirmed') return 'scheduled';
    return 'normal';
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        {/* Header con status */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Volo {booking.flightNumber || 'N/A'}
            </h3>
            <p className="text-sm text-gray-500">
              {new Date(booking.flightDate).toLocaleDateString('it-IT')}
            </p>
          </div>
          <Badge variant={getStatusVariant(booking.status)}>
            {booking.status.toUpperCase()}
          </Badge>
        </div>

        {/* Pickup Point - solo se confermato */}
        {(booking.status === 'confirmed' || booking.status === 'paid') && (
          <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
            <div className="flex items-start space-x-2 mb-2">
              <Navigation className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Punto di ritiro</p>
                <p className="text-sm text-gray-700">{pickupPoint.location}</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <Clock className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-gray-600">{pickupPoint.time}</p>
                <p className="text-xs text-gray-500 mt-1">
                  💡 {pickupPoint.instructions}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info viaggio */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center space-x-3">
            <Plane className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <p className="text-sm text-gray-500">Volo</p>
              <p className="font-semibold text-gray-900">{booking.flightNumber}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <MapPin className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <p className="text-sm text-gray-500">Destinazione</p>
              <p className="font-semibold text-gray-900">
                {booking.destinationAddress || 'Da specificare'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{passengers} pass.</span>
            </div>
            <div className="flex items-center space-x-2">
              <Luggage className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{luggage} bag.</span>
            </div>
          </div>
        </div>

        {/* Driver info - solo se confermato */}
        {(booking.status === 'confirmed' || booking.status === 'paid') && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Il tuo autista</p>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                DA
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{driver.name}</p>
                <p className="text-xs text-gray-500">{driver.vehicle}</p>
              </div>
            </div>
          </div>
        )}

        {/* Prezzo */}
        <div className="flex items-center justify-between py-3 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">Prezzo stimato</span>
          </div>
          <span className="text-xl font-bold text-primary-600">
            €{booking.estimatedPrice?.toFixed(2) || 'N/A'}
          </span>
        </div>

        {/* Azioni */}
        {booking.status === 'paid' && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Link 
                href={`/tracking/${booking.id}`}
                className="flex-1"
              >
                <Button className="w-full">Traccia corsa</Button>
              </Link>

              <button
                onClick={() => setIsChatOpen(true)}
                className="flex-1 bg-primary-500 text-white py-2 rounded-lg hover:bg-primary-600 transition-colors font-medium text-sm flex items-center justify-center space-x-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat</span>
              </button>
            </div>

            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="w-full bg-red-50 text-red-600 border border-red-200 py-2 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm flex items-center justify-center space-x-2"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancella Prenotazione</span>
            </button>
          </div>
        )}
      </Card>

      {/* Modal Chat */}
      <DriverChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        driverName={driver.name}
        driverPhone={driver.phone}
        bookingId={booking.id}
      />

      {/* Modal Cancellazione */}
      <CancellationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        bookingId={booking.id}
        flightStatus={getFlightStatus()}
        divertedTo={undefined}
        onConfirmCancel={handleCancelBooking}
        onFindNewRide={handleFindNewRide}
      />
    </>
  );
}