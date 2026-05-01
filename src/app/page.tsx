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
              className="object-cover object-center opacity-55"
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
              className="object-cover object-center opacity-55"
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
      <section id="come-funziona" className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Come funziona</h2>
          <p className="text-ink-secondary">Dalla ricerca al pickup. Paghi solo i km percorsi con te a bordo.</p>
        </div>

        {(() => {
          const steps = [
            { n: '1', title: 'Cerca la tua corsa',    body: 'Inserisci il codice volo e la destinazione che vuoi raggiungere una volta atterrato. L\'algoritmo trova i passeggeri del tuo stesso volo diretti nella tua zona.' },
            { n: '2', title: 'Conferma il posto',      body: 'Blocchi il posto nel gruppo con una pre-autorizzazione. Nessun addebito ora — paghi solo a destinazione.' },
            { n: '3', title: 'Il driver ti aspetta',   body: 'Atterri e ricevi nome, veicolo e orario di incontro. Il driver ti aspetta al punto Flanvo dopo il ritiro bagagli. Chat live disponibile.' },
            { n: '4', title: 'Drop-off e pagamento',   body: 'Arrivi a destinazione. Viene addebitato solo il tuo prezzo, calcolato sui chilometri effettivamente percorsi con te a bordo.' },
          ];
          const last = steps.length - 1;
          return (
            <>
              {/* Desktop */}
              <div className="hidden md:block relative">
                <div className="absolute top-6 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-primary-500/30 via-primary-500/60 to-primary-500" />
                <div className="grid grid-cols-4 gap-6">
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

              {/* Mobile */}
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
      </section>

      {/* Why Flanvo */}
      <section id="aeroporti" className="bg-surface-1 border-t border-surface-4 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Perché scegliere Flanvo</h2>
            <p className="text-ink-secondary">Costruito per i viaggiatori che sanno cosa vogliono</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: DollarSign, title: 'Risparmia denaro', desc: 'Riduci i costi del trasporto aeroportuale fino al 60–78% rispetto a taxi e NCC privati.' },
              { icon: Shield, title: 'Viaggia sicuro', desc: 'Autisti verificati con CQC, passeggeri del tuo stesso volo, pagamenti Stripe protetti.' },
              { icon: Clock, title: 'Gestione ritardi', desc: 'Monitoraggio in tempo reale dei voli. Se il tuo volo ritarda, il gruppo si adatta automaticamente.' },
              { icon: Zap, title: 'Prenotazione rapida', desc: 'Dal codice volo al checkout in meno di 2 minuti. Nessuna registrazione per visualizzare i prezzi.' },
              { icon: Users, title: 'Gruppo verificato', desc: 'Solo passeggeri del tuo stesso volo. Destinazioni simili raggruppate dall\'algoritmo.' },
              { icon: Plane, title: 'Zero stress', desc: 'Il driver ti aspetta all\'uscita bagagli. Tracking in tempo reale su WhatsApp o web.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-surface-2 border border-surface-5 rounded-2xl p-5 hover:border-surface-4 hover:bg-surface-3 transition-all group">
                <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-500/20 transition-all">
                  <Icon className="w-5 h-5 text-primary-400" />
                </div>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-ink-muted text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
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
