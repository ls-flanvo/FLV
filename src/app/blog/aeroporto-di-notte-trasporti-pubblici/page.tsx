import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Aeroporto di notte: quando i trasporti pubblici non ci sono — Flanvo Blog',
  description: 'Volo che atterra a mezzanotte. Bus già finito. Taxi senza prezzo fisso. Ecco cosa succede nei principali aeroporti italiani fuori orario.',
};

export default function Post() {
  return (
    <div className="bg-[#0B0B0B] min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink-secondary mb-10 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Blog
        </Link>

        <div className="mb-3">
          <span className="text-[11px] font-semibold text-warning bg-warning/10 border border-warning/20 rounded-full px-2.5 py-0.5">
            Consigli
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
          Aeroporto di notte: quando i trasporti pubblici non esistono
        </h1>
        <p className="text-xs text-ink-muted mb-10">aprile 2026 · 5 min di lettura</p>

        <div className="space-y-6 text-ink-secondary leading-relaxed text-[15px]">

          <p>
            Le compagnie low cost hanno un segreto che non ti dicono quando compri il biglietto: i voli più economici partono e atterrano quando nessun altro vuole viaggiare. Le 06:10 di mattina. Le 23:40 di sera. Le 00:55 di notte. Orari in cui il trasporto pubblico non esiste, i taxi applicano tariffe notturne, e tu sei l&apos;unico cliente disponibile.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-3">Il problema degli orari non convenzionali</h2>
          <p>
            Ryanair, Wizz Air e EasyJet programmano sistematicamente voli nelle fasce orarie meno richieste per ottenere slot aeroportuali a costi inferiori. Il risparmio sul biglietto è reale — ma spesso viene eroso dal costo del trasferimento aeroportuale, che in quegli orari è molto più alto.
          </p>
          <p>
            Un taxi da Catania Fontanarossa alle 23:30 applica la maggiorazione notturna: il prezzo può aumentare del 20–30% rispetto alla tariffa diurna. A Milano Malpensa, dove già la tratta è cara, trovare un taxi alle 01:00 significa spesso aspettare e pagare di più.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-3">Cosa succede negli aeroporti italiani fuori orario</h2>

          <div className="space-y-4">
            {[
              {
                airport: 'Catania Fontanarossa (CTA)',
                situation: "L'Alibus (il bus diretto per il centro) smette di circolare intorno alle 23:00. Dopo quell'ora, le opzioni sono taxi — con maggiorazione notturna — o aspettare l'alba. Non esiste collegamento ferroviario.",
              },
              {
                airport: 'Palermo Falcone Borsellino (PMO)',
                situation: "Il bus Prestia & Comande effettua l'ultima corsa verso mezzanotte. I voli che atterrano dopo quell'orario trovano solo taxi disponibili nel piazzale, con prezzi non fissi e negoziabili.",
              },
              {
                airport: 'Bari Karol Wojtyla (BRI)',
                situation: "Il bus Tempesta per il centro ha una copertura limitata nelle ore serali. Dopo le 22:00, il taxi diventa l'unica alternativa pratica, con prezzi che variano molto.",
              },
              {
                airport: 'Cagliari Elmas (CAG)',
                situation: "Il ARST (autobus regionale) ha orari molto ridotti nelle fasce serali. La tratta per il centro è di circa 8 km, ma senza bus disponibili, il taxi rimane l'unica scelta.",
              },
              {
                airport: 'Napoli Capodichino (NAP)',
                situation: "L'Alibus Napoli funziona fino a tarda sera, ma gli orari sono discontinui. Per destinazioni fuori dal percorso principale, il taxi è quasi sempre necessario — con il traffico napoletano che può influenzare notevolmente i prezzi.",
              },
            ].map(({ airport, situation }) => (
              <div key={airport} className="bg-surface-1 border border-surface-4 rounded-xl p-5">
                <h3 className="font-bold text-white mb-2 text-sm">{airport}</h3>
                <p className="text-sm text-ink-secondary leading-relaxed">{situation}</p>
              </div>
            ))}
          </div>

          <h2 className="text-xl font-bold text-white mt-10 mb-3">La matematica delle maggiorazioni notturne</h2>
          <p>
            In Italia, le tariffe taxi hanno una maggiorazione notturna che scatta generalmente dalle 22:00 alle 06:00 (in alcuni comuni dalle 21:00). La maggiorazione varia tra il 10% e il 30% a seconda del comune. Su una tratta da €40 di giorno, di notte puoi pagare €48–52.
          </p>
          <p>
            Con il carpooling aeroportuale il prezzo è sempre lo stesso, indipendentemente dall&apos;orario. Non esistono maggiorazioni notturne, festive o di picco. Il prezzo che vedi è il prezzo che paghi.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-3">La soluzione: prenotare prima di atterrare</h2>
          <p>
            Con Flanvo puoi prenotare il trasferimento prima ancora di salire sull&apos;aereo — anche giorni prima. Il van sarà lì ad aspettarti quando esci dal ritiro bagagli, all&apos;orario effettivo di atterraggio (monitorato in tempo reale), senza maggiorazioni e con il prezzo già bloccato.
          </p>
          <p>
            Per i voli notturni, il vantaggio non è solo economico. Uscire da un aeroporto alle 01:00 con un trasferimento già organizzato e un driver verificato ad aspettarti è molto diverso dal cercare un taxi nel piazzale nel buio.
          </p>

        </div>

        <div className="mt-14 pt-8 border-t border-surface-4">
          <Link href="/flight-search" className="inline-flex items-center gap-2 bg-primary-500 text-[#0B0B0B] px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary-400 transition-all">
            Prenota il tuo trasferimento notturno <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="mt-10 pt-8 border-t border-surface-4">
          <p className="text-xs text-ink-muted mb-4">Leggi anche</p>
          <Link href="/blog/aeroporti-senza-metro" className="block text-sm font-semibold text-white hover:text-primary-300 transition-colors mb-3">
            Aeroporti senza metro: gli scali dove il taxi è quasi obbligatorio →
          </Link>
          <Link href="/blog/ncc-vs-taxi-differenze" className="block text-sm font-semibold text-white hover:text-primary-300 transition-colors">
            NCC vs taxi: perché un autista verificato fa la differenza →
          </Link>
        </div>
      </div>
    </div>
  );
}
