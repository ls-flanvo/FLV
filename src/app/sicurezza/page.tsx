import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export const metadata = { title: 'Sicurezza — Flanvo' };

export default function SicurezzaPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink-secondary mb-8 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Home
      </Link>
      <div className="flex items-center gap-3 mb-2">
        <Shield className="w-6 h-6 text-primary-400" />
        <h1 className="text-3xl font-bold text-white">Sicurezza</h1>
      </div>
      <p className="text-ink-muted text-sm mb-12">Come proteggiamo passeggeri e autisti.</p>

      <div className="space-y-8 text-ink-secondary leading-relaxed">
        <p className="text-lg">Pagina in arrivo.</p>
      </div>
    </div>
  );
}
