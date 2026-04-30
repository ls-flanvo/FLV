import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Aeroporti senza metro: gli scali italiani dove il taxi è quasi obbligatorio — Flanvo Blog',
  description: 'Catania, Palermo, Bari, Cagliari. Aeroporti senza collegamento diretto in metro o treno. Ecco come muoversi senza pagare il taxi pieno.',
};

export default function Post() {
  return (
    <div className="bg-[#0B0B0B] min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink-secondary mb-10 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Blog
        </Link>

        <div className="mb-3">
          <span className="text-[11px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-2.5 py-0.5">
            Come funziona
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
          Aeroporti senza metro: gli scali dove il taxi è quasi obbligatorio (e come evitarlo)
        </h1>
        <p className="text-xs text-ink-muted mb-10">aprile 2026 · 6 min di lettura</p>

        <div className="space-y-6 text-ink-secondary leading-relaxed text-[15px]">

          <p>
            In Italia esistono due tipi di aeroporti: quelli collegati alla rete ferroviaria o metropolitana — Roma Fiumicino con il Leonardo Express, Milano Malpensa con il Malpensa Express, Milano Linate con la metro M4 — e tutti gli altri. Che sono la maggioranza.
          </p>
          <p>
            Per questi scali, la scelta al momento dell&apos;atterraggio è quasi sempre binaria: bus lento con orari fissi, oppure taxi. Il carpooling aeroportuale è la terza opzione che la maggior parte dei viaggiatori non conosce.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-3">Gli scali italiani senza collegamento diretto</h2>

          <div className="space-y-5 my-6">
            {[
              {
                airport: 'Catania Fontanarossa (CTA)',
                transport: 'Solo bus Alibus per il centro, con orari fino alle 23:00 circa. La metropolitana di Catania non raggiunge l\'aeroporto (il prolungamento è in costruzione da anni). Per destinazioni fuori dal percorso dell\'Alibus — province, zone costiere, Taormina, Siracusa — il taxi o il van privato sono le uniche opzioni.',
                km: '6 km dal centro',
                taxi: '€15–25',
              },
              {
                airport: 'Palermo Falcone Borsellino (PMO)',
                transport: 'Bus Prestia & Comande per il centro con frequenza ridotta nelle ore serali. Nessun collegamento ferroviario o metropolitano. Per chi deve raggiungere la provincia (Trapani, Agrigento, Cefalù), l\'unica alternativa al taxi è il bus regionale, con tempi molto più lunghi.',
                km: '35 km dal centro',
                taxi: '€40–55',
              },
              {
                airport: 'Cagliari Elmas (CAG)',
                transport: 'Esiste un collegamento ferroviario con la stazione di Cagliari, ma con frequenza limitata e non copre tutte le fasce orarie. Per destinazioni fuori città come Villasimius, Costa Rei, o le spiagge del sud Sardegna, il taxi è praticamente obbligatorio.',
                km: '8 km dal centro',
                taxi: '€20–30',
              },
              {
                airport: 'Bari Karol Wojtyla (BRI)',
                transport: 'Bus Tempesta per il centro con frequenza ridotta. Nessuna metropolitana. Per destinazioni come Lecce, Taranto, Matera o le masserie del Salento, un taxi dall\'aeroporto può costare €80–150 — cifre da trasferimento privato.',
                km: '9 km dal centro',
                taxi: '€20–30',
              },
              {
                airport: 'Napoli Capodichino (NAP)',
                transport: 'L\'Alibus Napoli copre il percorso principale, ma Napoli è una città dove le destinazioni si distribuiscono in modo complesso. Chi deve raggiungere la Costiera Amalfitana, i Campi Flegrei o le zone collinari si trova comunque a dover prendere un\'altra soluzione dopo il bus.',
                km: '7 km dal centro',
                taxi: '€20–35',
              },
            ].map(({ airport, transport, km, taxi }) => (
              <div key={airport} className="bg-surface-1 border border-surface-4 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3 gap-4">
                  <h3 className="font-bold text-white text-sm">{airport}</h3>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-ink-muted">{km}</p>
                    <p className="text-xs font-semibold text-ink-secondary">Taxi {taxi}</p>
                  </div>
                </div>
                <p className="text-sm text-ink-secondary leading-relaxed">{transport}</p>
              </div>
            ))}
          </div>

          <h2 className="text-xl font-bold text-white mt-10 mb-3">Il problema delle destinazioni periferiche</h2>
          <p>
            Anche quando esiste un bus per il centro città, il problema rimane per chi deve raggiungere destinazioni periferiche, turistiche o in provincia. Il bus arriva in piazza Duomo — non all&apos;agriturismo a 20 km fuori città, non al B&B sul lungomare, non all&apos;indirizzo specifico dell&apos;hotel.
          </p>
          <p>
            Per queste situazioni il taxi è quasi inevitabile, a meno di non avere un&apos;alternativa pre-organizzata. Flanvo risolve questo problema alla radice: un van condiviso che ti porta direttamente a destinazione, con il prezzo bloccato prima di atterrare.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-3">Il confronto con gli aeroporti serviti dal treno</h2>
          <p>
            Il Leonardo Express da Roma Fiumicino costa €14 e impiega 32 minuti. È una soluzione eccellente — se la tua destinazione finale è la stazione Termini o nelle vicinanze. Se devi poi prendere la metro e un taxi, il costo totale sale e i tempi si allungano.
          </p>
          <p>
            Il Malpensa Express da Milano Malpensa è simile: ottimo per chi va in Centrale o Cadorna, meno pratico per chi ha una destinazione specifica. Per tratte da aeroporto a destinazione finale, il van condiviso rimane spesso la soluzione più diretta.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-3">Come funziona il carpooling in questi aeroporti</h2>
          <p>
            Tutti gli aeroporti citati sono attivi su Flanvo. Il punto di incontro è sempre all&apos;uscita Arrivi, dove il driver con il cartello Flanvo ti aspetta dopo il ritiro bagagli. Non devi orientarti tra bus e taxi stand — trovi direttamente il tuo van.
          </p>
          <p>
            Per le destinazioni più lontane, come Taormina da Catania o Agrigento da Palermo, il carpooling è la scelta che cambia davvero il budget del viaggio. Puoi verificare il punto di incontro specifico per ogni aeroporto nella pagina <Link href="/aeroporti" className="text-primary-400 hover:text-primary-300 transition-colors">aeroporti serviti</Link>.
          </p>

        </div>

        <div className="mt-14 pt-8 border-t border-surface-4">
          <Link href="/flight-search" className="inline-flex items-center gap-2 bg-primary-500 text-[#0B0B0B] px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary-400 transition-all">
            Cerca la tua corsa <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="mt-10 pt-8 border-t border-surface-4">
          <p className="text-xs text-ink-muted mb-4">Leggi anche</p>
          <Link href="/blog/tratte-lunghe-risparmio-massimo" className="block text-sm font-semibold text-white hover:text-primary-300 transition-colors mb-3">
            Le tratte lunghe dove il carpooling fa la differenza vera →
          </Link>
          <Link href="/blog/ncc-vs-taxi-differenze" className="block text-sm font-semibold text-white hover:text-primary-300 transition-colors">
            NCC vs taxi: perché un autista verificato fa la differenza →
          </Link>
        </div>
      </div>
    </div>
  );
}
