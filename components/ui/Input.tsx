"use client";

import { X } from "lucide-react";
import {
  forwardRef,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

// ==========================================================
// Типы
// ==========================================================

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  /** Показывать метку только для скринридеров */
  labelSrOnly?: boolean;
  containerClassName?: string;
}

// ==========================================================
// Компонент
// ==========================================================

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    labelSrOnly = false,
    containerClassName,
    id,
    className,
    disabled,
    readOnly,
    value,
    onChange,
    "aria-describedby": ariaDescribedBy,
    ...rest
  },
  ref,
) {
  const localRef = useRef<HTMLInputElement | null>(null);
  const reactId = useId();
  const inputId = id ?? `input-${reactId}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const hintId = hint ? `${inputId}-hint` : undefined;

  const describedBy =
    [ariaDescribedBy, errorId, hintId].filter(Boolean).join(" ") || undefined;

  const hasError = Boolean(error);

  /* Кнопка «Очистить» появляется только при реальном содержимом.
     В неконтролируемом режиме состояние держим здесь, в
     контролируемом — читаем value от вызывающей стороны. */
  const [inner, setInner] = useState("");
  const isControlled = value !== undefined;
  const current = isControlled ? value : inner;
  const canClear = Boolean(current) && !disabled && !readOnly;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (!isControlled) setInner(event.target.value);
    onChange?.(event);
  }

  function handleClear() {
    const input = localRef.current;
    if (input) {
      /* Через нативный сеттер: React перехватывает присваивание
         value, поэтому прямое input.value = "" в контролируемом
         режиме не обновит состояние родителя. */
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      setter?.call(input, "");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus();
    }
    if (!isControlled) setInner("");
  }

  return (
    <div className={cn("flex flex-col gap-1.5", containerClassName)}>
      {label ? (
        <label
          htmlFor={inputId}
          className={cn(
            "text-small font-medium text-[var(--color-text)]",
            labelSrOnly && "sr-only",
          )}
        >
          {label}
        </label>
      ) : null}

      <div className="relative">
        {leftIcon ? (
          <span
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            aria-hidden="true"
          >
            {leftIcon}
          </span>
        ) : null}

        <input
          ref={mergeRefs(ref, localRef)}
          id={inputId}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          className={cn(
            // 48px: HIG text fields — измеримая цель, а не только
            // «достаточно высокое поле». Плюс font-size 17px
            // не даёт iOS зумить страницу при фокусе.
            "h-12 w-full rounded-[var(--radius-md)] border bg-[var(--color-surface)]",
            "px-3.5 text-body text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]",
            "transition-[border-color,background-color] duration-200 ease-out",
            "focus:outline-none focus:border-[var(--color-primary)] focus:bg-[var(--color-surface-2)]",
            "disabled:cursor-not-allowed disabled:opacity-60",
            leftIcon && "pl-11",
            (rightIcon || canClear) && "pr-12",
            hasError
              ? "border-[var(--color-error)]"
              : "border-[var(--color-border-strong)] hover:border-[var(--color-text-muted)]/50",
            className,
          )}
          onChange={handleChange}
          value={value}
          {...rest}
        />

        {/* Кнопка очистки. HIG рекомендует встроенное действие
            внутри поля: не нужно искать, куда нажать. */}
        {canClear ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Очистить поле"
            className={cn(
              "absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center",
              "rounded-full text-[var(--color-text-muted)]",
              "transition-colors duration-200 ease-out",
              "hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-primary)]",
            )}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : rightIcon ? (
          <span
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            aria-hidden="true"
          >
            {rightIcon}
          </span>
        ) : null}
      </div>

      {error ? (
        <p
          id={errorId}
          className="text-small text-[var(--color-error)]"
          role="alert"
        >
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

Input.displayName = "Input";

/** Внешний ref (его может использовать форма) плюс наш локальный. */
function mergeRefs<T>(
  external: React.ForwardedRef<T>,
  local: React.MutableRefObject<T | null>,
) {
  return (node: T | null) => {
    local.current = node;
    if (typeof external === "function") external(node);
    else if (external) external.current = node;
  };
}