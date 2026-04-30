'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown, ArrowRight, Car, DollarSign, Shield, MessageCircle, CheckCircle } from 'lucide-react';

// ── SVG Illustrations ──────────────────────────────────────────────

// Hero: UI card mockup stile dashboard driver
const DriverHeroIllustration = () => (
  <svg viewBox="0 0 460 380" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-lg">
    {/* Card principale — notifica nuova corsa */}
    <rect x="30" y="40" width="280" height="180" rx="20" fill="#161616" stroke="#2A2A2A" strokeWidth="1.5"/>

    {/* Badge stato */}
    <rect x="50" y="62" width="110" height="22" rx="11" fill="#00D1B2" opacity="0.15"/>
    <circle cx="64" cy="73" r="4" fill="#00D1B2"/>
    <text x="74" y="77" fontFamily="system-ui" fontSize="11" fontWeight="600" fill="#00D1B2">Nuova corsa</text>

    {/* Volo e guadagno */}
    <text x="50" y="110" fontFamily="system-ui" fontSize="22" fontWeight="800" fill="#FFFFFF">AZ 1234</text>
    <text x="200" y="110" fontFamily="system-ui" fontSize="22" fontWeight="800" fill="#00D1B2">€ 186</text>

    {/* Route line */}
    <circle cx="50" cy="140" r="5" fill="#00D1B2"/>
    <line x1="50" y1="148" x2="50" y2="172" stroke="#2A2A2A" strokeWidth="1.5" strokeDasharray="4,3"/>
    <rect x="44" y="173" width="12" height="12" rx="3" fill="#00D1B2"/>

    <text x="66" y="145" fontFamily="system-ui" fontSize="12" fill="#A1A1AA">Aeroporto di Catania (CTA)</text>
    <text x="66" y="180" fontFamily="system-ui" fontSize="12" fontWeight="600" fill="#FFFFFF">Taormina, Via Teatro Greco</text>

    {/* Passeggeri */}
    <rect x="50" y="196" width="60" height="18" rx="9" fill="#1F1F1F" stroke="#2A2A2A" strokeWidth="1"/>
    <text x="80" y="209" textAnchor="middle" fontFamily="system-ui" fontSize="11" fill="#A1A1AA">4 pax</text>
    <rect x="120" y="196" width="65" height="18" rx="9" fill="#1F1F1F" stroke="#2A2A2A" strokeWidth="1"/>
    <text x="153" y="209" textAnchor="middle" fontFamily="system-ui" fontSize="11" fill="#A1A1AA">52 km</text>

    {/* Pulsante accetta */}
    <rect x="50" y="188" width="240" height="0" rx="0" fill="none"/>
    {/* Azioni */}
    <rect x="162" y="186" width="100" height="18" rx="0" fill="none"/>

    {/* Card secondaria — statistiche driver */}
    <rect x="210" y="170" width="220" height="110" rx="16" fill="#0F0F0F" stroke="#00D1B2" strokeWidth="1" opacity="0.9"/>

    <text x="228" y="195" fontFamily="system-ui" fontSize="11" fontWeight="600" fill="#A1A1AA">I tuoi guadagni</text>

    {/* Stats row */}
    <text x="228" y="225" fontFamily="system-ui" fontSize="28" fontWeight="800" fill="#00D1B2">€2.340</text>
    <text x="228" y="242" fontFamily="system-ui" fontSize="11" fill="#555">questo mese</text>

    {/* Mini bar chart */}
    {[18, 28, 22, 36, 42, 30, 48].map((h, i) => (
      <rect key={i} x={228 + i * 24} y={268 + (52 - h)} width="16" height={h} rx="4"
        fill={i === 6 ? '#00D1B2' : '#1A1A1A'} stroke={i === 6 ? 'none' : '#2A2A2A'} strokeWidth="1"/>
    ))}

    {/* Card rating — in alto a destra */}
    <rect x="310" y="40" width="120" height="72" rx="14" fill="#161616" stroke="#2A2A2A" strokeWidth="1.5"/>
    <text x="370" y="65" textAnchor="middle" fontFamily="system-ui" fontSize="26" fontWeight="800" fill="#FFFFFF">4.9</text>
    {/* Stelle */}
    {[0,1,2,3,4].map((i) => (
      <rect key={i} x={325 + i * 18} y="74" width="12" height="12" rx="3"
        fill={i < 5 ? '#00D1B2' : '#2A2A2A'} opacity="0.9"/>
    ))}
    <text x="370" y="104" textAnchor="middle" fontFamily="system-ui" fontSize="10" fill="#555">valutazione media</text>

    {/* Decorative dots */}
    <circle cx="400" cy="200" r="3" fill="#00D1B2" opacity="0.4"/>
    <circle cx="420" cy="230" r="2" fill="#00D1B2" opacity="0.3"/>
    <circle cx="390" cy="260" r="4" fill="#00D1B2" opacity="0.2"/>
    <circle cx="40" cy="320" r="3" fill="#00D1B2" opacity="0.3"/>
    <circle cx="20" cy="280" r="2" fill="#00D1B2" opacity="0.2"/>
  </svg>
);

