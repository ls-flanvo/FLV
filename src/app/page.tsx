import Link from 'next/link';
import Image from 'next/image';
import { Plane, Users, DollarSign, Clock, Shield, Zap, ArrowRight, Star, CheckCircle } from 'lucide-react';
import HomeFAQ from '@/components/HomeFAQ';

export default function LandingPage() {
  return (
    <div className="bg-[#0B0B0B]">
      {/* Hero — sezione full-width, contenuto centrato */}
      <section className="relative w-full pt-24 pb-20 text-center overflow-hidden">

        {/* Immagini a larghezza schermo intera — ciascuna copre il 45% */}
        <div className="absolute inset-0 pointer-events-none hidden lg:block">
          {/* Aereo — sinistra */}
          <div className="absolute left-0 top-0 bottom-0 w-[45%]">
            <Image
              src="/images/hero-airplane.jpg"
              alt=""
              fill
              className="object-cover object-center opacity-85"
              priority
            />
            {/* Sfumatura verso destra — si dissolve al centro */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0B]/0 via-[#0B0B0B]/30 to-[#0B0B0B]" />
          </div>

          {/* Gruppo + driver — destra */}
          <div className="absolute right-0 top-0 bottom-0 w-[45%]">
            <Image
              src="/images/hero-group-driver.jpg"
              alt=""
              fill
              className="object-cover object-center opacity-85"
              priority
            />
            {/* Sfumatura verso sinistra — si dissolve al centro */}
            <div className="absolute inset-0 bg-gradient-to-l from-[#0B0B0B]/0 via-[#0B0B0B]/30 to-[#0B0B0B]" />
          </div>
        </div>

        {/* Contenuto centrato */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 rounded-full px-4 py-1.5 text-xs font-semibold text-primary-400 mb-8">
            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
            Carpooling aeroportuale intelligente
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight">
            Il tuo aeroporto,<br />
            <span className="text-gradient">condiviso.</span>
          </h1>
          <p className="text-xl text-ink-secondary mb-10 max-w-2xl mx-auto leading-relaxed">
            Atterri. Flanvo ha già raggruppato i passeggeri del tuo volo verso destinazioni simili alla tua.{' '}
            <strong className="text-white">Stesso van, meno spesa.</strong>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup"
              className="flex items-center justify-center gap-2 bg-primary-500 text-[#0B0B0B] px-8 py-4 rounded-2xl text-base font-bold hover:bg-primary-400 transition-all shadow-teal active:scale-95">
              Inizia gratis <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login"
              className="flex items-center justify-center gap-2 bg-surface-2 border border-surface-5 text-white px-8 py-4 rounded-2xl text-base font-semibold hover:border-surface-4 hover:bg-surface-3 transition-all active:scale-95">
              Ho già un account
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-6 mt-10 text-sm text-ink-muted">
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-2">
                {['M','L','G','A'].map((l, i) => (
                  <div key={i} className="w-7 h-7 rounded-full bg-primary-500/20 border-2 border-[#0B0B0B] flex items-center justify-center text-xs font-bold text-primary-400">{l}</div>
                ))}
              </div>
              <span>500+ viaggiatori</span>
            </div>
            <span>·</span>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-warning fill-warning" />
              <span className="font-semibold text-white">4.9</span>
              <span>media</span>
            </div>
            <span>·</span>
            <span>Price-lock garantito</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="prezzi" className="border-y border-surface-4 bg-surface-1">
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-3 gap-8 text-center">
          {[
            { value: 'Fino al 60%', label: 'di risparmio vs taxi privato' },
            { value: 'Paghi solo i tuoi km', label: 'nessuna divisione fissa' },
            { value: 'Price-lock', label: 'prezzo bloccato prima di salire' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-3xl md:text-4xl font-black text-primary-400 mb-1">{value}</p>
              <p className="text-ink-muted text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works — timeline passeggero */}
      <section id="come-funziona" className="max-w-7xl mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Come funziona</h2>
          <p className="text-ink-secondary">Dalla ricerca al pickup. Paghi solo i km percorsi con te a bordo.</p>
        </div>

        {(() => {
          const steps = [
            { n: '1', title: 'Cerca la tua corsa',    body: 'Inserisci il codice volo e la destinazione. L\'algoritmo trova i passeggeri del tuo stesso volo diretti nella tua zona.' },
            { n: '2', title: 'Conferma il posto',      body: 'Blocchi il posto nel gruppo con una pre-autorizzazione. Nessun addebito ora — paghi all\'accettazione del driver.' },
            { n: '3', title: 'Premi "Sono qui"',       body: 'Atterri, ritiri i bagagli e premi il pulsante. Il driver NCC raggiunge il punto di incontro in 5-10 minuti.' },
            { n: '4', title: 'Arrivi a destinazione',  body: 'Il driver ti porta a casa. Paghi solo i tuoi km effettivi — nessuna divisione fissa del costo totale.' },
          ];
          const last = steps.length - 1;
          return (
            <>
              {/* Desktop */}
              <div className="hidden md:block relative">
                <div className="absolute top-8 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-surface-4 via-primary-500/50 to-primary-500" />
                <div className="grid grid-cols-4 gap-8">
                  {steps.map((step, i) => (
                    <div key={i} className="flex flex-col items-center text-center px-2">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 relative z-10 border-2 shrink-0 shadow-lg ${
                        i === last
                          ? 'bg-primary-500 border-primary-500 shadow-teal'
                          : 'bg-surface-2 border-primary-500/30'
                      }`}>
                        <span className={`text-xl font-black ${i === last ? 'text-[#0B0B0B]' : 'text-primary-400'}`}>{step.n}</span>
                      </div>
                      <h4 className="text-base font-bold text-white mb-2 leading-snug">{step.title}</h4>
                      <p className="text-sm text-ink-muted leading-relaxed">{step.body}</p>
                    </div>
                  ))}
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
      </section>

      {/* Why Flanvo — bento grid */}
      <section id="aeroporti" className="bg-surface-1 border-t border-surface-4 py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Perché scegliere Flanvo</h2>
            <p className="text-ink-secondary">Costruito per i viaggiatori che sanno cosa vogliono</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Card 1 — Featured: Risparmio (3 col, tall) */}
            <div className="md:col-span-3 bg-gradient-to-br from-primary-500/15 via-primary-500/8 to-transparent border border-primary-500/25 rounded-3xl p-8 relative overflow-hidden group hover:border-primary-500/40 transition-all">
              <p className="text-7xl font-black text-primary-400 mb-1 leading-none">60%</p>
              <p className="text-xs font-semibold text-primary-400/60 uppercase tracking-widest mb-4">di risparmio medio</p>
              <h3 className="text-xl font-bold text-white mb-2">Risparmia su ogni viaggio</h3>
              <p className="text-ink-secondary text-sm leading-relaxed">Riduci i costi del trasporto aeroportuale rispetto a taxi e NCC privati. Più siete, meno paga ognuno.</p>
            </div>

            {/* Card 2 — Sicurezza (3 col) */}
            <div className="md:col-span-3 bg-surface-2 border border-surface-5 rounded-3xl p-8 relative overflow-hidden group hover:border-primary-500/20 hover:bg-surface-3 transition-all">
              <div className="w-14 h-14 bg-primary-500/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-primary-500/20 transition-all">
                <Shield className="w-7 h-7 text-primary-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Viaggia in sicurezza</h3>
              <p className="text-ink-secondary text-sm leading-relaxed mb-5">Autisti NCC verificati con CQC e licenza comunale. Passeggeri del tuo stesso volo. Pagamenti protetti da Stripe.</p>
              <div className="flex gap-2 flex-wrap">
                {['CQC certificato', 'Stripe PCI DSS', 'Stesso volo'].map(tag => (
                  <span key={tag} className="text-xs font-semibold text-primary-400 bg-primary-500/10 px-3 py-1 rounded-full border border-primary-500/20">{tag}</span>
                ))}
              </div>
            </div>

            {/* Card 3 — Voli in ritardo (2 col) */}
            <div className="md:col-span-2 bg-surface-2 border border-surface-5 rounded-3xl p-6 group hover:border-primary-500/20 hover:bg-surface-3 transition-all">
              <Clock className="w-8 h-8 text-primary-400 mb-4" />
              <h3 className="font-bold text-white mb-2">Volo in ritardo?</h3>
              <p className="text-ink-muted text-sm leading-relaxed">Il gruppo si adatta automaticamente. Il driver riceve il nuovo orario in tempo reale.</p>
            </div>

            {/* Card 4 — Velocità (2 col) */}
            <div className="md:col-span-2 bg-surface-2 border border-surface-5 rounded-3xl p-6 group hover:border-primary-500/20 hover:bg-surface-3 transition-all">
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-black text-primary-400">2</span>
                <span className="text-lg font-bold text-primary-400/60">min</span>
              </div>
              <h3 className="font-bold text-white mb-2">Prenotazione rapida</h3>
              <p className="text-ink-muted text-sm leading-relaxed">Dal codice volo al checkout. Nessuna registrazione per vedere i prezzi.</p>
            </div>

            {/* Card 5 — Algoritmo (2 col) */}
            <div className="md:col-span-2 bg-surface-2 border border-surface-5 rounded-3xl p-6 group hover:border-primary-500/20 hover:bg-surface-3 transition-all">
              <Users className="w-8 h-8 text-primary-400 mb-4" />
              <h3 className="font-bold text-white mb-2">Gruppo del tuo volo</h3>
              <p className="text-ink-muted text-sm leading-relaxed">Solo passeggeri con destinazioni simili. L'algoritmo ottimizza il percorso per tutti.</p>
            </div>

            {/* Card 6 — Zero stress (6 col, wide) */}
            <div className="md:col-span-6 bg-gradient-to-r from-surface-2 via-surface-3 to-surface-2 border border-surface-5 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6 group hover:border-primary-500/20 transition-all">
              <div className="w-16 h-16 bg-primary-500/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-primary-500/20 transition-all">
                <Plane className="w-8 h-8 text-primary-400" />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-xl font-bold text-white mb-1">Zero stress dall&apos;atterraggio alla porta di casa</h3>
                <p className="text-ink-secondary text-sm">Atterri, premi &quot;Sono qui&quot; sull&apos;app, il driver NCC raggiunge il punto di incontro in 5-10 minuti. Tracking live, chat diretta, nessuna sorpresa sul prezzo.</p>
              </div>
              <div className="ml-auto shrink-0 hidden md:block">
                <div className="flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 rounded-2xl px-5 py-3">
                  <CheckCircle className="w-5 h-5 text-primary-400" />
                  <span className="text-sm font-bold text-primary-400">Price-lock garantito</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ passeggeri */}
      <section className="max-w-3xl mx-auto px-4 py-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-2">Domande frequenti</h2>
          <p className="text-ink-secondary text-sm">Tutto quello che vuoi sapere prima di prenotare.</p>
        </div>
        <HomeFAQ />
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-teal-gradient opacity-10" />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-5">
            Pronto per il tuo prossimo volo?
          </h2>
          <p className="text-ink-secondary text-lg mb-8">
            Unisciti ai viaggiatori che hanno già scoperto il modo smart di andare in aeroporto
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup"
              className="flex items-center justify-center gap-2 bg-primary-500 text-[#0B0B0B] px-8 py-4 rounded-2xl font-bold hover:bg-primary-400 transition-all shadow-teal">
              Registrati gratis <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/driver/signup"
              className="flex items-center justify-center gap-2 bg-surface-2 border border-surface-5 text-white px-8 py-4 rounded-2xl font-semibold hover:border-surface-4 transition-all">
              Diventa autista
            </Link>
          </div>
          <div className="flex items-center justify-center gap-4 mt-8 text-xs text-ink-muted">
            {['Nessuna carta richiesta per cercare', 'Price-lock garantito', 'Cancellazione gratuita pre-match'].map((t, i) => (
              <span key={i} className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-primary-400" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
