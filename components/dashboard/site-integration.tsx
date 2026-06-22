"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Globe, Copy, Check, Code2, Rss, Plug } from "lucide-react";

interface Integration {
  projectId: string;
  key: string;
  articlesUrl: string;
  feedUrl: string;
  jsonFeedUrl: string;
  embedSnippet: string;
  siteUrl: string;
}

function CopyField({
  label,
  value,
  mono = true,
  multiline = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  multiline?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };
  return (
    <div>
      <div className="mb-1 text-[11px] font-medium text-muted-foreground">{label}</div>
      <div className="flex items-stretch gap-2">
        <div
          className={`min-w-0 flex-1 overflow-x-auto rounded-md border border-border/60 bg-background/60 px-2.5 py-2 text-[11px] ${
            mono ? "font-mono" : ""
          } ${multiline ? "whitespace-pre" : "whitespace-nowrap"} text-foreground/90`}
        >
          {value}
        </div>
        <button
          onClick={copy}
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border/60 px-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "コピー済" : "コピー"}
        </button>
      </div>
    </div>
  );
}

export function SiteIntegration({ projectId }: { projectId: string }) {
  const [data, setData] = useState<Integration | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/projects/${projectId}/site-integration`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Plug className="h-4 w-4 text-blue-400" />
          自社サイト連携（WordPress / Wix / 自作コード — なんでもOK）
        </CardTitle>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          下のキー／コードを自社サイトに組み込むと、PVが生成した記事を自動で表示できます。
          WordPress前提ではなく、<b className="text-foreground">どのプラットフォームでも</b>同じ仕組みで連携できます。
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pb-5">
        {loading ? (
          <div className="py-6 text-center text-xs text-muted-foreground">読み込み中…</div>
        ) : !data ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            連携情報を取得できませんでした。
          </div>
        ) : (
          <>
            <CopyField label="APIキー（プロジェクト識別キー）" value={data.key} />

            {/* 方式①: 埋め込みコード（Wix/ノーコード/自作向け・最も簡単） */}
            <div className="rounded-lg border border-border/50 bg-background/30 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Code2 className="h-3.5 w-3.5 text-emerald-400" />
                方式①　埋め込みコード（1行貼るだけ・Wix / STUDIO / 自作 すべて対応）
              </div>
              <CopyField label="HTMLに貼り付け" value={data.embedSnippet} multiline />
              <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">
                記事を表示したい場所に貼るだけ。デザインは自動。data-limit で件数、data-accent で色を変更可。
              </p>
            </div>

            {/* 方式②: API / フィード（WP・自作のヘッドレス取り込み向け） */}
            <div className="rounded-lg border border-border/50 bg-background/30 p-3 space-y-2">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Rss className="h-3.5 w-3.5 text-blue-400" />
                方式②　API / フィード（WordPress・自作サイトのヘッドレス取り込み向け）
              </div>
              <CopyField label="記事API（JSON）" value={data.articlesUrl} />
              <CopyField label="RSSフィード" value={data.feedUrl} />
              <CopyField label="JSON Feed" value={data.jsonFeedUrl} />
              <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                WordPress＝RSSブロック/プラグイン、自作＝APIをfetchして描画。CORS対応済みなので外部サイトから直接読めます。
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Globe className="h-3 w-3" />
              公開記事はこちらにも：
              <a
                href={`/companies/${projectId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                自社ナレッジHub
              </a>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
