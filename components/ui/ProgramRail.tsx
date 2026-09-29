import { cn } from "@/lib/utils";

/**
 * ProgramRail — фирменный элемент «Прогресса».
 *
 * Центр продаёт не «курс», а последовательность модулей, поэтому
 * каждый сегмент рельса соответствует реальному модулю из
 * `course.program`. Один сегмент = один шаг программы: элемент
 * показывает структуру курса, а не служит украшением.
 *
 * Прогресс передаётся числом `value` (0…total). При `value`
 * без `total` рельс рисуется полностью пройденным.
 */
export interface ProgramRailProps {
  /** Всего сегментов — длина программы */
  total: number;
  /** Сколько сегментов пройдено; по умолчанию рельс полный */
  value?: number;
  /** Подпись слева, например «Программа» */
  label?: string;
  /** Подпись справа, например «4 модуля» */
  meta?: string;
  /** Анимировать появление (уважает prefers-reduced-motion) */
  animate?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function ProgramRail({
  total,
  value,
  label,
  meta,
  animate = false,
  size = "md",
  className,
}: ProgramRailProps) {
  const segments = Math.max(0, Math.min(total, 24));
  const filled = value === undefined ? segments : Math.max(0, Math.min(value, segments));

  if (segments === 0) return null;

  const trackHeight = size === "sm" ? 3 : 4;

  return (
    <div className={cn("w-full", className)}>
      {(label || meta) && (
        <div className="mb-2 flex items-baseline justify-between gap-3">
          {label ? (
            <span className="text-caption font-medium text-[var(--color-text-muted)]">
              {label}
            </span>
          ) : (
            <span />
          )}
          {meta ? (
            <span className="text-caption text-[var(--color-text-muted)]">{meta}</span>
          ) : null}
        </div>
      )}

      <div
        className="flex w-full items-center gap-1"
        role="img"
        aria-label={
          value === undefined
            ? `Программа из ${segments} ${plural(segments, "модуля", "модулей", "модулей")}`
            : `Пройдено ${filled} из ${segments} ${plural(segments, "модуля", "модулей", "модулей")}`
        }
      >
        {Array.from({ length: segments }).map((_, index) => {
          const isFilled = index < filled;
          return (
            <span
              key={index}
              aria-hidden="true"
              style={{
                height: trackHeight,
                transformOrigin: "left center",
                transitionDelay: animate ? `${index * 70}ms` : undefined,
              }}
              className={cn(
                "flex-1 rounded-full",
                isFilled
                  ? "bg-[var(--color-progress)]"
                  : "bg-[var(--color-border-strong)]",
                animate && "rail-segment-in",
              )}
            />
          );
        })}
      </div>
    </div>
  );
}

/** Русская плюрализация: 1 модуль, 2–4 модуля, 5+ модулей */
function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export { plural as pluralizeRu };