// Earnings: bar chart pulito con badge "100% tuo"
const EarningsIllustration = () => (
  <svg viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-xs mx-auto">
    {/* Griglia sfondo */}
    {[40, 80, 120, 160].map((y) => (
      <line key={y} x1="20" y1={y} x2="280" y2={y} stroke="#1A1A1A" strokeWidth="1"/>
    ))}

    {/* Barre */}
    {[
      { x: 30,  h: 60,  w: 30 },
      { x: 75,  h: 90,  w: 30 },
      { x: 120, h: 75,  w: 30 },
      { x: 165, h: 115, w: 30 },
      { x: 210, h: 140, w: 30 },
    ].map((b, i) => (
      <g key={i}>
        <rect x={b.x} y={172 - b.h} width={b.w} height={b.h} rx="6"
          fill={i === 4 ? '#00D1B2' : '#1A1A1A'} stroke={i === 4 ? 'none' : '#2A2A2A'} strokeWidth="1"/>
        {/* Valore sulla barra più alta */}
        {i === 4 && (
          <>
            <rect x="200" y="14" width="50" height="20" rx="8" fill="#00D1B2"/>
            <text x="225" y="28" textAnchor="middle" fontFamily="system-ui" fontSize="10" fontWeight="700" fill="#0B0B0B">100% tuo</text>
          </>
        )}
      </g>
    ))}

    {/* Freccia trend */}
    <polyline points="45,155 90,130 135,145 180,110 225,85"
      stroke="#00D1B2" strokeWidth="2" strokeDasharray="5,3" fill="none" strokeLinecap="round"/>

    {/* Label y-axis */}
    <text x="275" y="172" fontFamily="system-ui" fontSize="10" fill="#555" textAnchor="end">€0</text>
    <text x="275" y="85" fontFamily="system-ui" fontSize="10" fill="#555" textAnchor="end">€200</text>
  </svg>
);

