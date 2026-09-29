"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

import { ChatInput, type ChatInputHandle } from "@/components/chat/ChatInput";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatSuggestions } from "@/components/chat/ChatSuggestions";
import { track } from "@/lib/analytics";
import type { ChatMessageModel } from "@/lib/chat/types";
import { getSiteConfig } from "@/lib/content";
import { cn } from "@/lib/utils";

// ==========================================================
// Типы
// ==========================================================

export interface ChatWindowProps {
  /** Открыто ли окно (управляет анимацией видимости) */
  isOpen: boolean;
  /** Закрыть окно */
  onClose: () => void;
  /** Список сообщений */
  messages: ChatMessageModel[];
  /** Идёт ли ответ от ассистента */
  isTyping: boolean;
  /** Отправка сообщения */
  onSend: (message: string) => void;
  /** Подсказки-чипы (показываются до первого сообщения пользователя) */
  suggestions: string[];
  /** Клик по действию в сообщении */
  onActionClick: (action: NonNullable<ChatMessageModel["actions"]>[number]) => void;
}

// ==========================================================
// Сообщение-приветствие по умолчанию
// ==========================================================

const DEFAULT_GREETING =
  "Здравствуйте! Я ассистент образовательного центра. Помогу с вопросами о курсах, расписании и обучении.";

// ==========================================================
// Компонент
// ==========================================================

export function ChatWindow({
  isOpen,
  onClose,
  messages,
  isTyping,
  onSend,
  suggestions,
  onActionClick,
}: ChatWindowProps) {
  const site = getSiteConfig();
  const inputRef = useRef<ChatInputHandle>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Автопрокрутка к последнему сообщению
  useEffect(() => {
    if (!isOpen) return;
    const timeout = window.setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 80);
    return () => window.clearTimeout(timeout);
  }, [messages, isTyping, isOpen]);

  // Автофокус на input при открытии
  useEffect(() => {
    if (!isOpen) return;
    const timeout = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [isOpen]);

  // Esc закрывает окно
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      track("chat_suggestion_click", { suggestion });
      onSend(suggestion);
    },
    [onSend],
  );

  const hasUserMessages = messages.some((m) => m.role === "user");
  const showSuggestions = !hasUserMessages && suggestions.length > 0;

  return (
    <motion.div
      ref={containerRef}
      role="dialog"
      aria-modal="false"
      aria-label="Чат с ассистентом"
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.97 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "flex flex-col overflow-hidden bg-[var(--color-surface)] shadow-lg",
        // Mobile: на весь экран
        "fixed inset-0 h-[100svh] w-full rounded-none border-0",
        // Desktop: панель 380×560 в правом нижнем углу.
        // inset-auto обязателен: мобильный inset-0 задаёт ещё и left/top,
        // а при заданных width/height в позиционировании побеждают именно
        // left и top, а не right/bottom. Без сброса панель прижималась
        // к левому верхнему углу вместо правого нижнего.
        "md:fixed md:inset-auto md:right-5 md:bottom-[calc(88px+env(safe-area-inset-bottom))]",
        "md:h-[560px] md:w-[380px] md:rounded-[var(--radius-lg)]",
        "md:border md:border-[var(--color-border)]",
      )}
      style={{ zIndex: "var(--z-chat)" }}
    >
      {/* Заголовок */}
      <header
        className={cn(
          "flex shrink-0 items-center justify-between gap-3 border-b border-[var(--color-border)]",
          "bg-[var(--color-surface)] px-4 py-3",
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-full",
              "bg-[var(--color-primary-solid)] text-white text-small font-bold",
            )}
            aria-hidden="true"
          >
            AI
          </span>
          <div className="min-w-0">
            <p className="truncate text-small font-semibold text-[var(--color-text)]">
              Ассистент
            </p>
            <p className="truncate text-small text-[var(--color-text-muted)]">
              {site.name}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть чат"
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-md)]",
            "text-[var(--color-text-muted)]",
            "transition-colors duration-200 ease-out",
            "hover:bg-[var(--color-bg-alt)] hover:text-[var(--color-text)]",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
          )}
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>

      {/* Список сообщений */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4"
        aria-live="polite"
        aria-atomic="false"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col gap-3">
            <div
              className={cn(
                "max-w-[85%] rounded-[var(--radius-md)] rounded-bl-sm",
                "bg-[var(--color-bg-alt)] px-3.5 py-2.5 text-small leading-relaxed",
                "text-[var(--color-text)]",
              )}
            >
              {DEFAULT_GREETING}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onActionClick={onActionClick}
              />
            ))}
            {isTyping ? (
              <ChatMessage
                message={{
                  id: "typing",
                  role: "assistant",
                  content: "",
                  createdAt: Date.now(),
                  status: "pending",
                }}
              />
            ) : null}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Подсказки */}
      {showSuggestions ? (
        <ChatSuggestions
          suggestions={suggestions}
          onSelect={handleSuggestionClick}
          disabled={isTyping}
        />
      ) : null}

      {/* Поле ввода */}
      <ChatInput
        ref={inputRef}
        onSend={onSend}
        disabled={isTyping}
        placeholder="Напишите сообщение…"
      />
    </motion.div>
  );
}