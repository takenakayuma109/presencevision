import { NextRequest, NextResponse } from "next/server";

// Suggest competitors by:
// 1. Extracting external links from the brand's site (partners/competitors often linked)
// 2. Matching industry-specific known competitors
export async function POST(request: NextRequest) {
  try {
    const { keywords, language, brandDomain, siteUrl } = await request.json();
    if (!keywords?.length) {
      return NextResponse.json({ competitors: [] });
    }

    const results: { domain: string; title: string; url: string; snippet: string; score: number }[] = [];

    const skipDomains = new Set([
      "google.com", "google.co.jp", "youtube.com", "wikipedia.org",
      "facebook.com", "twitter.com", "x.com", "instagram.com", "linkedin.com",
      "amazon.co.jp", "amazon.com", "tiktok.com", "pinterest.com",
      "reddit.com", "note.com", "qiita.com", "github.com",
      "wixsite.com", "wix.com", "prtimes.jp", "atpress.ne.jp",
      "cloudflare.com", "googleapis.com", "gstatic.com", "w3.org",
      "schema.org", "fonts.googleapis.com", "cdnjs.cloudflare.com",
      "jquery.com", "bootstrapcdn.com", "vercel.app",
      brandDomain?.replace("www.", "") || "",
    ]);

    // 1. Fetch the brand's site and extract external links
    const targetUrl = siteUrl || (brandDomain ? `https://${brandDomain}` : null);
    if (targetUrl) {
      try {
        const res = await fetch(targetUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; PresenceVision/1.0)" },
          signal: AbortSignal.timeout(8000),
        });
        const html = await res.text();

        // Find all external links
        const linkRegex = /href=["'](https?:\/\/[^"']+)["']/gi;
        let match;
        const extDomains = new Map<string, number>();
        while ((match = linkRegex.exec(html)) !== null) {
          try {
            const domain = new URL(match[1]).hostname.replace("www.", "");
            if (skipDomains.has(domain)) continue;
            if (domain.includes("cdn") || domain.includes("static") || domain.includes("asset")) continue;
            extDomains.set(domain, (extDomains.get(domain) || 0) + 1);
          } catch { continue; }
        }

        // External domains linked multiple times are likely partners/competitors
        [...extDomains.entries()]
          .filter(([, count]) => count >= 1)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .forEach(([domain, count]) => {
            if (!results.some((r) => r.domain === domain)) {
              results.push({
                domain,
                title: domain,
                url: `https://${domain}`,
                snippet: "",
                score: count,
              });
            }
          });
      } catch {
        // Site fetch failed
      }
    }

    // 2. Industry-specific competitor databases
    const kwText = keywords.join(" ").toLowerCase();
    const industryCompetitors: Record<string, { domain: string; title: string; snippet: string }[]> = {
      "ドローン": [
        { domain: "skydio.com", title: "Skydio", snippet: "自律飛行ドローンメーカー" },
        { domain: "dji.com", title: "DJI", snippet: "世界最大のドローンメーカー" },
        { domain: "droneshow.co.jp", title: "ドローンショー", snippet: "ドローンショー・演出" },
        { domain: "skymagic.show", title: "Sky Magic", snippet: "ドローンショー演出" },
        { domain: "drone-entertainment.com", title: "Drone Entertainment", snippet: "ドローンエンターテインメント" },
        { domain: "redcliffglobal.com", title: "Red Cliff Global", snippet: "ドローンショー企画" },
      ],
      "ロボット": [
        { domain: "softbankrobotics.com", title: "SoftBank Robotics", snippet: "サービスロボット" },
        { domain: "fanuc.co.jp", title: "FANUC", snippet: "産業用ロボット" },
        { domain: "irobot.com", title: "iRobot", snippet: "家庭用ロボット" },
      ],
      "映像": [
        { domain: "aob.co.jp", title: "AOI Pro.", snippet: "映像プロダクション" },
        { domain: "tyo.co.jp", title: "TYO", snippet: "映像制作" },
        { domain: "omnibus-jp.com", title: "OMNIBUS JAPAN", snippet: "ポストプロダクション" },
      ],
      "イベント": [
        { domain: "hakuten.co.jp", title: "博展", snippet: "イベント・空間デザイン" },
        { domain: "dentsu-live.co.jp", title: "電通ライブ", snippet: "イベントプロデュース" },
        { domain: "cerespo.co.jp", title: "セレスポ", snippet: "イベント企画・運営" },
      ],
      "seo": [
        { domain: "semrush.com", title: "SEMrush", snippet: "SEO・デジタルマーケティングツール" },
        { domain: "ahrefs.com", title: "Ahrefs", snippet: "SEO分析ツール" },
        { domain: "moz.com", title: "Moz", snippet: "SEOツール・リソース" },
      ],
      "saas": [
        { domain: "hubspot.com", title: "HubSpot", snippet: "CRM・マーケティングプラットフォーム" },
        { domain: "salesforce.com", title: "Salesforce", snippet: "CRMプラットフォーム" },
      ],
    };

    for (const [industry, competitors] of Object.entries(industryCompetitors)) {
      if (kwText.includes(industry)) {
        for (const comp of competitors) {
          if (!skipDomains.has(comp.domain) && !results.some((r) => r.domain === comp.domain)) {
            results.push({ ...comp, url: `https://${comp.domain}`, score: 5 });
          }
        }
      }
    }

    // Sort by score and take top 5
    const competitors = results
      .sort((a, b) => b.score - a.score)
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
