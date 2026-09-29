"use client";

import { cn } from "@/lib/utils";

// ==========================================================
// Типы
// ==========================================================

export interface ChatSuggestionsProps {
  /** Список подсказок-чипов */
  suggestions: string[];
  /** Коллбэк выбора подсказки */
  onSelect: (suggestion: string) => void;
  /** Заблокировать взаимодействие */
  disabled?: boolean;
  className?: string;
}

// ==========================================================
// Компонент
// ==========================================================

export function ChatSuggestions({
  suggestions,
  onSelect,
  disabled = false,
  className,
}: ChatSuggestionsProps) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div
      className={cn("flex flex-wrap gap-2 px-3 pb-3 pt-1", className)}
      role="group"
      aria-label="Быстрые вопросы"
    >
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(suggestion)}
          className={cn(
            "inline-flex items-center rounded-full border px-3 py-1.5",
            "text-small font-medium",
            "transition-colors duration-200 ease-out",
            "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]",
            "hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-bg-alt)] hover:text-[var(--color-primary)]",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[var(--color-border)] disabled:hover:bg-[var(--color-surface)] disabled:hover:text-[var(--color-text)]",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
          )}
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}