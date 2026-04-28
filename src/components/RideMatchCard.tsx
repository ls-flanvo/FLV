import { RideMatch } from '@/lib/types';
import { Button } from './ui';
import { Users, Clock, Car, Star, ChevronRight } from 'lucide-react';

interface RideMatchCardProps {
  match: RideMatch;
  onSelect: (match: RideMatch) => void;
  disabled?: boolean;
}

function ScoreDot({ score }: { score: number }) {
  const color =
    score >= 85 ? 'bg-success' : score >= 70 ? 'bg-warning' : 'bg-ink-muted';
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${color} mr-1.5`} />
  );
}

export default function RideMatchCard({ match, onSelect, disabled = false }: RideMatchCardProps) {
  const savings = Math.round(match.pricePerPerson * 2.5 - match.pricePerPerson);
  const departureTime = new Date(match.departureTime).toLocaleTimeString('it-IT', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div
      className={`bg-surface-1 border rounded-2xl overflow-hidden transition-all duration-200 bg-card-gradient
        ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-primary-500/30 cursor-pointer active:scale-[0.99]'}
        ${match.score >= 85 ? 'border-primary-500/20' : 'border-surface-4'}
      `}
      onClick={() => !disabled && onSelect(match)}
    >
      {/* Top: score badge */}
      {match.score >= 85 && (
        <div className="bg-primary-500/10 border-b border-primary-500/15 px-5 py-2.5 flex items-center gap-2">
          <Star className="w-3.5 h-3.5 text-primary-400 fill-primary-400" />
          <span className="text-xs font-semibold text-primary-400">Match ottimale</span>
        </div>
      )}

      <div className="p-5">
        {/* Price — most prominent */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs text-ink-muted mb-0.5">Il tuo prezzo</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white">
                €{match.pricePerPerson.toFixed(0)}
              </span>
              <span className="text-lg text-ink-secondary font-medium">
                .{(match.pricePerPerson % 1).toFixed(2).slice(2)}
              </span>
            </div>
            {savings > 0 && (
              <p className="text-xs text-success mt-1 font-medium">
                Risparmi ~€{savings} vs taxi
              </p>
            )}
          </div>

          {/* Score */}
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 mb-1">
              <ScoreDot score={match.score} />
              <span className="text-sm font-bold text-white">{match.score}%</span>
            </div>
            <p className="text-xs text-ink-muted">compatibilità</p>
          </div>
        </div>

        {/* Info grid — 3 col */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-surface-3 rounded-xl px-3 py-2.5 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Users className="w-3.5 h-3.5 text-ink-muted" />
            </div>
            <p className="text-base font-bold text-white">{match.passengers.length}</p>
            <p className="text-xs text-ink-muted">con te</p>
          </div>
          <div className="bg-surface-3 rounded-xl px-3 py-2.5 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Clock className="w-3.5 h-3.5 text-ink-muted" />
            </div>
            <p className="text-base font-bold text-white">{match.estimatedDuration}'</p>
            <p className="text-xs text-ink-muted">durata</p>
          </div>
          <div className="bg-surface-3 rounded-xl px-3 py-2.5 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Car className="w-3.5 h-3.5 text-ink-muted" />
            </div>
            <p className="text-xs font-bold text-white leading-tight">Van</p>
            <p className="text-xs text-ink-muted">7 posti</p>
          </div>
        </div>

        {/* Passengers avatars */}
        <div className="flex items-center gap-2 mb-5">
          <div className="flex -space-x-2">
            {match.passengers.slice(0, 4).map((p, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500/30 to-primary-600/50 border-2 border-surface-1 flex items-center justify-center text-xs font-bold text-primary-300"
              >
                {p.name.charAt(0)}
              </div>
            ))}
            {match.passengers.length > 4 && (
              <div className="w-8 h-8 rounded-full bg-surface-3 border-2 border-surface-1 flex items-center justify-center text-xs font-bold text-ink-muted">
                +{match.passengers.length - 4}
              </div>
            )}
          </div>
          <div className="text-xs text-ink-muted">
            <span className="text-white font-medium">{match.seats} posto{match.seats !== 1 ? 'i' : ''}</span> disponibile{match.seats !== 1 ? '' : ''}
            {' · '}pickup {departureTime}
          </div>
        </div>

        {/* CTA */}
        <button
          disabled={disabled}
          onClick={(e) => { e.stopPropagation(); onSelect(match); }}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary-500 text-[#0B0B0B] font-bold rounded-xl hover:bg-primary-400 active:scale-[0.98] transition-all shadow-teal disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Prenota questo gruppo
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
