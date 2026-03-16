// ---------------------------------------------------------------------------
// OG Image HTML Generation
// Generates a self-contained HTML template for Open Graph images (1200x630).
// The HTML can be rendered by Playwright and captured as an image.
// ---------------------------------------------------------------------------

export interface OGImageConfig {
  title: string;
  description: string;
  brandColors: { primary: string; secondary: string; accent: string };
  logoUrl?: string;
}

export interface GeneratedOGImage {
  html: string;
  width: number;
  height: number;
}

// Standard OG image dimensions
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function computeTitleFontSize(title: string): number {
  if (title.length > 60) return 32;
  if (title.length > 40) return 38;
  return 44;
}

export function generateOGImageHTML(
  title: string,
  description: string,
  brandColors: { primary: string; secondary: string; accent: string },
  logoUrl?: string
): GeneratedOGImage {
  const { primary, secondary, accent } = brandColors;
  const titleFontSize = computeTitleFontSize(title);

  const descriptionTruncated =
    description.length > 120
      ? description.slice(0, 117) + "..."
      : description;

  const logoBlock = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="logo" style="height:48px;object-fit:contain;" />`
    : "";

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=${OG_WIDTH}" />
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:${OG_WIDTH}px; height:${OG_HEIGHT}px; overflow:hidden; }
</style>
</head>
<body>
<div style="
  width:${OG_WIDTH}px;
  height:${OG_HEIGHT}px;
  background:linear-gradient(135deg, ${primary} 0%, ${secondary} 70%);
  display:flex;
  flex-direction:column;
  justify-content:center;
  padding:60px 72px;
  font-family:'Noto Sans JP','Helvetica Neue',Arial,sans-serif;
  color:#ffffff;
  position:relative;
">
  <!-- Decorative accent bar -->
  <div style="
    position:absolute;
    top:0;
    left:0;
    width:100%;
    height:6px;
    background:${accent};
  "></div>

  <!-- Logo -->
  <div style="margin-bottom:24px;">
    ${logoBlock}
  </div>

  <!-- Title -->
  <h1 style="
    font-size:${titleFontSize}px;
    font-weight:800;
    line-height:1.3;
    margin-bottom:20px;
    text-shadow:0 2px 8px rgba(0,0,0,0.2);
  ">${escapeHtml(title)}</h1>

  <!-- Description -->
  <p style="
    font-size:20px;
    line-height:1.5;
    opacity:0.9;
    max-width:900px;
  ">${escapeHtml(descriptionTruncated)}</p>
</div>
</body>
</html>`;

  return { html, width: OG_WIDTH, height: OG_HEIGHT };
}
