import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Volo in ritardo: cosa succede al tuo trasferimento? — Flanvo Blog',
  description: 'Volo in ritardo di 2 ore. Il taxi prenotato è andato. Ecco come Flanvo gestisce i ritardi in automatico.',
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
          Volo in ritardo: cosa succede al tuo trasferimento aeroportuale?
        </h1>
        <p className="text-xs text-ink-muted mb-10">marzo 2026 · 5 min di lettura</p>

        <div className="space-y-6 text-ink-secondary leading-relaxed text-[15px]">

          <p>
            È una situazione che capita spesso: il tuo volo ha due ore di ritardo, e tu hai già prenotato un trasferimento dall&apos;aeroporto. Se hai un taxi privato, devi chiamare, sperare che aspetti, e nella maggior parte dei casi scoprire che nel frattempo ha preso un altro cliente. Se hai Flanvo, non devi fare nulla.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-3">Come Flanvo monitora i voli</h2>
          <p>
            Quando inserisci il tuo codice volo al momento della prenotazione, Flanvo inizia a monitorare quel volo in tempo reale tramite API aeronautiche ufficiali. Questo include ritardi, cancellazioni, dirottamenti e variazioni di gate.
          </p>
          <p>
            Non devi inserire aggiornamenti manualmente. Non devi avvisare il driver. Non devi riscrivere a nessuno. Il sistema rileva il cambiamento e aggiorna automaticamente l&apos;orario di pickup.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-3">Cosa succede al driver</h2>
          <p>
            Il driver viene notificato in tempo reale quando il tuo volo subisce una variazione. Riceve il nuovo orario stimato di atterraggio e adegua la sua presenza al punto di incontro di conseguenza. Non ti aspetterà per due ore fuori dall&apos;aeroporto — arriverà all&apos;orario aggiornato.
          </p>

          <div className="bg-surface-1 border border-surface-4 rounded-xl p-5 my-6">
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-widest mb-3">Timeline tipica con ritardo</p>
            <div className="space-y-3 text-sm">
              {[
                ['Ritardo rilevato', 'Il sistema aggiorna automaticamente tutti i passeggeri del gruppo'],
                ['Driver notificato', 'Riceve nuovo ETA e aggiorna la sua agenda'],
                ['Tu atterri', 'Trovi il driver al punto di incontro come concordato'],
                ['Corsa regolare', 'Nessuna differenza rispetto a un volo puntuale'],
              ].map(([fase, desc]) => (
                <div key={fase} className="flex gap-3">
                  <span className="font-semibold text-white shrink-0 w-32">{fase}</span>
                  <span className="text-ink-muted">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          <h2 className="text-xl font-bold text-white mt-10 mb-3">Cosa succede se il ritardo è molto lungo</h2>
          <p>
            Se il ritardo supera una certa soglia e il gruppo non riesce più a formarsi (ad esempio perché altri passeggeri hanno preso alternative), Flanvo ti notifica e annulla la prenotazione con rimborso completo della pre-autorizzazione.
          </p>
          <p>
            In questo caso sei libero di prenotare un nuovo gruppo per il nuovo orario di atterraggio, oppure di organizzarti diversamente. Non ci sono penali e non viene addebitato nulla.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-3">Volo cancellato dalla compagnia</h2>
          <p>
            Se il volo viene cancellato dal vettore — non da te — il rimborso è sempre integrale, indipendentemente da quanto prima della partenza avviene la cancellazione. La pre-autorizzazione decade automaticamente entro 24–48 ore senza che tu debba fare nulla.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-3">Perché è diverso da un taxi tradizionale</h2>
          <p>
            Con un taxi privato o un NCC prenotato in anticipo, il driver ha un accordo per un orario preciso. Se il volo ritarda, sei tu a dover gestire la comunicazione, spesso senza sapere quanto durerà il ritardo. Nella maggior parte dei casi il driver se ne va dopo 30–60 minuti, e tu devi ricominciare da capo all&apos;atterraggio.
          </p>
          <p>
            Flanvo risolve questo problema strutturalmente: il prezzo non dipende dall&apos;orario di atterraggio ma dai chilometri percorsi. Il driver viene pagato per la corsa, non per l&apos;attesa. Questo allinea gli incentivi in modo che il sistema funzioni anche quando qualcosa va storto.
          </p>

          <h2 className="text-xl font-bold text-white mt-10 mb-3">Cosa devi fare tu</h2>
          <p>
            Niente. Davvero. Puoi stare seduto sul volo in ritardo, guardare un film, e sapere che il trasferimento si adatterà automaticamente. Se ci sono aggiornamenti importanti, ricevi una notifica push sull&apos;app. Il resto è automatico.
          </p>

        </div>

        <div className="mt-14 pt-8 border-t border-surface-4">
          <Link
            href="/flight-search"
            className="inline-flex items-center gap-2 bg-primary-500 text-[#0B0B0B] px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary-400 transition-all"
          >
            Prenota il tuo trasferimento <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="mt-10 pt-8 border-t border-surface-4">
          <p className="text-xs text-ink-muted mb-4">Leggi anche</p>
          <Link href="/blog/quanto-costa-taxi-aeroporto" className="block text-sm font-semibold text-white hover:text-primary-300 transition-colors">
            Quanto costa davvero un taxi dall&apos;aeroporto? →
          </Link>
        </div>
      </div>
    </div>
  );
}
