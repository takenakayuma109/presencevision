"use client";

import { use, useEffect, useMemo, useState } from "react";
import {
  Globe,
  FileText,
  X,
  Loader2,
  Calendar,
  ExternalLink,
} from "lucide-react";

interface Article {
  id?: string;
  slug: string;
  title: string;
  body?: string;
  country?: string;
  language?: string;
  published_at?: string;
  publishedAt?: string;
  type?: string;
}

export default function ProjectContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Article | null>(null);

  useEffect(() => {
    fetch(`/api/engine/articles?projectId=${projectId}&limit=300`)
      .then((r) => (r.ok ? r.json() : { articles: [] }))
      .then((d) => setArticles(Array.isArray(d.articles) ? d.articles : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  const dateOf = (a: Article) =>
    (a.published_at || a.publishedAt || "").slice(0, 10) || "日付不明";

  const byDay = useMemo(() => {
    const groups: Record<string, Article[]> = {};
    for (const a of articles) {
      const d = dateOf(a);
      (groups[d] ||= []).push(a);
    }
    return Object.entries(groups).sort((x, y) => y[0].localeCompare(x[0]));
  }, [articles]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">コンテンツ</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            AIが生成した記事を日付ごとに確認できます（累計 {articles.length} 件）。
            これは公開Hubと同じ記事です。
          </p>
        </div>
        <a
          href={`/companies/${projectId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-md bg-gradient-to-r from-blue-600 to-violet-600 px-3 py-1.5 text-xs text-white transition-opacity hover:opacity-90"
        >
          <Globe className="h-3 w-3" /> 公開Hubで見る
        </a>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : articles.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-card/50 py-16 text-center text-sm text-muted-foreground">
          まだ記事がありません。エンジンがサイクルを実行すると、ここに生成された記事が日付ごとに表示されます。
        </div>
      ) : (
        byDay.map(([day, arts]) => (
          <div key={day} className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Calendar className="h-4 w-4" /> {day}
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                {arts.length}件
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {arts.map((a, i) => (
                <button
                  key={`${a.slug}-${i}`}
                  onClick={() => setSelected(a)}
                  className="flex items-start gap-3 rounded-lg border border-border/50 bg-card/50 p-3 text-left transition-colors hover:border-blue-500/40"
                >
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{a.title}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {(a.country || "JP").toUpperCase()} · {a.language || "ja"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Reader modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="my-8 w-full max-w-3xl rounded-2xl border border-border bg-background p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-4">
              <h3 className="text-xl font-bold leading-snug">{selected.title}</h3>
              <button
                onClick={() => setSelected(null)}
                className="shrink-0 rounded-md p-1 hover:bg-muted"
                aria-label="閉じる"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <a
              href={`/companies/${projectId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-4 inline-flex items-center gap-1 text-xs text-blue-500 hover:underline"
            >
              公開Hubで開く <ExternalLink className="h-3 w-3" />
            </a>
            <article className="max-h-[65vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {selected.body || "(本文を取得できませんでした)"}
            </article>
          </div>
        </div>
      )}
    </div>
  );
}
