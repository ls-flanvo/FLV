'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Booking } from '@/lib/types';
import { Button } from './ui';
import DriverChat from './DriverChat';
import CancellationModal from './CancellationModal';
import {
  Plane, MapPin, DollarSign, MessageCircle, Navigation,
  Luggage, Clock, Users, XCircle, Star, Share2, ChevronRight,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  PENDING:      { label: 'In attesa',    color: 'text-warning',     dot: 'bg-warning' },
  CONFIRMED:    { label: 'Confermato',   color: 'text-primary-400', dot: 'bg-primary-500' },
  IN_MATCHING:  { label: 'Matching...',  color: 'text-primary-400', dot: 'bg-primary-500' },
  MATCHED:      { label: 'Gruppo trovato', color: 'text-success',   dot: 'bg-success' },
  IN_PROGRESS:  { label: 'In viaggio',   color: 'text-success',     dot: 'bg-success' },
  COMPLETED:    { label: 'Completata',   color: 'text-ink-muted',   dot: 'bg-ink-muted' },
  CANCELLED:    { label: 'Cancellata',   color: 'text-danger',      dot: 'bg-danger' },
  NO_MATCH:     { label: 'Nessun match', color: 'text-ink-muted',   dot: 'bg-ink-muted' },
};

export default function BookingCard({ booking }: { booking: Booking }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(!!booking.userRating);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  const groupId = booking.groupMember?.rideGroupId ?? booking.rideGroupId ?? '';
  const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
  const isActive = ['IN_PROGRESS', 'MATCHED'].includes(booking.status);
  const isCompleted = booking.status === 'COMPLETED';
  const passengers = booking.passengers ?? 1;
  const luggage = booking.luggage ?? booking.luggageCount ?? 1;

  const handleCancelBooking = async (_?: boolean) => {
    const token = localStorage.getItem('flanvo_token');
    const res = await fetch(`/api/bookings/${booking.id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (res.ok) { setIsCancelModalOpen(false); window.location.href = '/dashboard'; }
  };

  const handleSubmitRating = async () => {
    if (!rating || ratingLoading) return;
    setRatingLoading(true);
    try {
      const token = localStorage.getItem('flanvo_token');
      const res = await fetch(`/api/bookings/${booking.id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ rating, comment: ratingComment }),
      });
      if (res.ok) setRatingSubmitted(true);
    } finally { setRatingLoading(false); }
  };

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
          await navigator.share({ title: `Flanvo — Volo ${booking.flightNumber}`, text: 'Segui la mia corsa!', url: data.url });
        } else {
          await navigator.clipboard.writeText(data.url);
        }
      }
    } finally { setShareLoading(false); }
  };

  return (
    <>
      <div className="bg-surface-1 border border-surface-4 rounded-2xl overflow-hidden bg-card-gradient">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-surface-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-surface-3 rounded-xl">
                <Plane className="w-4 h-4 text-primary-400" />
              </div>
              <div>
                <p className="font-bold text-white">{booking.flightNumber || 'N/A'}</p>
                <p className="text-xs text-ink-muted">
                  {new Date(booking.flightDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot} ${isActive ? 'animate-pulse' : ''}`} />
              <span className={`text-xs font-semibold ${status.color}`}>{status.label}</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          {/* Destination */}
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-ink-muted shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-ink-muted mb-0.5">Destinazione</p>
              <p className="text-sm font-medium text-white leading-tight">
                {booking.dropoffLocation || booking.destination?.address || 'Da specificare'}
              </p>
            </div>
          </div>

          {/* Passengers + luggage + price row */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-4 text-sm text-ink-secondary">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />{passengers}
              </span>
              <span className="flex items-center gap-1.5">
                <Luggage className="w-3.5 h-3.5" />{luggage}
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs text-ink-muted">Prezzo stimato</p>
              <p className="text-xl font-black text-primary-400">
                €{booking.estimatedPrice?.toFixed(2) ?? '—'}
              </p>
            </div>
          </div>

          {/* Pickup info when active */}
          {(booking.status === 'CONFIRMED' || booking.status === 'MATCHED') && (
            <div className="bg-primary-500/8 border border-primary-500/15 rounded-xl px-4 py-3 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-primary-300">Punto di ritiro</p>
                <p className="text-xs text-ink-secondary mt-0.5">Terminal Arrivi · Uscita principale · Cartello Flanvo</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 space-y-2">
          {isActive && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Link href={`/tracking/${booking.id}`}>
                  <button className="w-full flex items-center justify-center gap-1.5 py-3 bg-primary-500 text-[#0B0B0B] font-bold text-sm rounded-xl hover:bg-primary-400 transition-all">
                    <Navigation className="w-4 h-4" /> Traccia
                  </button>
                </Link>
                {groupId && (
                  <button
                    onClick={() => setIsChatOpen(true)}
                    className="flex items-center justify-center gap-1.5 py-3 bg-surface-3 border border-surface-5 text-white font-semibold text-sm rounded-xl hover:border-primary-500/30 transition-all"
                  >
                    <MessageCircle className="w-4 h-4" /> Chat
                  </button>
                )}
              </div>
              <button
                onClick={handleShare}
                disabled={shareLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-ink-secondary border border-surface-5 rounded-xl hover:text-white hover:border-surface-5 transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
                {shareLoading ? 'Generando...' : 'Condividi posizione'}
              </button>
              <button
                onClick={() => setIsCancelModalOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-danger/70 hover:text-danger transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" /> Cancella prenotazione
              </button>
            </>
          )}

          {isCompleted && (
            <div className="pt-1">
              {ratingSubmitted ? (
                <div className="flex items-center justify-center gap-2 py-2.5 text-sm text-success">
                  <Star className="w-4 h-4 fill-current" /> Grazie per la valutazione!
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-white mb-2.5">Com&apos;è andata?</p>
                  <div className="flex justify-center gap-2 mb-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        onMouseEnter={() => setHoverRating(s)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(s)}
                        className="p-1"
                      >
                        <Star className={`w-7 h-7 transition-colors ${s <= (hoverRating || rating) ? 'fill-warning text-warning' : 'text-surface-5'}`} />
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
                        className="w-full text-sm bg-surface-2 border border-surface-5 rounded-xl px-3 py-2 text-white placeholder-ink-muted mb-2 focus:outline-none focus:border-primary-500 resize-none"
                      />
                      <Button className="w-full" disabled={ratingLoading} onClick={handleSubmitRating}>
                        {ratingLoading ? 'Invio...' : 'Invia valutazione'}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {booking.status === 'NO_MATCH' && (
            <Link href="/flight-search">
              <button className="w-full flex items-center justify-center gap-2 py-3 text-sm text-primary-400 border border-primary-500/20 rounded-xl hover:bg-primary-500/5 transition-all">
                Cerca di nuovo <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
          )}
        </div>
      </div>

      {groupId && (
        <DriverChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)}
          driverName="Autista" driverPhone="" groupId={groupId} />
      )}
      <CancellationModal
        isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)}
        bookingId={booking.id}
        flightStatus={booking.status === 'CANCELLED' ? 'cancelled' : 'normal'}
        divertedTo={undefined}
        onConfirmCancel={handleCancelBooking}
        onFindNewRide={() => (window.location.href = '/flight-search')}
      />
    </>
  );
}
