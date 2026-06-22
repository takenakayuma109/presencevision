/**
 * Public Articles API — 汎用サイト連携の読み取りエンドポイント。
 *
 * GET /api/public/articles?projectId=...&key=...&limit=20
 * 任意のサイト（WP/Wix/自作）からCORSで取得できる公開JSON。キーで識別・検証。
 */
import { NextResponse, type NextRequest } from "next/server";
import { verifySiteKey } from "@/lib/site-api";

const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL ?? "http://localhost:4000";
const ENGINE_API_KEY = process.env.NEXT_PUBLIC_ENGINE_API_KEY ?? "";
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://presencevision.com").replace(/\/+$/, "");

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, max-age=300",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId") ?? "";
  const key = req.nextUrl.searchParams.get("key");
  const limit = Math.min(100, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") ?? "20", 10) || 20));

  if (!verifySiteKey(projectId, key)) {
    return NextResponse.json(
      { error: "Invalid projectId or key" },
      { status: 401, headers: CORS },
    );
  }

  try {
    const res = await fetch(
      `${ENGINE_URL}/articles?projectId=${encodeURIComponent(projectId)}&limit=${limit}`,
      { headers: { "x-api-key": ENGINE_API_KEY }, next: { revalidate: 300 } },
    );
    const data = res.ok ? await res.json() : { articles: [], total: 0 };
    const articles = (Array.isArray(data.articles) ? data.articles : []).map(
      (a: Record<string, unknown>) => ({
        id: a.id,
        slug: a.slug,
        title: a.title,
        excerpt: a.meta_description ?? "",
        body: a.body,
        keyword: a.keyword ?? null,
        language: a.language ?? "ja",
        publishedAt: a.published_at ?? a.updated_at ?? null,
        url: `${SITE_URL}/blog/${a.slug}`,
      }),
    );
    return NextResponse.json(
      { projectId, count: articles.length, total: data.total ?? articles.length, articles },
      { headers: CORS },
    );
  } catch {
    return NextResponse.json({ error: "Upstream unavailable" }, { status: 502, headers: CORS });
  }
}
