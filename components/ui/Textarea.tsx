"use client";

import { forwardRef, useId, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

// ==========================================================
// Типы
// ==========================================================

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  labelSrOnly?: boolean;
  containerClassName?: string;
  /** Показывать счётчик символов (требует maxLength) */
  showCounter?: boolean;
}

// ==========================================================
// Компонент
// ==========================================================

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    error,
    hint,
    labelSrOnly = false,
    containerClassName,
    showCounter = false,
    maxLength,
    id,
    className,
    disabled,
    value,
    "aria-describedby": ariaDescribedBy,
    ...rest
  },
  ref,
) {
  const reactId = useId();
  const textareaId = id ?? `textarea-${reactId}`;
  const errorId = error ? `${textareaId}-error` : undefined;
  const hintId = hint ? `${textareaId}-hint` : undefined;
  const counterId = showCounter && maxLength ? `${textareaId}-counter` : undefined;

  const describedBy =
    [ariaDescribedBy, errorId, hintId, counterId].filter(Boolean).join(" ") || undefined;

  const hasError = Boolean(error);
  const currentLength = typeof value === "string" ? value.length : 0;

  return (
    <div className={cn("flex flex-col gap-1.5", containerClassName)}>
      {label ? (
        <label
          htmlFor={textareaId}
          className={cn(
            "text-small font-medium text-[var(--color-text)]",
            labelSrOnly && "sr-only",
          )}
        >
          {label}
        </label>
      ) : null}

      <textarea
        ref={ref}
        id={textareaId}
        disabled={disabled}
        maxLength={maxLength}
        value={value}
        aria-invalid={hasError || undefined}
        aria-describedby={describedBy}
        className={cn(
          "min-h-[112px] w-full resize-y rounded-[var(--radius-md)] border",
          "bg-[var(--color-surface)] px-3.5 py-3",
          "text-body text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/70",
          "transition-[border-color,background-color] duration-200 ease-out",
          "focus:outline-none focus:border-[var(--color-primary)] focus:bg-[var(--color-surface-2)]",
          "disabled:cursor-not-allowed disabled:opacity-60",
          hasError
            ? "border-[var(--color-error)]"
            : "border-[var(--color-border-strong)] hover:border-[var(--color-text-muted)]/50",
          className,
        )}
        {...rest}
      />

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {error ? (
            <p id={errorId} className="text-small text-[var(--color-error)]" role="alert">
              {error}
            </p>
          ) : hint ? (
            <p id={hintId} className="text-small text-[var(--color-text-muted)]">
              {hint}
            </p>
          ) : null}
        </div>

        {showCounter && maxLength ? (
          <p
            id={counterId}
            className="shrink-0 text-small text-[var(--color-text-muted)]"
            aria-live="polite"
          >
            {currentLength} / {maxLength}
          </p>
        ) : null}
      </div>
    </div>
  );
});

Textarea.displayName = "Textarea";