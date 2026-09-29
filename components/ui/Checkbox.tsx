"use client";

import { Check } from "lucide-react";
import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

// ==========================================================
// Типы
// ==========================================================

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

// ==========================================================
// Компонент
// ==========================================================

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  {
    label,
    error,
    hint,
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
  const checkboxId = id ?? `checkbox-${reactId}`;
  const errorId = error ? `${checkboxId}-error` : undefined;
  const hintId = hint ? `${checkboxId}-hint` : undefined;

  const describedBy =
    [ariaDescribedBy, errorId, hintId].filter(Boolean).join(" ") || undefined;

  const hasError = Boolean(error);

  return (
    <div className={cn("flex flex-col gap-1.5", containerClassName)}>
      <label
        htmlFor={checkboxId}
        className={cn(
          "group flex cursor-pointer items-start gap-3",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <span className="relative mt-0.5 inline-flex h-5 w-5 shrink-0">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            disabled={disabled}
            aria-invalid={hasError || undefined}
            aria-describedby={describedBy}
            className={cn(
              "peer h-5 w-5 cursor-pointer appearance-none rounded-[6px] border bg-[var(--color-surface)]",
              "transition-colors duration-200 ease-out",
              "checked:border-[var(--color-primary)] checked:bg-[var(--color-primary-solid)]",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
              "focus-visible:outline-[var(--color-primary)]",
              "disabled:cursor-not-allowed",
              hasError
                ? "border-[var(--color-error)]"
                : "border-[var(--color-border)] group-hover:border-[var(--color-primary)]/60",
              className,
            )}
            {...rest}
          />
          <Check
            className={cn(
              "pointer-events-none absolute inset-0 m-auto h-3.5 w-3.5",
              "text-white opacity-0 transition-opacity duration-150 ease-out",
              "peer-checked:opacity-100",
            )}
            aria-hidden="true"
          />
        </span>

        {label ? (
          <span className="text-small leading-snug text-[var(--color-text)]">
            {label}
          </span>
        ) : null}
      </label>

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

Checkbox.displayName = "Checkbox";