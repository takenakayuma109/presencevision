"use client";

import { useState } from "react";
import { Button, Input, Badge } from "@/components/ui";
import { useStore } from "@/lib/store";
import { Globe, Loader2, CheckCircle2, ArrowRight, Plus, X, Search, Swords, Building2 } from "lucide-react";

export function StepUrl() {
  const {
    wizard, analyzeSiteUrl, setWizardStep,
    setWizardKeywords, setWizardCompetitors, setWizardBrandName,
  } = useStore();
  const [url, setUrl] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [competitorInput, setCompetitorInput] = useState("");

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    await analyzeSiteUrl(url.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAnalyze();
  };

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (kw && !wizard.keywords.includes(kw)) {
      setWizardKeywords([...wizard.keywords, kw]);
      setKeywordInput("");
    }
  };
  const removeKeyword = (kw: string) => {
    setWizardKeywords(wizard.keywords.filter((k) => k !== kw));
  };

  const addCompetitor = () => {
    let comp = competitorInput.trim();
    if (!comp) return;
    if (!comp.startsWith("http")) comp = `https://${comp}`;
    if (!wizard.competitors.includes(comp)) {
      setWizardCompetitors([...wizard.competitors, comp]);
      setCompetitorInput("");
    }
  };
  const removeCompetitor = (c: string) => {
    setWizardCompetitors(wizard.competitors.filter((x) => x !== c));
  };

  const canProceed = wizard.siteInfo !== null;

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950 mb-2">
          <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-xl font-semibold">プレゼンスを高めたいURLを入力</h2>
        <p className="text-sm text-muted-foreground">
          ウェブサイトのURLを入力すると、自動的にサイト情報とキーワードを取得します
        </p>
      </div>

      <div className="max-w-lg mx-auto space-y-4">
        <div className="flex gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://example.com"
            className="h-12 text-base"
            disabled={wizard.isAnalyzing}
          />
          <Button
            onClick={handleAnalyze}
            disabled={!url.trim() || wizard.isAnalyzing}
            className="h-12 px-6"
          >
            {wizard.isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "分析"
            )}
          </Button>
        </div>

        {wizard.isAnalyzing && (
          <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50 p-4">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm font-medium">サイトを分析中...</p>
              <p className="text-xs text-muted-foreground">構造・コンテンツ・メタデータを取得しています</p>
            </div>
          </div>
        )}

        {wizard.siteInfo && !wizard.isAnalyzing && (
          <div className="space-y-4">
            {/* Site info card */}
            <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {wizard.siteInfo.favicon && (
                      <img src={wizard.siteInfo.favicon} alt="" className="h-4 w-4 rounded" />
                    )}
                    <p className="text-sm font-semibold">{wizard.siteInfo.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground break-all">{wizard.siteInfo.url}</p>
                  <p className="text-sm text-muted-foreground mt-1">{wizard.siteInfo.description}</p>
                  <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                    {wizard.siteInfo.language && <span>言語: {wizard.siteInfo.language}</span>}
                    {wizard.siteInfo.industry && <span>業界: {wizard.siteInfo.industry}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Brand name */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">ブランド名</h3>
              </div>
              <p className="text-xs text-muted-foreground ml-6">LLM引用チェック・コンテンツ生成で使用されます</p>
              <Input
                value={wizard.brandName}
                onChange={(e) => setWizardBrandName(e.target.value)}
                placeholder="会社名・サービス名"
                className="h-10"
              />
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">キーワード</h3>
              </div>
              <p className="text-xs text-muted-foreground ml-6">SERP順位トラッキング・SEO記事生成に使用されます（自動検出済み・編集可）</p>
              {wizard.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {wizard.keywords.map((kw) => (
                    <Badge key={kw} variant="info" className="gap-1 text-xs py-1 px-2.5">
                      {kw}
                      <button onClick={() => removeKeyword(kw)} className="ml-0.5 hover:text-red-500 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKeyword(); } }}
                  placeholder="キーワードを追加..."
                  className="h-9 text-sm flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={addKeyword} className="h-9 gap-1 text-xs px-3">
                  <Plus className="h-3 w-3" /> 追加
                </Button>
              </div>
            </div>

            {/* Competitors */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Swords className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">競合サイト（任意）</h3>
              </div>
              <p className="text-xs text-muted-foreground ml-6">競合との検索順位比較に使用されます</p>
              {wizard.competitors.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {wizard.competitors.map((c) => (
                    <Badge key={c} variant="secondary" className="gap-1 text-xs py-1 px-2.5">
                      {c}
                      <button onClick={() => removeCompetitor(c)} className="ml-0.5 hover:text-red-500 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={competitorInput}
                  onChange={(e) => setCompetitorInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCompetitor(); } }}
                  placeholder="https://competitor.com"
                  className="h-9 text-sm flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={addCompetitor} className="h-9 gap-1 text-xs px-3">
                  <Plus className="h-3 w-3" /> 追加
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => setWizardStep(2)}
          disabled={!canProceed}
          className="gap-2"
        >
          次へ <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
