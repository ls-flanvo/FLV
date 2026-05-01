import Link from 'next/link';
import { ArrowLeft, ArrowRight, MapPin, CheckCircle } from 'lucide-react';

export const metadata = { title: 'Aeroporti serviti — Flanvo' };

const italiani = [
  { code: 'CTA', name: 'Catania Fontanarossa',        city: 'Catania',   meeting: 'Uscita Arrivi — corsello esterno, area raccolta NCC' },
  { code: 'PMO', name: 'Palermo Falcone Borsellino',  city: 'Palermo',   meeting: 'Uscita Arrivi — marciapiede esterno, area NCC' },
  { code: 'CAG', name: 'Cagliari Elmas',              city: 'Cagliari',  meeting: 'Uscita Arrivi — piazzale esterno, zona NCC' },
  { code: 'FCO', name: 'Roma Fiumicino',              city: 'Roma',      meeting: 'Terminal 1 — Uscita Arrivi B, marciapiede raccolta NCC' },
  { code: 'CIA', name: 'Roma Ciampino',               city: 'Roma',      meeting: 'Parcheggio Accosto P3 — Piazzale Leonardo da Vinci' },
  { code: 'MXP', name: 'Milano Malpensa',             city: 'Milano',    meeting: 'Terminal 1 — Arrivi uscita D, zona raccolta NCC (piano 0)' },
  { code: 'BGY', name: 'Milano Bergamo Orio al Serio',city: 'Bergamo',   meeting: 'Uscita Arrivi — area NCC esterna, oltre le colonnine' },
  { code: 'NAP', name: 'Napoli Capodichino',          city: 'Napoli',    meeting: 'Uscita Arrivi — lato destro verso parcheggio, area NCC' },
  { code: 'BRI', name: 'Bari Karol Wojtyla',          city: 'Bari',      meeting: 'Uscita Arrivi — corsello esterno, parcheggio P1 zona NCC' },
];

const europei = [
  { code: 'LHR', name: 'London Heathrow',          city: 'Londra',     meeting: 'Terminal Arrivals — vehicle forecourt, PHV pickup bay' },
  { code: 'LGW', name: 'London Gatwick',           city: 'Londra',     meeting: 'South Terminal — Arrivals forecourt, PHV pickup zone' },
  { code: 'CDG', name: 'Parigi Charles de Gaulle', city: 'Parigi',     meeting: 'Terminal 2E — Zone VTC, sortie L (niveau arrivées)' },
  { code: 'AMS', name: 'Amsterdam Schiphol',       city: 'Amsterdam',  meeting: 'Arrivals Hall — transfer forecourt, private hire zone' },
  { code: 'FRA', name: 'Francoforte',              city: 'Francoforte',meeting: 'Terminal 1 — Ankunft B, Mietwagen-Abholzone (Ebene 0)' },
  { code: 'BCN', name: 'Barcellona El Prat',       city: 'Barcellona', meeting: 'Terminal 1 — Llegadas, zona VTC exterior' },
  { code: 'MAD', name: 'Madrid Barajas',           city: 'Madrid',     meeting: 'Terminal 4 — Llegadas, área VTC exterior (salida T4S)' },
];

function AirportCard({ code, name, city, meeting }: { code: string; name: string; city: string; meeting: string }) {
  return (
    <div className="bg-surface-1 border border-surface-4 rounded-2xl p-5 hover:border-surface-5 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-xs font-mono font-bold text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-md">{code}</span>
          <h3 className="font-bold text-white mt-2 text-sm leading-snug">{name}</h3>
          <p className="text-xs text-ink-muted mt-0.5">{city}</p>
        </div>
        <span className="flex items-center gap-1 text-[10px] font-semibold text-primary-400 bg-primary-500/10 border border-primary-500/20 rounded-full px-2 py-0.5 shrink-0 ml-2">
          <CheckCircle className="w-3 h-3" /> Attivo
        </span>
      </div>
      <div className="flex items-start gap-2 mt-3 pt-3 border-t border-surface-4">
        <MapPin className="w-3.5 h-3.5 text-ink-muted shrink-0 mt-0.5" />
        <p className="text-[11px] text-ink-muted leading-relaxed">{meeting}</p>
      </div>
    </div>
  );
}

export default function AeroportiPage() {
  return (
    <div className="bg-[#0B0B0B] min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink-secondary mb-10 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Home
        </Link>

        {/* Header */}
        <div className="mb-14 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-5 leading-tight">
            Aeroporti serviti
          </h1>
          <p className="text-lg text-ink-secondary leading-relaxed">
            Flanvo è attivo in {italiani.length + europei.length} aeroporti tra Italia ed Europa. Quando atterri premi &quot;Sono qui&quot; dall&apos;app — il driver NCC raggiunge il punto di incontro in 5-10 minuti.
          </p>
        </div>

        {/* Italia */}
        <div className="mb-12">
          <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-widest mb-5">
            Italia — {italiani.length} aeroporti
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {italiani.map((a) => <AirportCard key={a.code} {...a} />)}
          </div>
        </div>

        {/* Europa */}
        <div className="mb-14">
          <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-widest mb-5">
            Europa — {europei.length} aeroporti
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {europei.map((a) => <AirportCard key={a.code} {...a} />)}
          </div>
        </div>

        {/* CTA espansione */}
        <div className="bg-surface-1 border border-surface-4 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-bold text-white mb-1">Il tuo aeroporto non è in lista?</p>
            <p className="text-sm text-ink-muted">Stiamo espandendo continuamente. Scrivici e lo aggiungiamo alla roadmap.</p>
          </div>
          <a
            href="mailto:hello@flanvo.com?subject=Richiesta aeroporto"
            className="flex items-center gap-2 bg-primary-500 text-[#0B0B0B] px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-400 transition-all shrink-0"
          >
            Segnalaci <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
