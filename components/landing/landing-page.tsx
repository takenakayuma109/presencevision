"use client";

import { useEffect } from "react";
import Link from "next/link";
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
  Twitter,
  Linkedin,
  Facebook,
  MessageCircle,
  HelpCircle,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/hooks/use-translation";

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
  SNS: [
    { name: "Twitter / X", icon: Twitter },
    { name: "LinkedIn", icon: Linkedin },
    { name: "Facebook", icon: Facebook },
  ],
  Blog: [
    { name: "Medium", icon: BookOpen },
    { name: "note.com", icon: FileText },
    { name: "dev.to", icon: FileText },
    { name: "Qiita", icon: FileText },
    { name: "Hashnode", icon: FileText },
  ],
  "Q&A": [
    { name: "Reddit", icon: MessageCircle },
    { name: "Quora", icon: HelpCircle },
    { name: "Yahoo!知恵袋", icon: HelpCircle },
    { name: "知乎", icon: HelpCircle },
  ],
  Regional: [
    { name: "Naver Blog", icon: Globe },
    { name: "Tistory", icon: Globe },
    { name: "CSDN", icon: Globe },
    { name: "Xing", icon: Globe },
  ],
};

const plans = [
  {
    nameKey: "landing.pricing.starter.name",
    audience: "個人・フリーランス",
    price: "9,800",
    annualPrice: "7,800",
    featured: false,
    features: [
      "1プロジェクト",
      "5キーワード",
      "3チャネル配信",
      "月間100記事生成",
      "基本SERP追跡",
      "メールレポート（1日1回）",
    ],
  },
  {
    nameKey: "landing.pricing.professional.name",
    audience: "中小企業",
    price: "29,800",
    annualPrice: "24,800",
    featured: true,
    features: [
      "5プロジェクト",
      "50キーワード",
      "10チャネル配信",
      "月間500記事生成",
      "SERP + LLM引用追跡",
      "メールレポート（1日2回）",
      "競合分析",
      "CMS自動投稿（WordPress）",
      "優先サポート",
    ],
  },
  {
    nameKey: "landing.pricing.enterprise.name",
    audience: "大企業・代理店",
    price: "98,000",
    annualPrice: "78,000",
    featured: false,
    features: [
      "プロジェクト無制限",
      "キーワード無制限",
      "全20+チャネル配信",
      "記事生成無制限",
      "全機能利用可能",
      "専用VPSインスタンス",
      "カスタムチャネル追加",
      "API連携",
      "専任サポート",
      "SLA保証",
    ],
  },
];

