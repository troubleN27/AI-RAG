"use client";

import { ChevronDown } from "lucide-react";
import { forwardRef, useId, type SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

// ==========================================================
// Типы
// ==========================================================

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  labelSrOnly?: boolean;
  containerClassName?: string;
}

// ==========================================================
// Компонент
// ==========================================================

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    error,
    hint,
    options,
    placeholder,
    labelSrOnly = false,
    containerClassName,
    id,
    className,
    disabled,
    "aria-describedby": ariaDescribedBy,
    ...rest
  },
  ref,
) {
  const reactId = useId();
  const selectId = id ?? `select-${reactId}`;
  const errorId = error ? `${selectId}-error` : undefined;
  const hintId = hint ? `${selectId}-hint` : undefined;

  const describedBy =
    [ariaDescribedBy, errorId, hintId].filter(Boolean).join(" ") || undefined;

  const hasError = Boolean(error);

  return (
    <div className={cn("flex flex-col gap-1.5", containerClassName)}>
      {label ? (
        <label
          htmlFor={selectId}
          className={cn(
            "text-small font-medium text-[var(--color-text)]",
            labelSrOnly && "sr-only",
          )}
        >
          {label}
        </label>
      ) : null}

      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-12 w-full appearance-none rounded-[var(--radius-md)] border bg-[var(--color-surface)]",
            "px-3.5 pr-11 text-body text-[var(--color-text)]",
            "transition-colors duration-200 ease-out",
            "focus:outline-none focus:border-[var(--color-primary)] focus:bg-[var(--color-surface-2)]",
            "disabled:cursor-not-allowed disabled:opacity-60",
            hasError
              ? "border-[var(--color-error)]"
              : "border-[var(--color-border-strong)] hover:border-[var(--color-text-muted)]/50",
            className,
          )}
          {...rest}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}

          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>

        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]"
          aria-hidden="true"
        />
      </div>

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
  );
});

Select.displayName = "Select";