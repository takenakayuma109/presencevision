"use client";

import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { useStore } from "@/lib/store";
import { Globe, Loader2, CheckCircle2, ArrowRight } from "lucide-react";

export function StepUrl() {
  const { wizard, analyzeSiteUrl, setWizardStep } = useStore();
  const [url, setUrl] = useState("");

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    await analyzeSiteUrl(url.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAnalyze();
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
          ウェブサイトのURLを入力すると、自動的にサイト情報を取得します
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
