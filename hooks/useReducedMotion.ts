"use client";

import { useMediaQuery } from "@/hooks/useMediaQuery";

// ==========================================================
// Хук
// ==========================================================

/**
 * Возвращает true, если пользователь предпочитает уменьшенное движение.
 * Использует matchMedia с реактивной подпиской на изменение.
 */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}