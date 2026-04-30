import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata = { title: 'Blog — Flanvo' };

export default function BlogPage() {
  return (
    <div className="bg-[#0B0B0B] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink-secondary mb-10 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Home
        </Link>

        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">Blog</h1>
        <p className="text-ink-secondary mb-14">Notizie, aggiornamenti e consigli di viaggio.</p>

        <div className="text-center py-20 border border-surface-4 rounded-2xl bg-surface-1">
          <p className="text-white font-bold mb-2">In arrivo</p>
          <p className="text-sm text-ink-muted mb-6">
            Stiamo preparando i primi articoli su trasporto aeroportuale, risparmio e mobilità condivisa.
          </p>
          <a
            href="mailto:hello@flanvo.com?subject=Newsletter Flanvo"
            className="inline-flex items-center gap-2 bg-primary-500 text-[#0B0B0B] px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-400 transition-all"
          >
            Avvisami quando esce <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
