"use client";

import { useCallback, useId, useRef, type KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

// ==========================================================
// Типы
// ==========================================================

export interface TabItem {
  id: string;
  label: string;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  /** Вариант отображения */
  variant?: "chips" | "underline";
  /** Прокручиваемая лента на мобильных */
  scrollable?: boolean;
  ariaLabel?: string;
  className?: string;
}

// ==========================================================
// Компонент
// ==========================================================

export function Tabs({
  items,
  value,
  onChange,
  variant = "chips",
  scrollable = false,
  ariaLabel = "Фильтр",
  className,
}: TabsProps) {
  const baseId = useId();
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      const buttons = buttonsRef.current.filter(Boolean) as HTMLButtonElement[];
      if (buttons.length === 0) return;

      let nextIndex: number | null = null;

      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
          nextIndex = (index + 1) % buttons.length;
          break;
        case "ArrowLeft":
        case "ArrowUp":
          nextIndex = (index - 1 + buttons.length) % buttons.length;
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = buttons.length - 1;
          break;
        default:
          return;
      }

      if (nextIndex !== null) {
        event.preventDefault();
        const nextButton = buttons[nextIndex];
        if (nextButton) {
          nextButton.focus();
          const nextItem = items[nextIndex];
          if (nextItem) onChange(nextItem.id);
        }
      }
    },
    [items, onChange],
  );

  const chipsClasses = (active: boolean) =>
    cn(
      "inline-flex h-10 items-center justify-center rounded-full border px-4 text-small font-medium",
      "whitespace-nowrap transition-colors duration-200 ease-out",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
      "focus-visible:outline-[var(--color-primary)]",
      active
        ? "border-[var(--color-primary)] bg-[var(--color-primary-solid)] text-white shadow-sm"
        : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-bg-alt)]",
    );

  const underlineClasses = (active: boolean) =>
    cn(
      "relative inline-flex h-11 items-center justify-center px-1 text-small font-semibold md:text-body",
      "whitespace-nowrap transition-colors duration-200 ease-out",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
      "focus-visible:outline-[var(--color-primary)]",
      active
        ? "text-[var(--color-primary)]"
        : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
    );

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        variant === "chips" && "flex flex-wrap gap-2",
        variant === "underline" && "flex gap-6 border-b border-[var(--color-border)]",
        scrollable && "flex-nowrap overflow-x-auto scroll-x-snap pb-1",
        className,
      )}
    >
      {items.map((item, index) => {
        const active = item.id === value;

        return (
          <button
            key={item.id}
            ref={(el) => {
              buttonsRef.current[index] = el;
            }}
            id={`${baseId}-tab-${item.id}`}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={
              variant === "chips" ? chipsClasses(active) : underlineClasses(active)
            }
          >
            {item.label}
            {variant === "underline" && active ? (
              <span
                className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[var(--color-primary-solid)]"
                aria-hidden="true"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}