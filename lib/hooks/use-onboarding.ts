"use client";

import { useState, useEffect, useCallback } from "react";

interface UseOnboardingResult {
  /** Whether the user still needs to complete onboarding */
  needsOnboarding: boolean;
  /** Mark onboarding as completed and persist to localStorage */
  completeOnboarding: () => void;
  /** Whether the check has finished (avoids flash of redirect) */
  isLoaded: boolean;
}

const STORAGE_KEY = "onboarding_completed";

/**
 * Hook that checks whether the current user has completed onboarding.
 *
 * Uses localStorage to persist the onboarding state. Can be used in the
 * dashboard layout or page to redirect new users to /onboarding.
 *
 * @example
 * ```tsx
 * const { needsOnboarding, isLoaded } = useOnboarding();
 *
 * useEffect(() => {
 *   if (isLoaded && needsOnboarding) {
 *     router.push("/onboarding");
 *   }
 * }, [isLoaded, needsOnboarding, router]);
 * ```
 */
export function useOnboarding(): UseOnboardingResult {
  const [needsOnboarding, setNeedsOnboarding] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const completed = localStorage.getItem(STORAGE_KEY) === "true";
    const newNeedsOnboarding = !completed;
    setNeedsOnboarding((prev) =>
      prev !== newNeedsOnboarding ? newNeedsOnboarding : prev,
    );
    setIsLoaded((prev) => (prev !== true ? true : prev));
  }, []);

  const completeOnboarding = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "true");
    }
    setNeedsOnboarding(false);
  }, []);

  return { needsOnboarding, completeOnboarding, isLoaded };
}
