import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Quanto costa davvero un taxi dall\'aeroporto? — Flanvo Blog',
  description: 'Un taxi dall\'aeroporto costa €35–50. Con il carpooling aeroportuale puoi risparmiare fino al 60%. Ecco come.',
};

export default function Post() {
  return (
    <div className="bg-[#0B0B0B] min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink-secondary mb-10 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Blog
        </Link>

        <div className="mb-3">
          <span className="text-[11px] font-semibold text-primary-400 bg-primary-500/10 border border-primary-500/20 rounded-full px-2.5 py-0.5">
            Risparmio
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
          Quanto costa davvero un taxi dall&apos;aeroporto? (e come spendere meno)
        </h1>
        <p className="text-xs text-ink-muted mb-10">aprile 2026 · 4 min di lettura</p>

        <div className="prose-flanvo space-y-6 text-ink-secondary leading-relaxed text-[15px]">

          <p>
            Ogni volta che esci dall&apos;aeroporto e vedi la fila dei taxi, stai per prendere una delle decisioni di trasporto più costose della tua giornata. Non per colpa tua — è semplicemente il sistema che funziona così, e finché non hai un&apos;alternativa concreta, la fila dei taxi è inevitabile.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-3">Quanto costano i taxi aeroportuali in Italia</h2>
          <p>
            Le tariffe variano molto in base alla città, all&apos;orario e alla distanza. Ma ecco un quadro realistico basato sulle tariffe medie 2025–2026:
          </p>

          <div className="bg-surface-1 border border-surface-4 rounded-xl overflow-hidden my-6">
            <table className="w-full text-sm">
              <thead className="border-b border-surface-4">
                <tr>
                  <th className="text-left text-ink-muted font-medium px-4 py-3">Tratta</th>
                  <th className="text-right text-ink-muted font-medium px-4 py-3">Taxi privato</th>
                  <th className="text-right text-primary-400 font-bold px-4 py-3">Flanvo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-4 text-ink-secondary">
                {[
                  ['Catania → centro storico (18 km)', '€35–45', '~€9'],
                  ['Palermo → centro (28 km)', '€40–55', '~€13'],
                  ['Roma FCO → centro (32 km)', '€50–70', '~€16'],
                  ['Milano MXP → centro (50 km)', '€90–110', '~€22'],
                  ['Napoli → centro (7 km)', '€20–30', '~€6'],
                ].map(([tratta, taxi, flanvo]) => (
                  <tr key={tratta}>
                    <td className="px-4 py-3">{tratta}</td>
                    <td className="px-4 py-3 text-right">{taxi}</td>
                    <td className="px-4 py-3 text-right font-semibold text-primary-400">{flanvo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p>
            I prezzi Flanvo si riferiscono a una corsa con 4 passeggeri verso destinazioni simili. Ogni passeggero paga i propri chilometri effettivi — chi scende prima paga meno.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-3">Il costo nascosto che nessuno calcola</h2>
          <p>
            Il prezzo del taxi non è solo quello sul tassametro. Considera: l&apos;attesa in coda (15–30 minuti in un aeroporto affollato), il possibile sovrapezzo per i bagagli, e l&apos;impossibilità di sapere il prezzo finale prima di salire. Con il carpooling aeroportuale il prezzo è bloccato al momento del match — non cambia, non ci sono sorprese.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-3">La matematica del risparmio su base annua</h2>
          <p>
            Se prendi l&apos;aereo 6 volte all&apos;anno (andata e ritorno per 3 viaggi), stai prendendo 6 taxi dall&apos;aeroporto. A €40 di media per tratta, sono <strong className="text-white">€240 all&apos;anno solo in taxi aeroportuali</strong>. Con Flanvo, la stessa mobilità ti costa mediamente €70–90. La differenza è reale, non teorica.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-3">Quando il taxi resta la scelta giusta</h2>
          <p>
            Siamo onesti: il carpooling aeroportuale non è per tutti in ogni situazione. Ha senso quando hai bagagli standard, destinazione raggiungibile via van, e un po&apos; di flessibilità sui tempi di attesa all&apos;uscita bagagli (di solito meno di 20 minuti). Se hai un appuntamento urgente e sei disposto a pagare il premium per la privacy e la velocità, il taxi è ancora la scelta giusta.
          </p>

          <p>
            In tutti gli altri casi — che è la grande maggioranza dei viaggi — la differenza di prezzo non giustifica il taxi.
          </p>
        </div>

        <div className="mt-14 pt-8 border-t border-surface-4">
          <Link
            href="/flight-search"
            className="inline-flex items-center gap-2 bg-primary-500 text-[#0B0B0B] px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary-400 transition-all"
          >
            Cerca la tua corsa <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="mt-10 pt-8 border-t border-surface-4">
          <p className="text-xs text-ink-muted mb-4">Leggi anche</p>
          <Link href="/blog/carpooling-aeroportuale-come-funziona" className="block text-sm font-semibold text-white hover:text-primary-300 transition-colors">
            Carpooling aeroportuale: la guida completa per chi non l&apos;ha mai usato →
          </Link>
        </div>
      </div>
    </div>
  );
}
