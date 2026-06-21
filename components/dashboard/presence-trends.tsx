"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Globe,
  MessageSquare,
  Search,
  LineChart as LineChartIcon,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────

type Granularity = "day" | "month" | "year";

interface Bucket {
  key: string;
  articles: number;
  dist: { wordpress: number; gbp: number; community: number; total: number };
  serp: { avg: number | null; count: number };
  llm: { rate: number | null; mentioned: number; total: number };
}

interface TimeseriesResponse {
  granularity: Granularity;
  from: string;
  to: string;
  buckets: Bucket[];
  summary: {
    articles: number;
    dist: { wordpress: number; gbp: number; community: number; total: number };
    serp: { avg: number | null; count: number };
    llm: { rate: number | null; mentioned: number; total: number };
  };
}

type MetricKey = "articles" | "dist" | "serp" | "llm";

const METRICS: {
  key: MetricKey;
  label: string;
  unit: string;
  color: string;
  reversed: boolean;
  get: (b: Bucket) => number | null;
}[] = [
  { key: "articles", label: "記事公開数", unit: "件", color: "#34d399", reversed: false, get: (b) => b.articles },
  { key: "dist", label: "露出配信数", unit: "件", color: "#60a5fa", reversed: false, get: (b) => b.dist.total },
  { key: "serp", label: "平均検索順位", unit: "位", color: "#a78bfa", reversed: true, get: (b) => b.serp.avg },
  { key: "llm", label: "AI引用率", unit: "%", color: "#f472b6", reversed: false, get: (b) => b.llm.rate },
];

const GRAN_TABS: { key: Granularity; label: string }[] = [
  { key: "day", label: "日" },
  { key: "month", label: "月" },
  { key: "year", label: "年" },
];

const EMPTY_SUMMARY: TimeseriesResponse["summary"] = {
  articles: 0,
  dist: { wordpress: 0, gbp: 0, community: 0, total: 0 },
  serp: { avg: null, count: 0 },
  llm: { rate: null, mentioned: 0, total: 0 },
};

// ─── Date helpers (JST calendar) ─────────────────────────────────────

