"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

// ==========================================================
// Типы
// ==========================================================

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

// ==========================================================
// Стили
// ==========================================================

/* HIG buttons: подпись verb-first в sentence case (русская норма
   не ставит заглавную после глагола), высота sm тоже 44px, потому
   что 44pt — минимум для пальца, а не только для мобильных. */
const baseStyles =
  "relative inline-flex items-center justify-center gap-2 font-semibold rounded-md " +
  "transition-[background-color,color,box-shadow,transform] duration-200 ease-out " +
  "disabled:opacity-50 disabled:pointer-events-none " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-[var(--color-primary)] " +
  "select-none whitespace-nowrap";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-primary-solid)] text-white shadow-sm " +
    "hover:bg-[var(--color-primary-solid-hover)] hover:shadow-md " +
    "active:bg-[var(--color-primary-solid)] active:translate-y-px",
  secondary:
    "bg-[var(--color-surface)] text-[var(--color-text)] " +
    "border border-[var(--color-border-strong)] " +
    "hover:bg-[var(--color-surface-2)] hover:border-[var(--color-text-muted)]/60 " +
    "active:bg-[var(--color-bg-alt)] active:translate-y-px",
  ghost:
    "bg-transparent text-[var(--color-text)] " +
    "hover:bg-[var(--color-surface)] " +
    "active:bg-[var(--color-surface-2)] active:translate-y-px",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-11 px-4 text-small",
  md: "h-11 px-5 text-body",
  lg: "h-target-lg px-6 text-body md:px-8",
};

// ==========================================================
// Спиннер
// ==========================================================

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-4 w-4 animate-spin", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647Z"
      />
    </svg>
  );
}

// ==========================================================
// Компонент
// ==========================================================

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    disabled,
    className,
    children,
    type = "button",
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {loading ? (
        <>
          <Spinner />
          <span className="sr-only">Загрузка…</span>
          <span aria-hidden="true">{children}</span>
        </>
      ) : (
        <>
          {leftIcon ? (
            <span className="shrink-0" aria-hidden="true">
              {leftIcon}
            </span>
          ) : null}
          <span>{children}</span>
          {rightIcon ? (
            <span className="shrink-0" aria-hidden="true">
              {rightIcon}
            </span>
          ) : null}
        </>
      )}
    </button>
  );
});

Button.displayName = "Button";