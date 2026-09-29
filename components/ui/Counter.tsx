"use client";

import { useEffect, useRef, useState } from "react";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

// ==========================================================
// Типы
// ==========================================================

export interface CounterProps {
  /** Целевое значение */
  value: number;
  /** Длительность анимации, мс */
  duration?: number;
  /** Суффикс, например "+" или "%" */
  suffix?: string;
  /** Префикс, например "₽" */
  prefix?: string;
  /** Разделять разряды пробелом */
  useGrouping?: boolean;
  /** Порог появления во viewport */
  threshold?: number;
  className?: string;
}

// ==========================================================
// Easing: easeOutCubic
// ==========================================================

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// ==========================================================
// Компонент
// ==========================================================

export function Counter({
  value,
  duration = 1600,
  suffix = "",
  prefix = "",
  useGrouping = true,
  threshold = 0.4,
  className,
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const startedRef = useRef(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (reduceMotion) {
      setDisplay(value);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry || !entry.isIntersecting) return;
        if (startedRef.current) return;
        startedRef.current = true;

        const start = performance.now();

        const tick = (now: number) => {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = easeOutCubic(progress);
          setDisplay(value * eased);

          if (progress < 1) {
            requestAnimationFrame(tick);
          } else {
            setDisplay(value);
          }
        };

        requestAnimationFrame(tick);
      },
      { threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [value, duration, threshold, reduceMotion]);

  const rounded = Math.round(display);
  const formatted = useGrouping
    ? rounded.toLocaleString("ru-RU")
    : String(rounded);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {/* Анимируемое значение скрыто от скринридера, чтобы не объявлять
          промежуточные числа; доступное значение отдаётся отдельным узлом. */}
      <span aria-hidden="true">
        {prefix}
        {formatted}
        {suffix}
      </span>
      <span className="sr-only">{`${prefix}${value.toLocaleString("ru-RU")}${suffix}`}</span>
    </span>
  );
}