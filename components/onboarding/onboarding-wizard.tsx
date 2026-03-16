"use client";

import { useState, useCallback, type KeyboardEvent, type DragEvent } from "react";
import {
  Button,
  Badge,
  Card,
  CardContent,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  Rocket,
  Globe,
  Search,
  Zap,
  ArrowRight,
  ArrowLeft,
  Check,
  Upload,
  X,
  Plus,
  ExternalLink,
  Key,
  Sparkles,
  Twitter,
  Linkedin,
  BookOpen,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Tone = "Professional" | "Casual" | "Friendly" | "Authoritative" | "Playful";

interface ProjectData {
  url: string;
  name: string;
  description: string;
}

interface BrandData {
  tone: Tone;
  primaryColor: string;
  logoFile: File | null;
  logoPreview: string | null;
  ngWords: string[];
}

interface ChannelState {
  connected: boolean;
}

type ChannelStates = Record<string, ChannelState>;

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TONES: { value: Tone; label: string; description: string }[] = [
  { value: "Professional", label: "Professional", description: "ビジネス向けの信頼感ある表現" },
  { value: "Casual", label: "Casual", description: "親しみやすいカジュアルな表現" },
  { value: "Friendly", label: "Friendly", description: "温かみのある丁寧な表現" },
  { value: "Authoritative", label: "Authoritative", description: "権威性のある専門的な表現" },
  { value: "Playful", label: "Playful", description: "遊び心のある楽しい表現" },
];

const RECOMMENDED_CHANNELS = [
  {
    id: "cms",
    name: "自社サイト (CMS)",
    icon: Globe,
    method: "api_key" as const,
    color: "bg-blue-500",
  },
  {
    id: "twitter",
    name: "Twitter / X",
    icon: Twitter,
    method: "oauth" as const,
    color: "bg-black dark:bg-white/10",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    method: "oauth" as const,
    color: "bg-[#0A66C2]",
  },
  {
    id: "medium",
    name: "Medium",
    icon: BookOpen,
    method: "api_key" as const,
    color: "bg-black dark:bg-white/10",
  },
  {
    id: "note",
    name: "note.com",
    icon: FileText,
    method: "api_key" as const,
    color: "bg-[#41C9B4]",
  },
];

const PRESET_COLORS = [
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#06B6D4",
  "#6366F1",
  "#0EA5E9",
];

/* ------------------------------------------------------------------ */
/*  Progress Bar                                                       */
/* ------------------------------------------------------------------ */

function ProgressBar({ current, total }: { current: number; total: number }) {
  const percentage = (current / total) * 100;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-white/90">
          ステップ {current} / {total}
        </span>
        <span className="text-white/60">{Math.round(percentage)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-white/20 overflow-hidden">
        <div
          className="h-full rounded-full bg-white transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 1: Welcome                                                    */
/* ------------------------------------------------------------------ */

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center text-center space-y-8 py-8">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg">
        <Rocket className="h-10 w-10 text-white" />
      </div>

      <div className="space-y-3">
        <h2 className="text-3xl font-bold tracking-tight">
          PresenceVisionへようこそ！
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          AIが24時間自動で、あなたのデジタルプレゼンスを最適化します。
          初期設定を完了して、すぐに始めましょう。
        </p>
      </div>

      <div className="grid gap-4 w-full max-w-lg text-left">
        <div className="flex items-start gap-4 rounded-lg border p-4 bg-card">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
            <Search className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="font-medium text-sm">SEOコンテンツを自動生成</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              ローカルLLMがロングテールキーワードを分析し、最適な記事を自動で作成します
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-lg border p-4 bg-card">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
            <Zap className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <p className="font-medium text-sm">20以上のチャネルへ自動配信</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              SNS、ブログ、Q&Aサイトなど、あらゆるプラットフォームに自動投稿します
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-lg border p-4 bg-card">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
            <Globe className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="font-medium text-sm">API課金ゼロで運用</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              ローカルLLM + Playwrightで動作するため、外部API費用は一切かかりません
            </p>
          </div>
        </div>
      </div>

      <Button size="lg" onClick={onNext} className="gap-2 px-8">
        設定を始める
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 2: Project Registration                                       */
/* ------------------------------------------------------------------ */

function StepProject({
  data,
  onChange,
}: {
  data: ProjectData;
  onChange: (data: ProjectData) => void;
}) {
  return (
    <div className="space-y-6 py-4">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold">プロジェクト登録</h2>
        <p className="text-sm text-muted-foreground">
          最適化したいWebサイトの情報を入力してください
        </p>
      </div>

      <div className="max-w-lg mx-auto space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            サイトURL <span className="text-destructive">*</span>
          </label>
          <Input
            type="url"
            placeholder="https://example.com"
            value={data.url}
            onChange={(e) => onChange({ ...data, url: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">プロジェクト名</label>
          <Input
            placeholder="マイプロジェクト"
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">簡単な説明</label>
          <Textarea
            placeholder="サイトの概要やターゲット層を教えてください"
            value={data.description}
            onChange={(e) => onChange({ ...data, description: e.target.value })}
            rows={3}
          />
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 p-4">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-blue-500 shrink-0" />
            <p className="text-blue-700 dark:text-blue-300">
              AIが自動でサイトを分析します。URLを入力するだけで、コンテンツ戦略を最適化します。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 3: Brand Settings                                             */
/* ------------------------------------------------------------------ */

function StepBrand({
  data,
  onChange,
}: {
  data: BrandData;
  onChange: (data: BrandData) => void;
}) {
  const [ngInput, setNgInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          onChange({
            ...data,
            logoFile: file,
            logoPreview: reader.result as string,
          });
        };
        reader.readAsDataURL(file);
      }
    },
    [data, onChange],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          onChange({
            ...data,
            logoFile: file,
            logoPreview: reader.result as string,
          });
        };
        reader.readAsDataURL(file);
      }
    },
    [data, onChange],
  );

  const handleNgKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && ngInput.trim()) {
      e.preventDefault();
      if (!data.ngWords.includes(ngInput.trim())) {
        onChange({ ...data, ngWords: [...data.ngWords, ngInput.trim()] });
      }
      setNgInput("");
    }
  };

  const addNgWord = () => {
    if (ngInput.trim() && !data.ngWords.includes(ngInput.trim())) {
      onChange({ ...data, ngWords: [...data.ngWords, ngInput.trim()] });
      setNgInput("");
    }
  };

  const removeNgWord = (word: string) => {
    onChange({ ...data, ngWords: data.ngWords.filter((w) => w !== word) });
  };

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold">ブランド設定</h2>
        <p className="text-sm text-muted-foreground">
          AIが生成するコンテンツのトーンとブランドを設定します
        </p>
      </div>

      <div className="max-w-lg mx-auto space-y-6">
        {/* Tone Selector */}
        <div className="space-y-3">
          <label className="text-sm font-medium">ブランドボイス・トーン</label>
          <div className="grid gap-2">
            {TONES.map((t) => (
              <button
                key={t.value}
                onClick={() => onChange({ ...data, tone: t.value })}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 text-left transition-all",
                  data.tone === t.value
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 ring-1 ring-blue-500"
                    : "hover:border-border hover:bg-accent/50",
                )}
              >
                <div
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    data.tone === t.value
                      ? "border-blue-500 bg-blue-500"
                      : "border-muted-foreground/30",
                  )}
                >
                  {data.tone === t.value && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Color Picker */}
        <div className="space-y-3">
          <label className="text-sm font-medium">プライマリブランドカラー</label>
          <div className="flex items-center gap-3">
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => onChange({ ...data, primaryColor: color })}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
                    data.primaryColor === color
                      ? "border-foreground scale-110 ring-2 ring-offset-2 ring-offset-background"
                      : "border-transparent",
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <Input
              type="color"
              value={data.primaryColor}
              onChange={(e) => onChange({ ...data, primaryColor: e.target.value })}
              className="h-8 w-12 p-0.5 cursor-pointer"
            />
          </div>
        </div>

        {/* Logo Upload */}
        <div className="space-y-3">
          <label className="text-sm font-medium">ロゴ</label>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            className={cn(
              "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer",
              isDragging
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                : "border-muted-foreground/25 hover:border-muted-foreground/50",
            )}
          >
            {data.logoPreview ? (
              <div className="relative">
                <img
                  src={data.logoPreview}
                  alt="Logo preview"
                  className="h-16 w-16 rounded-lg object-contain"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange({ ...data, logoFile: null, logoPreview: null });
                  }}
                  className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  ドラッグ＆ドロップまたはクリックしてアップロード
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  PNG, JPG, SVG (最大2MB)
                </p>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </div>
        </div>

        {/* NG Words */}
        <div className="space-y-3">
          <label className="text-sm font-medium">
            NGワード <span className="text-muted-foreground font-normal">(任意)</span>
          </label>
          <div className="flex gap-2">
            <Input
              value={ngInput}
              onChange={(e) => setNgInput(e.target.value)}
              onKeyDown={handleNgKeyDown}
              placeholder="ブロックしたいワードを入力してEnter"
              className="flex-1"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={addNgWord}
              disabled={!ngInput.trim()}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          {data.ngWords.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {data.ngWords.map((word) => (
                <Badge key={word} variant="secondary" className="gap-1 pr-1">
                  {word}
                  <button
                    onClick={() => removeNgWord(word)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 4: Channel Connection                                         */
/* ------------------------------------------------------------------ */

function StepChannels({
  channels,
  onChange,
}: {
  channels: ChannelStates;
  onChange: (channels: ChannelStates) => void;
}) {
  const connectedCount = Object.values(channels).filter((c) => c.connected).length;

  const handleConnect = (id: string) => {
    onChange({ ...channels, [id]: { connected: true } });
  };

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold">チャネル接続</h2>
        <p className="text-sm text-muted-foreground">
          コンテンツを配信するチャネルを接続してください
        </p>
      </div>

      <div className="max-w-lg mx-auto space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-3">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            最低1つのチャネルを接続してください。後から設定画面で追加・変更できます。
          </p>
        </div>

        <div className="space-y-3">
          {RECOMMENDED_CHANNELS.map((ch) => {
            const state = channels[ch.id];
            const Icon = ch.icon;

            return (
              <div
                key={ch.id}
                className={cn(
                  "flex items-center justify-between rounded-lg border p-4 transition-all",
                  state?.connected
                    ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/20"
                    : "hover:border-border",
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      ch.color,
                    )}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{ch.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {ch.method === "oauth" ? "OAuth認証" : "APIキー接続"}
                    </p>
                  </div>
                </div>

                {state?.connected ? (
                  <Badge variant="success" className="gap-1">
                    <Check className="h-3 w-3" />
                    接続済み
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => handleConnect(ch.id)}
                  >
                    {ch.method === "oauth" ? (
                      <ExternalLink className="h-3.5 w-3.5" />
                    ) : (
                      <Key className="h-3.5 w-3.5" />
                    )}
                    接続
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {connectedCount === 0 && (
          <p className="text-center text-xs text-muted-foreground">
            「後で設定する」をクリックしてスキップすることもできます
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 5: Complete                                                    */
/* ------------------------------------------------------------------ */

function StepComplete({
  project,
  brand,
  channels,
  onFinish,
}: {
  project: ProjectData;
  brand: BrandData;
  channels: ChannelStates;
  onFinish: () => void;
}) {
  const connectedChannels = RECOMMENDED_CHANNELS.filter(
    (ch) => channels[ch.id]?.connected,
  );

  return (
    <div className="flex flex-col items-center text-center space-y-8 py-8">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg">
        <Check className="h-10 w-10 text-white" />
      </div>

      <div className="space-y-3">
        <h2 className="text-3xl font-bold tracking-tight">準備完了！</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          AIが24時間稼働を開始します。あなたのデジタルプレゼンスが自動的に最適化されます。
        </p>
      </div>

      {/* Summary */}
      <Card className="w-full max-w-lg text-left">
        <CardContent className="p-6 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            セットアップサマリー
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">プロジェクト</span>
              <span className="text-sm font-medium">
                {project.name || project.url || "未設定"}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">サイトURL</span>
              <span className="text-sm font-medium truncate max-w-[200px]">
                {project.url || "未設定"}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">ブランドトーン</span>
              <Badge variant="secondary">{brand.tone}</Badge>
            </div>

            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">ブランドカラー</span>
              <div className="flex items-center gap-2">
                <div
                  className="h-5 w-5 rounded-full border"
                  style={{ backgroundColor: brand.primaryColor }}
                />
                <span className="text-sm font-mono">{brand.primaryColor}</span>
              </div>
            </div>

            <div className="flex items-start justify-between py-2">
              <span className="text-sm text-muted-foreground">接続チャネル</span>
              <div className="flex flex-wrap gap-1 justify-end">
                {connectedChannels.length > 0 ? (
                  connectedChannels.map((ch) => (
                    <Badge key={ch.id} variant="success" className="text-xs">
                      {ch.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">未接続</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button size="lg" onClick={onFinish} className="gap-2 px-8">
        ダッシュボードへ
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Wizard Component                                              */
/* ------------------------------------------------------------------ */

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  const [project, setProject] = useState<ProjectData>({
    url: "",
    name: "",
    description: "",
  });

  const [brand, setBrand] = useState<BrandData>({
    tone: "Professional",
    primaryColor: "#3B82F6",
    logoFile: null,
    logoPreview: null,
    ngWords: [],
  });

  const [channels, setChannels] = useState<ChannelStates>(() => {
    const initial: ChannelStates = {};
    for (const ch of RECOMMENDED_CHANNELS) {
      initial[ch.id] = { connected: false };
    }
    return initial;
  });

  const canProceed = useCallback(() => {
    switch (step) {
      case 1:
        return true;
      case 2:
        return project.url.trim().length > 0;
      case 3:
        return true;
      case 4:
        return true; // Allow skipping channel connection
      case 5:
        return true;
      default:
        return false;
    }
  }, [step, project.url]);

  const handleNext = () => {
    if (step < totalSteps && canProceed()) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleFinish = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("onboarding_completed", "true");
    }
    router.push("/dashboard");
  };

  const handleSkipChannels = () => {
    setStep(5);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Gradient Header with Progress */}
      <div className="shrink-0 bg-gradient-to-r from-blue-600 via-violet-600 to-blue-600 px-6 py-4">
        <div className="mx-auto max-w-2xl">
          <ProgressBar current={step} total={totalSteps} />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <div
            className="transition-opacity duration-300"
            key={step}
          >
            {step === 1 && <StepWelcome onNext={handleNext} />}
            {step === 2 && <StepProject data={project} onChange={setProject} />}
            {step === 3 && <StepBrand data={brand} onChange={setBrand} />}
            {step === 4 && (
              <StepChannels channels={channels} onChange={setChannels} />
            )}
            {step === 5 && (
              <StepComplete
                project={project}
                brand={brand}
                channels={channels}
                onFinish={handleFinish}
              />
            )}
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      {step !== 1 && step !== 5 && (
        <div className="shrink-0 border-t bg-background px-6 py-4">
          <div className="mx-auto flex max-w-2xl items-center justify-between">
            <Button variant="ghost" onClick={handleBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              戻る
            </Button>

            <div className="flex items-center gap-3">
              {step === 4 && (
                <Button variant="ghost" onClick={handleSkipChannels}>
                  後で設定する
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="gap-2"
              >
                次へ
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