// Flex: calendario settimana pulito
const FlexIllustration = () => (
  <svg viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-xs mx-auto">
    {/* Card sfondo */}
    <rect x="20" y="20" width="260" height="165" rx="16" fill="#161616" stroke="#2A2A2A" strokeWidth="1.5"/>

    {/* Header mese */}
    <text x="40" y="50" fontFamily="system-ui" fontSize="13" fontWeight="700" fill="#FFFFFF">Maggio 2026</text>
    <text x="240" y="50" textAnchor="end" fontFamily="system-ui" fontSize="11" fill="#00D1B2">Tu scegli</text>

    {/* Separatore */}
    <line x1="30" y1="60" x2="270" y2="60" stroke="#2A2A2A" strokeWidth="1"/>

    {/* Giorni settimana */}
    {['L','M','M','G','V','S','D'].map((g, i) => (
      <text key={i} x={44 + i * 33} y="78" fontFamily="system-ui" fontSize="11" fill="#555" textAnchor="middle">{g}</text>
    ))}

    {/* Celle giorni — row 1 */}
    {[
      {n:1,  active:false}, {n:2,  active:true},  {n:3,  active:false},
      {n:4,  active:true},  {n:5,  active:false},  {n:6,  active:true},  {n:7, active:false},
    ].map((d, i) => (
      <g key={i}>
        {d.active && <circle cx={44 + i * 33} cy={104} r={14} fill="#00D1B2"/>}
        <text x={44 + i * 33} y={108} textAnchor="middle"
          fontFamily="system-ui" fontSize="13" fontWeight={d.active ? '700' : '400'}
          fill={d.active ? '#0B0B0B' : '#A1A1AA'}>{d.n}</text>
      </g>
    ))}

    {/* Row 2 */}
    {[
      {n:8, active:false}, {n:9, active:false}, {n:10,active:true},
      {n:11,active:false}, {n:12,active:true},  {n:13,active:false}, {n:14,active:true},
    ].map((d, i) => (
      <g key={i}>
        {d.active && <circle cx={44 + i * 33} cy={138} r={14} fill="#00D1B2" opacity="0.7"/>}
        <text x={44 + i * 33} y={142} textAnchor="middle"
          fontFamily="system-ui" fontSize="13" fontWeight={d.active ? '700' : '400'}
          fill={d.active ? '#0B0B0B' : '#A1A1AA'}>{d.n}</text>
      </g>
    ))}

    {/* Footer card */}
    <text x="150" y="172" textAnchor="middle" fontFamily="system-ui" fontSize="10" fill="#555">Accetti solo le corse che vuoi</text>
  </svg>
);

// App: telefono con notifica pulito
const AppIllustration = () => (
  <svg viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-xs mx-auto">
    {/* Telefono */}
    <rect x="95" y="10" width="110" height="185" rx="20" fill="#0F0F0F" stroke="#2A2A2A" strokeWidth="2"/>
    <rect x="103" y="22" width="94" height="161" rx="12" fill="#161616"/>
    {/* Notch */}
    <rect x="130" y="14" width="40" height="8" rx="4" fill="#0F0F0F"/>

    {/* Status bar */}
    <text x="113" y="38" fontFamily="system-ui" fontSize="8" fill="#555">09:41</text>
    <rect x="175" y="31" width="12" height="6" rx="2" fill="#2A2A2A"/>
    <rect x="175" y="31" width="9" height="6" rx="2" fill="#00D1B2"/>

    {/* Notifica */}
    <rect x="109" y="48" width="82" height="52" rx="10" fill="#1A1A1A" stroke="#2A2A2A" strokeWidth="1"/>
    <circle cx="120" cy="60" r="6" fill="#00D1B2" opacity="0.2"/>
    <circle cx="120" cy="60" r="3" fill="#00D1B2"/>
    <text x="130" y="58" fontFamily="system-ui" fontSize="8" fontWeight="700" fill="#FFFFFF">Nuova corsa</text>
    <text x="130" y="68" fontFamily="system-ui" fontSize="7" fill="#A1A1AA">AZ1234 → Palermo</text>
    <text x="109" y="90" fontFamily="system-ui" fontSize="16" fontWeight="800" fill="#00D1B2">€ 186</text>
    <text x="165" y="90" fontFamily="system-ui" fontSize="8" fill="#555">guadagno</text>

    {/* Pulsante accetta */}
    <rect x="109" y="108" width="82" height="28" rx="10" fill="#00D1B2"/>
    <text x="150" y="126" textAnchor="middle" fontFamily="system-ui" fontSize="11" fontWeight="700" fill="#0B0B0B">Accetta</text>

    {/* Rifiuta */}
    <text x="150" y="152" textAnchor="middle" fontFamily="system-ui" fontSize="10" fill="#555">Rifiuta</text>

    {/* Home indicator */}
    <rect x="135" y="172" width="30" height="3" rx="2" fill="#2A2A2A"/>

    {/* Glow esterno */}
    <ellipse cx="150" cy="100" rx="60" ry="95" stroke="#00D1B2" strokeWidth="0.5" opacity="0.15"/>
  </svg>
);

