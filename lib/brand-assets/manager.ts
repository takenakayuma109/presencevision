import type { BrandAsset, BrandKit, BrandColors, AssetCategory } from "@/lib/types/brand-assets";

// In-memory store for brand kits keyed by projectId
const brandKits = new Map<string, BrandKit>();

function ensureKit(projectId: string): BrandKit {
  let kit = brandKits.get(projectId);
  if (!kit) {
    kit = {
      projectId,
      colors: {
        primary: "#2563eb",
        secondary: "#64748b",
        accent: "#f59e0b",
        background: "#ffffff",
        text: "#0f172a",
      },
      assets: [],
    };
    brandKits.set(projectId, kit);
  }
  return kit;
}

export function addAsset(
  projectId: string,
  metadata: Omit<BrandAsset, "id" | "projectId" | "uploadedAt">
): BrandAsset {
  const kit = ensureKit(projectId);
  const asset: BrandAsset = {
    ...metadata,
    id: crypto.randomUUID(),
    projectId,
    uploadedAt: new Date().toISOString(),
  };
  kit.assets.push(asset);
  return asset;
}

export function removeAsset(projectId: string, assetId: string): boolean {
  const kit = brandKits.get(projectId);
  if (!kit) return false;
  const idx = kit.assets.findIndex((a) => a.id === assetId);
  if (idx === -1) return false;
  kit.assets.splice(idx, 1);
  return true;
}

export function getAssets(
  projectId: string,
  category?: AssetCategory
): BrandAsset[] {
  const kit = ensureKit(projectId);
  if (!category) return kit.assets;
  return kit.assets.filter((a) => a.category === category);
}

export function updateTags(assetId: string, tags: string[]): BrandAsset | null {
  for (const kit of brandKits.values()) {
    const asset = kit.assets.find((a) => a.id === assetId);
    if (asset) {
      asset.tags = tags;
      return asset;
    }
  }
  return null;
}

export function updateColors(projectId: string, colors: Partial<BrandColors>): BrandColors {
  const kit = ensureKit(projectId);
  kit.colors = { ...kit.colors, ...colors };
  return kit.colors;
}

export function updateFont(projectId: string, fontFamily: string): void {
  const kit = ensureKit(projectId);
  kit.fontFamily = fontFamily;
}

export function getBrandKit(projectId: string): BrandKit {
  return ensureKit(projectId);
}
