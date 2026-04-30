import Link from 'next/link';
import { ArrowLeft, Leaf } from 'lucide-react';

export const metadata = { title: 'Sostenibilità — Flanvo' };

const stats = [
  { value: '75%', label: 'auto in meno sulla strada per ogni van Flanvo con 4 passeggeri' },
  { value: '−1.9 kg', label: 'CO₂ risparmiata per passeggero per tratta (vs taxi privato)' },
  { value: '4–7', label: 'persone per van — ogni corsa sostituisce più taxi individuali' },
];

const commitments = [
  {
    title: 'Meno auto, stessa mobilità',
    desc: 'Un van con 4 passeggeri sostituisce fino a 4 taxi individuali. Ogni corsa Flanvo riduce il numero di veicoli in circolazione verso e dall\'aeroporto senza ridurre la mobilità delle persone.',
  },
  {
    title: 'Tratte ottimizzate',
    desc: 'L\'algoritmo di matching raggruppa solo passeggeri con destinazioni vicine, minimizzando i chilometri a vuoto percorsi dal van. Meno deviazioni, meno emissioni.',
  },
  {
    title: 'Nessun incentivo al volume',
    desc: 'Non guadagniamo di più se un autista fa più chilometri — guadagniamo quando i passeggeri arrivano a destinazione soddisfatti. Questo allinea i nostri incentivi alla qualità, non alla quantità.',
  },
  {
    title: 'Verso la flotta elettrica',
    desc: 'Stiamo lavorando per incentivare l\'adozione di veicoli ibridi ed elettrici tra gli autisti Flanvo. Puntiamo ad avere il 30% della flotta a basse emissioni entro 2027.',
  },
];

export default function SostenibilitaPage() {
  return (
    <div className="bg-[#0B0B0B] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink-secondary mb-10 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Home
        </Link>

        {/* Header */}
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 rounded-full px-4 py-1.5 text-xs font-semibold text-primary-400 mb-6">
            <Leaf className="w-3.5 h-3.5" /> Impatto ambientale
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-5 leading-tight">
            Condividere è già<br />un atto sostenibile.
          </h1>
          <p className="text-lg text-ink-secondary leading-relaxed">
            Il problema del trasporto aeroportuale non è solo il costo — è l&apos;inefficienza. Centinaia di taxi individuali, ognuno con un passeggero, tutti diretti nella stessa direzione. Flanvo risolve entrambi i problemi insieme.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-14">
          {stats.map(({ value, label }) => (
            <div key={label} className="bg-surface-1 border border-surface-4 rounded-2xl p-5 text-center">
              <p className="text-3xl font-black text-primary-400 mb-2">{value}</p>
              <p className="text-xs text-ink-muted leading-relaxed">{label}</p>
            </div>
          ))}
        </div>

        {/* The problem */}
        <div className="bg-surface-1 border border-surface-4 rounded-2xl p-6 md:p-8 mb-10">
          <h2 className="text-xl font-bold text-white mb-4">Il problema che risolviamo</h2>
          <p className="text-ink-secondary leading-relaxed mb-4">
            In un aeroporto medio, ogni giorno atterrano centinaia di voli. I passeggeri escono, prendono taxi individuali e si disperdono in città. Spesso tre persone dello stesso volo, dirette nello stesso quartiere, prendono tre macchine separate.
          </p>
          <p className="text-ink-secondary leading-relaxed">
            Un taxi medio percorre 30 km per una tratta aeroportuale emettendo circa 2,5 kg di CO₂. Con Flanvo, quello stesso tragitto viene condiviso tra più persone: la stessa distanza, le stesse emissioni, divise tra 4 o più passeggeri.
          </p>
        </div>

        {/* Commitments */}
        <div className="mb-14">
          <h2 className="text-xl font-bold text-white mb-6">I nostri impegni</h2>
          <div className="space-y-4">
            {commitments.map(({ title, desc }) => (
              <div key={title} className="bg-surface-1 border border-surface-4 rounded-xl p-5">
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-ink-secondary leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-8 border-t border-surface-4 text-sm text-ink-muted">
          Domande o suggerimenti sul nostro impatto ambientale?{' '}
          <a href="mailto:hello@flanvo.com" className="text-primary-400 hover:text-primary-300 transition-colors">
            hello@flanvo.com
          </a>
        </div>
      </div>
    </div>
  );
}
