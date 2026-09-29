"use client";

import { useEffect, useState } from "react";

import { isBrowser } from "@/lib/utils";

// ==========================================================
// Типы
// ==========================================================

export interface UseScrollSpyOptions {
  /** Отступы для rootMargin (по умолчанию: "-40% 0px -55% 0px") */
  rootMargin?: string;
  /** Порог срабатывания */
  threshold?: number | number[];
  /** Обновлять URL hash при смене активной секции */
  updateHash?: boolean;
}

// ==========================================================
// Хук
// ==========================================================

export function useScrollSpy(
  ids: string[],
  options: UseScrollSpyOptions = {},
): string | null {
  const { rootMargin = "-40% 0px -55% 0px", threshold = 0, updateHash = false } = options;

  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!isBrowser) return;

    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Выбираем самую "верхнюю" видимую секцию
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top - b.boundingClientRect.top,
          );

        const first = visible[0];
        if (first) {
          const id = first.target.id;
          setActiveId(id);

          if (updateHash && isBrowser) {
            try {
              const url = new URL(window.location.href);
              if (url.hash !== `#${id}`) {
                url.hash = id;
                window.history.replaceState(null, "", url.toString());
              }
            } catch {
              /* noop */
            }
          }
        }
      },
      { rootMargin, threshold },
    );

    for (const el of elements) observer.observe(el);

    // Инициализация: если ничего не видно, ставим первый
    setActiveId((prev) => prev ?? elements[0]?.id ?? null);

    return () => observer.disconnect();
  }, [ids, rootMargin, threshold, updateHash]);

  return activeId;
}