'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown, ArrowRight, Car, DollarSign, Shield, MessageCircle, CheckCircle } from 'lucide-react';

// ── SVG Illustrations ──────────────────────────────────────────────

const DriverHeroIllustration = () => (
  <svg viewBox="0 0 480 360" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-lg">
    {/* Background arc */}
    <ellipse cx="300" cy="200" rx="180" ry="170" fill="#00D1B2" opacity="0.12" />
    <ellipse cx="300" cy="210" rx="140" ry="130" fill="#00D1B2" opacity="0.10" />
    {/* Van body */}
    <rect x="80" y="210" width="280" height="90" rx="18" fill="#1A1A1A" />
    <rect x="95" y="185" width="200" height="90" rx="14" fill="#242424" />
    {/* Windows */}
    <rect x="110" y="195" width="75" height="55" rx="8" fill="#00D1B2" opacity="0.25" />
    <rect x="198" y="195" width="75" height="55" rx="8" fill="#00D1B2" opacity="0.25" />
    {/* Windshield shine */}
    <rect x="115" y="200" width="20" height="8" rx="4" fill="white" opacity="0.3" />
    {/* Wheels */}
    <circle cx="145" cy="300" r="28" fill="#111" />
    <circle cx="145" cy="300" r="16" fill="#2A2A2A" />
    <circle cx="145" cy="300" r="6" fill="#00D1B2" />
    <circle cx="295" cy="300" r="28" fill="#111" />
    <circle cx="295" cy="300" r="16" fill="#2A2A2A" />
    <circle cx="295" cy="300" r="6" fill="#00D1B2" />
    {/* Flanvo logo on van */}
    <rect x="155" y="238" width="60" height="18" rx="4" fill="#00D1B2" opacity="0.15" />
    <text x="185" y="251" textAnchor="middle" fontFamily="system-ui" fontSize="9" fontWeight="700" fill="#00D1B2">Flanvo</text>
    {/* Driver person */}
    <circle cx="340" cy="150" r="38" fill="#2A2A2A" />
    <circle cx="340" cy="132" r="22" fill="#C8956C" />
    {/* Hair */}
    <ellipse cx="340" cy="114" rx="22" ry="14" fill="#1A1A1A" />
    {/* Body */}
    <rect x="308" y="162" width="64" height="60" rx="14" fill="#1F4E6B" />
    {/* Collar */}
    <path d="M326 162 L340 178 L354 162" stroke="white" strokeWidth="2" fill="none" />
    {/* Steering wheel */}
    <circle cx="240" cy="240" r="26" stroke="#333" strokeWidth="5" fill="none" />
    <circle cx="240" cy="240" r="6" fill="#444" />
    <line x1="240" y1="214" x2="240" y2="228" stroke="#444" strokeWidth="4" />
    <line x1="240" y1="252" x2="240" y2="266" stroke="#444" strokeWidth="4" />
    {/* Stars / rating */}
    {[0,1,2,3,4].map((i) => (
      <text key={i} x={96 + i * 18} y="175" fontSize="14" fill="#00D1B2">★</text>
    ))}
    <text x="186" y="175" fontSize="11" fill="#A1A1AA" fontFamily="system-ui">4.9</text>
    {/* Passengers silhouettes */}
    <circle cx="390" cy="230" r="14" fill="#2A2A2A" />
    <circle cx="390" cy="218" r="9" fill="#B07D62" />
    <circle cx="415" cy="230" r="14" fill="#2A2A2A" />
    <circle cx="415" cy="218" r="9" fill="#8B6355" />
  </svg>
);

const EarningsIllustration = () => (
  <svg viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-xs mx-auto">
    {/* Chart bars */}
    <rect x="30" y="140" width="36" height="60" rx="6" fill="#00D1B2" opacity="0.3" />
    <rect x="84" y="100" width="36" height="100" rx="6" fill="#00D1B2" opacity="0.5" />
    <rect x="138" y="70" width="36" height="130" rx="6" fill="#00D1B2" opacity="0.7" />
    <rect x="192" y="40" width="36" height="160" rx="6" fill="#00D1B2" />
    <rect x="246" y="20" width="36" height="180" rx="6" fill="#00D1B2" />
    {/* Euro sign */}
    <circle cx="264" cy="14" r="14" fill="#00D1B2" opacity="0.2" />
    <text x="264" y="19" textAnchor="middle" fontSize="14" fontWeight="700" fill="#00D1B2" fontFamily="system-ui">€</text>
    {/* Trend arrow */}
    <polyline points="48,150 100,115 153,85 210,55 265,32" stroke="#00D1B2" strokeWidth="2.5" strokeDasharray="5,3" fill="none" />
  </svg>
);

