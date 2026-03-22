import { NextRequest, NextResponse } from "next/server";

// Suggest competitor sites by searching Google for the brand's top keywords
export async function POST(request: NextRequest) {
  try {
    const { keywords, language, brandDomain } = await request.json();
    if (!keywords?.length) {
      return NextResponse.json({ competitors: [] });
    }

    // Pick top 3 keywords for search
    const searchKeywords = keywords.slice(0, 3);
    const lang = language || "ja";
    const gl = lang === "ja" ? "jp" : lang === "ko" ? "kr" : lang === "zh" ? "cn" : "us";
    const hl = lang;

    const allResults: { domain: string; title: string; url: string; snippet: string }[] = [];

    for (const keyword of searchKeywords) {
      try {
        // Use Google's search via fetch (simplified scraping)
        const query = encodeURIComponent(keyword);
        const searchUrl = `https://www.google.com/search?q=${query}&hl=${hl}&gl=${gl}&num=10`;

        const res = await fetch(searchUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": `${lang},en;q=0.9`,
          },
          signal: AbortSignal.timeout(8000),
        });

        const html = await res.text();

        // Extract URLs from Google search results
        const linkRegex = /href="\/url\?q=(https?:\/\/[^&"]+)/g;
        let match;
        while ((match = linkRegex.exec(html)) !== null) {
          try {
            const resultUrl = decodeURIComponent(match[1]);
            const domain = new URL(resultUrl).hostname.replace("www.", "");

            // Skip Google, YouTube, Wikipedia, social media, and the brand's own domain
            const skipDomains = [
              "google.com", "google.co.jp", "youtube.com", "wikipedia.org",
              "facebook.com", "twitter.com", "instagram.com", "linkedin.com",
              "amazon.co.jp", "amazon.com", "tiktok.com", "pinterest.com",
              "reddit.com", "note.com", "qiita.com",
            ];
            if (skipDomains.some((d) => domain.includes(d))) continue;
            if (brandDomain && domain.includes(brandDomain.replace("www.", ""))) continue;

            // Extract title from surrounding HTML (best effort)
            const titleMatch = html.substring(Math.max(0, match.index - 500), match.index + 500)
              .match(/<h3[^>]*>([^<]+)<\/h3>/);
            const title = titleMatch?.[1] || domain;

            // Extract snippet
            const snippetMatch = html.substring(match.index, match.index + 1000)
              .match(/<span[^>]*class="[^"]*"[^>]*>([^<]{20,200})<\/span>/);
            const snippet = snippetMatch?.[1]?.replace(/<[^>]+>/g, "").trim() || "";

            if (!allResults.some((r) => r.domain === domain)) {
              allResults.push({ domain, title, url: `https://${domain}`, snippet });
            }
          } catch {
            continue;
          }
        }

        // Also try a simpler pattern for direct links
        const directLinkRegex = /<a[^>]*href="(https?:\/\/(?!www\.google)[^"]+)"[^>]*>/g;
        while ((match = directLinkRegex.exec(html)) !== null) {
          try {
            const resultUrl = match[1];
            const domain = new URL(resultUrl).hostname.replace("www.", "");
            const skipDomains = [
              "google.com", "google.co.jp", "gstatic.com", "googleapis.com",
              "youtube.com", "wikipedia.org", "schema.org",
              "facebook.com", "twitter.com", "instagram.com",
            ];
            if (skipDomains.some((d) => domain.includes(d))) continue;
            if (brandDomain && domain.includes(brandDomain.replace("www.", ""))) continue;

            if (!allResults.some((r) => r.domain === domain)) {
              allResults.push({ domain, title: domain, url: `https://${domain}`, snippet: "" });
            }
          } catch {
            continue;
          }
        }
      } catch {
        // Search failed for this keyword, continue
      }
    }

    // Rank by frequency across keyword searches and take top 5
    const competitors = allResults.slice(0, 5).map((r, i) => ({
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
