"use client";

import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

// ==========================================================
// Типы
// ==========================================================

export interface RatingProps {
  /** Оценка от 0 до 5 */
  value: number;
  /** Максимум звёзд */
  max?: number;
  /** Размер звёзд */
  size?: "sm" | "md" | "lg";
  /** Показывать число рядом */
  showValue?: boolean;
  className?: string;
}

// ==========================================================
// Стили
// ==========================================================

const sizeMap = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
} as const;

// ==========================================================
// Компонент
// ==========================================================

export function Rating({
  value,
  max = 5,
  size = "md",
  showValue = false,
  className,
}: RatingProps) {
  const safeValue = Math.max(0, Math.min(max, value));
  const roundedValue = Math.round(safeValue);

  const stars = Array.from({ length: max }, (_, i) => i);

  return (
    <div
      className={cn("inline-flex items-center gap-1", className)}
      role="img"
      aria-label={`Оценка ${safeValue} из ${max}`}
    >
      <span className="inline-flex items-center gap-0.5" aria-hidden="true">
        {stars.map((index) => {
          const filled = index < roundedValue;
          return (
            <Star
              key={index}
              className={cn(
                sizeMap[size],
                filled
                  ? "fill-[var(--color-primary)] text-[var(--color-primary)]"
                  : "fill-transparent text-[var(--color-border)]",
              )}
            />
          );
        })}
      </span>

      {showValue ? (
        <span
          className="ml-1 text-small font-medium text-[var(--color-text-muted)]"
          aria-hidden="true"
        >
          {safeValue.toFixed(1)}
        </span>
      ) : null}
    </div>
  );
}