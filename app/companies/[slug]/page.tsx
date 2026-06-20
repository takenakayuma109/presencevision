import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { KBHeader } from "@/components/knowledge-base/kb-header";

const ENGINE_URL =
  process.env.NEXT_PUBLIC_ENGINE_URL ?? "http://localhost:4000";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Project {
  id: string;
  name: string;
  targetUrl: string;
  brandName: string;
  keywords: string[];
  targetCountries: string[];
  methods: string[];
  status: string;
  createdAt: string;
}

interface Article {
  id: string;
  slug: string;
  title: string;
  body: string;
  meta_title: string | null;
  meta_description: string | null;
  keyword: string | null;
  language: string;
  country: string;
  brand_name: string | null;
  published_at: string;
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

// Normalized company data that both sources can produce
interface CompanyData {
  id: string;
  name: string;
  brandName: string;
  targetUrl: string;
  keywords: string[];
  targetCountries: string[];
  methods: string[];
  createdAt: string;
  fromEngine: boolean;
}

// ---------------------------------------------------------------------------
// Country flags
// ---------------------------------------------------------------------------

const FLAGS: Record<string, string> = {
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
};

const LANG_LABELS: Record<string, string> = {
  ja: "日本語",
  en: "English",
  de: "Deutsch",
  fr: "Francais",
  zh: "中文",
  ko: "한국어",
  pt: "Portugues",
  hi: "Hindi",
};

const METHOD_COLORS: Record<string, string> = {
  SEO: "bg-emerald-50 text-emerald-700 border-emerald-200",
  AEO: "bg-blue-50 text-blue-700 border-blue-200",
  GEO: "bg-purple-50 text-purple-700 border-purple-200",
  "Schema.org": "bg-amber-50 text-amber-700 border-amber-200",
  ContentMarketing: "bg-rose-50 text-rose-700 border-rose-200",
  KnowledgeGraph: "bg-cyan-50 text-cyan-700 border-cyan-200",
  FAQ: "bg-orange-50 text-orange-700 border-orange-200",
  Multilingual: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getProject(slug: string): Promise<Project | null> {
  try {
    const res = await fetch(`${ENGINE_URL}/engine/status`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const projects: Project[] = data.projects ?? [];
    return projects.find((p) => p.id === slug) ?? null;
  } catch {
    return null;
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

async function getCompanyData(slug: string): Promise<CompanyData | null> {
  // Try engine first
  const project = await getProject(slug);
  if (project) {
    return {
      id: project.id,
      name: project.name,
      brandName: project.brandName || project.name,
      targetUrl: project.targetUrl,
      keywords: project.keywords,
      targetCountries: project.targetCountries,
      methods: project.methods,
      createdAt: project.createdAt,
      fromEngine: true,
    };
  }

  // Fallback: try articles/companies
  const articleCompanies = await getArticleCompanies();
  const match = articleCompanies.companies.find((ac) => ac.id === slug);
  if (match) {
    return {
      id: match.id,
      name: match.name,
      brandName: match.name,
      targetUrl: "",
      keywords: [],
      targetCountries: [match.country],
      methods: [],
      createdAt: match.registeredAt ?? "",
      fromEngine: false,
    };
  }

  return null;
}

async function getArticles(
  projectId: string
): Promise<{ articles: Article[]; total: number }> {
  try {
    const res = await fetch(
      `${ENGINE_URL}/articles?projectId=${projectId}&limit=50`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return { articles: [], total: 0 };
    return res.json();
  } catch {
    return { articles: [], total: 0 };
  }
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const company = await getCompanyData(slug);
  if (!company) return { title: "企業情報が見つかりません" };

  const keywordsStr =
    company.keywords.length > 0
      ? company.keywords.slice(0, 5).join("、")
      : "デジタルプレゼンス";
  const countriesCount = company.targetCountries.length;
  const description = `${company.brandName}の企業プロフィール。${keywordsStr}に関する${countriesCount > 0 ? `${countriesCount}カ国向け` : ""}ナレッジベースを提供。`;

  return {
    title: `${company.brandName} | 企業プロフィール | PresenceVision`,
    description,
    openGraph: {
      title: `${company.brandName} | 企業プロフィール`,
      description,
      siteName: "PresenceVision",
      type: "profile",
    },
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [company, { articles, total }] = await Promise.all([
    getCompanyData(slug),
    getArticles(slug),
  ]);

  if (!company) notFound();

  const faqArticles = articles.filter(
    (a) =>
      a.keyword?.toLowerCase().includes("faq") ||
      a.title.toLowerCase().includes("faq") ||
      a.title.includes("よくある質問")
  );

  const sortedArticles = [...articles].sort(
    (a, b) =>
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  const registrationDate = company.createdAt
    ? new Date(company.createdAt).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(company.brandName)}&background=random&color=fff&size=128&bold=true&format=svg`;

  // JSON-LD: Organization
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.brandName,
    ...(company.targetUrl ? { url: company.targetUrl } : {}),
    keywords: company.keywords.join(", "),
    description: `${company.brandName} - ${company.keywords.slice(0, 5).join(", ") || "企業プロフィール"}`,
  };

  // JSON-LD: FAQPage
  const faqJsonLd =
    faqArticles.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqArticles.slice(0, 20).map((a) => ({
            "@type": "Question",
            name: a.title,
            acceptedAnswer: {
              "@type": "Answer",
              text: a.body.slice(0, 500),
            },
          })),
        }
      : null;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <KBHeader variant="light" />

      {/* ================================================================= */}
      {/* 1. Company Header                                                 */}
      {/* ================================================================= */}
      <header className="relative overflow-hidden border-b border-gray-200">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex items-start gap-6">
            {/* Company Logo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl}
              alt={`${company.brandName} logo`}
              width={80}
              height={80}
              className="rounded-xl shadow-sm border border-gray-200 flex-shrink-0"
            />

            <div className="flex-1 min-w-0">
              {/* Status badge + Registration date */}
              <div className="flex items-center gap-3 mb-3">
                {company.fromEngine ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    稼働中
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wide">
                    登録済み
                  </span>
                )}
                {registrationDate && (
                  <span className="text-sm text-gray-500">
                    登録日: {registrationDate}
                  </span>
                )}
              </div>

              {/* Company Name */}
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
                {company.brandName}
              </h1>

              {/* Website URL */}
              {company.targetUrl && (
                <a
                  href={company.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-3 text-base text-gray-500 hover:text-blue-600 transition-colors group"
                >
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  <span className="group-hover:underline">
                    {company.targetUrl}
                  </span>
                  <svg
                    className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              )}

              {/* Target countries with flags */}
              {company.targetCountries.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <span className="text-sm text-gray-500 mr-1">対象地域:</span>
                  {company.targetCountries.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-sm text-gray-700 border border-gray-200"
                    >
                      <span>{FLAGS[c] ?? ""}</span>
                      <span>{COUNTRY_NAMES[c] ?? c}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ================================================================= */}
      {/* 2. Company Data Panel -- Grid of key metrics                       */}
      {/* ================================================================= */}
      <section className="border-b border-gray-200 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div
            className={`grid grid-cols-2 ${company.fromEngine ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-4`}
          >
            <MetricBox label="掲載記事数" value={`${total}件`} accent />
            {company.keywords.length > 0 && (
              <MetricBox
                label="対象キーワード"
                value={`${company.keywords.length}件`}
              />
            )}
            <MetricBox
              label="対象市場"
              value={`${company.targetCountries.length}カ国`}
            />
            {company.methods.length > 0 && (
              <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">
                  稼働メソッド
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {company.methods.map((m) => (
                    <span
                      key={m}
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${METHOD_COLORS[m] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12 sm:space-y-16">
        {/* ================================================================= */}
        {/* 3. 企業概要                                                       */}
        {/* ================================================================= */}
        <section>
          <SectionHeading title="企業概要" />
          <div className="mt-5 rounded-xl bg-gray-50 border border-gray-200 p-6 sm:p-8">
            <p className="text-gray-700 leading-relaxed text-base sm:text-lg">
              <span className="font-semibold text-gray-900">
                {company.brandName}
              </span>
              は、
              {company.keywords.length > 0
                ? `${company.keywords.slice(0, 3).join("、")}を中心に事業を展開する企業です。`
                : "デジタルプレゼンスを展開する企業です。"}
              {company.targetCountries.length > 1
                ? `${company.targetCountries.map((c) => COUNTRY_NAMES[c] ?? c).join("、")}を含む${company.targetCountries.length}カ国・地域を対象に、`
                : ""}
              {company.methods.length > 0
                ? `${company.methods.join(" / ")}の手法を活用したデジタルプレゼンス戦略により、検索エンジンおよびAIプラットフォームでの高い可視性を実現しています。`
                : ""}
              {total > 0
                ? `現在までに${total}件のナレッジ記事を公開し、多言語・多地域でのブランド認知拡大を推進しています。`
                : "ナレッジベースへの記事掲載を準備中です。"}
            </p>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 4. キーワード・専門分野                                              */}
        {/* ================================================================= */}
        {company.keywords.length > 0 && (
          <section>
            <SectionHeading title="キーワード・専門分野" />
            <div className="mt-5 rounded-xl bg-gray-50 border border-gray-200 p-6 sm:p-8">
              <div className="flex flex-wrap gap-2">
                {company.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-block px-3.5 py-1.5 rounded-lg bg-gray-100 text-sm text-gray-700 border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ================================================================= */}
        {/* 5. 最新記事 -- TABLE format                                         */}
        {/* ================================================================= */}
        <section>
          <SectionHeading title="最新記事" count={total} />

          {sortedArticles.length === 0 ? (
            <div className="mt-6 text-center py-16 rounded-xl bg-gray-50 border border-gray-200 text-gray-500">
              <p className="text-lg">記事はまだ公開されていません</p>
              <p className="mt-1 text-sm">
                エンジンが記事を生成するとここに表示されます
              </p>
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">
                        公開日
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        タイトル
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-44 hidden md:table-cell">
                        キーワード
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24 hidden sm:table-cell">
                        言語
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedArticles.map((article, i) => (
                      <tr
                        key={article.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                          i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                        }`}
                      >
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap tabular-nums">
                          {new Date(article.published_at).toLocaleDateString(
                            "ja-JP",
                            {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            }
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/blog/${article.slug}`}
                            className="text-gray-900 hover:text-blue-600 transition-colors font-medium line-clamp-1"
                          >
                            {article.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {article.keyword && (
                            <span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-xs text-gray-600 border border-gray-200 truncate max-w-[10rem]">
                              {article.keyword}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-gray-500 text-xs">
                            {LANG_LABELS[article.language] ??
                              article.language.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* ================================================================= */}
        {/* 6. FAQ Section                                                     */}
        {/* ================================================================= */}
        {faqArticles.length > 0 && (
          <section>
            <SectionHeading title="よくある質問" />
            <div className="mt-5 space-y-2">
              {faqArticles.map((faq) => (
                <details
                  key={faq.id}
                  className="group rounded-xl bg-gray-50 border border-gray-200 overflow-hidden"
                >
                  <summary className="flex items-center justify-between cursor-pointer px-5 py-4 text-sm sm:text-base font-medium text-gray-900 hover:text-gray-700 transition-colors list-none [&::-webkit-details-marker]:hidden">
                    <span>{faq.title}</span>
                    <svg
                      className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </summary>
                  <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-200">
                    <p className="pt-3">{faq.body.slice(0, 500)}</p>
                    <Link
                      href={`/blog/${faq.slug}`}
                      className="inline-block mt-3 text-blue-600 hover:underline text-xs"
                    >
                      続きを読む &rarr;
                    </Link>
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 mt-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          Powered by{" "}
          <Link href="/" className="text-blue-600 hover:underline">
            PresenceVision
          </Link>
        </div>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MetricBox component
// ---------------------------------------------------------------------------

function MetricBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
      <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">
        {label}
      </div>
      <div
        className={`text-2xl sm:text-3xl font-bold ${accent ? "text-emerald-600" : "text-gray-900"}`}
      >
        {value}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SectionHeading component
// ---------------------------------------------------------------------------

function SectionHeading({
  title,
  count,
}: {
  title: string;
  count?: number;
}) {
  return (
    <div className="flex items-baseline gap-3 pb-3 border-b border-gray-200">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h2>
      {count !== undefined && (
        <span className="text-sm text-gray-500">({count}件)</span>
      )}
    </div>
  );
}
