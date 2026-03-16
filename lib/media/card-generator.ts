// ---------------------------------------------------------------------------
// Brand Card Image Generation
// Generates self-contained HTML templates for social media brand cards.
// The HTML can be rendered by Playwright and captured as an image.
// ---------------------------------------------------------------------------

export interface CardConfig {
  title: string;
  points: string[]; // Key points from article (3-5 items)
  brandColors: { primary: string; secondary: string; accent: string };
  logoUrl?: string;
  siteUrl: string;
  channel: "twitter" | "instagram" | "linkedin" | "pinterest" | "facebook";
}

export interface GeneratedCard {
  html: string; // HTML template that can be rendered/screenshot
  width: number;
  height: number;
  channel: string;
}

// ---------------------------------------------------------------------------
// Channel dimensions
// ---------------------------------------------------------------------------
const CARD_DIMENSIONS: Record<CardConfig["channel"], { width: number; height: number }> = {
  twitter: { width: 1200, height: 675 },
  instagram: { width: 1080, height: 1080 },
  linkedin: { width: 1200, height: 627 },
  pinterest: { width: 1000, height: 1500 },
  facebook: { width: 1200, height: 630 },
};

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildPointsHTML(points: string[], accent: string): string {
  return points
    .map(
      (p) => `
      <div style="display:flex;align-items:flex-start;margin-bottom:12px;">
        <span style="color:${accent};font-size:20px;margin-right:10px;line-height:1.4;">&#x2713;</span>
        <span style="font-size:18px;line-height:1.4;color:#ffffff;">${escapeHtml(p)}</span>
      </div>`
    )
    .join("");
}

function computeTitleFontSize(
  title: string,
  width: number,
  height: number
): number {
  const area = width * height;
  const baseSize = Math.round(Math.sqrt(area) * 0.04);
  if (title.length > 60) return Math.round(baseSize * 0.75);
  if (title.length > 40) return Math.round(baseSize * 0.85);
  return baseSize;
}

// ---------------------------------------------------------------------------
// Core generator
// ---------------------------------------------------------------------------

export function generateCardHTML(config: CardConfig): GeneratedCard {
  const { title, points, brandColors, logoUrl, siteUrl, channel } = config;
  const { primary, secondary, accent } = brandColors;
  const { width, height } = CARD_DIMENSIONS[channel];

  const titleFontSize = computeTitleFontSize(title, width, height);
  const isVertical = height > width; // e.g. Pinterest
  const pointsFontSize = isVertical ? 20 : 18;
  const padding = Math.round(width * 0.06);

  const logoBlock = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="logo" style="height:40px;margin-right:12px;object-fit:contain;" />`
    : "";

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=${width}" />
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:${width}px; height:${height}px; overflow:hidden; }
</style>
</head>
<body>
<div style="
  width:${width}px;
  height:${height}px;
  background:linear-gradient(135deg, ${primary} 0%, ${secondary} 100%);
  display:flex;
  flex-direction:column;
  justify-content:space-between;
  padding:${padding}px;
  font-family:'Noto Sans JP','Helvetica Neue',Arial,sans-serif;
  color:#ffffff;
">
  <!-- Title -->
  <div style="flex-shrink:0;">
    <h1 style="
      font-size:${titleFontSize}px;
      font-weight:800;
      line-height:1.3;
      margin-bottom:${Math.round(padding * 0.6)}px;
      text-shadow:0 2px 8px rgba(0,0,0,0.25);
    ">${escapeHtml(title)}</h1>
  </div>

  <!-- Points -->
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;font-size:${pointsFontSize}px;">
    ${buildPointsHTML(points, accent)}
  </div>

  <!-- Footer: logo + site URL -->
  <div style="
    flex-shrink:0;
    display:flex;
    align-items:center;
    justify-content:space-between;
    border-top:1px solid rgba(255,255,255,0.2);
    padding-top:${Math.round(padding * 0.4)}px;
  ">
    <div style="display:flex;align-items:center;">
      ${logoBlock}
    </div>
    <span style="font-size:14px;opacity:0.8;color:#ffffff;">${escapeHtml(siteUrl)}</span>
  </div>
</div>
</body>
</html>`;

  return { html, width, height, channel };
}
