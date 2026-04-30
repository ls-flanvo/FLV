import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata = { title: 'Blog — Flanvo' };

const posts = [
  {
    slug: 'quanto-costa-taxi-aeroporto',
    category: 'Risparmio',
    date: 'aprile 2026',
    title: 'Quanto costa davvero un taxi dall\'aeroporto? (e come spendere meno)',
    excerpt: 'Un taxi dall\'aeroporto di Catania al centro città costa mediamente €35–50. Moltiplica per 4 viaggi all\'anno e stai lasciando €180 sul tavolo. Ecco come cambia il calcolo con il carpooling.',
    readTime: '4 min',
  },
  {
    slug: 'carpooling-aeroportuale-come-funziona',
    category: 'Come funziona',
    date: 'aprile 2026',
    title: 'Carpooling aeroportuale: la guida completa per chi non l\'ha mai usato',
    excerpt: 'Il carpooling aeroportuale non è una divisione alla cieca del costo del taxi. Scopri come funziona il sistema a chilometri reali, cosa succede se il tuo volo è in ritardo e perché il prezzo è bloccato prima di salire.',
    readTime: '6 min',
  },
  {
    slug: 'volo-in-ritardo-cosa-fare',
    category: 'Consigli',
    date: 'marzo 2026',
    title: 'Volo in ritardo: cosa succede al tuo trasferimento aeroportuale?',
    excerpt: 'Il tuo volo ha due ore di ritardo. Il taxi che avevi prenotato è andato. Con Flanvo il monitoraggio è automatico — il driver viene aggiornato in tempo reale. Ecco tutto quello che devi sapere.',
    readTime: '5 min',
  },
];

const categoryColors: Record<string, string> = {
  'Risparmio':       'text-primary-400 bg-primary-500/10 border-primary-500/20',
  'Come funziona':   'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'Consigli':        'text-warning bg-warning/10 border-warning/20',
};

export default function BlogPage() {
  return (
    <div className="bg-[#0B0B0B] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink-secondary mb-10 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Home
        </Link>

        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">Blog</h1>
        <p className="text-ink-secondary mb-14">Consigli di viaggio, risparmio e mobilità condivisa.</p>

        <div className="space-y-6">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block bg-surface-1 border border-surface-4 rounded-2xl p-6 hover:border-surface-5 hover:bg-surface-2 transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-[11px] font-semibold border rounded-full px-2.5 py-0.5 ${categoryColors[post.category]}`}>
                  {post.category}
                </span>
                <span className="text-xs text-ink-muted">{post.date} · {post.readTime} di lettura</span>
              </div>
              <h2 className="text-lg font-bold text-white mb-2 leading-snug group-hover:text-primary-300 transition-colors">
                {post.title}
              </h2>
              <p className="text-sm text-ink-secondary leading-relaxed mb-4">{post.excerpt}</p>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary-400">
                Leggi <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
