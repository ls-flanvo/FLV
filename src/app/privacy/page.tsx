import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink-secondary mb-8 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Home
      </Link>
      <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
      <p className="text-ink-muted text-sm mb-10">Ultimo aggiornamento: aprile 2026 · Conforme al GDPR (Reg. UE 2016/679)</p>

      <div className="space-y-8 text-ink-secondary leading-relaxed">
        {[
          { title: '1. Titolare del trattamento', body: 'Flanvo S.r.l. — hello@flanvo.com — è il Titolare del trattamento dei dati personali raccolti tramite la piattaforma.' },
          { title: '2. Dati raccolti', body: 'Raccogliamo: dati di registrazione (nome, email, telefono), dati di viaggio (volo, destinazione, orari), dati di pagamento (gestiti interamente da Stripe, non archiviamo numeri di carta), dati di geolocalizzazione degli autisti durante le corse (non archiviati in modo permanente), e dati di utilizzo della piattaforma (log tecnici).' },
          { title: '3. Finalità del trattamento', body: 'I dati sono trattati per: eseguire il contratto di servizio (matching, prenotazione, pagamento), adempiere agli obblighi di legge, migliorare la piattaforma tramite analytics anonimizzate, e inviare comunicazioni di servizio (conferme, reminder, aggiornamenti). Non utilizziamo i dati per finalità di marketing senza consenso esplicito.' },
          { title: '4. Base giuridica', body: 'Il trattamento si basa su: esecuzione del contratto (Art. 6(1)(b) GDPR) per le funzionalità core, obbligo legale (Art. 6(1)(c)) per la fatturazione, e legittimo interesse (Art. 6(1)(f)) per la sicurezza della piattaforma.' },
          { title: '5. Conservazione dei dati', body: 'I dati degli account attivi sono conservati per tutta la durata del rapporto contrattuale. Dopo la cancellazione dell\'account, i dati vengono eliminati entro 30 giorni salvo obblighi di legge (es. dati fiscali conservati per 10 anni).' },
          { title: '6. Condivisione dei dati', body: 'I tuoi dati non vengono venduti a terzi. Vengono condivisi solo con: Stripe (pagamenti), Supabase (database), Resend (email transazionali), Mapbox (mappe), Anthropic (assistente AI — solo testo delle conversazioni di supporto, anonimizzato). Tutti i fornitori sono conformi al GDPR.' },
          { title: '7. I tuoi diritti', body: 'Hai il diritto di: accedere ai tuoi dati, rettificarli, cancellarli ("diritto all\'oblio"), limitarne il trattamento, portabilità dei dati, e opporti al trattamento. Per esercitare questi diritti: hello@flanvo.com — risposta entro 30 giorni.' },
          { title: '8. Cookie', body: 'Utilizziamo solo cookie tecnici essenziali per il funzionamento della piattaforma (sessione, autenticazione). Non utilizziamo cookie di profilazione o di terze parti per advertising.' },
        ].map(({ title, body }) => (
          <div key={title}>
            <h2 className="text-lg font-bold text-white mb-2">{title}</h2>
            <p>{body}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 pt-6 border-t border-surface-4 text-xs text-ink-muted">
        DPO / Contatto privacy: <a href="mailto:hello@flanvo.com" className="text-primary-400 hover:underline">hello@flanvo.com</a>
      </div>
    </div>
  );
}
