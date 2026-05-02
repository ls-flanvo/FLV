'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Booking } from '@/lib/types';
import { Button } from './ui';
import DriverChat from './DriverChat';
import CancellationModal from './CancellationModal';
import { formatFlightTime, formatCountdown } from '@/lib/time';
import {
  Plane, MapPin, DollarSign, MessageCircle, Navigation,
  Luggage, Clock, Users, XCircle, Star, Share2, ChevronRight, AlertTriangle,
} from 'lucide-react';
import DisputeModal from './DisputeModal';

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  PENDING:      { label: 'Cerchiamo compagni...',  color: 'text-warning',     dot: 'bg-warning' },
  CONFIRMED:    { label: 'Gruppo completo · Attesa driver', color: 'text-primary-400', dot: 'bg-primary-500' },
  IN_MATCHING:  { label: 'Matching...',            color: 'text-primary-400', dot: 'bg-primary-500' },
  MATCHED:      { label: 'Driver confermato · Paga ora', color: 'text-success', dot: 'bg-success' },
  IN_PROGRESS:  { label: 'In viaggio',             color: 'text-success',     dot: 'bg-success' },
  COMPLETED:    { label: 'Completata',             color: 'text-ink-muted',   dot: 'bg-ink-muted' },
  CANCELLED:    { label: 'Cancellata',             color: 'text-danger',      dot: 'bg-danger' },
  NO_MATCH:     { label: 'Nessun match',           color: 'text-ink-muted',   dot: 'bg-ink-muted' },
};

const TIP_OPTIONS = [1, 2, 5];

