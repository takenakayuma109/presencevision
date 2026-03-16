"use client";

import React, { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BrandAsset, BrandColors, AssetCategory } from "@/lib/types/brand-assets";

const CATEGORIES: { value: AssetCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "logo", label: "Logo" },
  { value: "product", label: "Product" },
  { value: "team", label: "Team" },
  { value: "screenshot", label: "Screenshot" },
  { value: "icon", label: "Icon" },
  { value: "video", label: "Video" },
  { value: "other", label: "Other" },
];

const FONT_OPTIONS = [
  "Noto Sans JP",
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Poppins",
  "Montserrat",
  "Source Sans Pro",
  "M PLUS Rounded 1c",
  "Zen Kaku Gothic New",
];

interface BrandAssetsSettingsProps {
  projectId: string;
}

export default function BrandAssetsSettings({ projectId }: BrandAssetsSettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [colors, setColors] = useState<BrandColors>({
    primary: "#2563eb",
    secondary: "#64748b",
    accent: "#f59e0b",
    background: "#ffffff",
    text: "#0f172a",
  });

  const [fontFamily, setFontFamily] = useState("Noto Sans JP");
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [activeCategory, setActiveCategory] = useState<AssetCategory | "all">("all");
  const [uploadCategory, setUploadCategory] = useState<AssetCategory>("product");
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [editTagsValue, setEditTagsValue] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const filteredAssets =
    activeCategory === "all"
      ? assets
      : assets.filter((a) => a.category === activeCategory);

  const assetCounts = CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat.value] =
        cat.value === "all"
          ? assets.length
          : assets.filter((a) => a.category === cat.value).length;
      return acc;
    },
    {} as Record<string, number>
  );

  const handleColorChange = useCallback(
    (key: keyof BrandColors, value: string) => {
      setColors((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleFileDrop = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      Array.from(files).forEach((file) => {
        const asset: BrandAsset = {
          id: crypto.randomUUID(),
          projectId,
          category: uploadCategory,
          filename: file.name,
          url: URL.createObjectURL(file),
          mimeType: file.type,
          fileSize: file.size,
          tags: [],
          uploadedAt: new Date().toISOString(),
        };
        setAssets((prev) => [...prev, asset]);
      });
    },
    [projectId, uploadCategory]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileDrop(e.dataTransfer.files);
    },
    [handleFileDrop]
  );

  const handleDelete = useCallback((assetId: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== assetId));
  }, []);

  const handleStartEditTags = useCallback((asset: BrandAsset) => {
    setEditingAssetId(asset.id);
    setEditTagsValue(asset.tags.join(", "));
  }, []);

  const handleSaveTags = useCallback(() => {
    if (!editingAssetId) return;
    const newTags = editTagsValue
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    setAssets((prev) =>
      prev.map((a) => (a.id === editingAssetId ? { ...a, tags: newTags } : a))
    );
    setEditingAssetId(null);
    setEditTagsValue("");
  }, [editingAssetId, editTagsValue]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Brand Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Colors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {(
              Object.entries(colors) as [keyof BrandColors, string][]
            ).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <label className="text-sm font-medium capitalize">{key}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={value}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="font-mono text-sm"
                    maxLength={7}
                  />
                </div>
                <div
                  className="h-8 rounded border"
                  style={{ backgroundColor: value }}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Font Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Font Family</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {FONT_OPTIONS.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
          <p
            className="mt-3 text-lg"
            style={{ fontFamily }}
          >
            The quick brown fox jumps over the lazy dog. / ABCDabcd1234
          </p>
        </CardContent>
      </Card>

      {/* Asset Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-3">
            <label className="text-sm font-medium">Category:</label>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value as AssetCategory)}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            >
              {CATEGORIES.filter((c) => c.value !== "all").map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <div className="text-muted-foreground">
              <p className="text-lg font-medium">
                Drop files here or click to upload
              </p>
              <p className="text-sm mt-1">
                Images, videos, icons, screenshots
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={(e) => handleFileDrop(e.target.files)}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Asset Library */}
      <Card>
        <CardHeader>
          <CardTitle>
            Asset Library
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({assets.length} total)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Category Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.value}
                variant={activeCategory === cat.value ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat.value)}
              >
                {cat.label}
                <span className="ml-1.5 text-xs opacity-70">
                  {assetCounts[cat.value]}
                </span>
              </Button>
            ))}
          </div>

          {/* Asset Grid */}
          {filteredAssets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No assets uploaded yet.</p>
              <p className="text-sm mt-1">
                Upload images, logos, or videos to build your brand library.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="group relative border rounded-lg overflow-hidden bg-muted/30"
                >
                  {/* Thumbnail */}
                  <div className="aspect-square relative">
                    {asset.mimeType.startsWith("image/") ? (
                      <img
                        src={asset.url}
                        alt={asset.filename}
                        className="w-full h-full object-cover"
                      />
                    ) : asset.mimeType.startsWith("video/") ? (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <span className="text-3xl">&#9654;</span>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <span className="text-2xl text-muted-foreground">&#128196;</span>
                      </div>
                    )}

                    {/* Hover overlay with actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleStartEditTags(asset)}
                      >
                        Tags
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(asset.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-2 space-y-1">
                    <p className="text-xs font-medium truncate" title={asset.filename}>
                      {asset.filename}
                    </p>
                    <div className="flex items-center gap-1 flex-wrap">
                      <Badge variant="secondary" className="text-[10px]">
                        {asset.category}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {formatFileSize(asset.fileSize)}
                      </span>
                    </div>
                    {asset.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {asset.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-[10px]"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {asset.tags.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{asset.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tag Editor Modal */}
          {editingAssetId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-background border rounded-lg p-6 w-full max-w-md shadow-lg">
                <h3 className="text-lg font-semibold mb-3">Edit Tags</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Comma-separated tags:
                </p>
                <Input
                  value={editTagsValue}
                  onChange={(e) => setEditTagsValue(e.target.value)}
                  placeholder="product, hero, dark-mode"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTags();
                  }}
                />
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingAssetId(null);
                      setEditTagsValue("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveTags}>Save</Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
