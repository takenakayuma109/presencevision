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

    // ---------------------------------------------------------------
    // Build keyword candidates with strict quality filtering
    // ---------------------------------------------------------------

    // Quality check: is this a good keyword (not a sentence, not junk)?
    const isKeywordQuality = (k: string): boolean => {
      if (k.length < 2 || k.length > 25) return false;
      if (/^[\d\s.,]+$/.test(k)) return false;
      if (/^(https?:\/\/|www\.|mailto:|tel:)/.test(k)) return false;
      if (/[@#]/.test(k)) return false;
      if (/\.(com|co|jp|org|net|io)\b/.test(k)) return false;
      // Too long = sentence, not keyword
      if (k.split(/[\s　]/).length > 4) return false;
      // Ends with particle = not a keyword (e.g. "VISIONOIDは", "VISIONOIDの")
      if (/[はがのをにへでとも]$/.test(k) && k.length > 3) return false;
      // Contains "と" connecting two proper nouns (e.g. "東京都江戸川区とVISIONOID")
      if (/[ァ-ヶA-Z].{2,}と[ァ-ヶA-Z]/.test(k)) return false;
      // English navigation/CTA junk
      if (/^(learn more|read more|click here|view more|see more|get started|sign up|log in)$/i.test(k)) return false;
      // Navigation/generic terms to exclude
      const junk = [
        "ホーム", "home", "トップ", "top", "メニュー", "menu", "閉じる", "close",
        "プレスリリース", "ニュース", "news", "お知らせ", "一覧", "もっと見る",
        "詳しく見る", "詳細はこちら", "read more", "click here", "こちら",
        "learn more", "view all", "see all", "get started", "sign up",
        "会社概要", "company", "about", "about us", "お問い合わせ", "contact",
        "採用情報", "careers", "プライバシーポリシー", "privacy", "利用規約",
        "terms", "サイトマップ", "sitemap", "english", "japanese", "日本語",
        "copyright", "all rights reserved", "株式会社", "inc", "co., ltd",
      ];
      if (junk.some((j) => k.toLowerCase() === j.toLowerCase())) return false;
      return true;
    };

    const candidates = new Set<string>();

    // 1. Brand name (primary keyword)
    candidates.add(brand);

    // 2. From meta keywords (highest quality — site owner chose these)
    metaKeywords.filter(isKeywordQuality).forEach((k) => candidates.add(k));

    // 3. From headings — extract short service/product names only
    for (const h of headings) {
      // Split compound headings by separators
      const parts = h.split(/[|\-–—:：・/／、,]/).map((p) => p.trim());
      for (const part of parts) {
        if (isKeywordQuality(part)) {
          candidates.add(part);
        }
      }
    }

    // 4. From link text — service/feature page names (very valuable)
    const navJunk = new Set([
      "ホーム", "home", "top", "トップ", "menu", "メニュー", "close", "閉じる",
      "お問い合わせ", "contact", "english", "japanese", "日本語", "more",
      "もっと見る", "詳細", "一覧", "news", "blog", "ブログ",
      "会社概要", "about", "privacy", "採用", "recruit", "access",
    ]);
    const uniqueLinks = [...new Set(linkTexts)];
    uniqueLinks
      .filter((t) => t.length >= 2 && t.length <= 20)
      .filter((t) => !navJunk.has(t.toLowerCase()))
      .filter((t) => !/^\d+$/.test(t))
      .slice(0, 15)
      .forEach((t) => {
        if (isKeywordQuality(t)) candidates.add(t);
      });

    // 5. From structured data — service/product names only
    structuredKeywords
      .filter(isKeywordQuality)
      .forEach((k) => candidates.add(k));

    // 6. From title — extract short noun phrases, not full title
    if (title) {
      const titleParts = title.split(/[|\-–—:：・/／]/).map((p) => p.trim());
      titleParts.filter(isKeywordQuality).forEach((p) => candidates.add(p));
    }

    // 7. From description — extract only short noun-like phrases
    const allDescText = [description, ogDescMatch?.[1] || ""].join(" ");
    if (allDescText) {
      // Look for quoted terms or key nouns
      const quotedMatch = allDescText.match(/「([^」]+)」/g);
      if (quotedMatch) {
        quotedMatch.forEach((q) => {
          const term = q.replace(/[「」]/g, "").trim();
          if (isKeywordQuality(term)) candidates.add(term);
        });
      }
      // Split by delimiters and take only short, keyword-like phrases
      allDescText
        .split(/[、。,.\n！!？?／/]/)
        .map((p) => p.trim())
        .filter((p) => p.length >= 2 && p.length <= 15)
        .filter(isKeywordQuality)
        .slice(0, 5)
        .forEach((p) => candidates.add(p));
    }

    // 8. Extract service/product names via frequency analysis on RAW HTML
    //    (Wix/SPA sites embed content in JSON inside <script> tags, so we
    //     analyze the FULL HTML, not stripped text)
    const rawText = html
      .replace(/<[^>]+>/g, " ")      // strip tags but keep all text including JSON
      .replace(/\\u[\da-fA-F]{4}/g, (m) => {
        try { return JSON.parse(`"${m}"`); } catch { return m; }
      })
      .replace(/\\n|\\r|\\t/g, " ")
      .replace(/&[a-z]+;/gi, " ")
      .replace(/\s+/g, " ");

    // Japanese compound nouns: katakana, kanji+katakana, katakana+kanji
    const jpPatterns = [
      /[ァ-ヶー]{3,12}/g,                                    // pure katakana (ドローンショー)
      /[一-龥]{2,4}[ァ-ヶー]{2,8}/g,                          // kanji+katakana (映像制作 won't match, but 空撮ドローン)
      /[ァ-ヶー]{2,8}[一-龥]{2,6}/g,                          // katakana+kanji (ドローン空撮, ドローン測量)
      /[一-龥]{2,6}[一-龥ぁ-ん]{0,2}[一-龥]{2,6}/g,           // pure kanji compound (映像制作, 映像編集)
      /[ァ-ヶー]{2,8}[一-龥ぁ-ん]{1,4}[ァ-ヶー]{2,8}/g,       // kata+kanji+kata (イベントプロデュース)
    ];

    const termFreq = new Map<string, number>();
    for (const regex of jpPatterns) {
      let termMatch;
      while ((termMatch = regex.exec(rawText)) !== null) {
        const term = termMatch[0];
        if (term.length >= 3 && term.length <= 15) {
          termFreq.set(term, (termFreq.get(term) || 0) + 1);
        }
      }
    }

    // Generic terms to exclude from frequency analysis
    const genericTerms = new Set([
      "コンテンツ", "サービス", "テクノロジー", "プロジェクト", "カテゴリ",
      "アクセス", "メニュー", "ページ", "リンク", "ボタン", "セクション",
      "エラー", "ステータス", "コンポーネント", "レイアウト", "スタイル",
      "デフォルト", "オプション", "パラメータ", "プロパティ", "アイテム",
      "コンテナ", "ウィジェット", "モジュール", "プラグイン", "テンプレート",
      "フッター", "ヘッダー", "サイドバー", "ナビゲーション",
      "株式会社", "ホームページ", "ウェブサイト",
    ]);

    // Service names discovered from frequency analysis
    const serviceNames: string[] = [];
    [...termFreq.entries()]
      .filter(([term, count]) => count >= 3)
      .filter(([term]) => !genericTerms.has(term))
      .filter(([term]) => term.toLowerCase() !== brand.toLowerCase())
      .filter(([term]) => isKeywordQuality(term))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .forEach(([term]) => {
        candidates.add(term);
        serviceNames.push(term);
      });

    // 9. SEO-oriented combinations: use SERVICE NAMES (not brand) + suffixes
    const seoSuffixes = ["料金", "評判", "口コミ", "導入事例"];
    // Top service names get SEO suffix combinations
    serviceNames.slice(0, 5).forEach((svc) => {
      seoSuffixes.slice(0, 2).forEach((s) => candidates.add(`${svc} ${s}`));
    });
    // Brand also gets basic SEO suffixes
    ["サービス", "評判", "料金"].forEach((s) => candidates.add(`${brand} ${s}`));

    // Final filter pass
    const keywords = [...candidates]
      .filter(isKeywordQuality)
      .slice(0, 25);

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
