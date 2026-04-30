import Link from 'next/link';
import { ArrowLeft, Shield, CreditCard, Lock, Star, Phone, CheckCircle } from 'lucide-react';

export const metadata = { title: 'Sicurezza — Flanvo' };

const sections = [
  {
    icon: Shield,
    title: 'Autisti verificati',
    body: 'Ogni autista Flanvo supera un processo di verifica prima di poter effettuare corse. Controlliamo patente di guida in corso di validità, Carta di Qualificazione del Conducente (CQC) obbligatoria per il trasporto professionale di persone, assicurazione RC professionale, e revisione del veicolo. Solo dopo l\'approvazione manuale da parte del team Flanvo l\'autista può accettare corse.',
    items: ['Patente di guida verificata', 'CQC — Carta Qualificazione Conducente', 'Assicurazione RC professionale', 'Approvazione manuale del team Flanvo'],
  },
  {
    icon: CreditCard,
    title: 'Pagamenti protetti da Stripe',
    body: 'I pagamenti sono gestiti interamente da Stripe, certificato PCI DSS Level 1 — lo standard più elevato per la sicurezza dei dati di pagamento. Flanvo non archivia mai i numeri di carta. Al momento della prenotazione viene eseguita solo una pre-autorizzazione (i fondi vengono bloccati ma non addebitati). L\'addebito reale avviene esclusivamente al drop-off, una volta completata la corsa.',
    items: ['Stripe PCI DSS Level 1', 'Nessun dato carta archiviato su Flanvo', 'Pre-autorizzazione — addebito solo al drop-off', 'Rimborso automatico se il gruppo non si forma'],
  },
  {
    icon: Lock,
    title: 'Dati e privacy',
    body: 'I tuoi dati personali sono trattati in conformità al GDPR (Reg. UE 2016/679). Utilizziamo Supabase (database europeo), crittografia TLS per tutte le comunicazioni, e accesso ai dati limitato strettamente al necessario per il funzionamento del servizio. Non vendiamo dati a terzi. Non utilizziamo cookie di profilazione.',
    items: ['GDPR compliant', 'Database europeo — Supabase', 'Crittografia TLS su tutte le comunicazioni', 'Nessuna vendita di dati a terzi'],
  },
  {
    icon: Star,
    title: 'Sistema di valutazione',
    body: 'Dopo ogni corsa, passeggeri e autisti si valutano reciprocamente. Le valutazioni sono visibili a tutti e influenzano la priorità con cui un autista riceve nuove corse. Gli autisti con rating sotto soglia vengono sospesi e sottoposti a revisione. Questo crea un sistema di accountability continua.',
    items: ['Valutazione post-corsa obbligatoria', 'Rating visibile e verificato', 'Autisti sotto soglia sospesi automaticamente', 'Recensioni non modificabili'],
  },
  {
    icon: Phone,
    title: 'Supporto e assistenza',
    body: 'In caso di problemi durante una corsa, puoi contattare il supporto Flanvo direttamente dall\'app via chat. Per emergenze, il driver dispone sempre del tuo numero di telefono e viceversa. Il monitoraggio dei voli in tempo reale ci permette di intervenire proattivamente in caso di ritardi o cancellazioni.',
    items: ['Chat di supporto in-app', 'Contatto diretto driver ↔ passeggero', 'Monitoraggio voli in tempo reale', 'Email: hello@flanvo.com'],
  },
];

export default function SicurezzaPage() {
  return (
    <div className="bg-[#0B0B0B] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink-secondary mb-10 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Home
        </Link>

        {/* Header */}
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 rounded-full px-4 py-1.5 text-xs font-semibold text-primary-400 mb-6">
            <Shield className="w-3.5 h-3.5" /> La tua sicurezza, prima di tutto
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
            Vogliamo che tu possa muoverti liberamente.
          </h1>
          <div className="space-y-4 text-lg text-ink-secondary leading-relaxed">
            <p>
              Atterri in una città nuova, a volte di notte, a volte da solo. Trovi un van con persone che non conosci e un driver che non hai mai visto. Sappiamo che la fiducia non si chiede — si guadagna.
            </p>
            <p>
              Per questo ogni autista su Flanvo viene verificato manualmente prima di poter effettuare la prima corsa. I pagamenti sono gestiti da Stripe, lo standard più sicuro al mondo. I tuoi dati non vengono mai venduti a terzi. E dopo ogni corsa, il sistema di rating garantisce che chi non rispetta gli standard venga rimosso.
            </p>
            <p className="text-base">
              Non è una lista di funzionalità. È il modo in cui abbiamo scelto di costruire questo servizio.
            </p>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {sections.map(({ icon: Icon, title, body, items }) => (
            <div key={title} className="bg-surface-1 border border-surface-4 rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-primary-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="w-4.5 h-4.5 text-primary-400" />
                </div>
                <h2 className="text-lg font-bold text-white">{title}</h2>
              </div>
              <p className="text-ink-secondary text-sm leading-relaxed mb-5">{body}</p>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-ink-secondary">
                    <CheckCircle className="w-4 h-4 text-primary-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-surface-4 text-sm text-ink-muted">
          Hai domande sulla sicurezza?{' '}
          <a href="mailto:hello@flanvo.com" className="text-primary-400 hover:text-primary-300 transition-colors">
            hello@flanvo.com
          </a>
        </div>
      </div>
    </div>
  );
}
