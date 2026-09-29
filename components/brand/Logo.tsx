import { cn } from "@/lib/utils";

// ==========================================================
// Логотип образовательного центра «Прогресс»
// ==========================================================

/** Градиент знака совпадает с favicon и макетными токенами. */
const MARK_GRADIENT_ID = "progres-logo-gradient";

export interface LogoMarkProps {
  /** Сторона квадрата со знаком, px */
  size?: number;
  className?: string;
}

/**
 * Знак: открытая книга (образование) и восходящий шеврон (прогресс).
 * Декоративный — название всегда идёт рядом текстом.
 *
 * Размер задан классами `size-*`, а не атрибутами: так flex-контейнер
 * сжимает только текстовую часть, а сам знак остаётся читаемым.
 */
export function LogoMark({ size = 36, className }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={cn("shrink-0", className)}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient
          id={MARK_GRADIENT_ID}
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>

      <rect width="40" height="40" rx="10" fill={`url(#${MARK_GRADIENT_ID})`} />

      {/* Восходящий шеврон — прогресс */}
      <path
        d="M13 15.5 20 8.5l7 7"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Открытая книга — образование */}
      <path
        d="M20 21.4c-3-1.7-6.3-1.9-9.5-.9v11.4c3.2-1 6.5-.8 9.5.9V21.4Z"
        fill="#ffffff"
      />
      <path
        d="M20 21.4c3-1.7 6.3-1.9 9.5-.9v11.4c-3.2-1-6.5-.8-9.5.9V21.4Z"
        fill="#ffffff"
        fillOpacity="0.72"
      />
    </svg>
  );
}

export interface LogoProps {
  /** Полное название центра */
  name: string;
  /** Короткое имя для выделения в лок-апе */
  shortName?: string;
  /**
   * `compact` — знак + короткое имя (шапка, где рядом меню и телефон).
   * `full`   — знак + надзаголовок «Образовательный центр» + имя (футер).
   */
  variant?: "compact" | "full";
  className?: string;
  markClassName?: string;
}

/**
 * Логотип: знак + текстовый лок-ап.
 *
 * Название никогда не сжимается и не обрезается: текстовый блок помечен
 * `shrink-0` + `whitespace-nowrap`, поэтому вместо многоточия в «Прогр...»
 * сжимается что-то другое (см. Header: там ради этого меню уходит в
 * бургер раньше, на `xl`, а не на `lg`).
 *
 * Надзаголовок «Образовательный центр» в ~1.9 раза шире слова «Прогресс»,
 * поэтому в шапке используется вариант `compact`, а полный лок-ап с
 * надзаголовком — в футере, где места хватает.
 */
export function Logo({
  name,
  shortName,
  variant = "compact",
  className,
  markClassName,
}: LogoProps) {
  const brand = shortName ?? name;
  const full = variant === "full";

  return (
    <span
      className={cn(
        "flex w-max max-w-none shrink-0 items-center gap-2.5",
        className,
      )}
    >
      <LogoMark className={markClassName} />

      <span className="flex w-max max-w-none shrink-0 flex-col leading-none whitespace-nowrap">
        {full ? (
          <span className="text-caption font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
            Образовательный центр
          </span>
        ) : null}
        <span
          className={cn(
            "w-max max-w-none whitespace-nowrap font-heading font-extrabold text-[var(--color-text)]",
            full ? "mt-1 text-body" : "text-small sm:text-body",
          )}
          title={full ? name : brand}
        >
          {brand}
        </span>
      </span>
    </span>
  );
}
