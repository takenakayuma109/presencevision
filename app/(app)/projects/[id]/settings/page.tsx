"use client";

import { use, useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Textarea, Badge } from "@/components/ui";
import { Settings, Save, Loader2, Plus, X, CheckCircle2, AlertTriangle, ArrowLeft, Globe, Target, Swords } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DbProject {
  id: string;
  name: string;
  url: string | null;
  description: string | null;
  locale: string;
  status: string;
  workspaceId: string;
  metadata: Record<string, unknown> | null;
  competitors: Array<{ id: string; name: string; domain: string | null }>;
}

export default function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);

  const [project, setProject] = useState<DbProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

  // Form fields
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [primaryKeyword, setPrimaryKeyword] = useState<string>("");
  const [keywordInput, setKeywordInput] = useState("");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [competitorInput, setCompetitorInput] = useState("");
  const [autoPublish, setAutoPublish] = useState(false);

  // Fetch project
  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: DbProject | null) => {
        if (data) {
          setProject(data);
          setName(data.name);
          setUrl(data.url ?? "");
          setDescription(data.description ?? "");
          const meta = data.metadata as Record<string, unknown> | null;
          setKeywords((meta?.keywords as string[]) ?? []);
          setPrimaryKeyword(
            (meta?.primaryKeyword as string) ??
              ((meta?.keywords as string[])?.[0] ?? ""),
          );
          setAutoPublish(meta?.autoPublish === true);
          setCompetitors(data.competitors.map((c) => c.name));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  const addKeyword = useCallback(() => {
    const kw = keywordInput.trim();
    if (kw && !keywords.includes(kw)) {
      setKeywords((prev) => [...prev, kw]);
    }
    setKeywordInput("");
  }, [keywordInput, keywords]);

  const removeKeyword = useCallback((kw: string) => {
    setKeywords((prev) => prev.filter((k) => k !== kw));
  }, []);

  const addCompetitor = useCallback(() => {
    const c = competitorInput.trim();
    if (c && !competitors.includes(c)) {
      setCompetitors((prev) => [...prev, c]);
    }
    setCompetitorInput("");
  }, [competitorInput, competitors]);

  const removeCompetitor = useCallback((c: string) => {
    setCompetitors((prev) => prev.filter((x) => x !== c));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus("idle");
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          url: url.trim() || null,
          description: description.trim() || null,
          keywords,
          primaryKeyword,
          competitors,
          autoPublish,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      const updated = await res.json();
      setProject(updated);
      setSaveStatus("saved");
      // Push the updated keyword config to the running engine (best-effort —
      // does not block the "saved" status).
      fetch(`/api/projects/${projectId}/engine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords, primaryKeyword }),
      }).catch(() => {});
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">設定</h2>
        </div>
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm">読み込み中...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">設定</h2>
        </div>
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">プロジェクトが見つかりません</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{project.name} - 設定</h2>
          <p className="text-sm text-muted-foreground mt-1">
            プロジェクトの基本情報と設定を編集
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saveStatus === "saved" && (
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              保存しました
            </Badge>
          )}
          {saveStatus === "error" && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              保存に失敗しました
            </Badge>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            保存
          </Button>
        </div>
      </div>

      {/* Publish mode */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">公開モード</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <button
            type="button"
            onClick={() => setAutoPublish(false)}
            className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
              !autoPublish
                ? "border-emerald-500/50 bg-emerald-500/5"
                : "border-border hover:border-blue-500/30"
            }`}
          >
            <div
              className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 ${
                !autoPublish ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground"
              }`}
            />
            <div>
              <div className="text-sm font-semibold">🛡️ 安全モード（承認あり・推奨）</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                公開前にあなたが確認してから公開。誤情報リスクをゼロに。
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setAutoPublish(true)}
            className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
              autoPublish
                ? "border-blue-500/50 bg-blue-500/5"
                : "border-border hover:border-blue-500/30"
            }`}
          >
            <div
              className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 ${
                autoPublish ? "border-blue-500 bg-blue-500" : "border-muted-foreground"
              }`}
            />
            <div>
              <div className="text-sm font-semibold">⚡ おまかせモード（承認なし）</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                承認もスキップして、AIが完全自動で公開。手間ゼロの「ほったらかし」運用。
              </div>
            </div>
          </button>
          <p className="text-xs text-muted-foreground">
            ※ 自社Hubは常時自動公開です。このモードは連携先（WordPress等）への公開方法に適用されます。変更後は右上の「保存」を押してください。
          </p>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            基本情報
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">プロジェクト名</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="プロジェクト名"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">URL</label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">説明</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="プロジェクトの説明"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Keywords */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            キーワード
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Primary (main) keyword — the user's #1 target */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium block">
              メインキーワード（最優先で1位を狙う語）
            </label>
            <p className="text-xs text-muted-foreground">記事はこのワード中心に生成されます。</p>
            <Input
              value={primaryKeyword}
              onChange={(e) => setPrimaryKeyword(e.target.value)}
              placeholder="例: ドローンショー"
            />
          </div>
          <div className="flex gap-2">
            <Input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="キーワードを入力..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addKeyword();
                }
              }}
            />
            <Button variant="outline" size="sm" onClick={addKeyword} className="shrink-0">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {keywords.map((kw) => (
                <Badge key={kw} variant="secondary" className="gap-1 pr-1">
                  {kw}
                  <button
                    onClick={() => removeKeyword(kw)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          {keywords.length === 0 && (
            <p className="text-xs text-muted-foreground">キーワードが未設定です</p>
          )}
        </CardContent>
      </Card>

      {/* Competitors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Swords className="h-4 w-4" />
            競合サイト
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={competitorInput}
              onChange={(e) => setCompetitorInput(e.target.value)}
              placeholder="競合サイト名またはURL..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCompetitor();
                }
              }}
            />
            <Button variant="outline" size="sm" onClick={addCompetitor} className="shrink-0">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {competitors.length > 0 && (
            <div className="space-y-1.5">
              {competitors.map((c) => (
                <div key={c} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span>{c}</span>
                  <button
                    onClick={() => removeCompetitor(c)}
                    className="rounded-full p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {competitors.length === 0 && (
            <p className="text-xs text-muted-foreground">競合サイトが未設定です</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