const comparisonRows = [
  { label: "月額", pv: "¥9,800〜", semrush: "$139〜", ahrefs: "$99〜", surfer: "$89〜" },
  { label: "AI記事生成", pv: true, semrush: "制限あり", ahrefs: false, surfer: "制限あり" },
  { label: "LLM引用追跡", pv: true, semrush: false, ahrefs: false, surfer: false },
  { label: "分散配信", pv: "20+チャネル", semrush: false, ahrefs: false, surfer: false },
  { label: "API課金", pv: "ゼロ", semrush: "従量課金", ahrefs: "従量課金", surfer: "従量課金" },
  { label: "24h自律稼働", pv: true, semrush: false, ahrefs: false, surfer: false },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export function LandingPage() {
  const { t } = useTranslation();

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
              <Link href="/dashboard">
                <Button size="sm">{t("landing.cta.start")}</Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* ========== Hero ========== */}
        <section className="relative overflow-hidden pt-32 pb-20 md:pt-44 md:pb-32">
          {/* Gradient background */}
          <div className="absolute inset-0 -z-10">
            <div className="animate-gradient absolute inset-0 bg-gradient-to-br from-blue-600/10 via-violet-600/10 to-cyan-600/10" />
            <div className="animate-pulse-glow absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="animate-pulse-glow absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" style={{ animationDelay: "2s" }} />
          </div>

          <div className="mx-auto max-w-7xl px-6 text-center">
            <Badge variant="secondary" className="animate-fade-in-up mb-6 inline-flex items-center gap-1.5 px-4 py-1.5 text-sm">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              {t("landing.hero.badge")}
            </Badge>

            <h1 className="animate-fade-in-up-delay-1 mx-auto max-w-4xl text-4xl font-bold leading-tight tracking-tight md:text-6xl md:leading-tight">
              {t("landing.hero.title")}
            </h1>

            <p className="animate-fade-in-up-delay-2 mx-auto mt-6 max-w-3xl text-lg text-muted-foreground md:text-xl">
              {t("landing.hero.subtitle")}
            </p>

            <div className="animate-fade-in-up-delay-3 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/dashboard">
                <Button size="lg" className="h-12 gap-2 px-8 text-base">
                  {t("landing.cta.startFree")}
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
            <div className="animate-fade-in-up-delay-3 mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-8 rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
              <div>
                <div className="text-2xl font-bold md:text-3xl">20+</div>
                <div className="mt-1 text-xs text-muted-foreground md:text-sm">配信チャネル</div>
              </div>
              <div>
                <div className="text-2xl font-bold md:text-3xl">24/7</div>
                <div className="mt-1 text-xs text-muted-foreground md:text-sm">自律稼働</div>
              </div>
              <div>
                <div className="text-2xl font-bold md:text-3xl">¥0</div>
                <div className="mt-1 text-xs text-muted-foreground md:text-sm">API課金</div>
              </div>
            </div>
          </div>
        </section>

        {/* ========== Features Grid ========== */}
        <section id="features" className="scroll-smooth py-20 md:py-32">
          <div className="mx-auto max-w-7xl px-6">
            <div className="scroll-animate text-center">
              <Badge variant="secondary" className="mb-4">Features</Badge>
              <h2 className="text-3xl font-bold md:text-4xl">{t("landing.features.sectionTitle")}</h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
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
                      <CardTitle className="text-lg">{t(f.titleKey)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed">{t(f.descKey)}</p>
                    </CardContent>
                    {/* Hover gradient line */}
                    <div className={`absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r ${f.gradient} transition-all duration-500 group-hover:w-full`} />
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== How It Works ========== */}
        <section id="how-it-works" className="border-t border-border/50 py-20 md:py-32">
          <div className="mx-auto max-w-7xl px-6">
            <div className="scroll-animate text-center">
              <Badge variant="secondary" className="mb-4">How It Works</Badge>
              <h2 className="text-3xl font-bold md:text-4xl">{t("landing.howItWorks.title")}</h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                {t("landing.howItWorks.subtitle")}
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, i) => (
                <div key={i} className="scroll-animate relative" style={{ transitionDelay: `${i * 0.15}s` }}>
                  <div className="relative rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
                    <div className="mb-4 text-4xl font-bold text-blue-500/20">{step.num}</div>
                    <h3 className="mb-2 text-lg font-semibold">{t(step.titleKey)}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{t(step.descKey)}</p>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="absolute top-1/2 -right-4 hidden -translate-y-1/2 text-muted-foreground/30 lg:block">
                      <ChevronRight className="h-6 w-6" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== Distribution Channels ========== */}
        <section className="border-t border-border/50 py-20 md:py-32">
          <div className="mx-auto max-w-7xl px-6">
            <div className="scroll-animate text-center">
              <Badge variant="secondary" className="mb-4">Channels</Badge>
              <h2 className="text-3xl font-bold md:text-4xl">{t("landing.channels.title")}</h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
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
                        <div key={ch.name} className="flex items-center gap-3 text-sm">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                            <ch.icon className="h-4 w-4 text-muted-foreground" />
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

        {/* ========== Pricing ========== */}
        <section id="pricing" className="border-t border-border/50 py-20 md:py-32">
          <div className="mx-auto max-w-7xl px-6">
            <div className="scroll-animate text-center">
              <Badge variant="secondary" className="mb-4">Pricing</Badge>
              <h2 className="text-3xl font-bold md:text-4xl">{t("landing.pricing.title")}</h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                {t("landing.pricing.subtitle")}
              </p>
            </div>

            <div className="mt-16 grid gap-8 lg:grid-cols-3">
              {plans.map((plan, i) => (
                <div key={i} className="scroll-animate" style={{ transitionDelay: `${i * 0.15}s` }}>
                  <Card className={`relative h-full overflow-hidden ${plan.featured ? "border-blue-500/50 shadow-lg shadow-blue-500/10" : "border-border/50"}`}>
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
                          <span className="text-4xl font-bold">¥{plan.price}</span>
                          <span className="text-muted-foreground">/月</span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          年払い ¥{plan.annualPrice}/月
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {plan.features.map((feat, fi) => (
                          <li key={fi} className="flex items-start gap-3 text-sm">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                      <Link href="/dashboard" className="mt-8 block">
                        <Button
                          className={`w-full ${plan.featured ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}`}
                          variant={plan.featured ? "default" : "outline"}
                        >
                          {t("landing.cta.startFree")}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== Comparison ========== */}
        <section className="border-t border-border/50 py-20 md:py-32">
          <div className="mx-auto max-w-5xl px-6">
            <div className="scroll-animate text-center">
              <Badge variant="secondary" className="mb-4">Comparison</Badge>
              <h2 className="text-3xl font-bold md:text-4xl">{t("landing.comparison.title")}</h2>
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

        {/* ========== CTA ========== */}
        <section className="border-t border-border/50 py-20 md:py-32">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <div className="scroll-animate relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-blue-500/10 via-violet-500/10 to-cyan-500/10 p-12 md:p-20">
              <div className="animate-pulse-glow absolute top-0 left-1/4 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
              <div className="animate-pulse-glow absolute right-1/4 bottom-0 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" style={{ animationDelay: "2s" }} />

              <div className="relative">
                <h2 className="text-3xl font-bold md:text-4xl">
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

        {/* ========== Footer ========== */}
        <footer className="border-t border-border/50 py-12">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="flex items-center gap-2 text-lg font-bold">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                PresenceVision
              </div>
              <div className="flex gap-8 text-sm text-muted-foreground">
                <a href="#features" className="transition-colors hover:text-foreground">{t("landing.footer.features")}</a>
                <a href="#pricing" className="transition-colors hover:text-foreground">{t("landing.footer.pricing")}</a>
                <a href="#" className="transition-colors hover:text-foreground">{t("landing.footer.docs")}</a>
                <a href="#" className="transition-colors hover:text-foreground">{t("landing.footer.contact")}</a>
              </div>
              <p className="text-sm text-muted-foreground">
                &copy; 2026 PresenceVision. All rights reserved.
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
