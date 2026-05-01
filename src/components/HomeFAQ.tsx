'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'Come viene calcolato il mio prezzo?',
    a: 'Paghi solo i chilometri effettivamente percorsi con te a bordo — non una divisione del costo totale. Se scendi prima degli altri passeggeri, paghi meno. Il prezzo è visibile prima di confermare.',
  },
  {
    q: 'Quando vengo addebitato?',
    a: 'Il pagamento viene pre-autorizzato al momento della conferma (i fondi vengono solo bloccati, non addebitati). L\'addebito reale avviene solo al drop-off, una volta completata la corsa.',
  },
  {
    q: 'Posso cancellare la prenotazione?',
    a: 'Sì. Puoi cancellare gratuitamente fino a quando il driver non accetta la corsa. Dopo l\'accettazione, la cancellazione non è consentita. Per forza maggiore al pickup (bagagli smarriti, emergenza medica) apri una disputa entro 24 ore. Per volo cancellato o dirottato dalla compagnia aerea, Flanvo attiva automaticamente una procedura di assistenza: ricevi la ricevuta ufficiale e le istruzioni per richiedere il rimborso all\'airline ai sensi del Reg. UE 261/2004 — è la compagnia a rimborsarti, non Flanvo.',
  },
  {
    q: 'Chi sono i passeggeri nel gruppo?',
    a: 'Tutti i passeggeri del tuo stesso volo, registrati su Flanvo, con destinazioni simili alla tua. Il numero massimo è 7 persone per van.',
  },
  {
    q: 'Cosa succede se il mio volo è in ritardo?',
    a: 'Flanvo monitora il tuo volo in tempo reale. Se ci sono ritardi, il driver viene avvisato automaticamente e il pickup si adatta. Non devi fare nulla.',
  },
  {
    q: 'Come mi trovo con il driver in aeroporto?',
    a: 'Ricevi il punto di incontro esatto (solitamente all\'uscita Arrivi del terminal). Il driver ha un cartello con il nome Flanvo e i tuoi dettagli. Puoi comunicare via chat direttamente dall\'app.',
  },
];

export default function HomeFAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="divide-y divide-surface-4 border border-surface-4 rounded-2xl overflow-hidden">
      {faqs.map((faq, i) => (
        <div key={i} className="bg-surface-1">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-surface-2 transition-colors"
          >
            <span className="font-semibold text-white text-sm pr-4">{faq.q}</span>
            <ChevronDown className={`w-4 h-4 text-ink-muted shrink-0 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`} />
          </button>
          {open === i && (
            <div className="px-6 pb-5 text-sm text-ink-secondary leading-relaxed">
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
