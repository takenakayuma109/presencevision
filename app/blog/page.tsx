import Link from "next/link";

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

export const metadata = {
  title: "Blog — PresenceVision",
  description: "AI-generated SEO articles powered by PresenceVision",
};

export default async function BlogPage() {
  const { articles, total } = await getArticles();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 py-6">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/" className="text-sm text-gray-400 hover:text-white">
            &larr; PresenceVision
          </Link>
          <h1 className="text-3xl font-bold mt-2">Blog</h1>
          <p className="text-gray-400 mt-1">{total} articles published</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {articles.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-xl">No articles yet</p>
            <p className="mt-2">Articles will appear here once the engine generates them.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {articles.map((article) => (
              <article
                key={article.id}
                className="border border-gray-800 rounded-lg p-6 hover:border-gray-600 transition-colors"
              >
                <Link href={`/blog/${article.slug}`}>
                  <h2 className="text-xl font-semibold hover:text-blue-400 transition-colors">
                    {article.title}
                  </h2>
                </Link>
                <p className="text-gray-400 mt-2 line-clamp-3">
                  {article.meta_description || article.body.slice(0, 200)}
                </p>
                <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                  {article.keyword && (
                    <span className="bg-gray-800 px-2 py-1 rounded">{article.keyword}</span>
                  )}
                  <span>{article.language.toUpperCase()}</span>
                  <span>{new Date(article.published_at).toLocaleDateString("ja-JP")}</span>
                  {article.brand_name && <span>{article.brand_name}</span>}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
