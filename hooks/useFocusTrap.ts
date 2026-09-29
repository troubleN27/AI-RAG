"use client";

import { useEffect, type RefObject } from "react";

import { isBrowser } from "@/lib/utils";

// ==========================================================
// Утилиты
// ==========================================================

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "object",
  "embed",
  "audio[controls]",
  "video[controls]",
  "[contenteditable]:not([contenteditable='false'])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getFocusable(container: HTMLElement): HTMLElement[] {
  const nodes = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  );

  return nodes.filter((el) => {
    if (el.hasAttribute("disabled")) return false;
    if (el.getAttribute("aria-hidden") === "true") return false;
    if (el.offsetParent === null && el.tagName !== "HTML") return false;
    return true;
  });
}

// ==========================================================
// Хук
// ==========================================================

/**
 * Удерживает фокус внутри `containerRef`, когда `active === true`.
 * По умолчанию переводит фокус на первый фокусируемый элемент
 * либо на сам контейнер. При деактивации возвращает фокус
 * на ранее активный элемент.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
): void {
  useEffect(() => {
    if (!active || !isBrowser) return;

    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // Первичный фокус
    const focusables = getFocusable(container);
    const initial = focusables[0] ?? container;

    // Небольшая задержка, чтобы модальное окно успело отрендериться
    const focusTimer = window.setTimeout(() => {
      try {
        initial.focus({ preventScroll: true });
      } catch {
        /* noop */
      }
    }, 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      const items = getFocusable(container);
      if (items.length === 0) {
        event.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }

      const first = items[0]!;
      const last = items[items.length - 1]!;
      const current = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (current === first || !container.contains(current)) {
          event.preventDefault();
          last.focus({ preventScroll: true });
        }
      } else {
        if (current === last || !container.contains(current)) {
          event.preventDefault();
          first.focus({ preventScroll: true });
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);

      if (previouslyFocused && document.contains(previouslyFocused)) {
        try {
          previouslyFocused.focus({ preventScroll: true });
        } catch {
          /* noop */
        }
      }
    };
  }, [containerRef, active]);
}