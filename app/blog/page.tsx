import Link from "next/link";
import { KBHeader } from "@/components/knowledge-base/kb-header";

const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL ?? "http://localhost:4000";

interface Article {
  id: string;
  slug: string;
  title: string;
  body: string;
  meta_description: string | null;
  keyword: string | null;
  language: string;
  country: string;
  brand_name: string | null;
  published_at: string;
}

async function getArticles(): Promise<{ articles: Article[]; total: number }> {
  try {
    const res = await fetch(`${ENGINE_URL}/articles?limit=50`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return { articles: [], total: 0 };
    return res.json();
  } catch {
    return { articles: [], total: 0 };
  }
}

// Generate a deterministic gradient from a keyword string
function keywordToGradient(keyword: string): string {
  let hash = 0;
  for (let i = 0; i < keyword.length; i++) {
    const char = keyword.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  hash = Math.abs(hash);
  const hue1 = hash % 360;
  const hue2 = (hue1 + 40 + (hash % 60)) % 360;
  return `linear-gradient(135deg, hsl(${hue1}, 70%, 55%), hsl(${hue2}, 65%, 45%))`;
}

export const metadata = {
  title: "VISIONOID Drone Media | ドローン・AI・エンターテインメントの最新情報",
  description: "VISIONOID株式会社が運営するドローンメディア。ドローンショー、ドローンレース、防災ドローン、フィジカルAI、アニマノイドの最新情報をお届けします。",
  openGraph: {
    title: "VISIONOID Drone Media",
    description: "ドローン・AI・エンターテインメントの最新情報メディア",
    siteName: "VISIONOID Drone Media",
  },
};

export default async function BlogPage() {
  const { articles, total } = await getArticles();

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100">
      <KBHeader />
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-zinc-100">VISIONOID Drone Media</h1>
        <p className="text-gray-600 dark:text-zinc-400 mt-1">ドローン・AI・エンターテインメントの最新情報 — {total}記事公開中</p>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {articles.length === 0 ? (
          <div className="text-center py-20 text-gray-500 dark:text-zinc-500">
            <p className="text-xl">No articles yet</p>
            <p className="mt-2">Articles will appear here once the engine generates them.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {articles.map((article) => {
              const kw = article.keyword || article.title;
              const gradient = keywordToGradient(kw);
              return (
                <article
                  key={article.id}
                  className="border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden hover:border-gray-400 dark:hover:border-zinc-600 transition-colors hover:shadow-sm flex flex-col sm:flex-row"
                >
                  {/* Thumbnail */}
                  <Link
                    href={`/blog/${article.slug}`}
                    className="sm:w-56 sm:shrink-0 aspect-video sm:aspect-auto sm:min-h-[140px] relative flex items-center justify-center"
                    style={{ background: gradient }}
                  >
                    <span className="text-white/80 text-sm font-medium px-3 py-1 text-center leading-snug max-w-[90%] truncate">
                      {article.keyword || "Article"}
                    </span>
                  </Link>

                  {/* Content */}
                  <div className="p-5 flex flex-col justify-between flex-1 min-w-0">
                    <div>
                      <Link href={`/blog/${article.slug}`}>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2">
                          {article.title}
                        </h2>
                      </Link>
                      <p className="text-gray-600 dark:text-zinc-400 mt-2 line-clamp-2 text-sm">
                        {article.meta_description || article.body.slice(0, 200)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 mt-3 text-sm text-gray-500 dark:text-zinc-500 flex-wrap">
                      {article.keyword && (
                        <span className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 px-2 py-0.5 rounded text-xs">{article.keyword}</span>
                      )}
                      <span>{article.language.toUpperCase()}</span>
                      <span>{new Date(article.published_at).toLocaleDateString("ja-JP")}</span>
                      {article.brand_name && <span>{article.brand_name}</span>}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