function TipSection({ bookingId }: { bookingId: string }) {
  const [tipped, setTipped] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendTip = async (amount: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('flanvo_token');
      await fetch('/api/payments/tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ bookingId, amount }),
      });
      setTipped(true);
    } finally {
      setLoading(false);
    }
  };

  if (tipped) {
    return (
      <div className="bg-primary-500/8 border border-primary-500/20 rounded-xl px-4 py-3 text-center">
        <p className="text-sm font-semibold text-primary-400">Mancia inviata — grazie!</p>
        <p className="text-xs text-ink-muted mt-0.5">Il driver ha ricevuto la tua mancia.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-2 border border-surface-5 rounded-xl px-4 py-3">
      <p className="text-xs text-ink-muted mb-2">Sei arrivato a destinazione. Grazie per aver scelto Flanvo!</p>
      <p className="text-xs font-semibold text-white mb-2">Vuoi lasciare una mancia al driver?</p>
      <div className="flex gap-2">
        {TIP_OPTIONS.map((amount) => (
          <button
            key={amount}
            onClick={() => sendTip(amount)}
            disabled={loading}
            className="flex-1 py-2 bg-surface-3 border border-surface-5 rounded-xl text-sm font-bold text-white hover:border-primary-500/30 hover:bg-surface-2 disabled:opacity-40 transition-all"
          >
            €{amount}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function BookingCard({ booking }: { booking: Booking }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(!!booking.userRating);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);

  const [groupStatus, setGroupStatus] = useState<{ current: number; max: number } | null>(null);
  const isForming = ['PENDING', 'IN_MATCHING'].includes(booking.status);

  useEffect(() => {
    if (!isForming) return;
    const poll = async () => {
      try {
        const token = localStorage.getItem('flanvo_token');
        const res = await fetch(`/api/bookings/${booking.id}/status`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.group) setGroupStatus({ current: data.group.current, max: data.group.max });
      } catch { /* silent */ }
    };
    poll();
    const interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
  }, [booking.id, isForming]); // eslint-disable-line react-hooks/exhaustive-deps

  const groupId = booking.groupMember?.id ?? booking.rideGroupId ?? '';
  const rideGroupId = booking.groupMember?.rideGroupId ?? booking.rideGroupId ?? '';
  const paymentStatus = booking.groupMember?.paymentStatus;
  const isPaid = paymentStatus === 'AUTHORIZED' || paymentStatus === 'CAPTURED';
  const rideGroup = booking.groupMember?.rideGroup;
  const chatEnabled =
    rideGroup?.status === 'ACTIVE' ||
    rideGroup?.status === 'COMPLETED' ||
    (rideGroup?.status === 'ASSIGNED' && rideGroup?.flightStatus === 'landed');
  const meetingLanded = rideGroup?.flightStatus === 'landed' && rideGroup?.meetingPoint;
  const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
  const isActive = ['IN_PROGRESS'].includes(booking.status);
  const isCancellable = ['PENDING', 'IN_MATCHING', 'CONFIRMED', 'MATCHED', 'IN_PROGRESS'].includes(booking.status);
  const isConfirmed = booking.status === 'CONFIRMED';
  const isMatched = booking.status === 'MATCHED' && !isPaid;
  const isAuthorized = booking.status === 'MATCHED' && isPaid;
  const isPending = booking.status === 'PENDING';
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

          {/* Flight timing */}
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>
              Arrivo previsto: <strong className="text-white">{formatFlightTime(booking.pickupTime, { showDate: true })}</strong>
              {' '}·{' '}{formatCountdown(booking.pickupTime)}
            </span>
          </div>

          {/* Group avatars — compagni di viaggio */}
          {rideGroup?.members && rideGroup.members.length > 1 && (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {rideGroup.members.slice(0, 5).map((m, i) => (
                  <div key={m.id}
                    className="w-7 h-7 rounded-full bg-primary-500/20 border-2 border-surface-1 flex items-center justify-center text-[10px] font-bold text-primary-400"
                    title={m.booking.passengerName}>
                    {m.booking.passengerName?.charAt(0)?.toUpperCase() ?? '?'}
                  </div>
                ))}
                {rideGroup.members.length > 5 && (
                  <div className="w-7 h-7 rounded-full bg-surface-3 border-2 border-surface-1 flex items-center justify-center text-[10px] text-ink-muted">
                    +{rideGroup.members.length - 5}
                  </div>
                )}
              </div>
              <span className="text-xs text-ink-muted">
                {rideGroup.members.reduce((s, m) => s + (m.booking?.passengers ?? 1), 0)} passeggeri nel gruppo
              </span>
            </div>
          )}

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
              <p className="text-xs text-ink-muted">
                {isAuthorized ? 'Pagato' : passengers > 1 ? `Totale (${passengers} pax)` : 'Stimato'}
              </p>
              <p className="text-xl font-black text-primary-400">
                €{booking.estimatedPrice?.toFixed(2) ?? '—'}
              </p>
              {!isAuthorized && passengers > 1 && booking.estimatedPrice && (
                <p className="text-xs text-ink-muted mt-0.5">
                  ~€{(booking.estimatedPrice / passengers).toFixed(2)} a persona
                </p>
              )}
            </div>
          </div>

          {/* MATCHED — gruppo pronto, in attesa di pagamento */}
          {isMatched && (
            <div className="bg-success/8 border border-success/25 rounded-xl px-4 py-3">
              <p className="text-xs font-bold text-success mb-1">Gruppo trovato!</p>
              <p className="text-xs text-ink-secondary mb-3">
                Conferma e pre-autorizza il pagamento per assicurarti il posto. Paghi solo al drop-off.
              </p>
              <Link href={`/checkout/${groupId}`}>
                <button className="w-full py-3 bg-primary-500 text-[#0B0B0B] font-bold rounded-xl hover:bg-primary-400 transition-all text-sm">
                  Conferma e paga →
                </button>
              </Link>
            </div>
          )}

          {/* IN_PROGRESS — link tracking live */}
          {booking.status === 'IN_PROGRESS' && (
            <Link href={`/tracking/${booking.id}`}>
              <div className="bg-success/8 border border-success/25 rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 bg-success rounded-full animate-pulse shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-success">In viaggio</p>
                    <p className="text-xs text-ink-muted">Tocca per seguire il percorso live</p>
                  </div>
                </div>
                <Navigation className="w-4 h-4 text-success" />
              </div>
            </Link>
          )}

          {/* MATCHED + AUTHORIZED — pagamento già autorizzato */}
          {isAuthorized && (
            <div className="bg-primary-500/8 border border-primary-500/25 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-7 h-7 bg-primary-500/15 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-primary-400 text-sm">✓</span>
              </div>
              <div>
                <p className="text-xs font-bold text-primary-400">Pagamento autorizzato</p>
                <p className="text-xs text-ink-muted">Verrai addebitato solo al drop-off</p>
              </div>
            </div>
          )}

          {/* NO-SHOW per forza maggiore — visibile quando driver assegnato */}
          {rideGroup?.status === 'ASSIGNED' && (
            <button
              onClick={() => setIsDisputeOpen(true)}
              className="flex items-center gap-2 text-xs text-ink-muted hover:text-warning transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Problema al pickup per cause di forza maggiore?
            </button>
          )}

          {/* MEETING POINT — volo atterrato, driver in arrivo */}
          {meetingLanded && (
            <div className="bg-success/8 border border-success/25 rounded-xl px-4 py-3">
              <p className="text-xs font-bold text-success mb-1">Volo atterrato</p>
              <p className="text-xs text-ink-secondary mb-1">Punto di incontro:</p>
              <p className="text-xs font-semibold text-white mb-2">{rideGroup!.meetingPoint}</p>
              <p className="text-xs text-ink-muted mt-1">
                Premi &quot;Sono qui&quot; nella pagina tracking quando sei all&apos;uscita arrivi
              </p>
            </div>
          )}

          {/* CHAT CON DRIVER — disponibile dal momento ASSIGNED */}
          {chatEnabled && rideGroupId && (
            <button
              onClick={() => setIsChatOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-surface-2 border border-surface-5 rounded-xl text-sm text-ink-secondary hover:text-white hover:border-primary-500/30 transition-all"
            >
              <MessageCircle className="w-4 h-4 text-primary-400" />
              Scrivi al driver
            </button>
          )}

          {/* PENDING — in attesa di compagni */}
          {isPending && (
            <div className="bg-surface-2 border border-surface-5 rounded-xl px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-warning rounded-full animate-pulse shrink-0" />
                  <p className="text-xs font-semibold text-warning">Cerchiamo compagni...</p>
                </div>
                {booking.groupMember?.rideGroup?.currentCapacity && (
                  <span className="text-xs text-ink-muted">
                    {booking.groupMember.rideGroup.currentCapacity} in attesa
                  </span>
                )}
              </div>
              {booking.estimatedPrice && (
                <p className="text-xs text-ink-secondary mb-1">
                  {passengers > 1
                ? <>Totale stimato: <strong className="text-white">~€{booking.estimatedPrice.toFixed(2)}</strong> · ~€{(booking.estimatedPrice / passengers).toFixed(2)} a persona</>
                : <>Stima: <strong className="text-white">~€{booking.estimatedPrice.toFixed(2)}</strong> a persona</>
              }
                  {booking.groupMember?.rideGroup?.currentCapacity && booking.groupMember.rideGroup.currentCapacity < 7 && (
                    <span className="text-success ml-1">· più siete, meno pagate</span>
                  )}
                </p>
              )}
              <p className="text-xs text-ink-muted">
                Nessun pagamento ora. Ricevi email quando il gruppo è pronto.
              </p>
            </div>
          )}

          {/* CONFIRMED — gruppo pieno, in attesa del driver */}
          {isConfirmed && (
            <div className="bg-primary-500/8 border border-primary-500/25 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse shrink-0" />
                <p className="text-xs font-semibold text-primary-400">Gruppo completo · In attesa del driver</p>
              </div>
              <p className="text-xs text-ink-secondary">
                Il van è al completo. Ti avvisiamo non appena un driver accetta la corsa.
              </p>
              {booking.estimatedPrice && (
                <p className="text-xs text-ink-muted mt-1.5">
                  Prezzo stimato: <strong className="text-white">€{booking.estimatedPrice.toFixed(2)}</strong>
                  {passengers > 1 && <> · ~€{(booking.estimatedPrice / passengers).toFixed(2)} a persona</>}
                </p>
              )}
            </div>
          )}

          {/* Group formation progress */}
          {isForming && (
            <div className="bg-surface-2 border border-surface-5 rounded-xl px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-ink-secondary">Gruppo in formazione</p>
                {groupStatus && (
                  <span className="text-xs font-bold text-primary-400">{groupStatus.current}/{groupStatus.max}</span>
                )}
              </div>
              <div className="h-1.5 bg-surface-4 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all duration-700"
                  style={{ width: groupStatus ? `${(groupStatus.current / groupStatus.max) * 100}%` : '20%' }}
                />
              </div>
              <p className="text-xs text-ink-muted mt-1.5">
                {groupStatus
                  ? `${groupStatus.max - groupStatus.current} posti ancora disponibili`
                  : 'Ricerca compagni di viaggio...'}
              </p>
            </div>
          )}

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
          {isCancellable && !isActive && (
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-danger/70 hover:text-danger transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" /> Cancella prenotazione
            </button>
          )}

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
            <div className="pt-1 space-y-3">
              {/* Ringraziamento + mancia */}
              <TipSection bookingId={booking.id} />

              {ratingSubmitted ? (
                <div className="bg-success/8 border border-success/20 rounded-xl px-4 py-3 flex items-center gap-2.5">
                  <Star className="w-4 h-4 text-success fill-success shrink-0" />
                  <span className="text-sm font-semibold text-success">Grazie per la valutazione!</span>
                </div>
              ) : (
                <div className="bg-surface-2 border border-surface-5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4 text-warning fill-warning" />
                    <p className="text-sm font-bold text-white">Com&apos;è andata la corsa?</p>
                  </div>
                  <div className="flex justify-center gap-1.5 mb-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        onMouseEnter={() => setHoverRating(s)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(s)}
                        className="p-1.5 rounded-lg hover:bg-surface-3 transition-all active:scale-90"
                      >
                        <Star className={`w-8 h-8 transition-all duration-150 ${
                          s <= (hoverRating || rating)
                            ? 'fill-warning text-warning scale-110'
                            : 'text-surface-5 hover:text-surface-4'
                        }`} />
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <div className="mt-3 animate-fade-up">
                      <p className="text-xs text-ink-muted text-center mb-2">
                        {['', 'Pessimo', 'Scarso', 'Nella norma', 'Buono', 'Ottimo'][rating]}
                      </p>
                      <textarea
                        value={ratingComment}
                        onChange={(e) => setRatingComment(e.target.value)}
                        placeholder="Commento opzionale per l'autista..."
                        rows={2}
                        className="w-full text-sm bg-surface-3 border border-surface-5 rounded-xl px-3 py-2 text-white placeholder-ink-muted mb-2.5 focus:outline-none focus:border-primary-500 resize-none"
                      />
                      <button
                        onClick={handleSubmitRating}
                        disabled={ratingLoading}
                        className="w-full py-2.5 bg-primary-500 text-[#0B0B0B] font-bold rounded-xl hover:bg-primary-400 transition-all disabled:opacity-40 text-sm">
                        {ratingLoading ? 'Invio...' : 'Invia valutazione'}
                      </button>
                    </div>
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

      {chatEnabled && rideGroupId && (
        <DriverChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)}
          driverName="Driver Flanvo" driverPhone="" groupId={rideGroupId} />
      )}
      {isDisputeOpen && (
        <DisputeModal
          bookingId={booking.id}
          flightNumber={booking.flightNumber}
          onClose={() => setIsDisputeOpen(false)}
        />
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
