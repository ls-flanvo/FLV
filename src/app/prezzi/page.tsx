import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle, XCircle } from 'lucide-react';

export const metadata = { title: 'Prezzi — Flanvo' };

const comparison = [
  { feature: 'Prezzo calcolato sui tuoi km effettivi',    flanvo: true,  taxi: false },
  { feature: 'Prezzo bloccato prima di salire',           flanvo: true,  taxi: false },
  { feature: 'Nessun sovrapprezzo notturno o festivo',    flanvo: true,  taxi: false },
  { feature: 'Rimborso automatico se il gruppo non si forma', flanvo: true, taxi: false },
  { feature: 'Driver professionista verificato',          flanvo: true,  taxi: true  },
  { feature: 'Monitoraggio volo in tempo reale',          flanvo: true,  taxi: false },
  { feature: 'Prezzo noto prima di confermare',           flanvo: true,  taxi: false },
];

const cancellation = [
  { when: 'Prima che il driver accetti',                          refund: 'Rimborso completo',       color: 'text-primary-400' },
  { when: 'Dopo che il driver accetta',                           refund: 'Nessun rimborso',         color: 'text-red-400' },
  { when: 'Forza maggiore al pickup (disputa entro 24h)',         refund: 'Valutato caso per caso',  color: 'text-warning' },
  { when: 'Volo cancellato dal vettore',                          refund: 'Rimborso completo',       color: 'text-primary-400' },
];

export default function PrezziPage() {
  return (
    <div className="bg-[#0B0B0B] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink-secondary mb-10 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Home
        </Link>

        {/* Header */}
        <div className="mb-14">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-5 leading-tight">
            Come funziona il prezzo
          </h1>
          <p className="text-lg text-ink-secondary leading-relaxed">
            Nessuna tariffa fissa, nessuna divisione alla cieca. Paghi esattamente i chilometri percorsi con te a bordo — niente di più.
          </p>
        </div>

        {/* Formula */}
        <div className="bg-surface-1 border border-surface-4 rounded-2xl p-6 md:p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-5">La formula</h2>
          <div className="space-y-4 text-sm text-ink-secondary leading-relaxed">
            <p>
              Il van percorre la rotta ottimale passando per tutte le destinazioni del gruppo. Ogni passeggero paga proporzionalmente ai <strong className="text-white">chilometri effettivamente percorsi mentre è a bordo</strong>.
            </p>
            <p>
              Chi scende prima paga meno. Chi ha la destinazione più lontana paga di più. Non esiste una divisione fissa del costo totale.
            </p>
          </div>

          {/* Example */}
          <div className="mt-6 bg-[#0B0B0B] border border-surface-4 rounded-xl p-5">
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-widest mb-4">Esempio — Catania aeroporto</p>
            <div className="space-y-3">
              {[
                { pax: 'Passeggero A', dest: 'Centro storico', km: '18 km', price: '~€9', highlight: false },
                { pax: 'Passeggero B', dest: 'Librino',        km: '22 km', price: '~€11', highlight: false },
                { pax: 'Passeggero C', dest: 'Misterbianco',   km: '28 km', price: '~€14', highlight: false },
              ].map(({ pax, dest, km, price }) => (
                <div key={pax} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-white font-medium">{pax}</span>
                    <span className="text-ink-muted ml-2">→ {dest}</span>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="text-ink-muted text-xs">{km}</span>
                    <span className="font-bold text-primary-400 w-12">{price}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-ink-muted mt-4 pt-3 border-t border-surface-4">
              Un taxi privato per la stessa tratta: €35–50 a persona. Con Flanvo il risparmio medio è del 40–60%.
            </p>
          </div>
        </div>

        {/* Cosa include */}
        <div className="bg-surface-1 border border-surface-4 rounded-2xl p-6 md:p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-5">Cosa include il prezzo</h2>
          <ul className="space-y-3">
            {[
              'Autista professionale verificato con CQC',
              'Van fino a 7 posti con bagagli',
              'Monitoraggio del tuo volo in tempo reale',
              'Chat diretta con il driver',
              'Copertura in caso di ritardo volo',
              'Pagamento sicuro via Stripe — addebito solo al drop-off',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-ink-secondary">
                <CheckCircle className="w-4 h-4 text-primary-400 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Confronto */}
        <div className="bg-surface-1 border border-surface-4 rounded-2xl p-6 md:p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-5">Flanvo vs taxi privato</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-4">
                  <th className="text-left text-ink-muted font-medium pb-3 w-full"></th>
                  <th className="text-center text-primary-400 font-bold pb-3 px-4 whitespace-nowrap">Flanvo</th>
                  <th className="text-center text-ink-muted font-medium pb-3 px-4 whitespace-nowrap">Taxi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-4">
                {comparison.map(({ feature, flanvo, taxi }) => (
                  <tr key={feature}>
                    <td className="py-3 text-ink-secondary pr-4">{feature}</td>
                    <td className="py-3 text-center px-4">
                      {flanvo
                        ? <CheckCircle className="w-4 h-4 text-primary-400 mx-auto" />
                        : <XCircle className="w-4 h-4 text-red-400 mx-auto" />}
                    </td>
                    <td className="py-3 text-center px-4">
                      {taxi
                        ? <CheckCircle className="w-4 h-4 text-primary-400 mx-auto" />
                        : <XCircle className="w-4 h-4 text-surface-5 mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cancellazione */}
        <div className="bg-surface-1 border border-surface-4 rounded-2xl p-6 md:p-8 mb-14">
          <h2 className="text-xl font-bold text-white mb-5">Politica di cancellazione</h2>
          <p className="text-sm text-ink-secondary mb-5 leading-relaxed">
            La pre-autorizzazione viene effettuata al momento della conferma. I fondi vengono addebitati solo al drop-off. Puoi cancellare con rimborso completo in qualsiasi momento — finché il driver non ha accettato la corsa. Dopo l&apos;accettazione, la cancellazione non è consentita: il driver ha già rinunciato ad altri impegni.
            In caso di <strong className="text-white">forza maggiore al pickup</strong> (bagagli smarriti, emergenza medica, ritardo involontario) puoi aprire una disputa entro 24 ore — il team Flanvo valuterà e deciderà sul rimborso. Volo cancellato dalla compagnia aerea: rimborso completo sempre.
          </p>
          <div className="space-y-3">
            {cancellation.map(({ when, refund, color }) => (
              <div key={when} className="flex items-center justify-between text-sm border-b border-surface-4 pb-3 last:border-0 last:pb-0">
                <span className="text-ink-secondary">{when}</span>
                <span className={`font-semibold ${color}`}>{refund}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/flight-search"
            className="inline-flex items-center gap-2 bg-primary-500 text-[#0B0B0B] px-8 py-4 rounded-2xl font-bold hover:bg-primary-400 transition-all shadow-teal"
          >
            Cerca la tua corsa <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-ink-muted mt-4">Nessuna registrazione per vedere i prezzi</p>
        </div>
      </div>
    </div>
  );
}
