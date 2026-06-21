/**
 * Site News Fetcher — 顧客サイト発の「最新ニュース」を取得し、記事生成の一次情報として供給する。
 *
 * 目的: 生成記事を顧客サイトの最新情報と連動させ、常に最新かつ検証済み(=自社発)の事実を反映する。
 * 方式: RSS/Atomフィードを優先し、無ければ /news・/blog 等から見出しを抽出（plain fetch・API課金ゼロ）。
 * キャッシュ: プロジェクト単位でTTL（毎記事ごとの再取得を避ける）。失敗しても決して throw しない。
 */

export interface SiteNewsItem {
  title: string;
  date?: string;
  summary?: string;
  url?: string;
}

interface CacheEntry {
  items: SiteNewsItem[];
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();
const TTL_MS = 6 * 60 * 60 * 1000; // 6時間
const UA = "Mozilla/5.0 (compatible; PresenceVisionBot/1.0; +https://presencevision.com)";
const FETCH_TIMEOUT_MS = 8000;

async function fetchText(url: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml,application/rss+xml,application/atom+xml",
      },
      signal: ctrl.signal,
      redirect: "follow",
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function normalizeBase(siteUrl: string): string {
  let u = siteUrl.trim();
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  return u.replace(/\/+$/, "");
}

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripTags(s: string): string {
  return decode(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function parseFeed(xml: string): SiteNewsItem[] {
  const items: SiteNewsItem[] = [];
  const blocks = xml.match(/<(item|entry)\b[\s\S]*?<\/\1>/gi) || [];
  for (const b of blocks) {
    const title = stripTags(b.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
    if (!title) continue;
    const date = stripTags(
      b.match(/<(pubDate|updated|published|dc:date)[^>]*>([\s\S]*?)<\/\1>/i)?.[2] ?? "",
    );
    const summary = stripTags(
      b.match(/<(description|summary|content)[^>]*>([\s\S]*?)<\/\1>/i)?.[2] ?? "",
    ).slice(0, 220);
    const link =
      b.match(/<link[^>]*href=["']([^"']+)["']/i)?.[1] ??
      stripTags(b.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] ?? "");
    items.push({ title, date: date || undefined, summary: summary || undefined, url: link || undefined });
    if (items.length >= 8) break;
  }
  return items;
}

function findFeedUrl(html: string, base: string): string | null {
  const tag = html.match(
    /<link[^>]+type=["']application\/(?:rss\+xml|atom\+xml)["'][^>]*>/i,
  )?.[0];
  const href = tag?.match(/href=["']([^"']+)["']/i)?.[1];
  if (!href) return null;
  if (/^https?:\/\//i.test(href)) return href;
  return base + (href.startsWith("/") ? href : `/${href}`);
}

function extractHeadlines(html: string): SiteNewsItem[] {
  const items: SiteNewsItem[] = [];
  const seen = new Set<string>();
  const blocks = html.match(/<(article|li)\b[\s\S]{0,1000}?<\/\1>/gi) || [];
  for (const b of blocks) {
    const title = stripTags(b.match(/<(h[1-4]|a)[^>]*>([\s\S]*?)<\/\1>/i)?.[2] ?? "");
    if (!title || title.length < 6 || title.length > 160 || seen.has(title)) continue;
    const date =
      b.match(/<time[^>]*datetime=["']([^"']+)["']/i)?.[1] ??
      stripTags(b.match(/<time[^>]*>([\s\S]*?)<\/time>/i)?.[1] ?? "") ??
      "";
    seen.add(title);
    items.push({ title, date: date || undefined });
    if (items.length >= 8) break;
  }
  return items;
}

/** 顧客サイトの最新ニュースを取得（TTLキャッシュ）。失敗時は空配列。 */
export async function fetchSiteNews(siteUrl: string | undefined, projectId: string): Promise<SiteNewsItem[]> {
  if (!siteUrl) return [];
  const cached = cache.get(projectId);
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) return cached.items;

  const base = normalizeBase(siteUrl);
  let items: SiteNewsItem[] = [];

  const home = await fetchText(base);

  // 1) RSS/Atom フィード（homepageの<link>＋よくあるパス）
  const candidates: string[] = [];
  if (home) {
    const f = findFeedUrl(home, base);
    if (f) candidates.push(f);
  }
  candidates.push(
    `${base}/feed`,
    `${base}/rss`,
    `${base}/feed.xml`,
    `${base}/rss.xml`,
    `${base}/atom.xml`,
    `${base}/news/feed`,
    `${base}/blog/feed`,
  );
  for (const url of candidates) {
    const xml = await fetchText(url);
    if (xml && /<(rss|feed)\b/i.test(xml)) {
      items = parseFeed(xml);
      if (items.length) break;
    }
  }

  // 2) フォールバック: News/Blog ページの見出し抽出
  if (!items.length) {
    for (const path of ["/news", "/blog", "/topics", "/information", "/press", ""]) {
      const html = path === "" ? home : await fetchText(base + path);
      if (!html) continue;
      const heads = extractHeadlines(html);
      if (heads.length) {
        items = heads;
        break;
      }
    }
  }

  const entry: CacheEntry = { items: items.slice(0, 8), fetchedAt: Date.now() };
  cache.set(projectId, entry);
  return entry.items;
}

/** 記事生成プロンプト用に最新ニュースを短い要約テキストへ整形 */
export function formatSiteNews(items: SiteNewsItem[], max = 6): string {
  if (!items.length) return "";
  return items
    .slice(0, max)
    .map((it, i) => {
      const d = it.date ? ` (${it.date})` : "";
      const s = it.summary ? ` — ${it.summary}` : "";
      return `${i + 1}. ${it.title}${d}${s}`;
    })
    .join("\n");
}
