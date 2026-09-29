"use client";

import { AlertCircle, ExternalLink } from "lucide-react";

import type { ChatMessageModel } from "@/lib/chat/types";
import { cn } from "@/lib/utils";

// ==========================================================
// Типы
// ==========================================================

export interface ChatMessageProps {
  message: ChatMessageModel;
  /** Коллбэк клика по действию (open_form / open_course / link) */
  onActionClick?: (action: NonNullable<ChatMessageModel["actions"]>[number]) => void;
}

// ==========================================================
// Утилита времени
// ==========================================================

function formatTime(timestamp: number): string {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp));
  } catch {
    return "";
  }
}

// ==========================================================
// Индикатор набора
// ==========================================================

function TypingDots() {
  /* HIG generative AI: «думает» без слов — пользователь не понимает,
     что происходит и сколько ждать. Поэтому подпись называет действие
     и держит нагрузку видимой, а не просто анимирует точки. */
  return (
    <span className="inline-flex items-center gap-2" role="status">
      <span className="inline-flex items-center gap-1" aria-hidden="true">
        {[0, 160, 320].map((delay) => (
          <span
            key={delay}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-70"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </span>
      <span className="text-small opacity-80">Ищу подходящие курсы…</span>
    </span>
  );
}

// ==========================================================
// Компонент
// ==========================================================

export function ChatMessage({ message, onActionClick }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isPending = message.status === "pending";
  const isError = message.status === "error";

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-1",
        isUser ? "items-end" : "items-start",
      )}
    >
      {/* Пузырь */}
      <div
        className={cn(
          "max-w-[85%] rounded-[var(--radius-md)] px-3.5 py-2.5 text-small leading-relaxed",
          "transition-colors duration-200 ease-out",
          isUser &&
            "bg-[var(--color-primary-solid)] text-white rounded-br-sm",
          !isUser &&
            !isError &&
            "bg-[var(--color-bg-alt)] text-[var(--color-text)] rounded-bl-sm",
          !isUser &&
            isError &&
            "border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 text-[var(--color-error)]",
        )}
      >
        {isPending ? (
          <TypingDots />
        ) : (
          <>
            {isError ? (
              <span className="mb-1 inline-flex items-center gap-1.5 font-semibold">
                <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                Ошибка
              </span>
            ) : null}
            <p className="whitespace-pre-line">{message.content}</p>
          </>
        )}
      </div>

      {/* Источники */}
      {!isUser && message.sources && message.sources.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5 pl-1">
          {message.sources.map((source) => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex min-h-target items-center gap-1.5 rounded-full",
                  "border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5",
                  "text-small text-[var(--color-text-muted)]",
                  "transition-colors duration-200 ease-out",
                  "hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
                )}
              >
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
                <span className="truncate max-w-[160px]">{source.title}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Действия */}
      {!isUser && message.actions && message.actions.length > 0 ? (
        <ul className="mt-1 flex flex-wrap gap-2 pl-1">
          {message.actions.map((action, index) => (
            <li key={`${action.type}-${index}`}>
              <button
                type="button"
                onClick={() => onActionClick?.(action)}
                className={cn(
                  "inline-flex min-h-target items-center rounded-full px-4",
                  "bg-[var(--color-primary-solid)] text-small font-semibold text-white",
                  "transition-colors duration-200 ease-out",
                  "hover:bg-[var(--color-primary-solid-hover)]",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
                )}
              >
                {action.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Время */}
      <span
        className={cn(
          "px-1 text-caption text-[var(--color-text-muted)]",
          isUser ? "text-right" : "text-left",
        )}
        aria-hidden="true"
      >
        {formatTime(message.createdAt)}
      </span>
    </div>
  );
}