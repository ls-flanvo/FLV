import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = { title: 'Chi siamo — Flanvo' };

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink-secondary mb-8 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Home
      </Link>
      <h1 className="text-3xl font-bold text-white mb-2">Chi siamo</h1>
      <p className="text-ink-muted text-sm mb-12">La storia e la missione di Flanvo.</p>

      {/* Contenuto da popolare */}
      <div className="space-y-8 text-ink-secondary leading-relaxed">
        <p className="text-lg">Pagina in arrivo.</p>
      </div>

      {/* Dati azienda */}
      <div id="dati" className="mt-16 pt-10 border-t border-surface-4">
        <h2 className="text-xl font-bold text-white mb-6">Dati dell&apos;azienda</h2>
        <div className="space-y-2 text-sm text-ink-secondary">
          <p><span className="text-ink-muted">Ragione sociale:</span> Flanvo S.r.l.</p>
          <p><span className="text-ink-muted">Sede:</span> Catania, Italia</p>
          <p><span className="text-ink-muted">Email:</span> <a href="mailto:hello@flanvo.com" className="text-primary-400 hover:text-primary-300 transition-colors">hello@flanvo.com</a></p>
        </div>
      </div>
    </div>
  );
}
