'use client';

import Link from 'next/link';
import Image from 'next/image';
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
// No-show: confronto metodo tradizionale vs Flanvo
const NoShowIllustration = () => (
  <svg viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-xs mx-auto">
    {/* Sfondo diviso */}
    <rect x="20" y="20" width="118" height="160" rx="14" fill="#161616" stroke="#2A2A2A" strokeWidth="1.5"/>
    <rect x="162" y="20" width="118" height="160" rx="14" fill="#0F1F1C" stroke="#00D1B2" strokeWidth="1.5" opacity="0.7"/>

    {/* Label sinistra: Tradizionale */}
    <text x="79" y="42" textAnchor="middle" fontFamily="system-ui" fontSize="9" fontWeight="700" fill="#666">A chiamata</text>

    {/* Telefono che suona */}
    <rect x="55" y="52" width="48" height="68" rx="10" fill="#1A1A1A" stroke="#333" strokeWidth="1"/>
    <text x="79" y="92" textAnchor="middle" fontFamily="system-ui" fontSize="22">📵</text>

    {/* Frecce incerte */}
    <text x="79" y="136" textAnchor="middle" fontFamily="system-ui" fontSize="9" fill="#555">Risponde?</text>
    <text x="44" y="155" fontFamily="system-ui" fontSize="8" fill="#555">Forse sì</text>
    <text x="90" y="155" fontFamily="system-ui" fontSize="8" fill="#555">Forse no</text>
    <line x1="79" y1="139" x2="52" y2="148" stroke="#444" strokeWidth="1" strokeDasharray="3,2"/>
    <line x1="79" y1="139" x2="100" y2="148" stroke="#444" strokeWidth="1" strokeDasharray="3,2"/>

    {/* X rossa */}
    <circle cx="79" cy="172" r="8" fill="#EF444420"/>
    <text x="79" y="176" textAnchor="middle" fontFamily="system-ui" fontSize="10" fontWeight="700" fill="#EF4444">✕</text>

    {/* Label destra: Flanvo */}
    <text x="221" y="42" textAnchor="middle" fontFamily="system-ui" fontSize="9" fontWeight="700" fill="#00D1B2">Flanvo</text>

    {/* Scudo confermato */}
    <path d="M221 52 L245 62 L245 90 C245 108 221 118 221 118 C221 118 197 108 197 90 L197 62 Z" fill="#00D1B220" stroke="#00D1B2" strokeWidth="1.5"/>
    <text x="221" y="93" textAnchor="middle" fontFamily="system-ui" fontSize="20" fill="#00D1B2">✓</text>

    {/* Badge "confermato" */}
    <rect x="185" y="126" width="72" height="18" rx="9" fill="#00D1B215" stroke="#00D1B230"/>
    <text x="221" y="139" textAnchor="middle" fontFamily="system-ui" fontSize="9" fontWeight="700" fill="#00D1B2">Prenotato e pagato</text>

    {/* Freccia sicura */}
    <rect x="193" y="152" width="56" height="16" rx="6" fill="#00D1B2"/>
    <text x="221" y="164" textAnchor="middle" fontFamily="system-ui" fontSize="9" fontWeight="700" fill="#0B0B0B">Si presenta</text>

    {/* Divisore centrale */}
    <line x1="150" y1="30" x2="150" y2="170" stroke="#2A2A2A" strokeWidth="1" strokeDasharray="4,3"/>
    <text x="150" y="108" textAnchor="middle" fontFamily="system-ui" fontSize="8" fill="#333" transform="rotate(-90,150,108)">VS</text>
  </svg>
);

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
    a: "Ricevi il 100% della tariffa di trasporto. Flanvo applica una quota di servizio separata direttamente ai passeggeri — tu non cedi nulla del tuo guadagno. Il pagamento arriva sul tuo conto via Stripe Connect entro 2 giorni lavorativi dall'accettazione della corsa.",
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
      <section className="relative max-w-7xl mx-auto px-6 pt-20 pb-16 overflow-hidden">

        {/* Immagine driver — sottoposta al testo, lato sinistro */}
        <div className="absolute left-0 top-0 bottom-0 w-[340px] pointer-events-none hidden lg:block">
          <Image
            src="/images/driver-tablet.jpg.png"
            alt=""
            fill
            className="object-cover object-top opacity-95"
            priority
          />
          {/* Sfumatura verso destra per fondersi col background */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0B0B0B]" />
          {/* Sfumatura in basso */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B]/50 via-transparent to-transparent" />
        </div>

        {/* Contenuto — spostato a destra dell'immagine */}
        <div className="grid md:grid-cols-2 gap-12 items-center lg:pl-80">
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
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-8">
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
              <h3 className="text-lg font-bold text-white mt-5 mb-2">Gestisci tutto dall&apos;app</h3>
              <p className="text-ink-secondary text-sm leading-relaxed">
                Ricevi notifiche per le corse nel tuo aeroporto, accetta con un tap e vedi il guadagno stimato prima di confermare. Storico corse, ricevute Stripe e fatturazione — tutto in un posto.
              </p>
            </div>
            <div className="text-center">
              <NoShowIllustration />
              <h3 className="text-lg font-bold text-white mt-5 mb-2">Meno no-show, più certezze</h3>
              <p className="text-ink-secondary text-sm leading-relaxed">
                Con il metodo tradizionale a chiamata il passeggero può non presentarsi senza conseguenze. Su Flanvo il pagamento è confermato prima della corsa — se non si presenta, sei comunque compensato.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TIMELINE CORSA ───────────────────────────── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 text-center">Come funziona una corsa</h2>
          <p className="text-ink-secondary mb-14 text-center">Dal volo al pagamento — ecco cosa succede ogni volta che accetti una corsa Flanvo.</p>

          {/* Steps data */}
          {(() => {
            const steps = [
              { n: '1', title: 'Il gruppo si forma',         body: 'Flanvo raggruppa automaticamente i passeggeri dello stesso volo verso destinazioni simili.' },
              { n: '2', title: 'Notifica e accettazione',    body: 'Ricevi volo, destinazione e guadagno stimato. Accetti in 1 tap — hai qualche minuto per decidere.' },
              { n: '3', title: 'Volo atterrato',             body: "Ricevi notifica all'atterraggio. I passeggeri premono 'Sono qui' quando giungono all'uscita arrivi. Quando il gruppo raggiunge il numero minimo di presenti, raggiungi il punto di incontro dal parcheggio NCC in 5-10 minuti." },
              { n: '4', title: 'Chat con i passeggeri',      body: 'Comunicazione live con il gruppo durante l\'attesa al ritiro bagagli.' },
              { n: '5', title: 'Ritiri i passeggeri',        body: 'I passeggeri ti trovano al punto Flanvo. L\'app calcola il percorso ottimizzato tra i drop-off.' },
              { n: '6', title: 'Pagamento automatico',       body: "All'accettazione della corsa il pagamento viene catturato e trasferito su Stripe Connect. Zero attese." },
            ];
            const last = steps.length - 1;
            return (
              <>
                {/* Desktop */}
                <div className="hidden md:block overflow-x-auto pb-2">
                  <div className="relative">
                    <div className="absolute top-8 left-[8%] right-[8%] h-0.5 bg-gradient-to-r from-surface-4 via-primary-500/50 to-primary-500" />
                    <div className="grid grid-cols-6 gap-4">
                      {steps.map((step, i) => (
                        <div key={i} className="flex flex-col items-center text-center px-1">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 relative z-10 border-2 shrink-0 shadow-lg ${
                            i === last ? 'bg-primary-500 border-primary-500 shadow-teal' : 'bg-surface-2 border-primary-500/30'
                          }`}>
                            <span className={`text-xl font-black ${i === last ? 'text-[#0B0B0B]' : 'text-primary-400'}`}>{step.n}</span>
                          </div>
                          <h4 className="text-sm font-bold text-white mb-2 leading-snug">{step.title}</h4>
                          <p className="text-xs text-ink-muted leading-relaxed">{step.body}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mobile */}
                <div className="md:hidden relative pl-10">
                  <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gradient-to-b from-surface-4 via-primary-500/50 to-primary-500" />
                  <div className="space-y-8">
                    {steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-5">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 -ml-5 relative z-10 ${
                          i === last ? 'bg-primary-500 border-primary-500' : 'bg-surface-2 border-primary-500/30'
                        }`}>
                          <span className={`text-sm font-black ${i === last ? 'text-[#0B0B0B]' : 'text-primary-400'}`}>{step.n}</span>
                        </div>
                        <div className="pb-1 pt-1">
                          <h4 className="text-base font-bold text-white mb-1.5">{step.title}</h4>
                          <p className="text-sm text-ink-muted leading-relaxed">{step.body}</p>
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

      {/* ── COSA OFFRIAMO — bento ─────────────────────── */}
      <section className="bg-surface-1 border-t border-surface-4 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white mb-3">Cosa offriamo ai driver partner</h2>
          <p className="text-ink-secondary mb-12">Il supporto di cui hai bisogno, quando ne hai bisogno.</p>
          <div className="grid md:grid-cols-6 gap-4">
            {/* Featured — Pagamenti */}
            <div className="md:col-span-4 bg-gradient-to-br from-primary-500/15 via-primary-500/8 to-transparent border border-primary-500/25 rounded-3xl p-8 group hover:border-primary-500/40 transition-all">
              <p className="text-6xl font-black text-primary-400 mb-1 leading-none">100%</p>
              <p className="text-xs font-semibold text-primary-400/60 uppercase tracking-widest mb-4">della tariffa a te</p>
              <h3 className="text-xl font-bold text-white mb-2">Pagamenti diretti e sicuri</h3>
              <p className="text-ink-secondary text-sm leading-relaxed mb-5">Stripe Connect trasferisce l&apos;intera tariffa di trasporto direttamente sul tuo conto bancario entro 2 giorni lavorativi dall&apos;accettazione della corsa. Zero contanti, zero rischi, zero commissioni.</p>
              <Link href="/terms" className="text-sm font-semibold text-primary-400 hover:text-primary-300 transition-colors">
                Leggi i termini di pagamento →
              </Link>
            </div>
            {/* Meno no-show */}
            <div className="md:col-span-2 bg-surface-2 border border-surface-5 rounded-3xl p-6 group hover:border-primary-500/20 transition-all">
              <div className="text-3xl font-black text-primary-400 mb-1">-80%</div>
              <p className="text-xs text-ink-muted mb-4">no-show vs metodo tradizionale</p>
              <h3 className="font-bold text-white mb-2">Meno no-show</h3>
              <p className="text-ink-muted text-sm">Il passeggero paga prima di salire. Se non si presenta, sei comunque compensato.</p>
            </div>
            {/* Supporto */}
            <div className="md:col-span-3 bg-surface-2 border border-surface-5 rounded-3xl p-6 group hover:border-primary-500/20 transition-all">
              <div className="w-12 h-12 bg-primary-500/10 rounded-2xl flex items-center justify-center mb-5">
                <MessageCircle className="w-6 h-6 text-primary-400" />
              </div>
              <h3 className="font-bold text-white mb-2">Supporto 24/7</h3>
              <p className="text-ink-secondary text-sm leading-relaxed">Assistente AI sempre disponibile. Canale prioritario per emergenze durante la corsa.</p>
            </div>
            {/* Passeggeri verificati */}
            <div className="md:col-span-3 bg-surface-2 border border-surface-5 rounded-3xl p-6 group hover:border-primary-500/20 transition-all">
              <div className="w-12 h-12 bg-primary-500/10 rounded-2xl flex items-center justify-center mb-5">
                <Shield className="w-6 h-6 text-primary-400" />
              </div>
              <h3 className="font-bold text-white mb-2">Passeggeri verificati</h3>
              <p className="text-ink-secondary text-sm leading-relaxed">Sai sempre chi stai trasportando — nome, destinazione e numero di bagagli prima di accettare.</p>
              <Link href="/sicurezza" className="mt-4 inline-block text-sm font-semibold text-primary-400 hover:text-primary-300 transition-colors">
                Sicurezza Flanvo →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── COME INIZIARE — bento ─────────────────────── */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Pronto a iniziare?</h2>
          <p className="text-ink-secondary mb-12">Tre passi per diventare driver partner Flanvo.</p>
          <div className="grid md:grid-cols-6 gap-4">
            {/* Step 01 — featured */}
            <div className="md:col-span-3 bg-gradient-to-br from-primary-500/15 via-primary-500/8 to-transparent border border-primary-500/25 rounded-3xl p-8 relative overflow-hidden group hover:border-primary-500/40 transition-all">
              <span className="text-6xl font-black text-primary-500/20 absolute top-4 right-6 leading-none">01</span>
              <div className="w-14 h-14 bg-primary-500/15 border border-primary-500/25 rounded-2xl flex items-center justify-center mb-6">
                <Car className="w-7 h-7 text-primary-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Registrati online</h3>
              <p className="text-ink-secondary text-sm leading-relaxed mb-6">Compila il modulo con i dati del tuo veicolo e i tuoi documenti. Il processo richiede meno di 5 minuti.</p>
              <Link href="/driver/signup" className="inline-flex items-center gap-2 bg-primary-500 text-[#0B0B0B] px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-400 transition-all">
                Inizia ora →
              </Link>
            </div>
            {/* Step 02 */}
            <div className="md:col-span-3 bg-surface-2 border border-surface-5 rounded-3xl p-8 relative overflow-hidden group hover:border-primary-500/20 transition-all">
              <span className="text-6xl font-black text-surface-4 absolute top-4 right-6 leading-none">02</span>
              <div className="w-14 h-14 bg-surface-3 border border-surface-5 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-primary-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Verifica documenti</h3>
              <p className="text-ink-secondary text-sm leading-relaxed">Il team Flanvo controlla licenza NCC, CQC e assicurazione commerciale. Ricevi risposta entro 48 ore lavorative.</p>
              <div className="mt-5 inline-flex items-center gap-2 bg-warning/10 border border-warning/20 rounded-xl px-4 py-2 text-xs font-semibold text-warning">
                ⏱ Risposta entro 48 ore
              </div>
            </div>
            {/* Step 03 — wide */}
            <div className="md:col-span-6 bg-surface-2 border border-surface-5 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6 group hover:border-primary-500/20 transition-all">
              <span className="text-8xl font-black text-surface-4 leading-none hidden md:block">03</span>
              <div className="w-14 h-14 bg-success/10 border border-success/20 rounded-2xl flex items-center justify-center shrink-0">
                <CheckCircle className="w-7 h-7 text-success" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Accetta le tue prime corse</h3>
                <p className="text-ink-secondary text-sm leading-relaxed">Una volta approvato, ricevi notifiche per le corse disponibili nel tuo aeroporto. Accetti solo quelle che vuoi — nessun obbligo di turno.</p>
              </div>
              <div className="ml-auto shrink-0 hidden md:flex flex-col gap-2">
                {['Nessun obbligo di turno', '100% della tariffa', 'Pagamento in 48h'].map(t => (
                  <div key={t} className="flex items-center gap-2 text-xs text-success">
                    <CheckCircle className="w-3.5 h-3.5" />{t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── REQUISITI — visual cards ───────────────────── */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white mb-3">Requisiti per guidare</h2>
          <p className="text-ink-secondary mb-10">Flanvo opera nel settore NCC regolamentato. Tutti i requisiti sono obbligatori.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: '🪪', label: 'Documento', title: 'Licenza NCC', desc: 'Rilasciata dal comune di residenza o operatività' },
              { icon: '📋', label: 'Certificazione', title: 'CQC in validità', desc: 'Certificato di Qualificazione del Conducente' },
              { icon: '🛡️', label: 'Assicurazione', title: 'Polizza commerciale', desc: 'Per il trasporto di persone a titolo oneroso' },
              { icon: '🚐', label: 'Veicolo', title: 'Auto o van revisionato', desc: 'Sedan, SUV o van — max 7 posti passeggeri' },
              { icon: '📱', label: 'Tecnologia', title: 'Smartphone', desc: 'Android o iOS per gestire notifiche e corse' },
              { icon: '🏦', label: 'Pagamenti', title: 'Conto bancario IT', desc: 'Per ricevere i pagamenti via Stripe Connect' },
            ].map((req) => (
              <div key={req.title} className="bg-surface-1 border border-surface-4 rounded-2xl p-5 hover:border-primary-500/20 hover:bg-surface-2 transition-all group">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{req.icon}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">{req.label}</span>
                </div>
                <h3 className="font-bold text-white mb-1">{req.title}</h3>
                <p className="text-ink-muted text-sm">{req.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-ink-muted mt-6 text-center">
            Hai dubbi su un requisito? <Link href="/guida-con-noi#faq" className="text-primary-400 hover:text-primary-300">Leggi le FAQ →</Link>
          </p>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────── */}
      <section id="faq" className="bg-surface-1 border-t border-surface-4 py-20">
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
