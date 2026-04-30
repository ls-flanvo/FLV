import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'NCC vs taxi: perché un autista verificato fa la differenza — Flanvo Blog',
  description: 'La differenza tra un taxi e un NCC non è solo il prezzo. È la certificazione, la prevedibilità e la sicurezza. Ecco cosa cambia concretamente.',
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
          NCC vs taxi: perché un autista verificato fa la differenza
        </h1>
        <p className="text-xs text-ink-muted mb-10">aprile 2026 · 6 min di lettura</p>

        <div className="space-y-6 text-ink-secondary leading-relaxed text-[15px]">

          <p>
            Quando esci da un aeroporto, la fila dei taxi ti sembra la scelta ovvia. Ma quanti di questi taxi hanno un autista certificato per il trasporto professionale di persone? Quanti hanno un veicolo revisionato regolarmente? Quanti ti dicono il prezzo prima di salire?
          </p>
          <p>
            La differenza tra un taxi e un NCC (Noleggio Con Conducente) non è una questione di etichetta — è una questione di standard, di formazione e di prevedibilità del servizio. E su Flanvo, tutti gli autisti sono NCC verificati.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-3">Cosa significa NCC in Italia</h2>
          <p>
            Il Noleggio Con Conducente è una categoria specifica di trasporto professionale regolamentata dalla legge italiana (L. 21/1992). Per operare come NCC, un autista deve:
          </p>
          <ul className="space-y-2 ml-4">
            {[
              'Ottenere la licenza NCC rilasciata dal comune',
              'Essere in possesso della Carta di Qualificazione del Conducente (CQC) per il trasporto di persone',
              'Avere un\'assicurazione RC professionale specifica per il trasporto di terzi',
              'Mantenere il veicolo in regola con revisioni periodiche',
              'Operare con prenotazione preventiva — non effettua servizio di piazza',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm">
                <span className="text-primary-400 mt-1 shrink-0">—</span>
                {item}
              </li>
            ))}
          </ul>

          <h2 className="text-xl font-bold text-white mt-10 mb-3">Cos&apos;è la CQC e perché conta</h2>
          <p>
            La Carta di Qualificazione del Conducente è una certificazione obbligatoria per chi esercita il trasporto professionale di persone. Richiede una formazione specifica sulla guida sicura, sulla gestione delle emergenze, sulla normativa del trasporto e sul comportamento professionale con i passeggeri.
          </p>
          <p>
            Non tutti i tassisti hanno la CQC. Non tutti i conducenti che vedete fuori dagli aeroporti hanno la CQC. Un autista NCC verificato da Flanvo ce l&apos;ha sempre — è uno dei requisiti per essere approvato sulla piattaforma.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-3">Il confronto concreto</h2>

          <div className="bg-surface-1 border border-surface-4 rounded-xl overflow-hidden my-6">
            <table className="w-full text-sm">
              <thead className="border-b border-surface-4">
                <tr>
                  <th className="text-left text-ink-muted font-medium px-4 py-3"></th>
                  <th className="text-center text-primary-400 font-bold px-4 py-3">NCC Flanvo</th>
                  <th className="text-center text-ink-muted font-medium px-4 py-3">Taxi da piazza</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-4 text-ink-secondary">
                {[
                  ['Licenza NCC', 'Sì, verificata', 'Non sempre'],
                  ['CQC obbligatoria', 'Sì, controllata', 'Non sempre'],
                  ['Assicurazione professionale', 'Sì, verificata', 'Sì (obbligatoria)'],
                  ['Prezzo noto prima di salire', 'Sì — price lock', 'No — tassametro'],
                  ['Prenotazione in anticipo', 'Sì', 'Generalmente no'],
                  ['Veicolo controllato da Flanvo', 'Sì', 'No'],
                  ['Rating e recensioni', 'Sì — visibili', 'Raramente'],
                  ['Maggiorazione notturna', 'No', 'Sì (+10–30%)'],
                ].map(([feature, ncc, taxi]) => (
                  <tr key={feature}>
                    <td className="px-4 py-3">{feature}</td>
                    <td className="px-4 py-3 text-center font-medium text-primary-400">{ncc}</td>
                    <td className="px-4 py-3 text-center">{taxi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-xl font-bold text-white mt-10 mb-3">Il problema degli abusivi fuori dagli aeroporti</h2>
          <p>
            Negli aeroporti italiani più frequentati — Catania, Palermo, Napoli, Roma — è documentata la presenza di conducenti non autorizzati che si propongono ai passeggeri all&apos;uscita del terminal. Questi conducenti non hanno licenza NCC, non hanno CQC, e spesso il prezzo viene concordato verbalmente senza ricevuta.
          </p>
          <p>
            Salire su un veicolo non autorizzato fuori dall&apos;aeroporto è un rischio concreto: nessuna copertura assicurativa adeguata, nessun tracciamento del percorso, nessuna tutela in caso di problemi. Il fatto che sembri conveniente non compensa l&apos;assenza di garanzie.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-3">Perché il prezzo fisso cambia il rapporto di fiducia</h2>
          <p>
            Con un taxi a tassametro, non sai quanto pagherai finché non arrivi. Con traffico, percorso allungato o maggiorazioni orarie, il prezzo finale può essere molto diverso dalle aspettative. Questo crea un rapporto asimmetrico: l&apos;autista ha incentivi a fare percorsi più lunghi, tu non hai strumenti per verificarlo.
          </p>
          <p>
            Con un NCC Flanvo, il prezzo è bloccato prima di salire. L&apos;autista non ha nessun incentivo a fare percorsi alternativi — viene pagato per la tratta concordata, non per i km aggiuntivi. Questo allineamento di incentivi cambia strutturalmente la qualità del servizio.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-3">Il sistema di rating come controllo continuo</h2>
          <p>
            Dopo ogni corsa, i passeggeri valutano il driver. Le valutazioni sono cumulative e visibili. Un driver con rating basso viene sospeso dalla piattaforma e sottoposto a verifica. Questo crea un ciclo di accountability che il taxi di piazza non ha: non puoi lasciare una recensione al tassista che ti ha portato fuori strada alle 02:00.
          </p>

        </div>

        <div className="mt-14 pt-8 border-t border-surface-4">
          <Link href="/flight-search" className="inline-flex items-center gap-2 bg-primary-500 text-[#0B0B0B] px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary-400 transition-all">
            Prenota con un driver verificato <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="mt-10 pt-8 border-t border-surface-4">
          <p className="text-xs text-ink-muted mb-4">Leggi anche</p>
          <Link href="/blog/aeroporto-di-notte-trasporti-pubblici" className="block text-sm font-semibold text-white hover:text-primary-300 transition-colors mb-3">
            Aeroporto di notte: quando i trasporti pubblici non esistono →
          </Link>
          <Link href="/blog/carpooling-aeroportuale-come-funziona" className="block text-sm font-semibold text-white hover:text-primary-300 transition-colors">
            Carpooling aeroportuale: la guida completa →
          </Link>
        </div>
      </div>
    </div>
  );
}