const FlexIllustration = () => (
  <svg viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-xs mx-auto">
    {/* Calendar */}
    <rect x="60" y="40" width="200" height="160" rx="16" fill="#1A1A1A" stroke="#2A2A2A" strokeWidth="2" />
    <rect x="60" y="40" width="200" height="44" rx="16" fill="#00D1B2" opacity="0.2" />
    <rect x="60" y="62" width="200" height="22" fill="#00D1B2" opacity="0.2" />
    {/* Days header */}
    {['L','M','M','G','V','S','D'].map((d, i) => (
      <text key={i} x={82 + i * 26} y="72" fontSize="11" fill="#A1A1AA" textAnchor="middle" fontFamily="system-ui">{d}</text>
    ))}
    {/* Day cells — some highlighted */}
    {[
      {x:82,y:100,active:false},{x:108,y:100,active:true},{x:134,y:100,active:false},
      {x:160,y:100,active:true},{x:186,y:100,active:false},{x:212,y:100,active:true},{x:238,y:100,active:false},
      {x:82,y:128,active:false},{x:108,y:128,active:false},{x:134,y:128,active:true},
      {x:160,y:128,active:false},{x:186,y:128,active:true},{x:212,y:128,active:false},{x:238,y:128,active:true},
    ].map((cell, i) => (
      <g key={i}>
        {cell.active && <circle cx={cell.x} cy={cell.y} r="12" fill="#00D1B2" />}
        <text x={cell.x} y={cell.y + 4} fontSize="11" fill={cell.active ? '#0B0B0B' : '#A1A1AA'} textAnchor="middle" fontFamily="system-ui" fontWeight={cell.active ? '700' : '400'}>
          {i + 2}
        </text>
      </g>
    ))}
  </svg>
);

const AppIllustration = () => (
  <svg viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-xs mx-auto">
    {/* Phone */}
    <rect x="100" y="20" width="120" height="190" rx="18" fill="#1A1A1A" stroke="#2A2A2A" strokeWidth="2" />
    <rect x="108" y="32" width="104" height="166" rx="12" fill="#0F0F0F" />
    {/* Screen content */}
    <rect x="116" y="48" width="88" height="28" rx="8" fill="#00D1B2" opacity="0.15" />
    <text x="160" y="66" textAnchor="middle" fontSize="10" fill="#00D1B2" fontFamily="system-ui" fontWeight="700">Nuova corsa</text>
    <rect x="116" y="84" width="88" height="12" rx="4" fill="#2A2A2A" />
    <rect x="116" y="104" width="60" height="12" rx="4" fill="#2A2A2A" />
    {/* Accept button */}
    <rect x="116" y="128" width="88" height="32" rx="10" fill="#00D1B2" />
    <text x="160" y="148" textAnchor="middle" fontSize="11" fill="#0B0B0B" fontFamily="system-ui" fontWeight="700">Accetta</text>
    {/* Notification dot */}
    <circle cx="204" cy="36" r="8" fill="#00D1B2" />
    <text x="204" y="40" textAnchor="middle" fontSize="9" fill="#0B0B0B" fontFamily="system-ui" fontWeight="700">1</text>
  </svg>
);

// ── FAQ ────────────────────────────────────────────────────────────

const faqs = [
  {
    q: 'Dove opera Flanvo?',
    a: 'Flanvo è attivo negli aeroporti di Catania, Palermo, Cagliari, Roma Fiumicino, Milano Malpensa, Milano Orio, Napoli e Bari. Stiamo espandendo in nuovi scali ogni mese.',
  },
  {
    q: 'Quali sono i requisiti per guidare con Flanvo?',
    a: 'Devi avere: patente di guida valida, Certificato di Qualificazione del Conducente (CQC), licenza NCC rilasciata dal comune, assicurazione commerciale e un veicolo in buono stato (sedan, SUV o van).',
  },
  {
    q: 'Come vengo pagato?',
    a: 'I pagamenti avvengono tramite Stripe Connect direttamente sul tuo conto bancario. Il pagamento viene trasferito entro 2 giorni lavorativi dal drop-off. Non ci sono trattenute nascoste.',
  },
  {
    q: 'Posso scegliere quali corse accettare?',
    a: 'Sì. Ricevi una notifica per ogni corsa disponibile nel tuo aeroporto di operatività e decidi tu se accettare. Non ci sono obblighi di turno o penali per i rifiuti.',
  },
  {
    q: 'Quanti passeggeri trasporto per corsa?',
    a: "Da 2 a 7 passeggeri dello stesso volo, verso destinazioni simili. L'app raggruppa i passeggeri automaticamente e ottimizza il percorso per massimizzare i tuoi guadagni.",
  },
  {
    q: 'Quanto posso guadagnare?',
    a: 'I guadagni dipendono dalla distanza percorsa (2€/km) e dal numero di passeggeri. Una corsa aeroporto-Palermo con 4 passeggeri può valere oltre 200€. Puoi vedere una stima prima di accettare.',
  },
];

