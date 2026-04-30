import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Le tratte lunghe dove il carpooling fa la differenza vera — Flanvo Blog',
  description: 'Milano Malpensa-centro: €100 in taxi. Roma Fiumicino-centro: €65. Su queste tratte il carpooling aeroportuale può farti risparmiare €60-80 a viaggio.',
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
          Le tratte lunghe dove il carpooling fa la differenza vera
        </h1>
        <p className="text-xs text-ink-muted mb-10">aprile 2026 · 5 min di lettura</p>

        <div className="space-y-6 text-ink-secondary leading-relaxed text-[15px]">

          <p>
            Non tutte le tratte aeroportuali sono uguali. Su una tratta da 8 km risparmi €15–20 rispetto a un taxi. Su una tratta da 50 km risparmi €70–80. Ed è qui che il carpooling aeroportuale diventa una scelta non solo conveniente, ma quasi obbligata se vuoi gestire i costi di viaggio in modo intelligente.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-3">Perché il risparmio cresce con la distanza</h2>
          <p>
            Il prezzo di un taxi è quasi interamente variabile: più km percorri, più paghi. Su distanze corte il vantaggio del carpooling è reale ma contenuto. Su distanze lunghe, la stessa tariffa-km divisa tra più passeggeri genera risparmi assoluti molto più significativi.
          </p>
          <p>
            Un taxi da Milano Malpensa al centro non costa €30 — costa €90–110. Con quattro passeggeri su Flanvo verso destinazioni simili, ognuno paga €20–28. La differenza è di €65–80 a persona, non €15.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-3">Le tratte dove conviene di più</h2>

          <div className="bg-surface-1 border border-surface-4 rounded-xl overflow-hidden my-6">
            <div className="px-4 py-3 border-b border-surface-4">
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-widest">Confronto per tratta — 4 passeggeri</p>
            </div>
            <table className="w-full text-sm">
              <thead className="border-b border-surface-4">
                <tr>
                  <th className="text-left text-ink-muted font-medium px-4 py-2.5">Tratta</th>
                  <th className="text-right text-ink-muted font-medium px-4 py-2.5">Taxi</th>
                  <th className="text-right text-primary-400 font-bold px-4 py-2.5">Flanvo</th>
                  <th className="text-right text-ink-muted font-medium px-4 py-2.5">Risparmio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-4 text-ink-secondary">
                {[
                  ['Milano MXP → centro (50 km)',     '€100–110', '~€24',  '~€80'],
                  ['Roma FCO → centro (32 km)',       '€55–70',   '~€16',  '~€50'],
                  ['Bergamo BGY → Milano (45 km)',    '€80–95',   '~€22',  '~€65'],
                  ['Barcellona BCN → centro (18 km)', '€35–45',   '~€10',  '~€30'],
                  ['Amsterdam AMS → centro (20 km)',  '€40–55',   '~€12',  '~€35'],
                  ['Francoforte FRA → centro (12 km)','€30–40',   '~€8',   '~€25'],
                  ['Catania CTA → Taormina (55 km)',  '€90–110',  '~€25',  '~€75'],
                  ['Palermo PMO → Agrigento (130 km)','€180–220', '~€55',  '~€145'],
                ].map(([tratta, taxi, flanvo, risparmio]) => (
                  <tr key={tratta}>
                    <td className="px-4 py-3 text-xs">{tratta}</td>
                    <td className="px-4 py-3 text-right">{taxi}</td>
                    <td className="px-4 py-3 text-right font-semibold text-primary-400">{flanvo}</td>
                    <td className="px-4 py-3 text-right font-bold text-white">{risparmio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[11px] text-ink-muted px-4 py-3 border-t border-surface-4">
              Prezzi Flanvo stimati con 4 passeggeri verso destinazioni simili. Il prezzo effettivo dipende dalle destinazioni specifiche del gruppo.
            </p>
          </div>

          <h2 className="text-xl font-bold text-white mt-10 mb-3">Il caso Bergamo: l&apos;aeroporto più lontano dalla città che serve</h2>
          <p>
            L&apos;aeroporto di Bergamo Orio al Serio è il terzo scalo per traffico in Italia, ma serve principalmente passeggeri diretti a Milano — che si trova a 45–50 km di distanza. La tratta in taxi supera spesso gli €80–90. Il Terravision bus è economico ma lento (oltre un&apos;ora), ha orari fissi e non porta direttamente a destinazione.
          </p>
          <p>
            Per chi arriva con bagagli e ha una destinazione specifica a Milano, Flanvo è spesso la scelta più razionale: più rapido del bus, molto meno costoso del taxi.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-3">Le destinazioni fuori città dove il treno non arriva</h2>
          <p>
            Il treno dal Fiumicino porta al centro di Roma — non a Trastevere, non a Parioli, non a EUR. Chi deve raggiungere una destinazione che non è esattamente la stazione Termini si trova comunque a dover prendere un taxi o la metro dall&apos;arrivo del Leonardo Express. Il costo totale (treno + taxi finale) spesso supera quello di un Flanvo diretto.
          </p>
          <p>
            Su destinazioni periferiche, suburbane o turistiche (Castelli Romani, Lago di Como, Costiera Amalfitana), la tratta è così lunga che il risparmio con il carpooling diventa il fattore decisivo.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-3">Palermo–Agrigento: il caso estremo</h2>
          <p>
            La tratta dall&apos;aeroporto di Palermo ad Agrigento supera i 130 km. Un taxi o NCC privato per questa tratta può costare €180–220. Con Flanvo, se si forma un gruppo di 4 persone dirette nella stessa zona, ognuno paga circa €50–60 — con un risparmio di oltre €140 a persona.
          </p>
          <p>
            Per queste tratte, il carpooling aeroportuale non è solo conveniente: è l&apos;unica alternativa al taxi privato che sia economicamente sostenibile.
          </p>

        </div>

        <div className="mt-14 pt-8 border-t border-surface-4">
          <Link href="/flight-search" className="inline-flex items-center gap-2 bg-primary-500 text-[#0B0B0B] px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary-400 transition-all">
            Cerca la tua tratta <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="mt-10 pt-8 border-t border-surface-4">
          <p className="text-xs text-ink-muted mb-4">Leggi anche</p>
          <Link href="/blog/quanto-costa-taxi-aeroporto" className="block text-sm font-semibold text-white hover:text-primary-300 transition-colors mb-3">
            Quanto costa davvero un taxi dall&apos;aeroporto? →
          </Link>
          <Link href="/blog/aeroporti-senza-metro" className="block text-sm font-semibold text-white hover:text-primary-300 transition-colors">
            Aeroporti senza metro: gli scali dove il taxi è quasi obbligatorio →
          </Link>
        </div>
      </div>
    </div>
  );
}