const pad2 = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) =>
  `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;

/** 粒度＋オフセット(0=最新)から表示ウィンドウの from..to（JST暦 YYYY-MM-DD）を求める */
function computeRange(g: Granularity, offset: number): { from: string; to: string } {
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
  const [y, m, d] = todayStr.split("-").map(Number);

  if (g === "day") {
    const span = 30;
    const end = new Date(Date.UTC(y, m - 1, d));
    end.setUTCDate(end.getUTCDate() - offset * span);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - (span - 1));
    return { from: ymd(start), to: ymd(end) };
  }
  if (g === "month") {
    const span = 12;
    const end = new Date(Date.UTC(y, m - 1, 1));
    end.setUTCMonth(end.getUTCMonth() - offset * span);
    const start = new Date(end);
    start.setUTCMonth(start.getUTCMonth() - (span - 1));
    const endLast = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0));
    return { from: ymd(start), to: ymd(endLast) };
  }
  // year
  const span = 5;
  const endY = y - offset * span;
  const startY = endY - (span - 1);
  return { from: `${startY}-01-01`, to: `${endY}-12-31` };
}

/** バケットキーをX軸ラベルへ */
function formatLabel(key: string, g: Granularity): string {
  if (g === "day") {
    const [, mm, dd] = key.split("-");
    return `${Number(mm)}/${Number(dd)}`;
  }
  if (g === "month") {
    const [, mm] = key.split("-");
    return `${Number(mm)}月`;
  }
  return `${key}年`;
}

/** 範囲全体の表示ラベル */
function formatRange(from: string, to: string, g: Granularity): string {
  const f = from.split("-").map(Number);
  const t = to.split("-").map(Number);
  if (g === "year") return `${f[0]} 〜 ${t[0]}年`;
  if (g === "month") return `${f[0]}/${f[1]} 〜 ${t[0]}/${t[1]}`;
  return `${f[0]}/${f[1]}/${f[2]} 〜 ${t[0]}/${t[1]}/${t[2]}`;
}

// ─── Component ───────────────────────────────────────────────────────

export function PresenceTrends({ projectId }: { projectId: string }) {
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [offset, setOffset] = useState(0);
  const [metric, setMetric] = useState<MetricKey>("articles");
  const [data, setData] = useState<TimeseriesResponse | null>(null);

  const { from, to } = useMemo(() => computeRange(granularity, offset), [granularity, offset]);

  useEffect(() => {
    let cancelled = false;
    fetch(
      `/api/engine/analytics/timeseries?projectId=${projectId}&granularity=${granularity}&from=${from}&to=${to}`,
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((d: TimeseriesResponse | null) => {
        if (!cancelled) setData(d ?? { granularity, from, to, buckets: [], summary: EMPTY_SUMMARY });
      })
      .catch(() => {
        if (!cancelled) setData({ granularity, from, to, buckets: [], summary: EMPTY_SUMMARY });
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, granularity, from, to]);

  // ローディングは派生（リクエスト中のパラメータと取得済みデータが一致しない＝stale）
  const loading =
    !data || data.granularity !== granularity || data.from !== from || data.to !== to;

  const activeMetric = METRICS.find((m) => m.key === metric)!;

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.buckets.map((b) => ({
      label: formatLabel(b.key, data.granularity),
      value: activeMetric.get(b),
    }));
  }, [data, activeMetric]);

  const summary = data?.summary;
  const fmtNum = (n: number | null, suffix = "") =>
    n == null ? "—" : `${n}${suffix}`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <LineChartIcon className="h-4 w-4 text-blue-400" />
              プレゼンス推移（株価のように見る）
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              記事の公開数・露出配信・検索順位・AI引用率の推移。日／月／年を切り替え、◀▶で過去にさかのぼれます。
            </p>
          </div>
          {/* 粒度タブ */}
          <div className="flex gap-1 rounded-lg border bg-muted/30 p-1">
            {GRAN_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setGranularity(tab.key);
                  setOffset(0);
                }}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  granularity === tab.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-4">
        {/* 期間ナビ */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setOffset((o) => o + 1)}
            className="inline-flex items-center gap-1 rounded-md border border-border/60 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            前へ
          </button>
          <span className="text-xs font-medium text-foreground">
            {data ? formatRange(data.from, data.to, data.granularity) : formatRange(from, to, granularity)}
          </span>
          <button
            onClick={() => setOffset((o) => Math.max(0, o - 1))}
            disabled={offset === 0}
            className="inline-flex items-center gap-1 rounded-md border border-border/60 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            次へ
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* 期間サマリー */}
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <SummaryCard
            icon={FileText}
            label="記事公開数"
            value={`${summary?.articles ?? 0}`}
            unit="件"
            accent="text-emerald-400"
            active={metric === "articles"}
            onClick={() => setMetric("articles")}
          />
          <SummaryCard
            icon={Globe}
            label="露出配信数"
            value={`${summary?.dist.total ?? 0}`}
            unit="件"
            sub={
              summary
                ? `WP ${summary.dist.wordpress} / GBP ${summary.dist.gbp} / コミュニティ ${summary.dist.community}`
                : undefined
            }
            accent="text-blue-400"
            active={metric === "dist"}
            onClick={() => setMetric("dist")}
          />
          <SummaryCard
            icon={Search}
            label="平均検索順位"
            value={fmtNum(summary?.serp.avg ?? null)}
            unit={summary?.serp.avg != null ? "位" : ""}
            sub="小さいほど上位"
            accent="text-violet-400"
            active={metric === "serp"}
            onClick={() => setMetric("serp")}
          />
          <SummaryCard
            icon={MessageSquare}
            label="AI引用率"
            value={fmtNum(summary?.llm.rate ?? null)}
            unit={summary?.llm.rate != null ? "%" : ""}
            sub={summary && summary.llm.total > 0 ? `${summary.llm.mentioned}/${summary.llm.total}回` : undefined}
            accent="text-pink-400"
            active={metric === "llm"}
            onClick={() => setMetric("llm")}
          />
        </div>

        {/* チャート */}
        <div className="rounded-lg border border-border/50 bg-background/30 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: activeMetric.color }}
            />
            {activeMetric.label}の推移
            {activeMetric.reversed && <span className="opacity-70">（上にいくほど上位）</span>}
          </div>
          {loading ? (
            <div className="flex h-[260px] items-center justify-center text-xs text-muted-foreground">
              読み込み中…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 6, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={activeMetric.color} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={activeMetric.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#71717a" }}
                  interval="preserveStartEnd"
                  minTickGap={16}
                  axisLine={{ stroke: "#27272a" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#71717a" }}
                  reversed={activeMetric.reversed}
                  domain={activeMetric.reversed ? [1, "dataMax"] : [0, "auto"]}
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #3f3f46",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#a1a1aa" }}
                  formatter={(value) => {
                    const v = value as number | null;
                    return [
                      v == null ? "データなし" : `${v}${activeMetric.unit}`,
                      activeMetric.label,
                    ];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={activeMetric.color}
                  strokeWidth={2}
                  fill={`url(#grad-${metric})`}
                  connectNulls={false}
                  dot={false}
                  activeDot={{ r: 3 }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
          {(activeMetric.key === "serp" || activeMetric.key === "llm") && (
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              {activeMetric.key === "serp"
                ? "※ 検索順位はGoogleが記事を評価してから付きます。空欄が続く間は、まだ順位が付いていない期間です。"
                : "※ AI引用率は、ChatGPT等が回答内で自社を引用した割合。記事が蓄積されると上がっていきます。"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Summary stat card (clickable → selects chart metric) ────────────

function SummaryCard({
  icon: Icon,
  label,
  value,
  unit,
  sub,
  accent,
  active,
  onClick,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
  unit: string;
  sub?: string;
  accent: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start rounded-lg border p-3 text-left transition-colors ${
        active
          ? "border-blue-500/40 bg-blue-500/5"
          : "border-border/50 bg-background/40 hover:border-blue-500/30"
      }`}
    >
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Icon className={`h-3.5 w-3.5 ${accent}`} />
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      {sub && <div className="mt-0.5 truncate text-[10px] text-muted-foreground/70">{sub}</div>}
    </button>
  );
}
