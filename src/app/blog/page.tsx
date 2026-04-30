import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = { title: 'Blog — Flanvo' };

export default function BlogPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink-secondary mb-8 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Home
      </Link>
      <h1 className="text-3xl font-bold text-white mb-2">Blog</h1>
      <p className="text-ink-muted text-sm mb-12">Notizie, aggiornamenti e consigli di viaggio.</p>

      <div className="text-center py-16 text-ink-muted">
        <p className="text-sm">Nessun articolo ancora. Torna presto.</p>
      </div>
    </div>
  );
}
