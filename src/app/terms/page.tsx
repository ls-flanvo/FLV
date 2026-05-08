import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink-secondary mb-8 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Home
      </Link>
      <h1 className="text-3xl font-bold text-white mb-2">Termini e Condizioni</h1>
      <p className="text-ink-muted text-sm mb-10">Ultimo aggiornamento: aprile 2026</p>

      <div className="prose prose-invert max-w-none space-y-8 text-ink-secondary leading-relaxed">
        {[
          { title: '1. Descrizione del servizio', body: 'Flanvo è una piattaforma digitale che facilita la condivisione di trasferimenti aeroportuali tra passeggeri con voli e destinazioni simili. Flanvo non è un vettore di trasporto: il trasporto viene effettuato da autisti indipendenti verificati dalla piattaforma.' },
          { title: '2. Registrazione e account', body: 'Per utilizzare il servizio è necessario creare un account con dati veritieri. L\'utente è responsabile della sicurezza delle proprie credenziali e di tutte le attività effettuate tramite il proprio account.' },
          { title: '3. Prenotazioni e pagamenti', body: 'Il prezzo viene calcolato in base alla distanza proporzionale e al numero di passeggeri nel gruppo. La registrazione della richiesta è gratuita e non richiede alcun dato di pagamento. Quando il gruppo si chiude (al raggiungimento della capacità massima o 3 ore prima del volo), il passeggero riceve il prezzo definitivo e ha 20 minuti per confermare e pagare tramite Stripe. L\'addebito avviene in quel momento. Chi non paga entro il termine perde il posto automaticamente senza alcun addebito. I fondi vengono trattenuti da Flanvo e trasferiti al driver al termine della corsa. Nessun addebito avviene se il gruppo non raggiunge il numero minimo o se nessun driver è disponibile.' },
          { title: '4. Cancellazioni e rimborsi', body: 'Puoi cancellare gratuitamente fino alla chiusura del gruppo — nessun addebito verrà applicato. Dopo aver pagato, puoi cancellare gratuitamente finché nessun driver ha accettato la corsa — rimborso completo automatico. Una volta che il driver accetta, la cancellazione non prevede rimborso. In caso di forza maggiore documentata al pickup (bagaglio smarrito con pratica ufficiale, emergenza medica certificata, intervento forze dell\'ordine con numero pratica), il passeggero può aprire una disputa entro 24 ore — il team Flanvo valuta e decide discrezionalmente. Per volo cancellato o dirottato dalla compagnia aerea: Flanvo non prevede rimborso diretto. La responsabilità è del vettore aereo ai sensi del Regolamento UE 261/2004. Flanvo attiva automaticamente una procedura di assistenza fornendo ricevuta ufficiale e supporto per la richiesta di rimborso alla compagnia aerea.' },
          { title: '4b. No-show passeggero', body: 'Se il passeggero non si presenta al punto di incontro entro i tempi previsti, il driver è autorizzato a marcare il no-show dopo aver tentato il contatto via chat. In questo caso: il driver riceve la propria quota (driverShare) come compensazione per la presenza e l\'attesa; la fee Flanvo viene rimborsata al passeggero; il passeggero non ha diritto ad ulteriore rimborso salvo forza maggiore documentata tramite procedura di disputa.' },
          { title: '4c. No-show driver', body: 'Se il driver assegnato non si presenta o annulla dopo l\'accettazione, Flanvo rimborsa integralmente tutti i passeggeri del gruppo entro 2-5 giorni lavorativi. Il rimborso avviene automaticamente sull\'originale metodo di pagamento. Il driver viene sospeso dalla piattaforma e soggetto a verifica. Flanvo si impegna a notificare i passeggeri appena viene confermato il mancato servizio.' },
          { title: '4a. Criteri di valutazione disputa', body: 'Casi ammissibili: bagaglio smarrito (numero pratica compagnia aerea obbligatorio), emergenza medica (certificato pronto soccorso o medico), intervento forze dell\'ordine (numero denuncia/pratica), ritardo aeroportuale involontario documentato. Casi non ammissibili: cambio di idea, alternativa più conveniente, dimenticanza. Regole: disputa entro 24h dall\'orario di pickup; risposta Flanvo entro 48h lavorative; decisione insindacabile del team Flanvo; il passeggero dichiara di non avere già ricevuto rimborso per le stesse spese da terzi.' },
          { title: '5. Condotta degli utenti', body: 'Gli utenti si impegnano a rispettare gli altri passeggeri e gli autisti, a essere puntuali nel luogo e orario di ritiro concordati, e a non portare oggetti pericolosi o illegali. Flanvo si riserva di sospendere account in caso di comportamenti scorretti segnalati e verificati.' },
          { title: '6. Responsabilità', body: 'Flanvo si impegna a verificare gli autisti tramite controllo di patente, CQC e assicurazione. Tuttavia Flanvo non è responsabile per ritardi, danni o inconvenienti causati da circostanze al di fuori del proprio controllo (traffico, condizioni meteorologiche, ritardi aerei).' },
          { title: '7. Modifiche ai termini', body: 'Flanvo si riserva di aggiornare i presenti termini con preavviso via email. L\'utilizzo continuato del servizio dopo la notifica costituisce accettazione delle modifiche.' },
          { title: '8. Legge applicabile', body: 'I presenti termini sono regolati dalla legge italiana. Per qualsiasi controversia è competente il Foro di Milano.' },
        ].map(({ title, body }) => (
          <div key={title}>
            <h2 className="text-lg font-bold text-white mb-2">{title}</h2>
            <p>{body}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 pt-6 border-t border-surface-4 text-xs text-ink-muted">
        Per domande: <a href="mailto:hello@flanvo.com" className="text-primary-400 hover:underline">hello@flanvo.com</a>
      </div>
    </div>
  );
}
