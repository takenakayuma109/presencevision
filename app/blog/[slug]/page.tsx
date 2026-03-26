import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL ?? "http://localhost:4000";

interface Article {
  id: string;
  slug: string;
  title: string;
  body: string;
  meta_title: string | null;
  meta_description: string | null;
  keyword: string | null;
  language: string;
  country: string;
  brand_name: string | null;
  published_at: string;
}

async function getArticle(slug: string): Promise<Article | null> {
  try {
    const res = await fetch(`${ENGINE_URL}/articles/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Not Found" };

  return {
    title: article.meta_title || article.title,
    description: article.meta_description || article.body.slice(0, 160),
  };
}

function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-8 mb-3">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n\n/g, '</p><p class="mb-4">')
    .replace(/^/, '<p class="mb-4">')
    .replace(/$/, "</p>");
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 py-6">
        <div className="max-w-3xl mx-auto px-4">
          <Link href="/blog" className="text-sm text-gray-400 hover:text-white">
            &larr; Blog
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">{article.title}</h1>

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-8 border-b border-gray-800 pb-4">
          {article.keyword && (
            <span className="bg-gray-800 px-2 py-1 rounded">{article.keyword}</span>
          )}
          <span>{article.language.toUpperCase()}</span>
          <span>{new Date(article.published_at).toLocaleDateString("ja-JP")}</span>
          {article.brand_name && <span>{article.brand_name}</span>}
        </div>

        <div
          className="prose prose-invert max-w-none leading-relaxed text-gray-300"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(article.body) }}
        />
      </article>

      <footer className="border-t border-gray-800 py-8 mt-12">
        <div className="max-w-3xl mx-auto px-4 text-center text-gray-500 text-sm">
          Powered by <Link href="/" className="text-blue-400 hover:underline">PresenceVision</Link>
        </div>
      </footer>
    </div>
  );
}
