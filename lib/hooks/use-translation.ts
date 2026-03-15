"use client";

import { useCallback, useMemo } from "react";
import { useLocaleStore, type Locale } from "@/lib/store/locale";

import ja from "@/lib/i18n/messages/ja.json";
import en from "@/lib/i18n/messages/en.json";
import zh from "@/lib/i18n/messages/zh.json";
import ko from "@/lib/i18n/messages/ko.json";
import fr from "@/lib/i18n/messages/fr.json";
import de from "@/lib/i18n/messages/de.json";
import es from "@/lib/i18n/messages/es.json";
import pt from "@/lib/i18n/messages/pt.json";
import ar from "@/lib/i18n/messages/ar.json";
import ru from "@/lib/i18n/messages/ru.json";
import hi from "@/lib/i18n/messages/hi.json";

const messages: Record<Locale, typeof ja> = {
  ja, en, zh, ko, fr, de, es, pt, ar, ru, hi,
};

type Messages = typeof ja;

// Helper to get nested value by dot-separated key
function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== "object") {
      return path; // fallback to key
    }
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : path;
}

export function useTranslation() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  const currentMessages = useMemo(() => messages[locale] ?? messages.ja, [locale]);

  const t = useCallback(
    (key: string): string => {
      return getNestedValue(currentMessages as unknown as Record<string, unknown>, key);
    },
    [currentMessages],
  );

  return { t, locale, setLocale, messages: currentMessages };
}

/**
 * Hook that returns locale-aware labels for goals, methods, audiences, etc.
 * Components can use this instead of the hardcoded labels from store.ts
 */
export function useLabels() {
  const { messages: m } = useTranslation();

  return useMemo(() => ({
    goalLabels: m.labels.goals as Record<string, string>,
    methodLabels: m.labels.methods as Record<string, string>,
    audienceLabels: m.labels.audiences as Record<string, string>,
    durationLabels: m.labels.durations as Record<string, string>,
    statusLabels: m.labels.status as Record<string, string>,
    taskStatusLabels: m.labels.taskStatus as Record<string, string>,
    artifactTypeLabels: m.labels.artifactTypes as Record<string, string>,
  }), [m]);
}
