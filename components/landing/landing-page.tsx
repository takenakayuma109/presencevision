"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { HeroParticles } from "./hero-particles";
import {
  Search,
  FileText,
  Share2,
  Eye,
  BarChart3,
  Clock,
  ArrowRight,
  Check,
  X,
  Sparkles,
  Zap,
  Globe,
  ChevronRight,
  BookOpen,
  ShieldCheck,
  FileCheck2,
  TrendingUp,
  Scale,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/hooks/use-translation";
import { LanguageSwitch } from "@/components/ui/language-switch";
import { PaymentMethods } from "@/components/billing/payment-methods";
import { useThemeStore } from "@/lib/store/theme";
import { useRouter } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  CSS animation styles (injected via <style> tag)                    */
/* ------------------------------------------------------------------ */
const animationStyles = `
  @keyframes gradient-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  @keyframes pulse-glow {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.8; }
  }

  .animate-gradient {
    background-size: 200% 200%;
    animation: gradient-shift 8s ease infinite;
  }

  .animate-fade-in-up {
    animation: fade-in-up 0.8s ease-out forwards;
    opacity: 0;
  }

  .animate-fade-in-up-delay-1 {
    animation: fade-in-up 0.8s ease-out 0.15s forwards;
    opacity: 0;
  }

  .animate-fade-in-up-delay-2 {
    animation: fade-in-up 0.8s ease-out 0.3s forwards;
    opacity: 0;
  }

  .animate-fade-in-up-delay-3 {
    animation: fade-in-up 0.8s ease-out 0.45s forwards;
    opacity: 0;
  }

  .animate-float {
    animation: float 6s ease-in-out infinite;
  }

  .animate-pulse-glow {
    animation: pulse-glow 4s ease-in-out infinite;
  }

  /* Scroll-triggered animations using IntersectionObserver-free approach */
  .scroll-animate {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.8s ease-out, transform 0.8s ease-out;
  }

  .scroll-animate.visible {
    opacity: 1;
    transform: translateY(0);
  }

`;

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const features = [
  {
    icon: Search,
    titleKey: "landing.features.keyword.title",
    descKey: "landing.features.keyword.desc",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: FileText,
    titleKey: "landing.features.content.title",
    descKey: "landing.features.content.desc",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: Share2,
    titleKey: "landing.features.distribution.title",
    descKey: "landing.features.distribution.desc",
    gradient: "from-orange-500 to-red-500",
  },
  {
    icon: Eye,
    titleKey: "landing.features.llmMonitoring.title",
    descKey: "landing.features.llmMonitoring.desc",
    gradient: "from-emerald-500 to-green-500",
  },
  {
    icon: BarChart3,
    titleKey: "landing.features.serp.title",
    descKey: "landing.features.serp.desc",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: Clock,
    titleKey: "landing.features.autonomous.title",
    descKey: "landing.features.autonomous.desc",
    gradient: "from-amber-500 to-yellow-500",
  },
];

const steps = [
  {
    num: "01",
    titleKey: "landing.steps.step1.title",
    descKey: "landing.steps.step1.desc",
  },
  {
    num: "02",
    titleKey: "landing.steps.step2.title",
    descKey: "landing.steps.step2.desc",
  },
  {
    num: "03",
    titleKey: "landing.steps.step3.title",
    descKey: "landing.steps.step3.desc",
  },
  {
    num: "04",
    titleKey: "landing.steps.step4.title",
    descKey: "landing.steps.step4.desc",
  },
];

const channels = {
  "ナレッジHub（自社ドメイン）": [
    { name: "PresenceVision Hub", icon: BookOpen, color: "#2563EB", bg: "bg-blue-600" },
    { name: "企業ディレクトリ", icon: Globe, color: "#7C3AED", bg: "bg-violet-600" },
    { name: "構造化データ (JSON-LD)", icon: FileCheck2, color: "#059669", bg: "bg-emerald-600" },
  ],
  "あなたのサイト / CMS": [
    { name: "WordPress", icon: Globe, color: "#21759B", bg: "bg-[#21759B]" },
    { name: "microCMS", icon: Globe, color: "#2B2D42", bg: "bg-[#2B2D42]" },
  ],
  "ローカル検索": [
    { name: "Google Business Profile", icon: Globe, color: "#4285F4", bg: "bg-[#4285F4]" },
  ],
  "技術コミュニティ（公式API）": [
    { name: "Qiita", icon: FileText, color: "#55C500", bg: "bg-[#55C500]" },
    { name: "DEV.to", icon: FileText, color: "#0A0A0A", bg: "bg-[#0A0A0A]" },
    { name: "Hashnode", icon: FileText, color: "#2962FF", bg: "bg-[#2962FF]" },
  ],
};

const plans = [
  {
    nameKey: "landing.pricing.starter.name",
    slug: "starter",
    audience: "個人・スモールビジネス",
    price: "9,800",
    annualPrice: "7,800",
    featured: false,
    features: [
      "AIサイクル: 6時間ごと（1日4回稼働）",
      "1プロジェクト / 5キーワード",
      "高品質コンテンツ 月約150点（プレミアムOpus 30本＋FAQ・構造化データ）",
      "自社ナレッジHubへの記事・構造化データ公開",
      "Google検索 + GEO（AI引用）の基本モニタリング",
      "Schema.org（Organization / FAQ）自動付与",
      "Googleの大量生成ポリシー準拠の安全なペースで運用（インデックス削除リスク回避）",
      "公開前の人間承認（安全モード）",
      "メールレポート（1日1回）",
      "AI Boost: 月5記事まで Claude Opus 4.8 で高品質生成",
    ],
  },
  {
    nameKey: "landing.pricing.professional.name",
    slug: "professional",
    audience: "中小企業・ローカルビジネス",
    price: "29,800",
    annualPrice: "24,800",
    featured: true,
    features: [
      "AIサイクル: 1時間ごと（1日24回稼働）",
      "5プロジェクト / 50キーワード",
      "高品質コンテンツ 月約1,500点（5サイト・うちプレミアムOpus 300本）",
      "自社Hub + あなたのWordPressへ自動公開",
      "Googleビジネスプロフィール連携（ローカルSEO）",
      "Google検索 + ChatGPT / Gemini / Perplexity 引用モニタリング",
      "競合・キーワードギャップ分析",
      "承認ワークフロー（公開前レビュー）",
      "Googleの大量生成ポリシー準拠の安全なペース（1日最大6記事/サイト）でインデックス削除リスクを回避",
      "メールレポート（1日2回）+ 優先サポート",
      "AI Boost: 月20記事まで Claude Opus 4.8",
    ],
  },
  {
    nameKey: "landing.pricing.enterprise.name",
    slug: "enterprise",
    audience: "代理店・複数拠点",
    price: "98,000",
    annualPrice: "78,000",
    featured: false,
    features: [
      "AIサイクル: 1時間ごと（1日24回稼働）",
      "マルチサイト・複数拠点対応（大規模キーワード）",
      "高品質コンテンツ 1サイト月約300点（プレミアムOpus 60本）× サイト数",
      "ホワイトラベル（代理店向け再販）",
      "公式API連携（Qiita / DEV.to / Hashnode）",
      "専用VPSインスタンス",
      "API連携・カスタム統合",
      "Googleの大量生成ポリシー準拠の安全なペースで全サイト運用",
      "専任サポート / SLA保証",
      "AI Boost: 月50記事まで Claude Opus 4.8",
    ],
  },
];

const comparisonRows = [
  { label: "月額", pv: "¥9,800〜", semrush: "$139〜", ahrefs: "$99〜", surfer: "$89〜" },
  { label: "AI記事生成 + 公開まで自動", pv: true, semrush: "制限あり", ahrefs: false, surfer: "制限あり" },
  { label: "GEO（AIでの被引用）モニタリング", pv: true, semrush: "一部(beta)", ahrefs: "一部(beta)", surfer: false },
  { label: "ローカルビジネス対応（GBP）", pv: true, semrush: false, ahrefs: false, surfer: false },
  { label: "日本語・日本市場特化", pv: true, semrush: "△", ahrefs: "△", surfer: "△" },
  { label: "公開前の人間承認（安全設計）", pv: true, semrush: "—", ahrefs: "—", surfer: "—" },
  { label: "24h自律稼働", pv: true, semrush: false, ahrefs: false, surfer: false },
  { label: "AI Boost（Claude Opus 4.8）", pv: "月5〜50記事", semrush: false, ahrefs: false, surfer: false },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export function LandingPage() {
  const { t } = useTranslation();
  const { dark, toggleTheme } = useThemeStore();
  const [isAnnual, setIsAnnual] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  const handlePricingCta = async (planSlug: string) => {
    setCheckoutLoading(planSlug);
    try {
      // First check if user is authenticated by trying the checkout endpoint
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: planSlug,
          interval: isAnnual ? "annual" : "monthly",
        }),
      });

      if (res.status === 401) {
        // Not authenticated — redirect to sign-in with redirect back
        router.push(`/sign-in?redirect=/billing`);
        return;
      }

      if (!res.ok) throw new Error("Checkout failed");

      const { sessionUrl } = await res.json();
      if (sessionUrl) {
        window.location.href = sessionUrl;
      }
    } catch {
      // Fallback: redirect to billing page
      router.push("/billing");
    } finally {
      setCheckoutLoading(null);
    }
  };

  // Set up scroll-triggered fade-in animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 },
    );

    document.querySelectorAll(".scroll-animate").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
      <div className="min-h-screen bg-background text-foreground">
        {/* ========== Navbar ========== */}
        <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              PresenceVision
            </Link>
            <div className="hidden items-center gap-8 md:flex">
              <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                {t("landing.nav.features")}
              </a>
              <a href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                {t("landing.nav.howItWorks")}
              </a>
              <a href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                {t("landing.nav.pricing")}
              </a>
              <Link href="/companies" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                {t("landing.nav.knowledgeBase")}
              </Link>
              <LanguageSwitch position="bottom" />
              <button
                onClick={toggleTheme}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                title={dark ? "Light mode" : "Dark mode"}
              >
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              {session?.user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors hover:bg-accent"
                  >
                    {session.user.image ? (
                      <img src={session.user.image} alt="" className="h-6 w-6 rounded-full" />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {(session.user.name?.[0] || session.user.email?.[0] || "U").toUpperCase()}
                      </div>
                    )}
                    <span className="max-w-[120px] truncate">{session.user.name || session.user.email}</span>
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md border bg-background shadow-lg">
                      <Link
                        href="/dashboard"
                        className="block px-4 py-2 text-sm hover:bg-accent"
                        onClick={() => setShowUserMenu(false)}
                      >
                        ダッシュボード
                      </Link>
                      <Link
                        href="/settings"
                        className="block px-4 py-2 text-sm hover:bg-accent"
                        onClick={() => setShowUserMenu(false)}
                      >
                        設定
                      </Link>
                      <button
                        onClick={() => signOut()}
                        className="block w-full px-4 py-2 text-left text-sm text-destructive hover:bg-accent"
                      >
                        ログアウト
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/sign-in">
                  <Button size="sm">{t("landing.cta.start")}</Button>
                </Link>
              )}
            </div>
          </div>
        </nav>

        {/* ========== Hero ========== */}
        <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
          {/* Animated particle background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-violet-600/10 to-cyan-600/10" />
            <div className="animate-pulse-glow absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="animate-pulse-glow absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" style={{ animationDelay: "2s" }} />
            <HeroParticles />
          </div>

          <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
            {/* Eyebrow — category kicker (muted; gradient is reserved for the h1 accent) */}
            <p className="animate-fade-in-up mx-auto mb-5 max-w-xl text-xs font-semibold tracking-wide text-muted-foreground md:text-sm">
              {t("landing.hero.powerword2")}
            </p>

            <Badge variant="secondary" className="animate-fade-in-up mb-7 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs md:text-sm">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              {t("landing.hero.badge")}
            </Badge>

            {/* h1 — the single hero focus; final line accented with the gradient */}
            <h1 className="animate-fade-in-up-delay-1 mx-auto max-w-5xl whitespace-pre-line text-2xl font-bold leading-[1.35] tracking-tight text-foreground sm:text-4xl md:text-5xl md:leading-[1.3]">
              {t("landing.hero.title")
                .split("\n")
                .map((line, i, arr) => (
                  <span
                    key={i}
                    className={
                      arr.length > 1 && i === arr.length - 1
                        ? "block bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-500 bg-clip-text text-transparent"
                        : "block"
                    }
                  >
                    {line}
                  </span>
                ))}
            </h1>

            {/* subtitle — single paragraph, natural wrapping (no forced breaks) */}
            <p className="animate-fade-in-up-delay-2 mx-auto mt-7 max-w-4xl whitespace-pre-line text-sm leading-[1.9] text-muted-foreground sm:text-base md:text-lg">
              {t("landing.hero.subtitle")}
            </p>

            <div className="animate-fade-in-up-delay-3 mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={session?.user ? "/dashboard" : "/sign-in"}>
                <Button size="lg" className="h-12 gap-2 px-8 text-base">
                  {session?.user ? "ダッシュボード" : t("landing.cta.startFree")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#pricing">
                <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                  {t("landing.cta.viewPricing")}
                </Button>
              </a>
            </div>

            {/* Stats bar */}
            <div className="animate-fade-in-up-delay-3 mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-6 rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
              <div>
                <div className="text-xl font-bold md:text-2xl">SEO+GEO</div>
                <div className="mt-1 text-xs text-muted-foreground md:text-sm">検索もAIも対応</div>
              </div>
              <div>
                <div className="text-xl font-bold md:text-2xl">24時間</div>
                <div className="mt-1 text-xs text-muted-foreground md:text-sm">自律稼働</div>
              </div>
              <div>
                <div className="text-xl font-bold md:text-2xl">承認制</div>
                <div className="mt-1 text-xs text-muted-foreground md:text-sm">公開前に人間が確認</div>
              </div>
            </div>
          </div>
        </section>

        {/* ========== Section Divider ========== */}
        <div className="border-t border-border/50" />

        {/* ========== Simple Intro (beginner-friendly) ========== */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="scroll-animate text-center">
              <Badge variant="secondary" className="mb-4">{t("landing.simple.badge")}</Badge>
              <h2 className="text-3xl font-bold leading-snug md:text-4xl">{t("landing.simple.title")}</h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl">
                {t("landing.simple.subtitle")}
              </p>
            </div>

            {/* 3-step flow */}
            <div className="scroll-animate relative mt-14 grid gap-6 md:grid-cols-3">
              {([
                { icon: Search, key: "step1", color: "from-blue-500 to-cyan-500" },
                { icon: Sparkles, key: "step2", color: "from-violet-500 to-purple-500" },
                { icon: TrendingUp, key: "step3", color: "from-emerald-500 to-green-500" },
              ] as const).map((s, i) => (
                <div key={s.key} className="relative">
                  <div className="flex h-full flex-col rounded-2xl border border-border/50 bg-card/50 p-6 text-center backdrop-blur-sm">
                    <div className="mb-1 text-sm font-bold text-muted-foreground">STEP {i + 1}</div>
                    <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${s.color} shadow-lg`}>
                      <s.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold">{t(`landing.simple.${s.key}.title`)}</h3>
                    <p className="mt-2 text-base leading-relaxed text-muted-foreground">{t(`landing.simple.${s.key}.desc`)}</p>
                  </div>
                  {i < 2 && (
                    <div className="absolute top-1/2 -right-4 z-10 hidden -translate-y-1/2 md:flex">
                      <ArrowRight className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* What you reliably get */}
            <div className="scroll-animate mt-16">
              <h3 className="text-center text-xl font-bold md:text-2xl">{t("landing.simple.getTitle")}</h3>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {([
                  { icon: FileText, key: "g1" },
                  { icon: Clock, key: "g2" },
                  { icon: Globe, key: "g3" },
                  { icon: ShieldCheck, key: "g4" },
                ] as const).map((g) => (
                  <div key={g.key} className="rounded-xl border border-border/50 bg-card/50 p-5 text-center backdrop-blur-sm">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                      <g.icon className="h-6 w-6 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold">{t(`landing.simple.${g.key}.stat`)}</div>
                    <div className="mt-1 text-sm font-semibold">{t(`landing.simple.${g.key}.label`)}</div>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t(`landing.simple.${g.key}.desc`)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Results are shown as real numbers (honest) */}
            <div className="scroll-animate mt-10">
              <div className="flex items-start gap-4 rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/5 to-violet-500/5 p-6 md:p-8">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 shadow-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-base font-bold md:text-lg">{t("landing.simple.resultsTitle")}</h4>
                  <p className="mt-1 text-base leading-relaxed text-muted-foreground md:text-base">{t("landing.simple.resultsDesc")}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========== Section Divider ========== */}
        <div className="border-t border-border/50" />

        {/* ========== What/Where/How in detail (beginner) ========== */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="scroll-animate text-center">
              <Badge variant="secondary" className="mb-4">仕組み</Badge>
              <h2 className="text-4xl font-bold leading-snug md:text-5xl">毎月、何を・どこに・どう作るの？</h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl">
                リテラシー0でも大丈夫。AIが作るもの・公開する場所・作り方を、ぜんぶ見える化しました。
              </p>
            </div>

            {/* ① WHAT — 3 content types + images */}
            <div className="scroll-animate mt-14">
              <h3 className="text-center text-xl font-bold md:text-2xl">① AIが作る「3種類」のコンテンツ</h3>
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {([
                  { icon: FileText, color: "from-blue-500 to-cyan-500", title: "SEO記事（読み物）", desc: "あなたの専門知識やサービスを伝える記事。重要テーマはプレミアム（Opus 4.8）で深く、数はHaikuで幅広く自動生成します。" },
                  { icon: BookOpen, color: "from-violet-500 to-purple-500", title: "FAQ（よくある質問）", desc: "「〇〇とは？」にAIが答えやすいQ&A形式。ChatGPTやGeminiなどのAIに引用されやすくなります。" },
                  { icon: FileCheck2, color: "from-emerald-500 to-green-500", title: "構造化データ", desc: "Google・AIが“理解”するための裏側のタグ（会社情報・FAQ・地域情報）。Schema.org準拠で機械可読に。" },
                ] as const).map((c) => (
                  <div key={c.title} className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
                    <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${c.color} shadow-lg`}>
                      <c.icon className="h-7 w-7 text-white" />
                    </div>
                    <h4 className="text-lg font-bold">{c.title}</h4>
                    <p className="mt-2 text-base leading-relaxed text-muted-foreground">{c.desc}</p>
                  </div>
                ))}
              </div>
              {/* Image note (honest) */}
              <div className="mt-6 flex items-start gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
                  <Eye className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h4 className="text-base font-bold md:text-lg">画像は「生成しません」</h4>
                  <p className="mt-1 text-base leading-relaxed text-muted-foreground">
                    PresenceVisionは“テキスト＋構造化データ”に特化します（検索エンジンや生成AIが“読む”のは文章と構造であり、ここが成果に直結するため）。記事に写真を入れたい場合は、お客様サイトの既存画像をそのままご利用いただけます。
                  </p>
                </div>
              </div>
            </div>

            {/* ② WHERE — destinations + volume */}
            <div className="scroll-animate mt-16">
              <h3 className="text-center text-xl font-bold md:text-2xl">② どこに公開する？（公開前に必ず人間が承認）</h3>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {([
                  { icon: BookOpen, place: "自社ナレッジHub", note: "PVが用意する“あなた専用の公開ページ”。新しく作る・サーバー契約は不要（PVがホスティング）。自分のサイトが無くてもOK。", plan: "全プラン" },
                  { icon: Globe, place: "あなたのサイト / WordPress", note: "今お使いのサイトに、AIが下書き→あなたが承認して自動投稿。", plan: "Pro以上" },
                  { icon: Search, place: "Googleビジネスプロフィール", note: "Google検索・マップに出る“お店の情報カード”（営業時間・写真・口コミ）。最新のお知らせを自動投稿し、近所の人に見つけてもらう。", plan: "Pro以上" },
                  { icon: FileText, place: "技術コミュニティ", note: "Qiita / DEV.to / Hashnode（専門家が集まる公開サイト）へ自動投稿。IT・技術系の事業向け。", plan: "Enterprise" },
                ] as const).map((d) => (
                  <div key={d.place} className="flex items-center gap-4 rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                      <d.icon className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{d.place}</span>
                        <Badge variant="secondary" className="text-xs">{d.plan}</Badge>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">{d.note}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/5 to-violet-500/5 p-6 text-center">
                <p className="text-base font-semibold md:text-lg">どれくらいの量？</p>
                <p className="mx-auto mt-2 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
                  Starter <span className="font-bold text-foreground">月約150点</span> ／ Professional <span className="font-bold text-foreground">月約1,500点</span>（5サイト）／ Enterprise <span className="font-bold text-foreground">サイト数に応じ拡張</span>
                </p>
                <p className="mx-auto mt-2 max-w-3xl text-sm text-muted-foreground">
                  ※「点」＝ 記事＋FAQ＋構造化データの合計。Googleの大量生成ポリシー準拠の安全なペース（1日最大6記事/サイト）で運用します。
                </p>
              </div>
            </div>

            {/* ③ HOW — 4 steps */}
            <div className="scroll-animate mt-16">
              <h3 className="text-center text-xl font-bold md:text-2xl">③ どうやって作る？（4ステップ・全自動）</h3>
              <div className="mt-8 grid gap-6 md:grid-cols-4">
                {([
                  { icon: Search, color: "from-blue-500 to-cyan-500", title: "キーワードを発見", desc: "あなたの業種・地域から「検索される言葉」をAIが自動で収集します。" },
                  { icon: Sparkles, color: "from-violet-500 to-purple-500", title: "AIが生成", desc: "記事・FAQ・構造化データを生成。重要テーマはOpus 4.8、量はHaiku。" },
                  { icon: ShieldCheck, color: "from-amber-500 to-orange-500", title: "人間が承認", desc: "公開前に誤情報・リスクを人がチェック（安全運用）。" },
                  { icon: TrendingUp, color: "from-emerald-500 to-green-500", title: "監視して自動調整", desc: "公開後、検索順位とAI引用を監視し、結果を見て戦略を自動で見直します。" },
                ] as const).map((s, i) => (
                  <div key={s.title} className="rounded-2xl border border-border/50 bg-card/50 p-6 text-center backdrop-blur-sm">
                    <div className="mb-1 text-sm font-bold text-muted-foreground">STEP {i + 1}</div>
                    <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${s.color} shadow-lg`}>
                      <s.icon className="h-7 w-7 text-white" />
                    </div>
                    <h4 className="text-base font-bold">{s.title}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ========== Section Divider ========== */}
        <div className="border-t border-border/50" />

        {/* ========== Concrete worked example: a day in the life → 30 days ========== */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-5xl px-6">
            <div className="scroll-animate text-center">
              <Badge variant="secondary" className="mb-4">実例で見る</Badge>
              <h2 className="text-4xl font-bold leading-snug md:text-5xl">横浜の歯医者さんの「ある1日」</h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl">
                言葉だけだとピンと来ないので、横浜の小さな歯医者さん「あおば歯科」を例に、PVが“勝手に”やってくれる1日を、最初から最後まで追ってみましょう。
              </p>
            </div>

            {/* Timeline */}
            <div className="mt-12 space-y-4">
              {/* Step 1 — discover */}
              <div className="scroll-animate flex flex-col gap-4 rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm md:flex-row md:items-center">
                <div className="flex items-center gap-3 md:w-44 md:shrink-0">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-xs font-bold text-blue-400">朝6:00</span>
                  <span className="text-base font-bold">①言葉を発見</span>
                </div>
                <div className="flex-1">
                  <p className="mb-3 text-base leading-relaxed text-muted-foreground">AIが「横浜の人が実際に検索しているのに、まだ誰もちゃんと答えていない言葉」を見つけます。</p>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-gray-800 shadow-lg">
                    <Search className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">横浜 親知らず 抜歯 痛くない</span>
                  </div>
                </div>
              </div>

              {/* Step 2 — generate */}
              <div className="scroll-animate flex flex-col gap-4 rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm md:flex-row md:items-center">
                <div className="flex items-center gap-3 md:w-44 md:shrink-0">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xs font-bold text-violet-400">朝6:05</span>
                  <span className="text-base font-bold">②AIが書く</span>
                </div>
                <div className="flex-1">
                  <p className="mb-3 text-base leading-relaxed text-muted-foreground">記事・FAQ・構造化データをまとめて自動生成（重要テーマは高品質なOpus 4.8で執筆）。文章だけで、画像は作りません。</p>
                  <div className="rounded-xl bg-white p-4 text-left shadow-lg">
                    <div className="text-base font-bold text-gray-900">親知らずの抜歯は痛い？横浜の歯科医が正直に解説</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">記事 本文</span>
                      <span className="rounded bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">よくある質問×3</span>
                      <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">構造化データ</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">Q. 抜歯は痛い？／Q. 費用は？／Q. 当日の流れは？</div>
                  </div>
                </div>
              </div>

              {/* Step 3 — approve */}
              <div className="scroll-animate flex flex-col gap-4 rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm md:flex-row md:items-center">
                <div className="flex items-center gap-3 md:w-44 md:shrink-0">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-bold text-amber-400">朝8:00</span>
                  <span className="text-base font-bold">③院長が承認</span>
                </div>
                <div className="flex-1">
                  <p className="mb-3 text-base leading-relaxed text-muted-foreground">スマホに「下書きできました」と通知。中身を読んで【承認】を押すだけ（約30秒）。気になれば修正もワンタップ。</p>
                  <div className="inline-flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-lg"><ShieldCheck className="h-4 w-4" />承認して公開</span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground">✏️ 修正</span>
                  </div>
                </div>
              </div>

              {/* Step 4 — publish */}
              <div className="scroll-animate flex flex-col gap-4 rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm md:flex-row md:items-center">
                <div className="flex items-center gap-3 md:w-44 md:shrink-0">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-400">朝8:01</span>
                  <span className="text-base font-bold">④3か所に公開</span>
                </div>
                <div className="flex-1">
                  <p className="mb-3 text-base leading-relaxed text-muted-foreground">承認した瞬間、AIが3か所へ同時に公開。あなたは何もしなくてOK。</p>
                  <div className="flex flex-wrap gap-2">
                    {["自社ナレッジHub", "あおば歯科の医院サイト", "Googleビジネスプロフィール"].map((p) => (
                      <span key={p} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium">
                        <Check className="h-3.5 w-3.5 text-emerald-500" />{p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Result — now "found" everywhere */}
            <div className="scroll-animate mt-10">
              <h3 className="text-center text-xl font-bold md:text-2xl">夕方には、もう「見つかる」状態に</h3>
              <p className="mx-auto mt-2 max-w-2xl text-center text-base text-muted-foreground">同じ「横浜 親知らず」で検索した人に、あおば歯科が届きはじめます。</p>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {/* Google search result */}
                <div className="rounded-xl bg-white p-4 text-left shadow-xl">
                  <div className="mb-2 text-[11px] font-bold text-gray-400">Google 検索</div>
                  <div className="text-[11px] text-gray-500">presencevision.com › companies › aoba-dental</div>
                  <div className="mt-0.5 text-sm font-medium leading-snug text-[#1a0dab]">親知らずの抜歯は痛い？横浜の歯科医が正直に解説</div>
                  <div className="mt-1 text-xs leading-relaxed text-gray-600">横浜で親知らずの抜歯をお考えの方へ。痛みの程度・費用・当日の流れを歯科医が解説します…</div>
                </div>
                {/* ChatGPT answer */}
                <div className="rounded-xl border border-border/50 bg-card p-4 text-left">
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground"><Sparkles className="h-3.5 w-3.5 text-violet-400" />ChatGPT・Gemini の回答</div>
                  <div className="text-sm leading-relaxed">「横浜で親知らずの抜歯は？」と聞くと、<span className="font-bold text-blue-400">あおば歯科</span>が“痛みに配慮した治療”として紹介されるように。</div>
                </div>
                {/* GBP card */}
                <div className="rounded-xl bg-white p-4 text-left shadow-xl">
                  <div className="mb-2 text-[11px] font-bold text-gray-400">Google マップ</div>
                  <div className="text-sm font-bold text-gray-900">あおば歯科</div>
                  <div className="text-xs text-gray-600">★★★★☆ 4.6・歯科・横浜市</div>
                  <div className="mt-2 rounded-md bg-gray-100 p-2 text-[11px] text-gray-700">📢 最新の投稿：親知らずの抜歯について解説しました</div>
                </div>
              </div>
            </div>

            {/* Repeat → 30 days */}
            <div className="scroll-animate mt-12 rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/5 to-violet-500/5 p-6 md:p-8">
              <h3 className="text-center text-xl font-bold md:text-2xl">これを毎日くり返すと… 30日でこうなる</h3>
              <div className="mt-8 grid gap-6 sm:grid-cols-3">
                <div className="text-center">
                  <div className="text-3xl font-bold md:text-4xl">約150点</div>
                  <div className="mt-1 text-sm leading-relaxed text-muted-foreground">記事＋FAQ＋構造化データの“資産”が積み上がる</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold md:text-4xl">4つの接点</div>
                  <div className="mt-1 text-sm leading-relaxed text-muted-foreground">Google・ChatGPT・Gemini・地図に“出てくる場所”が毎日増える</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold md:text-4xl">広告費¥0</div>
                  <div className="mt-1 text-sm leading-relaxed text-muted-foreground">広告は止めれば消える。これは“資産”として残り続ける</div>
                </div>
              </div>
              <p className="mx-auto mt-8 max-w-2xl text-center text-base leading-relaxed text-muted-foreground">
                院長がやったことは、最初に<span className="font-semibold text-foreground">URLを入れて、毎日30秒だけ“承認”を押す</span>だけ。人を雇わず、広告費をかけず、“見つかる医院”が毎日ひとりでに育ちます。
              </p>
              <p className="mx-auto mt-3 max-w-2xl text-center text-xs leading-relaxed text-muted-foreground/80">
                ※ 検索順位・AIでの引用・来院などの成果は、ダッシュボードで実データを確認できます（外部要因に左右されるため、特定の数値は保証しません）。
              </p>
            </div>
          </div>
        </section>

        {/* ========== Section Divider ========== */}
        <div className="border-t border-border/50" />

        {/* ========== Features Grid ========== */}
        <section id="features" className="scroll-smooth py-20 md:py-32">
          <div className="mx-auto max-w-7xl px-6">
            <div className="scroll-animate text-center">
              <Badge variant="secondary" className="mb-4">Features</Badge>
              <h2 className="text-4xl font-bold md:text-5xl">{t("landing.features.sectionTitle")}</h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl">
                {t("landing.features.sectionSubtitle")}
              </p>
            </div>

            <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((f, i) => (
                <div key={i} className="scroll-animate" style={{ transitionDelay: `${i * 0.1}s` }}>
                  <Card className="group relative h-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-border hover:shadow-lg hover:shadow-blue-500/5">
                    <CardHeader>
                      <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.gradient} shadow-lg`}>
                        <f.icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-xl">{t(f.titleKey)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg text-muted-foreground leading-relaxed">{t(f.descKey)}</p>
                    </CardContent>
                    {/* Hover gradient line */}
                    <div className={`absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r ${f.gradient} transition-all duration-500 group-hover:w-full`} />
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== Trust & Legitimacy ========== */}
        <section id="trust" className="border-t border-border/50 py-20 md:py-32">
          <div className="mx-auto max-w-7xl px-6">
            <div className="scroll-animate text-center">
              <Badge variant="secondary" className="mb-4">Trust &amp; Ethics</Badge>
              <h2 className="text-4xl font-bold md:text-5xl">{t("landing.trust.title")}</h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl">
                {t("landing.trust.subtitle")}
              </p>
            </div>

            {/* Trust Pillar Cards */}
            <div className="mt-16 grid gap-6 md:grid-cols-3">
              {/* Card 1 - Verified Entity Only */}
              <div className="scroll-animate" style={{ transitionDelay: "0s" }}>
                <Card className="group relative h-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-border hover:shadow-lg hover:shadow-emerald-500/5">
                  <CardHeader>
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
                      <ShieldCheck className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">{t("landing.trust.verified.title")}</CardTitle>
                      <Badge variant="outline" className="text-xs">{t("landing.trust.verified.badge")}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg text-muted-foreground leading-relaxed">{t("landing.trust.verified.desc")}</p>
                  </CardContent>
                  <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500 group-hover:w-full" />
                </Card>
              </div>

              {/* Card 2 - Evidence-Required Publishing */}
              <div className="scroll-animate" style={{ transitionDelay: "0.1s" }}>
                <Card className="group relative h-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-border hover:shadow-lg hover:shadow-blue-500/5">
                  <CardHeader>
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg">
                      <FileCheck2 className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">{t("landing.trust.evidence.title")}</CardTitle>
                      <Badge variant="outline" className="text-xs">{t("landing.trust.evidence.badge")}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg text-muted-foreground leading-relaxed">{t("landing.trust.evidence.desc")}</p>
                  </CardContent>
                  <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 group-hover:w-full" />
                </Card>
              </div>

              {/* Card 3 - Entity Trust Score */}
              <div className="scroll-animate" style={{ transitionDelay: "0.2s" }}>
                <Card className="group relative h-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-border hover:shadow-lg hover:shadow-violet-500/5">
                  <CardHeader>
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">{t("landing.trust.score.title")}</CardTitle>
                      <Badge variant="outline" className="text-xs">{t("landing.trust.score.badge")}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg text-muted-foreground leading-relaxed">{t("landing.trust.score.desc")}</p>
                  </CardContent>
                  <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500 group-hover:w-full" />
                </Card>
              </div>
            </div>

            {/* Legal & Compliance Box */}
            <div className="scroll-animate mt-12">
              <div className="rounded-2xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
                    <Scale className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">{t("landing.trust.legal.title")}</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-border/30 bg-background/50 p-4">
                    <div className="mb-1 text-base font-semibold">{t("landing.trust.legal.stealth.title")}</div>
                    <p className="text-base text-muted-foreground leading-relaxed">{t("landing.trust.legal.stealth.desc")}</p>
                  </div>
                  <div className="rounded-xl border border-border/30 bg-background/50 p-4">
                    <div className="mb-1 text-base font-semibold">{t("landing.trust.legal.ftc.title")}</div>
                    <p className="text-base text-muted-foreground leading-relaxed">{t("landing.trust.legal.ftc.desc")}</p>
                  </div>
                  <div className="rounded-xl border border-border/30 bg-background/50 p-4">
                    <div className="mb-1 text-base font-semibold">{t("landing.trust.legal.dsa.title")}</div>
                    <p className="text-base text-muted-foreground leading-relaxed">{t("landing.trust.legal.dsa.desc")}</p>
                  </div>
                  <div className="rounded-xl border border-border/30 bg-background/50 p-4">
                    <div className="mb-1 text-base font-semibold">{t("landing.trust.legal.google.title")}</div>
                    <p className="text-base text-muted-foreground leading-relaxed">{t("landing.trust.legal.google.desc")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========== Section Divider ========== */}
        <div className="border-t border-border/50" />

        {/* ========== How It Works ========== */}
        <section id="how-it-works" className="relative py-20 md:py-32">
          <div className="mx-auto max-w-7xl px-6">
            <div className="scroll-animate text-center">
              <Badge variant="secondary" className="mb-4">How It Works</Badge>
              <h2 className="text-4xl font-bold md:text-5xl">{t("landing.howItWorks.title")}</h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl">
                {t("landing.howItWorks.subtitle")}
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, i) => (
                <div key={i} className="scroll-animate relative" style={{ transitionDelay: `${i * 0.15}s` }}>
                  <div className="relative flex h-full min-h-[200px] flex-col rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
                    <div className="mb-4 text-4xl font-bold text-blue-500/20">{step.num}</div>
                    <h3 className="mb-2 text-lg font-semibold">{t(step.titleKey)}</h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">{t(step.descKey)}</p>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="absolute top-1/2 -right-4 hidden -translate-y-1/2 text-muted-foreground/30 lg:block">
                      <ChevronRight className="h-6 w-6" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Hub & Spoke Diagram */}
            <div className="scroll-animate mt-20">
              <div className="rounded-3xl border border-border/50 bg-gradient-to-br from-blue-500/5 via-violet-500/5 to-cyan-500/5 p-8 md:p-12">
                <h3 className="mb-2 text-center text-xl font-bold md:text-2xl">{t("landing.hubSpoke.title")}</h3>
                <p className="mx-auto mb-10 max-w-xl text-center text-lg text-muted-foreground md:text-xl">
                  {t("landing.hubSpoke.subtitle")}
                </p>

                <div className="relative mx-auto flex max-w-3xl items-center justify-center">
                  {/* Spoke circles positioned around the hub */}
                  <div className="relative h-[400px] w-[400px] md:h-[560px] md:w-[560px]">
                    {/* Center Hub */}
                    <div className="absolute left-1/2 top-1/2 z-10 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-2 border-blue-500 bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/20 md:h-40 md:w-40">
                      <Globe className="mb-1 h-7 w-7 text-white md:h-8 md:w-8" />
                      <span className="text-sm font-bold text-white leading-tight text-center md:text-base">自社サイト<br />(ハブ)</span>
                    </div>

                    {/* Spoke items */}
                    {[
                      { name: "Google Business", angle: 0, color: "#4285F4" },
                      { name: "あなたのサイト", angle: 60, color: "#21759B" },
                      { name: "Qiita", angle: 120, color: "#55C500" },
                      { name: "構造化データ", angle: 180, color: "#059669" },
                      { name: "企業ディレクトリ", angle: 240, color: "#7C3AED" },
                      { name: "FAQ / AEO", angle: 300, color: "#F59E0B" },
                    ].map((spoke) => {
                      const radius = 200;
                      const rad = (spoke.angle * Math.PI) / 180;
                      const x = Math.cos(rad) * radius;
                      const y = Math.sin(rad) * radius;
                      return (
                        <div
                          key={spoke.name}
                          className="absolute left-1/2 top-1/2 flex flex-col items-center"
                          style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
                        >
                          {/* Connecting line (visual via border) */}
                          <div
                            className="flex h-16 w-16 items-center justify-center rounded-full border border-border/50 bg-card shadow-sm md:h-20 md:w-20"
                          >
                            <span className="text-xs font-semibold text-foreground md:text-sm">{spoke.name}</span>
                          </div>
                          <span className="mt-1 text-xs text-blue-500 font-medium">↔ ハブと連携</span>
                        </div>
                      );
                    })}

                    {/* SVG lines from spokes to center */}
                    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 560 560">
                      {[0, 60, 120, 180, 240, 300].map((angle) => {
                        const radius = 200;
                        const rad = (angle * Math.PI) / 180;
                        const x = 280 + Math.cos(rad) * radius;
                        const y = 280 + Math.sin(rad) * radius;
                        return (
                          <line
                            key={angle}
                            x1="280"
                            y1="280"
                            x2={x}
                            y2={y}
                            stroke="currentColor"
                            className="text-blue-500/20"
                            strokeWidth="2"
                            strokeDasharray="6 4"
                          />
                        );
                      })}
                    </svg>
                  </div>
                </div>

                {/* Explanation paragraph */}
                <p className="mx-auto mt-10 max-w-2xl text-center text-lg text-muted-foreground leading-relaxed md:text-xl">
                  {t("landing.hubSpoke.explanation")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========== Section Divider ========== */}
        <div className="border-t border-border/50" />

        {/* ========== Distribution Channels ========== */}
        <section className="py-20 md:py-32">
          <div className="mx-auto max-w-7xl px-6">
            <div className="scroll-animate text-center">
              <Badge variant="secondary" className="mb-4">Channels</Badge>
              <h2 className="text-4xl font-bold md:text-5xl">{t("landing.channels.title")}</h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl">
                {t("landing.channels.subtitle")}
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {Object.entries(channels).map(([category, items], ci) => (
                <div key={category} className="scroll-animate" style={{ transitionDelay: `${ci * 0.1}s` }}>
                  <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      {category}
                    </h3>
                    <div className="space-y-3">
                      {items.map((ch) => (
                        <div key={ch.name} className="flex items-center gap-3 text-base">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${ch.bg}`}>
                            <ch.icon className="h-4 w-4 text-white" />
                          </div>
                          <span>{ch.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== Section Divider ========== */}
        <div className="border-t border-border/50" />

        {/* ========== Pricing ========== */}
        <section id="pricing" className="py-20 md:py-32">
          <div className="mx-auto max-w-7xl px-6">
            <div className="scroll-animate text-center">
              <Badge variant="secondary" className="mb-4">Pricing</Badge>
              <h2 className="text-4xl font-bold md:text-5xl">{t("landing.pricing.title")}</h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl">
                {t("landing.pricing.subtitle")}
              </p>
            </div>

            {/* Billing Toggle */}
            <div className="scroll-animate mt-10 flex flex-col items-center gap-3">
              <div className="flex items-center gap-3 rounded-full border border-border/50 bg-card/50 p-1 backdrop-blur-sm">
                <button
                  onClick={() => setIsAnnual(false)}
                  className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                    !isAnnual
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("landing.pricing.billing.monthly")}
                </button>
                <button
                  onClick={() => setIsAnnual(true)}
                  className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                    isAnnual
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("landing.pricing.billing.annual")}
                </button>
              </div>
              {isAnnual && (
                <Badge variant="success" className="gap-1 text-xs">
                  <Zap className="h-3 w-3" />
                  {t("landing.pricing.billing.annualSave")}
                </Badge>
              )}
            </div>

            <div className="mt-10 grid gap-8 lg:grid-cols-3">
              {plans.map((plan, i) => (
                <div key={i} className="scroll-animate" style={{ transitionDelay: `${i * 0.15}s` }}>
                  <Card className={`relative flex h-full flex-col overflow-hidden ${plan.featured ? "border-blue-500/50 shadow-lg shadow-blue-500/10" : "border-border/50"}`}>
                    {plan.featured && (
                      <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-violet-500" />
                    )}
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl">{t(plan.nameKey)}</CardTitle>
                          <p className="mt-1 text-sm text-muted-foreground">{plan.audience}</p>
                        </div>
                        {plan.featured && (
                          <Badge className="bg-blue-500 text-white hover:bg-blue-600">
                            {t("landing.pricing.recommended")}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-4">
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold">¥{isAnnual ? plan.annualPrice : plan.price}</span>
                          <span className="text-muted-foreground">/月</span>
                        </div>
                        {!isAnnual && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {t("landing.pricing.billing.annual")} ¥{plan.annualPrice}/月
                          </p>
                        )}
                        {isAnnual && (
                          <p className="mt-1 text-sm text-muted-foreground line-through">
                            {t("landing.pricing.billing.monthly")} ¥{plan.price}/月
                          </p>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col">
                      <ul className="flex-1 space-y-3">
                        {plan.features.map((feat, fi) => (
                          <li key={fi} className="flex items-start gap-3 text-base">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-8">
                        <Button
                          className={`w-full ${plan.featured ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}`}
                          variant={plan.featured ? "default" : "outline"}
                          disabled={checkoutLoading === plan.slug}
                          onClick={() => handlePricingCta(plan.slug)}
                        >
                          {checkoutLoading === plan.slug
                            ? t("billing.redirecting")
                            : t("landing.pricing.billing.trialCta")}
                        </Button>
                        <PaymentMethods />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== Section Divider ========== */}
        <div className="border-t border-border/50" />

        {/* ========== 24-Hour Schedule ========== */}
        <section className="py-20 md:py-32">
          <div className="mx-auto max-w-7xl px-6">
            <div className="scroll-animate text-center">
              <Badge variant="secondary" className="mb-4">Schedule</Badge>
              <h2 className="text-4xl font-bold md:text-5xl">24時間自律スケジュール</h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl">
                各プランのAIエンジン稼働スケジュールを比較
              </p>
            </div>

            <div className="scroll-animate mt-12 space-y-8">
              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-3 text-xs">
                {[
                  { label: "キーワード発掘", color: "bg-blue-500" },
                  { label: "コンテンツ生成", color: "bg-emerald-500" },
                  { label: "SERP確認", color: "bg-orange-500" },
                  { label: "LLM引用チェック", color: "bg-purple-500" },
                  { label: "配信", color: "bg-pink-500" },
                  { label: "レポート", color: "bg-yellow-500" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div className={`h-2.5 w-2.5 rounded-sm ${item.color}`} />
                    <span className="text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Time axis header */}
              <div className="pl-40 md:pl-48">
                <div className="flex justify-between text-xs text-muted-foreground">
                  {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => (
                    <span key={h}>{h}:00</span>
                  ))}
                  <span>24:00</span>
                </div>
              </div>

              {/* Plan rows */}
              {([
                {
                  name: "Starter",
                  price: "¥9,800",
                  cycles: 4,
                  hours: [0, 6, 12, 18] as number[],
                  featured: false,
                },
                {
                  name: "Professional",
                  price: "¥29,800",
                  cycles: 24,
                  hours: Array.from({ length: 24 }, (_, i) => i),
                  featured: true,
                },
                {
                  name: "Enterprise（Premium AI）",
                  price: "¥98,000",
                  cycles: 24,
                  hours: Array.from({ length: 24 }, (_, i) => i),
                  featured: false,
                },
              ]).map((plan) => (
                <div
                  key={plan.name}
                  className={`scroll-animate rounded-xl border p-4 md:p-5 ${
                    plan.featured
                      ? "border-blue-500/50 bg-blue-500/5 shadow-lg shadow-blue-500/10"
                      : "border-border/50 bg-card/30"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Plan info */}
                    <div className="flex items-center gap-3 md:w-40 md:shrink-0">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base">{plan.name}</span>
                          {plan.featured && (
                            <Badge className="bg-blue-500 text-white text-[10px] px-1.5 py-0">
                              推奨
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">{plan.price}/月</span>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          1日{plan.cycles}サイクル
                        </div>
                      </div>
                    </div>

                    {/* 24h bar */}
                    <div className="flex-1 min-w-0">
                      <div className="relative h-12 rounded-lg bg-muted/30 border border-border/30 overflow-hidden">
                        {/* Hour grid lines */}
                        {[0, 6, 12, 18].map((h) => (
                          <div
                            key={h}
                            className="absolute top-0 bottom-0 border-l border-border/20"
                            style={{ left: `${(h / 24) * 100}%` }}
                          />
                        ))}

                        {/* Cycle blocks */}
                        {plan.hours.map((hour, idx) => {
                          const leftPct = ((typeof hour === "number" ? hour : 0) / 24) * 100;
                          const widthPct = plan.cycles >= 24 ? 2.8 : 4;
                          const taskColors = [
                            "bg-blue-500",    // keyword
                            "bg-emerald-500", // content
                            "bg-orange-500",  // SERP
                            "bg-purple-500",  // LLM
                            "bg-pink-500",    // publish
                            "bg-yellow-500",  // report
                          ];
                          return (
                            <div
                              key={idx}
                              className="absolute top-1 bottom-1 flex flex-col gap-[1px] justify-center"
                              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                            >
                              {taskColors.map((color, ci) => (
                                <div
                                  key={ci}
                                  className={`${color} rounded-[1px] opacity-90`}
                                  style={{ height: `${100 / 6 - 1}%` }}
                                />
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Bottom message */}
              <p className="text-center text-sm text-muted-foreground">
                上位プランほどAIエンジンが高頻度で稼働し、より迅速にプレゼンスを構築します
              </p>
            </div>
          </div>
        </section>

        {/* ========== Section Divider ========== */}
        <div className="border-t border-border/50" />

        {/* ========== Comparison ========== */}
        <section className="relative py-20 md:py-32">
          <div className="mx-auto max-w-5xl px-6">
            <div className="scroll-animate text-center">
              <Badge variant="secondary" className="mb-4">Comparison</Badge>
              <h2 className="text-4xl font-bold md:text-5xl">{t("landing.comparison.title")}</h2>
            </div>

            <div className="scroll-animate mt-12 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-4 pr-4 text-left font-medium text-muted-foreground" />
                    <th className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-bold text-blue-500">PV</span>
                      </div>
                    </th>
                    <th className="px-4 py-4 text-center font-medium text-muted-foreground">Semrush</th>
                    <th className="px-4 py-4 text-center font-medium text-muted-foreground">Ahrefs</th>
                    <th className="px-4 py-4 text-center font-medium text-muted-foreground">Surfer SEO</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-4 pr-4 font-medium">{row.label}</td>
                      <td className="px-4 py-4 text-center">
                        <ComparisonCell value={row.pv} highlight />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <ComparisonCell value={row.semrush} />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <ComparisonCell value={row.ahrefs} />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <ComparisonCell value={row.surfer} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ========== Section Divider ========== */}
        <div className="border-t border-border/50" />

        {/* ========== Ad Differentiation ========== */}
        <section className="relative py-20 md:py-32">
          <div className="mx-auto max-w-5xl px-6">
            <div className="scroll-animate text-center">
              <Badge variant="secondary" className="mb-4">vs Ad Tools</Badge>
              <h2 className="text-4xl font-bold md:text-5xl">{t("landing.adDiff.title")}</h2>
              <p className="mx-auto mt-4 max-w-3xl text-lg text-muted-foreground md:text-xl">
                {t("landing.adDiff.subtitle")}
              </p>
            </div>

            <div className="scroll-animate mt-12 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="py-4 pr-4 text-left font-semibold text-muted-foreground">
                      {t("landing.adDiff.table.category")}
                    </th>
                    <th className="px-6 py-4 text-center">
                      <span className="font-medium text-muted-foreground/70">{t("landing.adDiff.table.adTools")}</span>
                    </th>
                    <th className="px-6 py-4 text-center">
                      <span className="font-bold text-blue-500">{t("landing.adDiff.table.pv")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(["whatItDoes", "cost", "whenStopped", "output", "approach"] as const).map((rowKey, i) => (
                    <tr key={rowKey} className={`border-b border-border/50 ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                      <td className="py-5 pr-4 font-medium text-foreground">
                        {t(`landing.adDiff.table.${rowKey}.label`)}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <X className="h-4 w-4 shrink-0 text-red-400" />
                          <span className="text-muted-foreground/70">{t(`landing.adDiff.table.${rowKey}.ad`)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex items-center justify-center gap-2 rounded-lg bg-blue-500/5 px-3 py-1">
                          <Check className="h-4 w-4 shrink-0 text-blue-500" />
                          <span className="font-semibold text-blue-600 dark:text-blue-400">{t(`landing.adDiff.table.${rowKey}.pv`)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Complement Note */}
            <div className="scroll-animate mt-10">
              <div className="relative rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/5 to-violet-500/5 p-6 md:p-8">
                <div className="absolute top-0 left-6 h-full w-1 rounded-full bg-gradient-to-b from-blue-500 to-violet-500" />
                <p className="pl-6 text-lg text-muted-foreground leading-relaxed md:text-xl">
                  {t("landing.adDiff.complementNote")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========== Section Divider ========== */}
        <div className="border-t border-border/50" />

        {/* ========== CTA ========== */}
        <section className="py-20 md:py-32">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <div className="scroll-animate relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-blue-500/10 via-violet-500/10 to-cyan-500/10 p-12 md:p-20">
              <div className="animate-pulse-glow absolute top-0 left-1/4 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
              <div className="animate-pulse-glow absolute right-1/4 bottom-0 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" style={{ animationDelay: "2s" }} />

              <div className="relative">
                <h2 className="text-4xl font-bold md:text-5xl">
                  {t("landing.cta.bottomTitle")}
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                  {t("landing.cta.bottomSubtitle")}
                </p>
                <Link href="/dashboard" className="mt-8 inline-block">
                  <Button size="lg" className="h-12 gap-2 bg-blue-500 px-8 text-base text-white hover:bg-blue-600">
                    {t("landing.cta.startTrial")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ========== Section Divider ========== */}
        <div className="border-t border-border/50" />

        {/* ========== Footer ========== */}
        <footer className="py-12">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="flex items-center gap-2 text-lg font-bold">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                PresenceVision
              </div>
              <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
                <a href="#features" className="transition-colors hover:text-foreground">{t("landing.footer.features")}</a>
                <a href="#pricing" className="transition-colors hover:text-foreground">{t("landing.footer.pricing")}</a>
                <a href="#" className="transition-colors hover:text-foreground">{t("landing.footer.docs")}</a>
                <a href="#" className="transition-colors hover:text-foreground">{t("landing.footer.contact")}</a>
                <Link href="/terms" className="transition-colors hover:text-foreground">利用規約</Link>
                <Link href="/privacy" className="transition-colors hover:text-foreground">プライバシーポリシー</Link>
                <Link href="/tokushoho" className="transition-colors hover:text-foreground">特定商取引法に基づく表記</Link>
              </div>
              <p className="text-sm text-muted-foreground">
                &copy; 2026 VISIONOID Inc. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Comparison Cell                                                    */
/* ------------------------------------------------------------------ */
function ComparisonCell({ value, highlight }: { value: boolean | string; highlight?: boolean }) {
  if (value === true) {
    return (
      <span className={`inline-flex items-center justify-center rounded-full p-1 ${highlight ? "bg-blue-500/20 text-blue-500" : "bg-green-500/20 text-green-500"}`}>
        <Check className="h-4 w-4" />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center rounded-full bg-red-500/10 p-1 text-red-400">
        <X className="h-4 w-4" />
      </span>
    );
  }
  return <span className={highlight ? "font-semibold text-blue-500" : "text-muted-foreground"}>{value}</span>;
}
