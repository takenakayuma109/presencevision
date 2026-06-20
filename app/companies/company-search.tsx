"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import type { CompanyCard } from "./page";

type SortKey = "alphabetical" | "newest";
type CountryFilter = "all" | string;

// Predefined country tabs (always show these)
const COUNTRY_TABS = [
  { code: "JP", label: "日本" },
  { code: "US", label: "アメリカ" },
  { code: "GB", label: "イギリス" },
  { code: "DE", label: "ドイツ" },
  { code: "FR", label: "フランス" },
  { code: "CN", label: "中国" },
  { code: "KR", label: "韓国" },
  { code: "IN", label: "インド" },
  { code: "BR", label: "ブラジル" },
];

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

interface RankingCardData {
  id: string;
  brandName: string;
  slug: string;
  keywords: string[];
  countryFlags: string[];
  targetCountries: string[];
  registeredAt: string;
}

export function CompanySearch({
  cards,
  countryCounts,
  countryNames,
  countryFlags,
  rankingTop5,
  latestCompanies,
}: {
  cards: CompanyCard[];
  countryCounts: Record<string, number>;
  countryNames: Record<string, string>;
  countryFlags: Record<string, string>;
  languageNames: Record<string, string>;
  rankingTop5: RankingCardData[];
  latestCompanies: RankingCardData[];
}) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState<CountryFilter>("all");
  const [sort, setSort] = useState<SortKey>("alphabetical");

  const filtered = useMemo(() => {
    let result = cards;

    // text filter
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.brandName.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          r.keywords.some((k) => k.toLowerCase().includes(q))
      );
    }

    // country filter
    if (country !== "all") {
      result = result.filter((r) => r.targetCountries.includes(country));
    }

    // sort
    if (sort === "alphabetical") {
      result = [...result].sort((a, b) =>
        a.brandName.localeCompare(b.brandName, "ja")
      );
    } else {
      result = [...result].sort((a, b) => {
        if (a.registeredAt && b.registeredAt)
          return b.registeredAt.localeCompare(a.registeredAt);
        if (a.registeredAt) return -1;
        if (b.registeredAt) return 1;
        return a.brandName.localeCompare(b.brandName, "ja");
      });
    }

    return result;
  }, [cards, query, country, sort]);

  // Build additional country tabs beyond the predefined ones
  const predefinedCodes = new Set(COUNTRY_TABS.map((t) => t.code));
  const additionalCountries = Object.entries(countryCounts)
    .filter(([code]) => !predefinedCodes.has(code))
    .sort((a, b) => b[1] - a[1])
    .map(([code]) => ({
      code,
      label: countryNames[code] ?? code,
    }));

  const allCountryTabs = [...COUNTRY_TABS, ...additionalCountries];

  return (
    <>
      {/* Search bar */}
      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
          <svg
            className="w-5 h-5 text-gray-400 dark:text-zinc-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="企業名・キーワードで検索..."
          className="w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-14 pr-4 py-4 text-base text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500 transition-all shadow-sm dark:shadow-none"
        />
      </div>

      {/* "Enterprise Knowledge Baseが選ばれる3つの理由" Section */}
      <section className="mb-12 py-12 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-zinc-900/50 border-y border-gray-100 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-zinc-100 mb-4">
            企業情報の見方が、
            <span className="text-blue-600 dark:text-blue-400">変わる。</span>
          </h2>
          <p className="text-center text-gray-600 dark:text-zinc-400 text-sm sm:text-base mb-12 max-w-2xl mx-auto leading-relaxed">
            従来の企業データベースは「過去の情報」を見るもの。Enterprise Knowledge Baseは、企業が伝えたい「今」をリアルタイムに届けます。
          </p>

          {/* Feature 1: left text, right visual */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center mb-16">
            <div>
              <div className="flex items-start gap-4 mb-4">
                <span className="flex-shrink-0 text-5xl font-black text-blue-600 dark:text-blue-400 leading-none">1</span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100 mb-2">
                    企業の「今」が、常に最新の状態で見える
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
                    AIが企業の強み・サービス・最新動向を24時間体制で記事にまとめ続けます。人間が書くより圧倒的にタイムリーかつ大量。だからこそ、その企業のことが一番よくわかる場所になります。
                  </p>
                </div>
              </div>
            </div>
            {/* Right visual: bar chart going up with AI icon */}
            <div className="flex items-center justify-center">
              <div className="relative w-56 h-40 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-sm dark:shadow-none p-4 flex items-end justify-center gap-2">
                {/* Rising bars */}
                <div className="w-6 h-8 bg-blue-200 dark:bg-blue-900 rounded-t" />
                <div className="w-6 h-14 bg-blue-300 dark:bg-blue-800 rounded-t" />
                <div className="w-6 h-10 bg-blue-400 dark:bg-blue-700 rounded-t" />
                <div className="w-6 h-20 bg-blue-500 dark:bg-blue-600 rounded-t" />
                <div className="w-6 h-24 bg-blue-600 dark:bg-blue-500 rounded-t" />
                {/* AI sparkle icon overlay */}
                <div className="absolute top-3 right-3">
                  <svg className="w-8 h-8 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                </div>
                {/* Trend arrow */}
                <div className="absolute top-3 left-3">
                  <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: left visual, right text (reversed) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center mb-16">
            {/* Left visual: structured data/code blocks */}
            <div className="flex items-center justify-center order-2 md:order-1">
              <div className="relative w-56 h-40 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-sm dark:shadow-none p-4 overflow-hidden">
                {/* Code-like structured data lines */}
                <div className="space-y-2 text-[10px] font-mono">
                  <div className="flex items-center gap-1">
                    <span className="text-purple-500 dark:text-purple-400">{"{"}</span>
                    <span className="text-gray-400 dark:text-zinc-500">Schema.org</span>
                  </div>
                  <div className="ml-3 flex items-center gap-1">
                    <span className="text-blue-600 dark:text-blue-400">&quot;@type&quot;</span>
                    <span className="text-gray-400 dark:text-zinc-500">:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">&quot;Organization&quot;</span>
                  </div>
                  <div className="ml-3 flex items-center gap-1">
                    <span className="text-blue-600 dark:text-blue-400">&quot;name&quot;</span>
                    <span className="text-gray-400 dark:text-zinc-500">:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">&quot;...&quot;</span>
                  </div>
                  <div className="ml-3 flex items-center gap-1">
                    <span className="text-blue-600 dark:text-blue-400">&quot;service&quot;</span>
                    <span className="text-gray-400 dark:text-zinc-500">:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">[...]</span>
                  </div>
                  <div className="ml-3 flex items-center gap-1">
                    <span className="text-blue-600 dark:text-blue-400">&quot;faq&quot;</span>
                    <span className="text-gray-400 dark:text-zinc-500">:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">[...]</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-purple-500 dark:text-purple-400">{"}"}</span>
                  </div>
                </div>
                {/* Check mark overlay */}
                <div className="absolute bottom-2 right-2">
                  <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="flex items-start gap-4 mb-4">
                <span className="flex-shrink-0 text-5xl font-black text-blue-600 dark:text-blue-400 leading-none">2</span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100 mb-2">
                    「サボり」ではなく、企業が伝えたいことの高速発信
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
                    AI生成＝手抜きではありません。企業が世の中に伝えたいことを、人間の何倍もの速さと網羅性で発信し続ける仕組みです。だからこそ、この場所を見れば企業の全体像が把握できます。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3: left text, right visual */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <div className="flex items-start gap-4 mb-4">
                <span className="flex-shrink-0 text-5xl font-black text-blue-600 dark:text-blue-400 leading-none">3</span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100 mb-2">
                    世界中の企業を、言語の壁なく理解できる
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
                    11言語対応で、日本の企業も海外の企業も同じフォーマットで閲覧可能。言語が違っても、その企業が何をしているのか、何を目指しているのかが一目でわかります。
                  </p>
                </div>
              </div>
            </div>
            {/* Right visual: globe with language flags */}
            <div className="flex items-center justify-center">
              <div className="relative w-56 h-40 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-sm dark:shadow-none flex items-center justify-center">
                {/* Globe icon */}
                <svg className="w-16 h-16 text-blue-400 dark:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 003 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
                {/* Language flags around the globe */}
                <span className="absolute top-2 left-4 text-lg">🇯🇵</span>
                <span className="absolute top-2 right-4 text-lg">🇺🇸</span>
                <span className="absolute top-8 left-1 text-sm">🇩🇪</span>
                <span className="absolute top-8 right-1 text-sm">🇫🇷</span>
                <span className="absolute bottom-8 left-2 text-sm">🇧🇷</span>
                <span className="absolute bottom-8 right-2 text-sm">🇨🇳</span>
                <span className="absolute bottom-2 left-8 text-sm">🇰🇷</span>
                <span className="absolute bottom-2 right-8 text-sm">🇮🇳</span>
                <span className="absolute top-1/2 -translate-y-1/2 left-0 text-xs">🇪🇸</span>
                <span className="absolute top-1/2 -translate-y-1/2 right-0 text-xs">🇮🇹</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ranking + Latest Section */}
      <section className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Access Ranking TOP5 */}
          <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm dark:shadow-none overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
              <h2 className="text-sm font-bold text-gray-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                アクセスランキング TOP5
              </h2>
            </div>
            <div className="p-4 space-y-1">
              {rankingTop5.map((card, i) => {
                const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(card.brandName)}&background=random&color=fff&size=40&bold=true&format=svg`;
                return (
                  <Link
                    key={card.id}
                    href={`/companies/${card.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all group"
                  >
                    {/* Rank medal or number */}
                    <span className="flex-shrink-0 w-8 text-center">
                      {i < 3 ? (
                        <span className="text-xl">{RANK_MEDALS[i]}</span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 text-xs font-bold border border-gray-200 dark:border-zinc-700">
                          {i + 1}
                        </span>
                      )}
                    </span>
                    {/* Avatar */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatarUrl}
                      alt={card.brandName}
                      width={36}
                      height={36}
                      className="flex-shrink-0 w-9 h-9 rounded-lg shadow-sm dark:shadow-none"
                    />
                    <span className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate block">
                        {card.brandName}
                      </span>
                      {card.keywords[0] && (
                        <span className="text-xs text-gray-500 dark:text-zinc-500 truncate block">{card.keywords[0]}</span>
                      )}
                    </span>
                    {card.countryFlags[0] && (
                      <span className="text-base flex-shrink-0">{card.countryFlags[0]}</span>
                    )}
                  </Link>
                );
              })}
              {rankingTop5.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-zinc-500 py-6 text-center">データなし</p>
              )}
            </div>
          </div>

          {/* Latest Companies */}
          <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm dark:shadow-none overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
              <h2 className="text-sm font-bold text-gray-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                最新登録企業
              </h2>
            </div>
            <div className="p-4 space-y-1">
              {latestCompanies.map((card) => {
                const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(card.brandName)}&background=random&color=fff&size=40&bold=true&format=svg`;
                const dateStr = card.registeredAt
                  ? new Date(card.registeredAt).toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" })
                  : "";
                return (
                  <Link
                    key={card.id}
                    href={`/companies/${card.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all group"
                  >
                    {/* Avatar */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatarUrl}
                      alt={card.brandName}
                      width={36}
                      height={36}
                      className="flex-shrink-0 w-9 h-9 rounded-lg shadow-sm dark:shadow-none"
                    />
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {card.brandName}
                        </span>
                        <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wide">
                          NEW
                        </span>
                      </span>
                      {card.keywords[0] && (
                        <span className="text-xs text-gray-500 dark:text-zinc-500 truncate block">{card.keywords[0]}</span>
                      )}
                    </span>
                    {dateStr && (
                      <span className="text-xs text-gray-400 dark:text-zinc-500 flex-shrink-0 tabular-nums">{dateStr}</span>
                    )}
                  </Link>
                );
              })}
              {latestCompanies.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-zinc-500 py-6 text-center">データなし</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Country/Region Tabs */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
            国・地域
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCountry("all")}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
              country === "all"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 hover:text-gray-900 dark:hover:text-zinc-100"
            }`}
          >
            すべて
          </button>
          {allCountryTabs.map(({ code, label }) => {
            const count = countryCounts[code] ?? 0;
            const hasData = count > 0;
            return (
              <button
                key={code}
                onClick={() => hasData && setCountry(country === code ? "all" : code)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                  country === code
                    ? "bg-blue-600 text-white shadow-sm"
                    : hasData
                    ? "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 hover:text-gray-900 dark:hover:text-zinc-100"
                    : "bg-gray-50 dark:bg-zinc-900 text-gray-400 dark:text-zinc-600 cursor-default"
                }`}
              >
                <span>{countryFlags[code] ?? code}</span>
                <span>{label}</span>
                <span className={`text-xs ${country === code ? "text-blue-100" : hasData ? "text-gray-500 dark:text-zinc-500" : "text-gray-400 dark:text-zinc-600"}`}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort + results count bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <span className="text-sm text-gray-700 dark:text-zinc-300">
          {filtered.length === cards.length
            ? `${cards.length} 社`
            : `${filtered.length} 社 / ${cards.length} 社`}
        </span>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600 dark:text-zinc-400">並び替え:</span>
          <button
            onClick={() => setSort("alphabetical")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              sort === "alphabetical"
                ? "bg-gray-200 dark:bg-zinc-700 text-gray-900 dark:text-zinc-100"
                : "text-gray-600 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200"
            }`}
          >
            50音順
          </button>
          <button
            onClick={() => setSort("newest")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              sort === "newest"
                ? "bg-gray-200 dark:bg-zinc-700 text-gray-900 dark:text-zinc-100"
                : "text-gray-600 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200"
            }`}
          >
            新着順
          </button>
        </div>
      </div>

      {/* Company Cards Grid */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-zinc-800 mb-4">
            <svg
              className="w-8 h-8 text-gray-400 dark:text-zinc-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </div>
          <p className="text-gray-700 dark:text-zinc-300 text-base">該当する企業が見つかりません</p>
          <p className="mt-1 text-xs text-gray-600 dark:text-zinc-500">
            検索条件を変更してお試しください
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((card) => {
            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(card.brandName)}&background=random&color=fff&size=96&bold=true&format=svg`;
            const pvDateStr = card.registeredAt
              ? new Date(card.registeredAt).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })
              : "";
            return (
              <Link
                key={card.id}
                href={`/companies/${card.id}`}
                className="group block rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 transition-all duration-200 hover:border-gray-300 dark:hover:border-zinc-700 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-none hover:-translate-y-0.5"
              >
                {/* Top row: logo + name + flag */}
                <div className="flex items-start gap-4 mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatarUrl}
                    alt={card.brandName}
                    width={48}
                    height={48}
                    className="flex-shrink-0 w-12 h-12 rounded-xl shadow-sm dark:shadow-none"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-gray-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                        {card.brandName}
                      </h3>
                      {card.countryFlags[0] && (
                        <span className="text-sm flex-shrink-0" title={card.targetCountries[0]}>
                          {card.countryFlags[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Countries */}
                {card.targetCountries.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-3 text-xs text-gray-500 dark:text-zinc-500">
                    <svg
                      className="w-3.5 h-3.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 003 12c0-1.605.42-3.113 1.157-4.418"
                      />
                    </svg>
                    <span className="truncate">
                      {card.countryFlags.join(" ")}
                    </span>
                  </div>
                )}

                {/* Article count + PV registration date */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-[11px] text-gray-500 dark:text-zinc-500">
                  <span>掲載記事: {card.articleCount.toLocaleString()} 件</span>
                  {pvDateStr && <span>PV登録: {pvDateStr}</span>}
                </div>

                {/* Keywords (real data) */}
                {card.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {card.keywords.slice(0, 3).map((keyword, i) => (
                      <span
                        key={i}
                        className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
