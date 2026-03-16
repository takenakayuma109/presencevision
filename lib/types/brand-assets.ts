export type AssetCategory = "logo" | "product" | "team" | "screenshot" | "icon" | "video" | "other";

export interface BrandAsset {
  id: string;
  projectId: string;
  category: AssetCategory;
  filename: string;
  url: string;           // Local or CDN URL
  mimeType: string;
  width?: number;
  height?: number;
  fileSize: number;
  tags: string[];         // AI-generated + manual tags
  uploadedAt: string;
}

export interface BrandColors {
  primary: string;    // HEX
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface BrandKit {
  projectId: string;
  colors: BrandColors;
  fontFamily?: string;
  assets: BrandAsset[];
}
