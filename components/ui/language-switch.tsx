"use client";

import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";
import {
  useLocaleStore,
  SUPPORTED_LOCALES,
  LOCALE_NAMES,
  LOCALE_FLAGS,
  type Locale,
} from "@/lib/store/locale";
import { cn } from "@/lib/utils";

export function LanguageSwitch({ position = "bottom" }: { position?: "top" | "bottom" }) {
  const { locale, setLocale } = useLocaleStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const handleSelect = (l: Locale) => {
    setLocale(l);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        title="Language"
      >
        <Globe className="h-3.5 w-3.5" />
        <span>{LOCALE_FLAGS[locale]}</span>
        <span className="hidden sm:inline">{LOCALE_NAMES[locale]}</span>
      </button>

      {open && (
        <div className={cn(
          "absolute left-0 z-50 w-48 rounded-lg border bg-popover shadow-lg py-1 max-h-80 overflow-y-auto",
          position === "top" ? "bottom-full mb-1" : "top-full mt-1",
        )}>
          {SUPPORTED_LOCALES.map((l) => (
            <button
              key={l}
              onClick={() => handleSelect(l)}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-accent",
                locale === l && "bg-accent font-medium",
              )}
            >
              <span className="text-base">{LOCALE_FLAGS[l]}</span>
              <span>{LOCALE_NAMES[l]}</span>
              {l === "ar" && (
                <span className="ml-auto text-[10px] text-muted-foreground">RTL</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
