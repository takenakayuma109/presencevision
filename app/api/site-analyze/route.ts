import { NextRequest, NextResponse } from "next/server";

// Extract keywords from site content by fetching and parsing HTML
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

    const fullUrl = url.startsWith("http") ? url : `https://${url}`;
    let hostname: string;
    try {
      hostname = new URL(fullUrl).hostname;
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const brand = hostname
      .replace("www.", "")
      .split(".")[0]
      .charAt(0)
      .toUpperCase() + hostname.replace("www.", "").split(".")[0].slice(1);

    // Fetch the actual page
    let html = "";
    try {
      const res = await fetch(fullUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; PresenceVision/1.0)",
          "Accept": "text/html",
          "Accept-Language": "ja,en;q=0.9",
        },
        signal: AbortSignal.timeout(10000),
      });
      html = await res.text();
    } catch {
      // If fetch fails, return basic keywords
      return NextResponse.json({
        url: fullUrl,
        title: brand,
        description: `${hostname} のウェブサイト`,
        favicon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
        language: "ja",
        industry: "テクノロジー",
        suggestedKeywords: [brand, `${brand} サービス`, `${brand} 評判`, `${brand} 料金`],
      });
    }

    // Extract metadata
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch?.[1]?.trim() || brand;

    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
    const description = descMatch?.[1]?.trim() || "";

    const metaKeywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']keywords["']/i);
    const metaKeywords = metaKeywordsMatch?.[1]?.split(",").map((k) => k.trim()).filter(Boolean) || [];

    // Extract OG data
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);

    // Extract headings
    const headings: string[] = [];
    const headingRegex = /<h[1-3][^>]*>([^<]*(?:<[^/][^>]*>[^<]*)*)<\/h[1-3]>/gi;
    let match;
    while ((match = headingRegex.exec(html)) !== null) {
      const text = match[1].replace(/<[^>]+>/g, "").trim();
      if (text.length > 2 && text.length < 100) headings.push(text);
    }

    // Extract link text for internal links
    const linkTexts: string[] = [];
    const linkRegex = /<a[^>]*href=["'][^"']*["'][^>]*>([^<]+)<\/a>/gi;
    while ((match = linkRegex.exec(html)) !== null) {
      const text = match[1].trim();
      if (text.length > 2 && text.length < 50 && !/^(http|mailto|tel|#)/.test(text)) {
        linkTexts.push(text);
      }
    }

    // Extract structured data
    const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
    const structuredKeywords: string[] = [];
    for (const jsonLdBlock of jsonLdMatches) {
      try {
        const content = jsonLdBlock.replace(/<\/?script[^>]*>/gi, "");
        const data = JSON.parse(content);
        if (data.name) structuredKeywords.push(data.name);
        if (data.description) {
          // Extract key phrases from structured data description
          const words = data.description.split(/[、。,.]/).filter((w: string) => w.trim().length > 2);
          structuredKeywords.push(...words.slice(0, 5).map((w: string) => w.trim()));
        }
        if (data.keywords) {
          if (typeof data.keywords === "string") {
            structuredKeywords.push(...data.keywords.split(",").map((k: string) => k.trim()));
          } else if (Array.isArray(data.keywords)) {
            structuredKeywords.push(...data.keywords);
          }
        }
        // Extract service/product names
        if (data["@type"] === "Organization" || data["@type"] === "LocalBusiness") {
          if (data.name) structuredKeywords.push(data.name);
        }
        if (data.hasOfferCatalog?.itemListElement) {
          for (const item of data.hasOfferCatalog.itemListElement) {
            if (item.name) structuredKeywords.push(item.name);
          }
        }
      } catch {
        // JSON parse error - skip
      }
    }

    // Detect language
    const langMatch = html.match(/<html[^>]*lang=["']([^"']+)["']/i);
    const language = langMatch?.[1]?.substring(0, 2) || "ja";

    // Build keyword candidates from all sources
    const candidates = new Set<string>();

    // 1. Brand variations
    candidates.add(brand);
    candidates.add(`${brand} とは`);

    // 2. From title
    if (title && title !== brand) {
      candidates.add(title);
      // Extract meaningful phrases from title
      const titleParts = title.split(/[|\-–—:：・/]/).map((p) => p.trim()).filter((p) => p.length > 2);
      titleParts.forEach((p) => candidates.add(p));
    }

    // 3. From description
    if (description) {
      // Extract noun phrases from description (Japanese & English)
      const descPhrases = description
        .split(/[、。,.\n！!？?]/)
        .map((p) => p.trim())
        .filter((p) => p.length > 3 && p.length < 40);
      descPhrases.slice(0, 8).forEach((p) => candidates.add(p));
    }

    // 4. From OG data
    if (ogTitleMatch?.[1]) candidates.add(ogTitleMatch[1].trim());
    if (ogDescMatch?.[1]) {
      const ogPhrases = ogDescMatch[1].split(/[、。,.]/).map((p) => p.trim()).filter((p) => p.length > 3);
      ogPhrases.slice(0, 5).forEach((p) => candidates.add(p));
    }

    // 5. From meta keywords
    metaKeywords.forEach((k) => candidates.add(k));

    // 6. From headings (high value)
    headings.slice(0, 15).forEach((h) => candidates.add(h));

    // 7. From structured data
    structuredKeywords.filter((k) => k.length > 2 && k.length < 50).forEach((k) => candidates.add(k));

    // 8. From navigation/link text (service names, features)
    const uniqueLinks = [...new Set(linkTexts)];
    uniqueLinks
      .filter((t) => !["ホーム", "Home", "トップ", "Top", "メニュー", "Menu", "閉じる", "Close"].includes(t))
      .slice(0, 10)
      .forEach((t) => candidates.add(t));

    // 9. SEO-oriented brand combinations
    const seoSuffixes = ["サービス", "評判", "料金", "使い方", "特徴", "メリット", "導入事例", "口コミ"];
    seoSuffixes.forEach((s) => candidates.add(`${brand} ${s}`));

    // Filter and deduplicate
    const keywords = [...candidates]
      .filter((k) => k.length > 1 && k.length < 60)
      .filter((k) => !/^[\d\s]+$/.test(k)) // Remove number-only
      .filter((k) => !/^(https?:\/\/|www\.)/.test(k)) // Remove URLs
      .slice(0, 30);

    // Detect industry from content
    const contentText = (title + " " + description + " " + headings.join(" ")).toLowerCase();
    let industry = "テクノロジー";
    const industryMap: Record<string, string[]> = {
      "ロボティクス": ["robot", "ロボット", "drone", "ドローン", "自動化", "automation"],
      "AI・機械学習": ["ai", "機械学習", "deep learning", "neural", "llm"],
      "SaaS": ["saas", "クラウド", "cloud", "subscription", "サブスク"],
      "EC・小売": ["ecommerce", "通販", "ショッピング", "shop", "store"],
      "マーケティング": ["marketing", "seo", "広告", "集客", "pr"],
      "ヘルスケア": ["health", "医療", "healthcare", "クリニック"],
      "教育": ["education", "学習", "スクール", "learn"],
      "不動産": ["不動産", "real estate", "物件", "賃貸"],
      "金融": ["finance", "fintech", "金融", "投資", "insurance"],
    };
    for (const [ind, terms] of Object.entries(industryMap)) {
      if (terms.some((t) => contentText.includes(t))) {
        industry = ind;
        break;
      }
    }

    return NextResponse.json({
      url: fullUrl,
      title: title || brand,
      description: description || ogDescMatch?.[1] || `${hostname} のウェブサイト`,
      favicon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
      language,
      industry,
      suggestedKeywords: keywords,
    });
  } catch (err) {
    console.error("Site analysis error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
