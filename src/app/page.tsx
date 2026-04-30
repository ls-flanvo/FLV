import Link from 'next/link';
import { Plane, Users, DollarSign, Clock, Shield, Zap, ArrowRight, Star, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="bg-[#0B0B0B]">
      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 rounded-full px-4 py-1.5 text-xs font-semibold text-primary-400 mb-8">
            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
            Carpooling aeroportuale intelligente
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight">
            Il tuo aeroporto,<br />
            <span className="text-gradient">condiviso.</span>
          </h1>
          <p className="text-xl text-ink-secondary mb-10 max-w-2xl mx-auto leading-relaxed">
            Flanvo raggruppa i passeggeri dello stesso volo verso destinazioni simili.
            Risparmio fino al <strong className="text-white">78%</strong> rispetto ai taxi privati.
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
            { value: '40–78%', label: 'Risparmio vs taxi privato' },
            { value: '€0.22', label: 'Fee media per km/passeggero' },
            { value: 'Price-lock', label: 'Prezzo fisso al momento del match' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-3xl md:text-4xl font-black text-primary-400 mb-1">{value}</p>
              <p className="text-ink-muted text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="come-funziona" className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Come funziona</h2>
          <p className="text-ink-secondary">Tre passi. Nessuna sorpresa.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Plane, step: '01', title: 'Inserisci il tuo volo', desc: 'Digita il codice volo e la tua destinazione. L\'app rileva automaticamente l\'aeroporto.' },
            { icon: Users, step: '02', title: 'Trova compagni', desc: 'Il nostro algoritmo DBSCAN raggruppa i passeggeri con destinazioni simili in tempo reale.' },
            { icon: DollarSign, step: '03', title: 'Condividi i costi', desc: 'Il prezzo si divide proporzionalmente alla distanza. Paghi solo per il tuo tratto.' },
          ].map(({ icon: Icon, step, title, desc }) => (
            <div key={step} className="bg-surface-1 border border-surface-4 rounded-2xl p-6 bg-card-gradient hover:border-surface-5 transition-all group">
              <div className="flex items-start gap-4">
                <div className="shrink-0">
                  <div className="w-10 h-10 bg-primary-500/10 border border-primary-500/20 rounded-xl flex items-center justify-center group-hover:bg-primary-500/20 transition-all">
                    <Icon className="w-5 h-5 text-primary-400" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-mono text-ink-muted mb-1">{step}</p>
                  <h3 className="font-bold text-white mb-2">{title}</h3>
                  <p className="text-ink-secondary text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
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
