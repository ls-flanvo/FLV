import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Carpooling aeroportuale: la guida completa — Flanvo Blog',
  description: 'Come funziona il carpooling aeroportuale, come viene calcolato il prezzo e cosa succede se il volo è in ritardo.',
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
          Carpooling aeroportuale: la guida completa per chi non l&apos;ha mai usato
        </h1>
        <p className="text-xs text-ink-muted mb-10">aprile 2026 · 6 min di lettura</p>

        <div className="space-y-6 text-ink-secondary leading-relaxed text-[15px]">

          <p>
            Quando senti &quot;carpooling aeroportuale&quot; probabilmente pensi a dividere il costo di un taxi con degli sconosciuti. L&apos;idea non è entusiasmante. In realtà il modello di Flanvo funziona in modo molto diverso — e la differenza principale riguarda come viene calcolato il tuo prezzo.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-3">Non è una divisione alla cieca</h2>
          <p>
            Il malinteso più comune sul carpooling aeroportuale è questo: si pensa che il costo totale del van venga diviso in parti uguali tra i passeggeri. Non è così — almeno non su Flanvo.
          </p>
          <p>
            Ogni passeggero paga i chilometri effettivamente percorsi mentre è a bordo. Se esci per primo dopo 18 km, paghi 18 km. Chi resta fino a 30 km paga 30 km. Il driver fa una rotta ottimizzata che passa per tutte le destinazioni del gruppo, e ognuno viene addebitato per la propria tratta.
          </p>

          <div className="bg-surface-1 border border-surface-4 rounded-xl p-5 my-6">
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-widest mb-3">Esempio pratico</p>
            <p className="text-sm text-ink-secondary leading-relaxed">
              Tre persone sullo stesso volo. A scende al centro (18 km), B va a Librino (22 km), C va a Misterbianco (28 km). Il van passa per tutti e tre. A paga ~€9, B ~€11, C ~€14. Se fossero andati in taxi separati: €35–45 ciascuno.
            </p>
          </div>

          <h2 className="text-xl font-bold text-white mt-10 mb-3">Come funziona il matching</h2>
          <p>
            Prima di atterrare inserisci il tuo codice volo e la destinazione. L&apos;algoritmo di Flanvo cerca altri passeggeri del tuo stesso volo con destinazioni nella stessa zona geografica. Quando il gruppo si forma (minimo 2, massimo 7 persone), ricevi la conferma con il prezzo bloccato.
          </p>
          <p>
            Il prezzo viene calcolato in quel momento e non cambia. Non ci sono variazioni in base al traffico, all&apos;orario o a quante persone ci sono in coda per i taxi. Quello che vedi è quello che paghi.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-3">Il pagamento: quando e come avviene</h2>
          <p>
            Registrare la richiesta è gratuito — non inserisci nessun dato di pagamento finché il gruppo non si chiude. Quando il gruppo raggiunge la capacità massima o mancano 3 ore al volo, ricevi una notifica con il prezzo definitivo e hai 30 minuti per confermare e pagare tramite Stripe. Solo dopo il driver viene notificato. Se non confermi entro il termine il posto viene liberato senza nessun addebito. Se nessun driver è disponibile entro 1 ora dal volo, rimborso automatico completo.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-3">Cosa succede se il volo è in ritardo?</h2>
          <p>
            È la domanda che fanno tutti, ed è legittima. Flanvo monitora il tuo volo in tempo reale tramite API aeree. Quando viene rilevato un ritardo, il driver viene avvisato automaticamente — non devi fare nulla, non devi chiamare nessuno, non rischi di perdere il van.
          </p>
          <p>
            Se il ritardo è superiore a 2 ore e il gruppo non riesce più a formarsi, ricevi un rimborso completo. In caso di cancellazione del volo da parte del vettore, il rimborso è sempre integrale.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-3">Come trovo il driver in aeroporto?</h2>
          <p>
            Ricevi una notifica all&apos;atterraggio. Ritira i bagagli e premi &quot;Sono qui&quot; dall&apos;app quando sei all&apos;uscita arrivi — ogni passeggero del gruppo fa lo stesso indipendentemente. Quando il gruppo raggiunge il numero minimo di presenti, il driver riceve la conferma e si avvicina dal parcheggio NCC in 5-10 minuti. Non devi aspettare all&apos;uscita: sei tu a chiamarlo quando sei pronto.
          </p>
          <p>
            Il punto di incontro esatto per ogni aeroporto è disponibile nella pagina <Link href="/aeroporti" className="text-primary-400 hover:text-primary-300 transition-colors">aeroporti serviti</Link>.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-3">Chi sono gli altri passeggeri?</h2>
          <p>
            Solo persone che erano sullo stesso volo. Non c&apos;è matching con passeggeri casuali — il gruppo è composto esclusivamente da chi ha condiviso il tuo volo, con destinazioni nella stessa zona. Tutti hanno un account verificato su Flanvo e sono stati pre-approvati dalla piattaforma.
          </p>

        </div>

        <div className="mt-14 pt-8 border-t border-surface-4">
          <Link
            href="/flight-search"
            className="inline-flex items-center gap-2 bg-primary-500 text-[#0B0B0B] px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary-400 transition-all"
          >
            Prova Flanvo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="mt-10 pt-8 border-t border-surface-4">
          <p className="text-xs text-ink-muted mb-4">Leggi anche</p>
          <Link href="/blog/volo-in-ritardo-cosa-fare" className="block text-sm font-semibold text-white hover:text-primary-300 transition-colors">
            Volo in ritardo: cosa succede al tuo trasferimento aeroportuale? →
          </Link>
        </div>
      </div>
    </div>
  );
}