// ── FAQ ────────────────────────────────────────────────────────────

const faqs = [
  {
    q: 'Dove opera Flanvo?',
    a: 'Flanvo è attivo negli aeroporti di Catania, Palermo, Cagliari, Roma Fiumicino, Milano Malpensa, Milano Orio al Serio, Napoli e Bari. Stiamo espandendo in nuovi scali ogni mese.',
  },
  {
    q: 'Quali sono i requisiti per guidare con Flanvo?',
    a: 'Devi avere: patente di guida valida, Certificato di Qualificazione del Conducente (CQC), licenza NCC rilasciata dal comune, assicurazione commerciale per il trasporto di persone e un veicolo in regola con la revisione.',
  },
  {
    q: 'Come vengo pagato e quanto ricevo?',
    a: 'Ricevi il 100% della tariffa di trasporto. Flanvo applica una quota di servizio separata direttamente ai passeggeri — tu non cedi nulla del tuo guadagno. Il pagamento arriva sul tuo conto via Stripe Connect entro 2 giorni lavorativi dal drop-off.',
  },
  {
    q: 'Posso scegliere quali corse accettare?',
    a: 'Sì, sempre. Ricevi una notifica push per ogni corsa disponibile nel tuo aeroporto di operatività e decidi tu se accettare. Nessun obbligo di turno e nessuna penale per i rifiuti.',
  },
  {
    q: 'Quanti passeggeri trasporto per corsa?',
    a: "Da 2 a 7 passeggeri dello stesso volo, con destinazioni simili. L'algoritmo raggruppa i passeggeri automaticamente e ottimizza il percorso per massimizzare il tuo guadagno per chilometro.",
  },
  {
    q: 'Quanto posso guadagnare in media?',
    a: 'Dipende dalla distanza e dalla frequenza con cui accetti le corse. Integrando Flanvo nella tua operatività puoi aumentare significativamente il numero di corse mensili, mantenendo sempre il 100% della tariffa su ogni tratta.',
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
            Più corse. Guadagno garantito.
          </h2>
          <p className="text-ink-secondary text-center mb-14 max-w-xl mx-auto">
            Flanvo riempie il tuo calendario. Corse pianificate e prevedibili. <strong className="text-white">Zero commissioni</strong> sul tuo guadagno.
          </p>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="text-center">
              <EarningsIllustration />
              <h3 className="text-lg font-bold text-white mt-5 mb-2">Ricevi il 100% della tariffa</h3>
              <p className="text-ink-secondary text-sm leading-relaxed">
                Integrando Flanvo nella tua operatività ricevi più corse ogni mese, sempre al 100% della tariffa. Nessuna commissione sul tuo guadagno, coordinamento ottimale al punto di pick-up.
              </p>
            </div>
            <div className="text-center">
              <FlexIllustration />
              <h3 className="text-lg font-bold text-white mt-5 mb-2">Scegli quando guidare</h3>
              <p className="text-ink-secondary text-sm leading-relaxed">
                Accetti solo le corse che vuoi. Nessun turno obbligatorio, nessuna penale per i rifiuti. Sei tu il capo del tuo orario.
              </p>
            </div>
            <div className="text-center">
              <AppIllustration />
              <h3 className="text-lg font-bold text-white mt-5 mb-2">Gestisci tutto dall'app</h3>
              <p className="text-ink-secondary text-sm leading-relaxed">
                Ricevi notifiche per le corse nel tuo aeroporto, accetta con un tap e vedi il guadagno stimato prima di confermare.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TIMELINE CORSA ───────────────────────────── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Come funziona una corsa</h2>
          <p className="text-ink-secondary mb-14">Dal volo al pagamento — ecco cosa succede ogni volta che accetti una corsa Flanvo.</p>

          {/* Steps data */}
          {(() => {
            const steps = [
              { n: '1', title: 'Il gruppo si forma',         body: 'Flanvo raggruppa automaticamente i passeggeri dello stesso volo verso destinazioni simili.' },
              { n: '2', title: 'Notifica e accettazione',    body: 'Ricevi volo, destinazione e guadagno stimato. Accetti in 1 tap — hai qualche minuto per decidere.' },
              { n: '3', title: 'Volo atterrato',             body: "Ricevi notifica all'atterraggio. L'app ti guida al punto di incontro Flanvo dell'aeroporto." },
              { n: '4', title: 'Chat con i passeggeri',      body: 'Comunicazione live con il gruppo durante l\'attesa al ritiro bagagli.' },
              { n: '5', title: 'Ritiri i passeggeri',        body: 'I passeggeri ti trovano al punto Flanvo. L\'app calcola il percorso ottimizzato tra i drop-off.' },
              { n: '6', title: 'Pagamento automatico',       body: "All'ultimo drop-off il pagamento viene trasferito su Stripe Connect. Zero attese." },
            ];
            const last = steps.length - 1;
            return (
              <>
                {/* Desktop: orizzontale scrollabile */}
                <div className="hidden md:block overflow-x-auto pb-2">
                  <div className="relative">
                    <div className="absolute top-6 left-[8%] right-[8%] h-px bg-gradient-to-r from-primary-500/10 via-primary-500/50 to-primary-500" />
                    <div className="grid grid-cols-6 gap-4">
                      {steps.map((step, i) => (
                        <div key={i} className="flex flex-col items-center text-center px-1">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 relative z-10 border-2 shrink-0 ${
                            i === last ? 'bg-primary-500 border-primary-500' : 'bg-surface-2 border-surface-5'
                          }`}>
                            <span className={`text-sm font-bold ${i === last ? 'text-[#0B0B0B]' : 'text-primary-400'}`}>{step.n}</span>
                          </div>
                          <h4 className="text-xs font-bold text-white mb-1.5 leading-snug">{step.title}</h4>
                          <p className="text-[11px] text-ink-muted leading-relaxed">{step.body}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mobile: verticale */}
                <div className="md:hidden relative pl-8">
                  <div className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-primary-500/20 via-primary-500/50 to-primary-500" />
                  <div className="space-y-7">
                    {steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 -ml-4 relative z-10 ${
                          i === last ? 'bg-primary-500 border-primary-500' : 'bg-surface-2 border-surface-5'
                        }`}>
                          <span className={`text-xs font-bold ${i === last ? 'text-[#0B0B0B]' : 'text-primary-400'}`}>{step.n}</span>
                        </div>
                        <div className="pb-1">
                          <h4 className="text-sm font-bold text-white mb-1">{step.title}</h4>
                          <p className="text-xs text-ink-muted leading-relaxed">{step.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}
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
                body: 'Stripe Connect trasferisce il 100% della tariffa di trasporto direttamente sul tuo conto bancario entro 2 giorni lavorativi. Zero contanti, zero rischi.',
                link: { label: 'Leggi i termini di pagamento', href: '/terms' },
              },
              {
                icon: <MessageCircle className="w-6 h-6 text-primary-400" />,
                title: 'Supporto dedicato',
                body: "Il nostro assistente AI è disponibile 24 ore su 24. Per problemi urgenti durante la corsa, hai un canale di supporto prioritario.",
                link: null,
              },
              {
                icon: <Shield className="w-6 h-6 text-primary-400" />,
                title: 'Passeggeri verificati',
                body: "Tutti i passeggeri sono registrati su Flanvo. Sai sempre chi stai trasportando prima di accettare la corsa — nome, numero di passeggeri e destinazione.",
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
        <p className="text-sm text-ink-secondary hidden sm:block">Approva in 48 ore · 100% della tariffa · Nessun obbligo di turno</p>
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
