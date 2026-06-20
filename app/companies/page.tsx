import Link from "next/link";
import { CompanySearch } from "./company-search";
import { KBHeader } from "@/components/knowledge-base/kb-header";

const ENGINE_URL =
  process.env.NEXT_PUBLIC_ENGINE_URL ?? "http://localhost:4000";

interface Project {
  id: string;
  name: string;
  brandName: string;
  targetUrl: string;
  targetCountries: string[];
  keywords: string[];
  methods: string[];
}

interface EngineStatus {
  projects: Project[];
}

interface ArticleCompany {
  id: string;
  name: string;
  country: string;
  language: string;
  articleCount: number;
  registeredAt: string;
}

interface ArticleCompaniesResponse {
  companies: ArticleCompany[];
  total: number;
}

const COUNTRY_FLAGS: Record<string, string> = {
  JP: "\u{1F1EF}\u{1F1F5}",
  US: "\u{1F1FA}\u{1F1F8}",
  GB: "\u{1F1EC}\u{1F1E7}",
  DE: "\u{1F1E9}\u{1F1EA}",
  FR: "\u{1F1EB}\u{1F1F7}",
  CN: "\u{1F1E8}\u{1F1F3}",
  KR: "\u{1F1F0}\u{1F1F7}",
  IN: "\u{1F1EE}\u{1F1F3}",
  BR: "\u{1F1E7}\u{1F1F7}",
  AU: "\u{1F1E6}\u{1F1FA}",
  CA: "\u{1F1E8}\u{1F1E6}",
  IT: "\u{1F1EE}\u{1F1F9}",
  ES: "\u{1F1EA}\u{1F1F8}",
  MX: "\u{1F1F2}\u{1F1FD}",
  SG: "\u{1F1F8}\u{1F1EC}",
  TW: "\u{1F1F9}\u{1F1FC}",
  TH: "\u{1F1F9}\u{1F1ED}",
  VN: "\u{1F1FB}\u{1F1F3}",
  ID: "\u{1F1EE}\u{1F1E9}",
  PH: "\u{1F1F5}\u{1F1ED}",
  NL: "\u{1F1F3}\u{1F1F1}",
  SE: "\u{1F1F8}\u{1F1EA}",
  CH: "\u{1F1E8}\u{1F1ED}",
  AE: "\u{1F1E6}\u{1F1EA}",
  SA: "\u{1F1F8}\u{1F1E6}",
  RU: "\u{1F1F7}\u{1F1FA}",
  ZA: "\u{1F1FF}\u{1F1E6}",
  NZ: "\u{1F1F3}\u{1F1FF}",
  IE: "\u{1F1EE}\u{1F1EA}",
  PT: "\u{1F1F5}\u{1F1F9}",
  PL: "\u{1F1F5}\u{1F1F1}",
  AT: "\u{1F1E6}\u{1F1F9}",
  BE: "\u{1F1E7}\u{1F1EA}",
  DK: "\u{1F1E9}\u{1F1F0}",
  FI: "\u{1F1EB}\u{1F1EE}",
  NO: "\u{1F1F3}\u{1F1F4}",
  IL: "\u{1F1EE}\u{1F1F1}",
  MY: "\u{1F1F2}\u{1F1FE}",
  HK: "\u{1F1ED}\u{1F1F0}",
  AR: "\u{1F1E6}\u{1F1F7}",
  CL: "\u{1F1E8}\u{1F1F1}",
  CO: "\u{1F1E8}\u{1F1F4}",
  EG: "\u{1F1EA}\u{1F1EC}",
  NG: "\u{1F1F3}\u{1F1EC}",
  KE: "\u{1F1F0}\u{1F1EA}",
  TR: "\u{1F1F9}\u{1F1F7}",
};

const COUNTRY_NAMES: Record<string, string> = {
  JP: "日本",
  US: "アメリカ",
  GB: "イギリス",
  DE: "ドイツ",
  FR: "フランス",
  CN: "中国",
  KR: "韓国",
  IN: "インド",
  BR: "ブラジル",
  AU: "オーストラリア",
  CA: "カナダ",
  IT: "イタリア",
  ES: "スペイン",
  SG: "シンガポール",
  TW: "台湾",
  TH: "タイ",
  VN: "ベトナム",
};

