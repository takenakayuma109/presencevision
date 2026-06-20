"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useThemeStore } from "@/lib/store/theme";

const LANGUAGES = [
  { code: "ja", flag: "\u{1F1EF}\u{1F1F5}", name: "\u65E5\u672C\u8A9E" },
  { code: "en", flag: "\u{1F1FA}\u{1F1F8}", name: "English" },
  { code: "zh", flag: "\u{1F1E8}\u{1F1F3}", name: "\u4E2D\u6587" },
  { code: "ko", flag: "\u{1F1F0}\u{1F1F7}", name: "\uD55C\uAD6D\uC5B4" },
  { code: "fr", flag: "\u{1F1EB}\u{1F1F7}", name: "Fran\u00E7ais" },
  { code: "de", flag: "\u{1F1E9}\u{1F1EA}", name: "Deutsch" },
  { code: "es", flag: "\u{1F1EA}\u{1F1F8}", name: "Espa\u00F1ol" },
  { code: "pt", flag: "\u{1F1E7}\u{1F1F7}", name: "Portugu\u00EAs" },
  { code: "ru", flag: "\u{1F1F7}\u{1F1FA}", name: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439" },
  { code: "hi", flag: "\u{1F1EE}\u{1F1F3}", name: "\u0939\u093F\u0928\u094D\u0926\u0940" },
  { code: "ar", flag: "\u{1F1F8}\u{1F1E6}", name: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629" },
];

const NAV_LINKS = [
  { href: "/companies", label: "\u4F01\u696D\u4E00\u89A7" },
  { href: "/blog", label: "\u8A18\u4E8B" },
];

// Style maps for light vs dark variants
const STYLES = {
  dark: {
    header: "border-zinc-800 bg-zinc-950/80",
    logo: "text-white",
    svgIcon: "text-blue-400",
    navActive: "bg-zinc-800 text-white",
    navInactive: "text-zinc-400 hover:text-white hover:bg-zinc-800/50",
    langButton: "text-zinc-400 hover:text-white hover:bg-zinc-800/50",
    langDropdown: "bg-zinc-900 border-zinc-700",
    langItemActive: "bg-zinc-800 text-white",
    langItemInactive: "text-zinc-300 hover:bg-zinc-800/60 hover:text-white",
    themeButton: "text-zinc-400 hover:text-white hover:bg-zinc-800/50",
    loginButton: "bg-blue-600 text-white hover:bg-blue-500",
    hamburger: "text-zinc-400 hover:text-white hover:bg-zinc-800/50",
    mobileMenu: "border-zinc-800 bg-zinc-950/95",
    mobileDivider: "border-zinc-800",
    mobileLangLabel: "text-zinc-500",
    mobileLangActive: "bg-zinc-800 text-white",
    mobileLangInactive: "text-zinc-400 hover:text-white hover:bg-zinc-800/50",
    mobileThemeButton: "text-zinc-400 hover:text-white hover:bg-zinc-800/50",
  },
  light: {
    header: "border-gray-200 bg-white/90 shadow-sm",
    logo: "text-gray-900",
    svgIcon: "text-blue-600",
    navActive: "bg-blue-50 text-blue-700",
    navInactive: "text-gray-600 hover:text-blue-600 hover:bg-gray-100",
    langButton: "text-gray-600 hover:text-blue-600 hover:bg-gray-100",
    langDropdown: "bg-white border-gray-200 shadow-lg",
    langItemActive: "bg-blue-50 text-blue-700",
    langItemInactive: "text-gray-700 hover:bg-gray-100 hover:text-blue-600",
    themeButton: "text-gray-500 hover:text-blue-600 hover:bg-gray-100",
    loginButton: "bg-blue-600 text-white hover:bg-blue-500",
    hamburger: "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
    mobileMenu: "border-gray-200 bg-white/95",
    mobileDivider: "border-gray-200",
    mobileLangLabel: "text-gray-400",
    mobileLangActive: "bg-blue-50 text-blue-700",
    mobileLangInactive: "text-gray-600 hover:text-blue-600 hover:bg-gray-100",
    mobileThemeButton: "text-gray-500 hover:text-blue-600 hover:bg-gray-100",
  },
} as const;

interface KBHeaderProps {
  variant?: "light" | "dark";
}

export function KBHeader({ variant }: KBHeaderProps = {}) {
  const pathname = usePathname();
  const { dark, toggleTheme } = useThemeStore();
  const [langOpen, setLangOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(LANGUAGES[0]);
  const langRef = useRef<HTMLDivElement>(null);
  // Auto-detect from theme store if no variant explicitly provided
  const resolvedVariant = variant ?? (dark ? "dark" : "light");
  const s = STYLES[resolvedVariant];

  // Load saved language from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("kb-language");
    if (saved) {
      const found = LANGUAGES.find((l) => l.code === saved);
      if (found) setCurrentLang(found);
    }
  }, []);

  // Close language dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectLang(lang: { code: string; flag: string; name: string }) {
    setCurrentLang(lang);
    localStorage.setItem("kb-language", lang.code);
    setLangOpen(false);
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <header className={`sticky top-0 z-50 border-b backdrop-blur-md ${s.header}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-[60px] flex items-center justify-between">
        {/* Left: Logo */}
        <Link
          href="/"
          className={`flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity shrink-0 ${s.logo}`}
        >
          <svg
            className={`w-6 h-6 ${s.svgIcon}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          <span className="hidden sm:inline">PresenceVision</span>
        </Link>

        {/* Center: Navigation (desktop) */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(link.href) ? s.navActive : s.navInactive
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right: Language, Theme, Login (desktop) */}
        <div className="hidden md:flex items-center gap-2">
          {/* Language selector */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${s.langButton}`}
            >
              <span>{currentLang.flag}</span>
              <span>{currentLang.name}</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform ${langOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {langOpen && (
              <div className={`absolute right-0 mt-1 w-48 rounded-lg border shadow-xl py-1 max-h-80 overflow-y-auto ${s.langDropdown}`}>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => selectLang(lang)}
                    className={`w-full text-left flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                      currentLang.code === lang.code
                        ? s.langItemActive
                        : s.langItemInactive
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${s.themeButton}`}
            aria-label="Toggle theme"
          >
            {dark ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>

          {/* Login button */}
          <Link
            href="/sign-in"
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${s.loginButton}`}
          >
            ログイン
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`md:hidden p-2 rounded-lg transition-colors ${s.hamburger}`}
          aria-label="Menu"
        >
          {mobileOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className={`md:hidden border-t backdrop-blur-md ${s.mobileMenu}`}>
          <div className="px-4 py-4 space-y-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href) ? s.navActive : s.navInactive
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className={`border-t pt-3 mt-3 ${s.mobileDivider}`}>
              {/* Mobile language selector */}
              <div className="px-4 py-2">
                <p className={`text-xs uppercase tracking-wider mb-2 ${s.mobileLangLabel}`}>言語</p>
                <div className="grid grid-cols-2 gap-1">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => selectLang(lang)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        currentLang.code === lang.code
                          ? s.mobileLangActive
                          : s.mobileLangInactive
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={`border-t pt-3 mt-3 flex items-center justify-between px-4 ${s.mobileDivider}`}>
              <button
                onClick={toggleTheme}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${s.mobileThemeButton}`}
              >
                {dark ? (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    ライトモード
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    ダークモード
                  </>
                )}
              </button>
              <Link
                href="/sign-in"
                onClick={() => setMobileOpen(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${s.loginButton}`}
              >
                ログイン
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
