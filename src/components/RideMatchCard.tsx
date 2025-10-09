import { RideMatch } from '@/lib/types';
import { Card, Badge, Button } from './ui';
import { Users, DollarSign, Clock, TrendingUp, Car } from 'lucide-react';

interface RideMatchCardProps {
  match: RideMatch;
  onSelect: (match: RideMatch) => void;
}

export default function RideMatchCard({ match, onSelect }: RideMatchCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    return 'text-yellow-600';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" padding="md">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-primary-100 p-3 rounded-full">
            <Car className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-900">{match.vehicleType}</h3>
            <p className="text-sm text-gray-500">{match.seats} posti disponibili</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${getScoreColor(match.score)}`}>
            {match.score}%
          </div>
          <p className="text-xs text-gray-500">Match</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <DollarSign className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-sm text-gray-500">Prezzo per te</p>
            <p className="font-bold text-lg text-gray-900">€{match.pricePerPerson}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-sm text-gray-500">Durata stimata</p>
            <p className="font-semibold text-gray-900">{match.estimatedDuration} min</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-sm text-gray-500">Passeggeri</p>
            <p className="font-semibold text-gray-900">{match.passengers.length} persone</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-sm text-gray-500">Deviazione max</p>
            <p className="font-semibold text-gray-900">{match.maxDeviation} min</p>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500">Compagni di viaggio:</p>
        </div>
        <div className="flex items-center space-x-2 mb-4">
          {match.passengers.slice(0, 3).map((passenger, index) => (
            <div
              key={index}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm"
            >
              {passenger.name.charAt(0)}
            </div>
          ))}
          {match.passengers.length > 3 && (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-sm">
              +{match.passengers.length - 3}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Partenza: {new Date(match.departureTime).toLocaleTimeString('it-IT', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>

        <Button onClick={() => onSelect(match)} className="w-full">
          Seleziona questa corsa
        </Button>
      </div>
    </Card>
  );
}