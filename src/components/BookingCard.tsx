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
  XCircle,
  Star,
  Share2,
} from 'lucide-react';

interface BookingCardProps {
  booking: Booking;
}

export default function BookingCard({ booking }: BookingCardProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(!!booking.userRating);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  const handleShare = async () => {
    setShareLoading(true);
    try {
      const token = localStorage.getItem('flanvo_token');
      const res = await fetch(`/api/bookings/${booking.id}/share`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.url) {
        if (navigator.share) {
          await navigator.share({
            title: `Flanvo — Volo ${booking.flightNumber}`,
            text: 'Segui la mia corsa in tempo reale!',
            url: data.url,
          });
        } else {
          await navigator.clipboard.writeText(data.url);
          alert('Link copiato negli appunti!');
        }
      }
    } catch {
      // silent
    } finally {
      setShareLoading(false);
    }
  };

  const groupId =
    booking.groupMember?.rideGroupId ?? booking.rideGroupId ?? '';

  const getStatusVariant = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      PENDING: 'warning',
      CONFIRMED: 'info',
      MATCHED: 'info',
      IN_PROGRESS: 'info',
      COMPLETED: 'success',
      CANCELLED: 'danger',
    };
    return variants[status] || 'default';
  };

  const driver = {
    name: 'Da assegnare',
    phone: '',
    vehicle: 'In attesa di conferma',
  };

  const pickupPoint = {
    location: 'Terminal - Uscita Arrivi',
    time: "15 minuti dopo l'atterraggio",
    instructions: 'Cerca un cartello con il logo Flanvo',
  };

  const passengers = booking.passengers ?? 1;
  const luggage = booking.luggage ?? booking.luggageCount ?? 1;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCancelBooking = async (_refundEligible?: boolean) => {
    try {
      const token = localStorage.getItem('flanvo_token');
      const response = await fetch(`/api/bookings/${booking.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        setIsCancelModalOpen(false);
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  const handleSubmitRating = async () => {
    if (!rating || ratingLoading) return;
    setRatingLoading(true);
    try {
      const token = localStorage.getItem('flanvo_token');
      const res = await fetch(`/api/bookings/${booking.id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ rating, comment: ratingComment }),
      });
      if (res.ok) {
        setRatingSubmitted(true);
      }
    } catch {
      // silent
    } finally {
      setRatingLoading(false);
    }
  };

  const getFlightStatus = (): 'scheduled' | 'cancelled' | 'diverted' | 'delayed' | 'normal' => {
    const status = booking.status.toLowerCase();
    if (status === 'cancelled') return 'cancelled';
    if (status === 'confirmed') return 'scheduled';
    return 'normal';
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
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
            {booking.status}
          </Badge>
        </div>

        {(booking.status === 'CONFIRMED' ||
          booking.status === 'MATCHED' ||
          booking.status === 'IN_PROGRESS') && (
          <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
            <div className="flex items-start space-x-2 mb-2">
              <Navigation className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  Punto di ritiro
                </p>
                <p className="text-sm text-gray-700">{pickupPoint.location}</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <Clock className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-gray-600">{pickupPoint.time}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {pickupPoint.instructions}
                </p>
              </div>
            </div>
          </div>
        )}

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
                {booking.dropoffLocation ||
                  booking.destination?.address ||
                  'Da specificare'}
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

        {(booking.status === 'CONFIRMED' ||
          booking.status === 'MATCHED' ||
          booking.status === 'IN_PROGRESS') && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Il tuo autista</p>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                DA
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {driver.name}
                </p>
                <p className="text-xs text-gray-500">{driver.vehicle}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between py-3 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">Prezzo stimato</span>
          </div>
          <span className="text-xl font-bold text-primary-600">
            €{booking.estimatedPrice?.toFixed(2) || 'N/A'}
          </span>
        </div>

        {(booking.status === 'IN_PROGRESS' || booking.status === 'MATCHED') && (
          <div className="space-y-2 mt-2">
            <div className="flex gap-2">
              <Link href={`/tracking/${booking.id}`} className="flex-1">
                <Button className="w-full">Traccia corsa</Button>
              </Link>
              {groupId && (
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="flex-1 bg-primary-500 text-white py-2 rounded-lg hover:bg-primary-600 transition-colors font-medium text-sm flex items-center justify-center space-x-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat</span>
                </button>
              )}
            </div>
            <button
              onClick={handleShare}
              disabled={shareLoading}
              className="w-full bg-green-50 text-green-700 border border-green-200 py-2 rounded-lg hover:bg-green-100 transition-colors font-medium text-sm flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" />
              <span>{shareLoading ? 'Generando link...' : 'Condividi posizione (WhatsApp)'}</span>
            </button>

            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="w-full bg-red-50 text-red-600 border border-red-200 py-2 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm flex items-center justify-center space-x-2"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancella Prenotazione</span>
            </button>
          </div>
        )}

        {booking.status === 'COMPLETED' && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            {ratingSubmitted ? (
              <div className="text-center text-sm text-green-700 bg-green-50 rounded-lg py-3 px-4">
                <Star className="w-4 h-4 inline mr-1 fill-current text-yellow-500" />
                Grazie per la valutazione!
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  Valuta questa corsa
                </p>
                <div className="flex space-x-1 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(s)}
                      className="p-1"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          s <= (hoverRating || rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <>
                    <textarea
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      placeholder="Commento opzionale..."
                      rows={2}
                      className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 mb-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <Button
                      className="w-full"
                      disabled={ratingLoading}
                      onClick={handleSubmitRating}
                    >
                      {ratingLoading ? 'Invio...' : 'Invia valutazione'}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      {groupId && (
        <DriverChat
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          driverName={driver.name}
          driverPhone={driver.phone}
          groupId={groupId}
        />
      )}

      <CancellationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        bookingId={booking.id}
        flightStatus={getFlightStatus()}
        divertedTo={undefined}
        onConfirmCancel={handleCancelBooking}
        onFindNewRide={() => (window.location.href = '/flight-search')}
      />
    </>
  );
}
