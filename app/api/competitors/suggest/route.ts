import { NextRequest, NextResponse } from "next/server";

interface Result {
  domain: string;
  title: string;
  url: string;
  snippet: string;
}

// Suggest competitor sites using DuckDuckGo HTML search (no API key needed, no blocking)
export async function POST(request: NextRequest) {
  try {
    const { keywords, language, brandDomain } = await request.json();
    if (!keywords?.length) {
      return NextResponse.json({ competitors: [] });
    }

    const searchKeywords = keywords.slice(0, 3);
    const allResults: Result[] = [];

    const skipDomains = [
      "google.com", "google.co.jp", "youtube.com", "wikipedia.org",
      "facebook.com", "twitter.com", "x.com", "instagram.com", "linkedin.com",
      "amazon.co.jp", "amazon.com", "tiktok.com", "pinterest.com",
      "reddit.com", "note.com", "qiita.com", "duckduckgo.com",
      "wixsite.com", "wix.com", "prtimes.jp", "atpress.ne.jp",
    ];

    for (const keyword of searchKeywords) {
      try {
        const query = encodeURIComponent(keyword);
        // DuckDuckGo HTML-only endpoint (no JS needed, no blocking)
        const searchUrl = `https://html.duckduckgo.com/html/?q=${query}&kl=${language === "ja" ? "jp-jp" : "us-en"}`;

        const res = await fetch(searchUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Accept": "text/html",
          },
          signal: AbortSignal.timeout(10000),
        });

        const html = await res.text();

        // DuckDuckGo HTML results have this pattern:
        // <a rel="nofollow" class="result__a" href="URL">TITLE</a>
        // <a class="result__snippet" href="...">SNIPPET</a>
        const resultRegex = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/a>/gi;
        let match;
        while ((match = resultRegex.exec(html)) !== null) {
          try {
            let resultUrl = match[1];
            const title = match[2].replace(/<[^>]+>/g, "").trim();

            // DuckDuckGo sometimes wraps URLs in redirect
            if (resultUrl.includes("uddg=")) {
              const uddgMatch = resultUrl.match(/uddg=(https?[^&]+)/);
              if (uddgMatch) resultUrl = decodeURIComponent(uddgMatch[1]);
            }

            if (!resultUrl.startsWith("http")) continue;

            const domain = new URL(resultUrl).hostname.replace("www.", "");

            if (skipDomains.some((d) => domain.includes(d))) continue;
            if (brandDomain && domain.includes(brandDomain.replace("www.", ""))) continue;

            // Extract snippet (next sibling with class result__snippet)
            const snippetIdx = html.indexOf("result__snippet", match.index);
            let snippet = "";
            if (snippetIdx > 0 && snippetIdx - match.index < 1000) {
              const snippetMatch = html.substring(snippetIdx, snippetIdx + 500)
                .match(/>([^<]{10,200})</);
              if (snippetMatch) snippet = snippetMatch[1].trim();
            }

            if (!allResults.some((r) => r.domain === domain)) {
              allResults.push({ domain, title: title || domain, url: `https://${domain}`, snippet });
            }
          } catch {
            continue;
          }
        }

        // Fallback: try simpler link pattern
        if (allResults.length === 0) {
          const simpleLinkRegex = /<a[^>]*href="(https?:\/\/[^"]+)"[^>]*class="[^"]*result[^"]*"[^>]*>/gi;
          while ((match = simpleLinkRegex.exec(html)) !== null) {
            try {
              let resultUrl = match[1];
              if (resultUrl.includes("uddg=")) {
                const uddgMatch = resultUrl.match(/uddg=(https?[^&]+)/);
                if (uddgMatch) resultUrl = decodeURIComponent(uddgMatch[1]);
              }
              if (!resultUrl.startsWith("http")) continue;
              const domain = new URL(resultUrl).hostname.replace("www.", "");
              if (skipDomains.some((d) => domain.includes(d))) continue;
              if (brandDomain && domain.includes(brandDomain.replace("www.", ""))) continue;
              if (!allResults.some((r) => r.domain === domain)) {
                allResults.push({ domain, title: domain, url: `https://${domain}`, snippet: "" });
              }
            } catch { continue; }
          }
        }
      } catch {
        // Search failed for this keyword
      }
    }

    // Deduplicate by domain, take top 5
    const seen = new Set<string>();
    const competitors = allResults
      .filter((r) => {
        if (seen.has(r.domain)) return false;
        seen.add(r.domain);
        return true;
      })
      .slice(0, 5)
      .map((r, i) => ({
        rank: i + 1,
        domain: r.domain,
        url: r.url,
        title: r.title,
        snippet: r.snippet,
      }));

    return NextResponse.json({ competitors });
  } catch (err) {
    console.error("Competitor suggestion error:", err);
    return NextResponse.json({ competitors: [] });
  }
}
