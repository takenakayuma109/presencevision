import type { BrandAsset, AssetCategory } from "@/lib/types/brand-assets";
import { getAssets } from "./manager";

export interface AssetMatch {
  asset: BrandAsset;
  score: number;
  reason: string;
}

// Category preferences per content type keyword
const CATEGORY_KEYWORD_MAP: Record<string, AssetCategory[]> = {
  product: ["product", "screenshot"],
  service: ["product", "screenshot"],
  launch: ["product", "logo"],
  company: ["logo", "team"],
  culture: ["team"],
  hiring: ["team"],
  tutorial: ["screenshot", "product"],
  guide: ["screenshot", "product"],
  announcement: ["logo", "product"],
  branding: ["logo", "icon"],
};

// Channel aspect ratio preferences
const CHANNEL_REQUIREMENTS: Record<string, { preferSquare?: boolean; prefer16x9?: boolean; preferVertical?: boolean }> = {
  instagram: { preferSquare: true },
  twitter: { prefer16x9: true },
  x: { prefer16x9: true },
  facebook: { prefer16x9: true },
  youtube: { prefer16x9: true },
  tiktok: { preferVertical: true },
  pinterest: { preferVertical: true },
  linkedin: { prefer16x9: true },
};

function computeTagOverlap(assetTags: string[], keywords: string[]): number {
  const normalizedTags = assetTags.map((t) => t.toLowerCase());
  const normalizedKeywords = keywords.map((k) => k.toLowerCase());
  let matches = 0;
  for (const kw of normalizedKeywords) {
    if (normalizedTags.some((tag) => tag.includes(kw) || kw.includes(tag))) {
      matches++;
    }
  }
  return keywords.length > 0 ? matches / keywords.length : 0;
}

function computeCategoryBonus(asset: BrandAsset, keywords: string[]): number {
  let bonus = 0;
  for (const kw of keywords) {
    const preferred = CATEGORY_KEYWORD_MAP[kw.toLowerCase()];
    if (preferred && preferred.includes(asset.category)) {
      bonus += 0.3;
      break;
    }
  }
  return bonus;
}

function computeChannelFit(asset: BrandAsset, channel?: string): { score: number; reason: string } {
  if (!channel || !asset.width || !asset.height) {
    return { score: 0, reason: "" };
  }

  const req = CHANNEL_REQUIREMENTS[channel.toLowerCase()];
  if (!req) return { score: 0, reason: "" };

  const ratio = asset.width / asset.height;

  if (req.preferSquare && Math.abs(ratio - 1) < 0.15) {
    return { score: 0.2, reason: `Square aspect ratio fits ${channel}` };
  }
  if (req.prefer16x9 && Math.abs(ratio - 16 / 9) < 0.2) {
    return { score: 0.2, reason: `16:9 aspect ratio fits ${channel}` };
  }
  if (req.preferVertical && ratio < 0.7) {
    return { score: 0.2, reason: `Vertical aspect ratio fits ${channel}` };
  }

  return { score: 0, reason: "" };
}

export function matchAssetsToContent(
  projectId: string,
  articleKeywords: string[],
  channel?: string
): AssetMatch[] {
  const assets = getAssets(projectId);

  const matches: AssetMatch[] = assets.map((asset) => {
    const tagScore = computeTagOverlap(asset.tags, articleKeywords);
    const categoryBonus = computeCategoryBonus(asset, articleKeywords);
    const channelFit = computeChannelFit(asset, channel);

    const totalScore = Math.min(tagScore + categoryBonus + channelFit.score, 1);

    const reasons: string[] = [];
    if (tagScore > 0) reasons.push(`Tag match: ${Math.round(tagScore * 100)}%`);
    if (categoryBonus > 0) reasons.push(`Category "${asset.category}" matches content type`);
    if (channelFit.reason) reasons.push(channelFit.reason);
    if (reasons.length === 0) reasons.push("No strong match");

    return {
      asset,
      score: Math.round(totalScore * 100) / 100,
      reason: reasons.join("; "),
    };
  });

  return matches
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);
}