function FAQ() {
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

// ── Page ───────────────────────────────────────────────────────────

export default function GuidaConNoiPage() {
  return (
    <div className="bg-[#0B0B0B]">

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 rounded-full px-4 py-1.5 text-xs font-semibold text-primary-400 mb-6">
            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
            Driver partner Flanvo
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight mb-5">
            Guadagna trasportando passeggeri aeroportuali
          </h1>
          <p className="text-ink-secondary text-lg leading-relaxed mb-8">
            Unisciti alla rete di driver NCC che trasportano gruppi di passeggeri dallo stesso volo verso destinazioni simili. Corse più lunghe, più passeggeri, guadagni più alti.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/driver/signup"
              className="flex items-center justify-center gap-2 bg-primary-500 text-[#0B0B0B] px-7 py-4 rounded-2xl font-bold text-base hover:bg-primary-400 transition-all shadow-teal"
            >
              Registrati e guida con noi <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/driver/login"
              className="flex items-center justify-center gap-2 bg-surface-2 border border-surface-5 text-white px-7 py-4 rounded-2xl font-semibold text-base hover:border-surface-4 transition-all"
            >
              Accedi
            </Link>
          </div>
        </div>
        <div className="hidden md:flex justify-center">
          <DriverHeroIllustration />
        </div>
      </section>

      {/* ── BENEFITS ─────────────────────────────────── */}
      <section className="bg-surface-1 border-t border-surface-4 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            Guadagna di più con ogni corsa
          </h2>
          <p className="text-ink-secondary text-center mb-14 max-w-xl mx-auto">
            Con Flanvo trasporti più passeggeri per tratta, massimizzando il guadagno per chilometro percorso.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <EarningsIllustration />
              <h3 className="text-lg font-bold text-white mt-4 mb-2">Guadagna di più</h3>
              <p className="text-ink-secondary text-sm leading-relaxed">
                Più passeggeri per corsa significa più entrate per ogni chilometro. Una tratta da 50km con 5 passeggeri vale oltre 100€.
              </p>
            </div>
            <div className="text-center">
              <FlexIllustration />
              <h3 className="text-lg font-bold text-white mt-4 mb-2">Scegli quando guidare</h3>
              <p className="text-ink-secondary text-sm leading-relaxed">
                Accetti solo le corse che vuoi. Nessun turno obbligatorio, nessuna penale per i rifiuti. Sei tu il capo.
              </p>
            </div>
            <div className="text-center">
              <AppIllustration />
              <h3 className="text-lg font-bold text-white mt-4 mb-2">Gestisci tutto dall'app</h3>
              <p className="text-ink-secondary text-sm leading-relaxed">
                Ricevi notifiche per le nuove corse nel tuo aeroporto, accetta con un tap e ricevi pagamento automatico al drop-off.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── COME INIZIARE ─────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Pronto a iniziare?</h2>
          <p className="text-ink-secondary mb-12">Tre passi per diventare driver partner Flanvo.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                n: '01',
                icon: <Car className="w-6 h-6 text-primary-400" />,
                title: 'Registrati online',
                body: 'Compila il modulo con i dati del tuo veicolo e i tuoi documenti. Il processo richiede meno di 5 minuti.',
                cta: { label: 'Registrati', href: '/driver/signup' },
              },
              {
                n: '02',
                icon: <Shield className="w-6 h-6 text-primary-400" />,
                title: 'Verifica requisiti',
                body: 'Il team Flanvo controlla licenza NCC, CQC e assicurazione commerciale. Ricevi risposta entro 48 ore.',
                cta: null,
              },
              {
                n: '03',
                icon: <CheckCircle className="w-6 h-6 text-primary-400" />,
                title: 'Accetta le tue prime corse',
                body: 'Una volta approvato, ricevi notifiche per le corse disponibili nel tuo aeroporto e inizia a guadagnare.',
                cta: null,
              },
            ].map((step) => (
              <div key={step.n} className="bg-surface-1 border border-surface-4 rounded-2xl p-6 bg-card-gradient">
                <div className="flex items-start gap-4 mb-4">
                  <span className="text-xs font-mono text-ink-muted">{step.n}</span>
                  <div className="w-10 h-10 bg-primary-500/10 border border-primary-500/20 rounded-xl flex items-center justify-center shrink-0">
                    {step.icon}
                  </div>
                </div>
                <h3 className="font-bold text-white mb-2">{step.title}</h3>
                <p className="text-ink-secondary text-sm leading-relaxed mb-4">{step.body}</p>
                {step.cta && (
                  <Link href={step.cta.href} className="text-sm font-semibold text-primary-400 hover:text-primary-300 transition-colors underline underline-offset-4">
                    {step.cta.label} →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COSA OFFRIAMO ─────────────────────────────── */}
      <section className="bg-surface-1 border-t border-surface-4 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white mb-3">Cosa offriamo ai driver partner</h2>
          <p className="text-ink-secondary mb-12">Il supporto di cui hai bisogno, quando ne hai bisogno.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <DollarSign className="w-6 h-6 text-primary-400" />,
                title: 'Pagamenti sicuri',
                body: 'Stripe Connect trasferisce i guadagni direttamente sul tuo conto bancario entro 2 giorni lavorativi. Zero contanti, zero rischi.',
                link: { label: 'Come funzionano i pagamenti', href: '/#prezzi' },
              },
              {
                icon: <MessageCircle className="w-6 h-6 text-primary-400" />,
                title: 'Supporto dedicato',
                body: 'Il nostro assistente AI è disponibile 24 ore su 24. Per problemi urgenti durante la corsa, hai un canale di supporto prioritario.',
                link: null,
              },
              {
                icon: <Shield className="w-6 h-6 text-primary-400" />,
                title: 'Passeggeri verificati',
                body: "Tutti i passeggeri sono registrati e verificati. Sai sempre chi stai trasportando prima di accettare la corsa.",
                link: { label: 'Leggi di più sulla sicurezza', href: '/sicurezza' },
              },
            ].map((item) => (
              <div key={item.title} className="bg-surface-2 border border-surface-5 rounded-2xl p-6 hover:border-surface-4 transition-all">
                <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center mb-5">
                  {item.icon}
                </div>
                <h3 className="font-bold text-white mb-2">{item.title}</h3>
                <p className="text-ink-secondary text-sm leading-relaxed mb-4">{item.body}</p>
                {item.link && (
                  <Link href={item.link.href} className="text-sm font-semibold text-primary-400 hover:text-primary-300 transition-colors underline underline-offset-4">
                    {item.link.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REQUISITI ─────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white mb-3">Requisiti per guidare</h2>
          <p className="text-ink-secondary mb-10">Flanvo opera nel settore NCC regolamentato.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              'Licenza NCC (Noleggio con Conducente) rilasciata dal comune',
              'Certificato di Qualificazione del Conducente (CQC) in corso di validità',
              'Assicurazione commerciale per il trasporto di persone',
              'Veicolo con revisione valida (sedan, SUV o van — max 7 posti)',
              'Smartphone Android o iOS per gestire le corse',
              'Conto bancario italiano per i pagamenti Stripe Connect',
            ].map((req) => (
              <div key={req} className="flex items-start gap-3 bg-surface-1 border border-surface-4 rounded-xl px-4 py-3">
                <CheckCircle className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
                <span className="text-sm text-ink-secondary">{req}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────── */}
      <section className="bg-surface-1 border-t border-surface-4 py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white mb-10">Domande frequenti</h2>
          <FAQ />
        </div>
      </section>

      {/* ── BOTTOM CTA ────────────────────────────────── */}
      <div className="sticky bottom-0 bg-[#0B0B0B] border-t border-surface-4 px-6 py-4 flex items-center justify-between gap-4 z-30">
        <p className="text-sm text-ink-secondary hidden sm:block">Unisciti ai driver partner Flanvo — approva in 48 ore.</p>
        <Link
          href="/driver/signup"
          className="flex items-center gap-2 bg-primary-500 text-[#0B0B0B] px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary-400 transition-all shadow-teal shrink-0 ml-auto"
        >
          Registrati e guida con noi <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  );
}