// Language code to display name mapping
const LANGUAGE_NAMES: Record<string, string> = {
  ja: "日本語",
  en: "英語",
  de: "ドイツ語",
  fr: "フランス語",
  zh: "中国語",
  ko: "韓国語",
  pt: "ポルトガル語",
  es: "スペイン語",
  it: "イタリア語",
  th: "タイ語",
  vi: "ベトナム語",
};

function getCountryFlag(code: string): string {
  return COUNTRY_FLAGS[code.toUpperCase()] ?? code;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function getEngineStatus(): Promise<EngineStatus> {
  try {
    const res = await fetch(`${ENGINE_URL}/engine/status`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return { projects: [] };
    return res.json();
  } catch {
    return { projects: [] };
  }
}

async function getArticleCompanies(): Promise<ArticleCompaniesResponse> {
  try {
    const res = await fetch(`${ENGINE_URL}/articles/companies`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return { companies: [], total: 0 };
    return res.json();
  } catch {
    return { companies: [], total: 0 };
  }
}

export const metadata = {
  title: "Enterprise Knowledge Base - PresenceVision",
  description:
    "企業のデジタルプレゼンスを可視化するナレッジプラットフォーム。企業概要、サービス、FAQ、業界インサイトを構造化データとともに提供。",
  openGraph: {
    title: "Enterprise Knowledge Base - PresenceVision",
    description:
      "企業のデジタルプレゼンスを可視化するナレッジプラットフォーム",
    siteName: "PresenceVision",
  },
};

export interface CompanyCard {
  id: string;
  name: string;
  brandName: string;
  slug: string;
  keywords: string[];
  targetCountries: string[];
  countryFlags: string[];
  articleCount: number;
  registeredAt: string;
}

export default async function CompaniesPage() {
  const [{ projects }, articleCompaniesRes] = await Promise.all([
    getEngineStatus(),
    getArticleCompanies(),
  ]);

  const engineProjectIds = new Set(projects.map((p) => p.id));

  // Build article count map
  const articleCountMap: Record<string, number> = {};
  articleCompaniesRes.companies.forEach((ac) => {
    articleCountMap[ac.id] = ac.articleCount;
  });

  // Build registeredAt map
  const registeredAtMap: Record<string, string> = {};
  articleCompaniesRes.companies.forEach((ac) => {
    registeredAtMap[ac.id] = ac.registeredAt ?? "";
  });

  // Build cards from engine projects
  const engineCards: CompanyCard[] = projects.map((c) => {
    const displayName = c.brandName || c.name;
    return {
      id: c.id,
      name: c.name,
      brandName: displayName,
      slug: slugify(c.name || c.id),
      keywords: c.keywords ?? [],
      targetCountries: c.targetCountries ?? [],
      countryFlags: (c.targetCountries ?? []).map((code) => getCountryFlag(code)),
      articleCount: articleCountMap[c.id] ?? 0,
      registeredAt: registeredAtMap[c.id] ?? "",
    };
  });

  // Build cards from article-only companies
  const articleOnlyCards: CompanyCard[] = articleCompaniesRes.companies
    .filter((ac) => !engineProjectIds.has(ac.id))
    .map((ac) => {
      return {
        id: ac.id,
        name: ac.name,
        brandName: ac.name,
        slug: slugify(ac.name || ac.id),
        keywords: [],
        targetCountries: [ac.country],
        countryFlags: [getCountryFlag(ac.country)],
        articleCount: ac.articleCount ?? 0,
        registeredAt: ac.registeredAt ?? "",
      };
    });

  // Deduplicate by normalized brandName (trim, remove newlines, collapse whitespace)
  const normalizeName = (name: string) =>
    name.replace(/[\n\r]+/g, " ").replace(/\s+/g, " ").trim();
  const seenNames = new Set<string>();
  const deduped: CompanyCard[] = [];
  for (const card of [...engineCards, ...articleOnlyCards]) {
    // Normalize the brandName for display as well
    card.brandName = normalizeName(card.brandName);
    card.name = normalizeName(card.name);
    const key = card.brandName.toLowerCase();
    if (!seenNames.has(key)) {
      seenNames.add(key);
      deduped.push(card);
    }
  }
  const cards: CompanyCard[] = deduped.sort(
    (a, b) => a.brandName.localeCompare(b.brandName, "ja")
  );

  // Calculate real stats
  const totalArticles = articleCompaniesRes.companies.reduce(
    (sum, c) => sum + c.articleCount,
    0
  );
  // Collect distinct languages from article data + derive from project countries
  const COUNTRY_TO_LANG: Record<string, string> = {
    JP: "ja", US: "en", GB: "en", AU: "en", CA: "en", NZ: "en", IE: "en",
    DE: "de", AT: "de", CH: "de",
    FR: "fr", BE: "fr",
    CN: "zh", TW: "zh", HK: "zh",
    KR: "ko",
    BR: "pt", PT: "pt",
    IN: "hi",
    ES: "es", MX: "es", AR: "es", CL: "es", CO: "es",
    IT: "it",
    TH: "th",
    VN: "vi",
  };
  const distinctLanguages = new Set<string>();
  // Add all languages from article data
  for (const c of articleCompaniesRes.companies) {
    if (c.language) distinctLanguages.add(c.language);
  }
  // Also derive from project target countries
  for (const p of projects) {
    for (const cc of p.targetCountries ?? []) {
      const lang = COUNTRY_TO_LANG[cc];
      if (lang) distinctLanguages.add(lang);
    }
  }

  // Collect unique countries for filter chips with counts
  const countryCounts: Record<string, number> = {};
  cards.forEach((c) => {
    (c.targetCountries ?? []).forEach((code) => {
      countryCounts[code] = (countryCounts[code] ?? 0) + 1;
    });
  });

  // Access ranking: top 5 by article count
  const rankingTop5 = [...cards]
    .sort((a, b) => b.articleCount - a.articleCount)
    .slice(0, 5);

  // Latest companies: top 5 by registeredAt descending
  const latestCompanies = [...cards]
    .filter((c) => c.registeredAt)
    .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 transition-colors">
      {/* Hero animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes heroFloat1 { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-20px) rotate(5deg); } }
        @keyframes heroFloat2 { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-15px) rotate(-3deg); } }
        @keyframes heroFloat3 { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-10px) scale(1.05); } }
        @keyframes heroGradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .hero-float-1 { animation: heroFloat1 6s ease-in-out infinite; }
        .hero-float-2 { animation: heroFloat2 8s ease-in-out infinite 1s; }
        .hero-float-3 { animation: heroFloat3 7s ease-in-out infinite 2s; }
        .hero-gradient-shift { animation: heroGradient 8s ease infinite; background-size: 200% 200%; }
      ` }} />

      <KBHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Main gradient background */}
        <div
          className="absolute inset-0 hero-gradient-shift"
          style={{
            background:
              "linear-gradient(135deg, #1e3a5f 0%, #1e3a5f 30%, #2563eb 70%, #3b82f6 100%)",
            backgroundSize: "200% 200%",
          }}
        />

        {/* Geometric decorative shapes */}
        <div className="hero-float-1 absolute -top-10 -right-10 w-72 h-72 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #60a5fa, transparent 70%)" }} />
        <div className="hero-float-2 absolute top-1/2 -left-16 w-48 h-48 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #93c5fd, transparent 70%)" }} />
        <div className="hero-float-3 absolute bottom-20 right-1/4 w-24 h-24 rounded-full opacity-15" style={{ background: "#3b82f6" }} />

        {/* Diagonal lines */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[200%] h-px opacity-10 origin-top-right" style={{ background: "linear-gradient(90deg, transparent, #93c5fd, transparent)", transform: "rotate(-15deg) translateY(120px)" }} />
          <div className="absolute top-0 right-0 w-[200%] h-px opacity-[0.07] origin-top-right" style={{ background: "linear-gradient(90deg, transparent, #93c5fd, transparent)", transform: "rotate(-15deg) translateY(200px)" }} />
          <div className="absolute top-0 right-0 w-[200%] h-px opacity-[0.05] origin-top-right" style={{ background: "linear-gradient(90deg, transparent, #93c5fd, transparent)", transform: "rotate(-15deg) translateY(280px)" }} />
        </div>

        {/* Abstract business geometric illustration (right side) */}
        <div className="absolute right-0 top-0 w-1/2 h-full pointer-events-none hidden lg:block">
          {/* Overlapping circles */}
          <div className="hero-float-1 absolute top-[20%] right-[15%] w-32 h-32 rounded-full border-2 border-white/10" />
          <div className="hero-float-2 absolute top-[25%] right-[10%] w-24 h-24 rounded-full border-2 border-white/10" />
          <div className="hero-float-3 absolute top-[30%] right-[20%] w-16 h-16 rounded-full bg-white/5" />
          {/* Bar chart elements */}
          <div className="absolute bottom-[25%] right-[12%] flex items-end gap-2 opacity-[0.12]">
            <div className="w-4 h-12 bg-white rounded-t" />
            <div className="w-4 h-20 bg-white rounded-t" />
            <div className="w-4 h-16 bg-white rounded-t" />
            <div className="w-4 h-24 bg-white rounded-t" />
            <div className="w-4 h-28 bg-white rounded-t" />
          </div>
          {/* Hexagon */}
          <div className="hero-float-2 absolute top-16 right-[15%] w-16 h-16 opacity-10" style={{ background: "#93c5fd", clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }} />
          {/* Diamond */}
          <div className="hero-float-1 absolute bottom-[40%] right-[30%] w-8 h-8 opacity-10" style={{ background: "#60a5fa", clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />
          {/* Dotted grid */}
          <div className="absolute top-[15%] right-[25%] grid grid-cols-4 gap-3 opacity-[0.08]">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-white" />
            ))}
          </div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16 sm:pt-20 sm:pb-24">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
            Enterprise
            <br />
            <span className="text-blue-200">Knowledge Base</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-blue-100/80 max-w-2xl leading-relaxed">
            企業のデジタルプレゼンスを網羅するナレッジプラットフォーム
          </p>

          {/* Stats */}
          <div className="mt-10 flex flex-wrap items-center gap-4 text-sm">
            <div className="inline-flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-5 py-3">
              <span className="font-mono text-2xl sm:text-3xl font-bold text-white">
                {cards.length}
              </span>
              <span className="text-blue-100/80 text-sm">登録企業</span>
            </div>
            <div className="inline-flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-5 py-3">
              <span className="font-mono text-2xl sm:text-3xl font-bold text-emerald-300">
                {totalArticles.toLocaleString()}
              </span>
              <span className="text-blue-100/80 text-sm">掲載記事</span>
            </div>
            <div className="inline-flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-5 py-3">
              <span className="font-mono text-2xl sm:text-3xl font-bold text-violet-300">
                {distinctLanguages.size}
              </span>
              <span className="text-blue-100/80 text-sm">対応言語</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <CompanySearch
          cards={cards}
          countryCounts={countryCounts}
          countryNames={COUNTRY_NAMES}
          countryFlags={COUNTRY_FLAGS}
          languageNames={LANGUAGE_NAMES}
          rankingTop5={rankingTop5}
          latestCompanies={latestCompanies}
        />
      </main>

      {/* Bottom CTA */}
      <section className="border-t border-gray-200 dark:border-zinc-800 bg-gradient-to-b from-gray-50 via-blue-50 to-blue-100 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-zinc-100">
            あなたの企業も掲載しませんか？
          </h2>
          <p className="mt-3 text-gray-700 dark:text-zinc-400 max-w-lg mx-auto text-sm leading-relaxed">
            PresenceVisionに登録するだけで、あなたの企業情報が自動的にナレッジベースに掲載されます。
          </p>
          <Link
            href="/sign-in"
            className="mt-8 inline-flex items-center gap-2 rounded-lg px-7 py-3 text-sm font-semibold text-white transition-all hover:brightness-110 shadow-lg shadow-emerald-500/25"
            style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}
          >
            無料で始める
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-gray-600 dark:text-zinc-500">
          <span>PresenceVision Enterprise Knowledge Base</span>
          <span>データは5分間隔で更新</span>
        </div>
      </footer>
    </div>
  );
}
