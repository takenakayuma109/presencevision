"use client";

import { Button, Badge, Card, CardContent } from "@/components/ui";
import { useStore, methodLabels, availableCountries } from "@/lib/store";
import { ArrowLeft, Rocket, CheckCircle2, Zap, Repeat, Mail, Search, Swords, Building2 } from "lucide-react";

export function StepPlan() {
  const { wizard, setWizardStep, confirmAndStartProject } = useStore();
  const plan = wizard.generatedPlan;
  if (!plan) return null;

  const getCountryName = (code: string) => availableCountries.find((c) => c.code === code);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-50 dark:bg-green-950 mb-2">
          <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-xl font-semibold">AIプランが完成しました</h2>
        <p className="text-sm text-muted-foreground">確認して「作業を開始する」を押すと、全タスクが同時に稼働開始します</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-5">
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <h3 className="text-sm font-semibold">プラン概要</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{plan.summary}</p>
            <div className="flex gap-6 pt-2">
              <div className="text-center">
                <p className="text-2xl font-bold">{plan.tasks.length}</p>
                <p className="text-xs text-muted-foreground">タスク（同時実行）</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{plan.duration}</p>
                <p className="text-xs text-muted-foreground">期間</p>
              </div>
            </div>
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{plan.estimatedImpact}</p>
          </CardContent>
        </Card>

        {/* Countries */}
        <div className="flex gap-4">
          <div className="flex-1 rounded-lg border p-3">
            <p className="text-xs text-muted-foreground mb-1.5">事業ターゲット</p>
            <div className="flex flex-wrap gap-1">
              {wizard.businessCountries.map((c) => { const cc = getCountryName(c); return <Badge key={c} variant="secondary">{cc?.flag} {cc?.name}</Badge>; })}
            </div>
          </div>
          <div className="flex-1 rounded-lg border p-3">
            <p className="text-xs text-muted-foreground mb-1.5">プレゼンス拡散</p>
            <div className="flex flex-wrap gap-1">
              {wizard.presenceCountries.map((c) => { const cc = getCountryName(c); return <Badge key={c} variant="info">{cc?.flag} {cc?.name}</Badge>; })}
            </div>
          </div>
        </div>

        {/* Brand, Keywords, Competitors */}
        <div className="space-y-2">
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">ブランド名:</span>
              <span className="text-sm font-medium">{wizard.brandName}</span>
            </div>
            {wizard.keywords.length > 0 && (
              <div className="flex items-start gap-2 mb-2">
                <Search className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                <div>
                  <span className="text-xs text-muted-foreground">キーワード: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {wizard.keywords.map((kw) => <Badge key={kw} variant="info" className="text-xs">{kw}</Badge>)}
                  </div>
                </div>
              </div>
            )}
            {wizard.competitors.length > 0 && (
              <div className="flex items-start gap-2">
                <Swords className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                <div>
                  <span className="text-xs text-muted-foreground">競合: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {wizard.competitors.map((c) => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Report config */}
        <div className="rounded-lg border p-3 flex items-center gap-3">
          <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="text-sm">
            <span className="text-muted-foreground">レポート: </span>
            <span className="font-medium">{wizard.reportConfig.emailAddresses.join(", ")}</span>
            <span className="text-muted-foreground"> に毎日 </span>
            <span className="font-medium">{wizard.reportConfig.morningTime}</span>
            <span className="text-muted-foreground"> と </span>
            <span className="font-medium">{wizard.reportConfig.eveningTime}</span>
            <span className="text-muted-foreground"> に送信</span>
          </div>
        </div>

        {/* Tasks as parallel items */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Repeat className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">同時実行タスク一覧</h3>
            <Badge variant="success" className="text-xs">全タスク同時稼働</Badge>
          </div>
          {plan.tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3 rounded-lg border p-3">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{task.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">{methodLabels[task.method]}</Badge>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setWizardStep(3)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> 戻る
        </Button>
        <Button onClick={confirmAndStartProject} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
          <Rocket className="h-4 w-4" /> 作業を開始する
        </Button>
      </div>
    </div>
  );
}
