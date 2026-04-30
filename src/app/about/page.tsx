import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata = { title: 'Chi siamo — Flanvo' };

const values = [
  {
    title: 'Trasparenza',
    desc: 'Il prezzo che vedi prima di confermare è il prezzo che paghi. Nessun sovrapprezzo, nessuna commissione nascosta. Paghi solo i chilometri che percorri tu.',
  },
  {
    title: 'Affidabilità',
    desc: 'Monitoraggio voli in tempo reale, autisti verificati, pagamenti Stripe. Ogni elemento del servizio è costruito per funzionare anche quando qualcosa va storto.',
  },
  {
    title: 'Semplicità',
    desc: 'Dal codice volo al van prenotato in meno di due minuti. Nessuna registrazione richiesta per vedere i prezzi. Zero attriti nel momento in cui ne hai più bisogno.',
  },
];

export default function AboutPage() {
  return (
    <div className="bg-[#0B0B0B] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink-secondary mb-10 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Home
        </Link>

        {/* Header */}
        <div className="mb-14">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-5 leading-tight">
            Chi siamo
          </h1>
          <p className="text-lg text-ink-secondary leading-relaxed">
            Flanvo nasce da una domanda semplice: perché quattro persone che escono dallo stesso volo, dirette nella stessa zona, prendono quattro taxi diversi?
          </p>
        </div>

        {/* Mission */}
        <div className="bg-surface-1 border border-surface-4 rounded-2xl p-6 md:p-8 mb-10">
          <h2 className="text-xl font-bold text-white mb-4">La nostra missione</h2>
          <p className="text-ink-secondary leading-relaxed mb-4">
            Flanvo è una piattaforma di trasferimento aeroportuale condiviso. Raggruppiamo i passeggeri dello stesso volo verso destinazioni simili, assegnando loro un unico van con un autista professionista verificato.
          </p>
          <p className="text-ink-secondary leading-relaxed">
            Ogni passeggero paga solo i chilometri effettivamente percorsi con lui a bordo — non una divisione fissa del costo totale. Chi scende prima, paga meno. Il prezzo è bloccato al momento del match e non cambia.
          </p>
        </div>

        {/* Values */}
        <div className="mb-14">
          <h2 className="text-xl font-bold text-white mb-6">I nostri valori</h2>
          <div className="space-y-4">
            {values.map(({ title, desc }) => (
              <div key={title} className="bg-surface-1 border border-surface-4 rounded-xl p-5">
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-ink-secondary leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-primary-500/5 border border-primary-500/20 rounded-2xl p-6 mb-14 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-bold text-white mb-1">Vuoi far parte del team?</p>
            <p className="text-sm text-ink-muted">Siamo sempre aperti a persone che vogliono costruire qualcosa di reale.</p>
          </div>
          <a
            href="mailto:hello@flanvo.com"
            className="flex items-center gap-2 bg-primary-500 text-[#0B0B0B] px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-400 transition-all shrink-0"
          >
            Scrivici <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Dati azienda */}
        <div id="dati" className="pt-10 border-t border-surface-4">
          <h2 className="text-xl font-bold text-white mb-6">Dati dell&apos;azienda</h2>
          <div className="space-y-3 text-sm text-ink-secondary">
            <div className="flex gap-3">
              <span className="text-ink-muted w-36 shrink-0">Ragione sociale</span>
              <span>Flanvo S.r.l.</span>
            </div>
            <div className="flex gap-3">
              <span className="text-ink-muted w-36 shrink-0">Sede legale</span>
              <span>Catania, Italia</span>
            </div>
            <div className="flex gap-3">
              <span className="text-ink-muted w-36 shrink-0">Email</span>
              <a href="mailto:hello@flanvo.com" className="text-primary-400 hover:text-primary-300 transition-colors">
                hello@flanvo.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
