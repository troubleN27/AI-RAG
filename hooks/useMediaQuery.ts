"use client";

import { useEffect, useState } from "react";

import { isBrowser } from "@/lib/utils";

// ==========================================================
// Хук
// ==========================================================

/**
 * Подписка на media query.
 * Возвращает false на сервере, чтобы избежать гидрационных различий.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (!isBrowser) return false;
    if (typeof window.matchMedia !== "function") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (!isBrowser) return;
    if (typeof window.matchMedia !== "function") return;

    const mql = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Синхронизация при изменении query
    setMatches(mql.matches);

    // Safari < 14 использует addListener
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    }

    const legacy = mql as MediaQueryList & {
      addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
      removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
    };

    legacy.addListener?.(handler);
    return () => legacy.removeListener?.(handler);
  }, [query]);

  return matches;
}