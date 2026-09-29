"use client";

import { Send } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import { cn } from "@/lib/utils";

// ==========================================================
// Типы
// ==========================================================

export interface ChatInputProps {
  /** Коллбэк отправки сообщения */
  onSend: (message: string) => void;
  /** Заблокировать ввод (например, пока идёт ответ) */
  disabled?: boolean;
  /** Максимальная длина сообщения */
  maxLength?: number;
  /** Плейсхолдер */
  placeholder?: string;
  /** Автофокус при монтировании/открытии */
  autoFocus?: boolean;
  className?: string;
}

export interface ChatInputHandle {
  /** Программно установить текст и сфокусировать */
  setValue: (value: string) => void;
  /** Сфокусировать поле */
  focus: () => void;
}

// ==========================================================
// Компонент
// ==========================================================

const MAX_ROWS = 5;
const LINE_HEIGHT = 22;
const BASE_HEIGHT = 44;

export const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(
  function ChatInput(
    {
      onSend,
      disabled = false,
      maxLength = 1000,
      placeholder = "Напишите сообщение…",
      autoFocus = false,
      className,
    },
    ref,
  ) {
    const [value, setValue] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Авто-рост textarea
    useEffect(() => {
      const node = textareaRef.current;
      if (!node) return;

      node.style.height = "auto";
      const maxHeight = MAX_ROWS * LINE_HEIGHT + (BASE_HEIGHT - LINE_HEIGHT);
      const nextHeight = Math.min(node.scrollHeight, maxHeight);
      node.style.height = `${nextHeight}px`;
      node.style.overflowY = node.scrollHeight > maxHeight ? "auto" : "hidden";
    }, [value]);

    // Автофокус
    useEffect(() => {
      if (!autoFocus) return;
      const timeout = window.setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
      return () => window.clearTimeout(timeout);
    }, [autoFocus]);

    useImperativeHandle(
      ref,
      () => ({
        setValue: (next: string) => {
          setValue(next);
          textareaRef.current?.focus();
        },
        focus: () => {
          textareaRef.current?.focus();
        },
      }),
      [],
    );

    const trySend = useCallback(() => {
      const trimmed = value.trim();
      if (!trimmed || disabled) return;
      if (trimmed.length > maxLength) return;

      onSend(trimmed);
      setValue("");
    }, [value, disabled, maxLength, onSend]);

    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          trySend();
        }
      },
      [trySend],
    );

    const isSendDisabled =
      disabled || value.trim().length === 0 || value.length > maxLength;

    return (
      <div
        className={cn(
          "flex items-end gap-2 border-t border-[var(--color-border)]",
          "bg-[var(--color-surface)] p-3",
          className,
        )}
      >
        <div className="flex-1">
          <label htmlFor="chat-input" className="sr-only">
            Сообщение
          </label>
          <textarea
            id="chat-input"
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            maxLength={maxLength}
            placeholder={placeholder}
            rows={1}
            className={cn(
              "block w-full resize-none rounded-[var(--radius-md)] border border-[var(--color-border-strong)]",
              "bg-[var(--color-bg)] px-3.5 py-3 text-body leading-[22px]",
              "text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]",
              "transition-colors duration-200 ease-out",
              "hover:border-[var(--color-text-muted)]/50 focus:border-[var(--color-primary)] focus:bg-[var(--color-surface-2)] focus:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
            style={{ minHeight: BASE_HEIGHT }}
          />
        </div>

        <button
          type="button"
          onClick={trySend}
          disabled={isSendDisabled}
          aria-label="Отправить сообщение"
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-md)]",
            "bg-[var(--color-primary-solid)] text-white shadow-sm",
            "transition-[background-color,opacity,transform] duration-200 ease-out",
            "hover:bg-[var(--color-primary-solid-hover)]",
            "active:translate-y-px",
            "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[var(--color-primary-solid)]",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
          )}
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    );
  },
);

ChatInput.displayName = "ChatInput";