/**
 * Public Feed — 汎用サイト連携の RSS / JSON Feed。
 *
 * GET /api/public/feed?projectId=...&key=...           → RSS 2.0 (XML)
 * GET /api/public/feed?projectId=...&key=...&format=json → JSON Feed 1.1
 * WordPress・Wix のRSSブロックや、自作サイトの取り込みにそのまま使える。
 */
import { NextResponse, type NextRequest } from "next/server";
import { verifySiteKey } from "@/lib/site-api";

const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL ?? "http://localhost:4000";
const ENGINE_API_KEY = process.env.NEXT_PUBLIC_ENGINE_API_KEY ?? "";
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://presencevision.com").replace(/\/+$/, "");

const CORS = { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=600" };

function xmlEscape(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId") ?? "";
  const key = req.nextUrl.searchParams.get("key");
  const format = req.nextUrl.searchParams.get("format");

  if (!verifySiteKey(projectId, key)) {
    return NextResponse.json({ error: "Invalid projectId or key" }, { status: 401, headers: CORS });
  }

  let articles: Record<string, unknown>[] = [];
  let brand = "PresenceVision";
  try {
    const res = await fetch(
      `${ENGINE_URL}/articles?projectId=${encodeURIComponent(projectId)}&limit=30`,
      { headers: { "x-api-key": ENGINE_API_KEY }, next: { revalidate: 600 } },
    );
    if (res.ok) {
      const data = await res.json();
      articles = Array.isArray(data.articles) ? data.articles : [];
      brand = (articles[0]?.brand_name as string) || brand;
    }
  } catch {
    /* upstream down → empty feed */
  }

  const items = articles.map((a) => ({
    title: String(a.title ?? ""),
    url: `${SITE_URL}/blog/${a.slug}`,
    id: String(a.id ?? a.slug ?? ""),
    summary: String(a.meta_description ?? ""),
    date: new Date(String(a.published_at ?? a.updated_at ?? Date.now())).toISOString(),
  }));

  if (format === "json") {
    return NextResponse.json(
      {
        version: "https://jsonfeed.org/version/1.1",
        title: `${brand} — 最新記事`,
        home_page_url: `${SITE_URL}/companies/${projectId}`,
        feed_url: `${SITE_URL}/api/public/feed?projectId=${projectId}&key=${key}&format=json`,
        items: items.map((it) => ({
          id: it.id,
          url: it.url,
          title: it.title,
          summary: it.summary,
          date_published: it.date,
        })),
      },
      { headers: { ...CORS, "Content-Type": "application/feed+json; charset=utf-8" } },
    );
  }

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>${xmlEscape(brand)} — 最新記事</title>
<link>${SITE_URL}/companies/${projectId}</link>
<description>${xmlEscape(brand)} の最新記事（PresenceVision 自動生成）</description>
<language>ja</language>
${items
    .map(
      (it) => `<item>
<title>${xmlEscape(it.title)}</title>
<link>${xmlEscape(it.url)}</link>
<guid isPermaLink="false">${xmlEscape(it.id)}</guid>
<pubDate>${new Date(it.date).toUTCString()}</pubDate>
<description>${xmlEscape(it.summary)}</description>
</item>`,
    )
    .join("\n")}
</channel></rss>`;

  return new NextResponse(rss, {
    headers: { ...CORS, "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
