"use client";

import { AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { ChatWindow } from "@/components/chat/ChatWindow";
import { track } from "@/lib/analytics";
import { useChat } from "@/lib/chat/ChatContext";
import type {
  ChatMessageModel,
  ChatRequest,
  ChatResponse,
} from "@/lib/chat/types";
import { useLead } from "@/lib/lead/LeadContext";
import { cn, safeJsonParse, uuid } from "@/lib/utils";

// ==========================================================
// Константы
// ==========================================================

const CHAT_ENABLED = process.env.NEXT_PUBLIC_CHAT_ENABLED !== "false";
const SESSION_KEY = "chat:session";
const HISTORY_KEY = "chat:v1";
const MAX_HISTORY_SENT = 10;
const TOOLTIP_DELAY_MS = 8000;
const TOOLTIP_DURATION_MS = 6000;

const DEFAULT_SUGGESTIONS = [
  "Какие курсы есть?",
  "Расписание занятий",
  "Сколько стоит обучение?",
  "Как записаться?",
];

// ==========================================================
// sessionStorage helpers
// ==========================================================

function readOrCreateSessionId(): string {
  if (typeof window === "undefined") return uuid();
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing && existing.length > 0) return existing;
    const created = uuid();
    sessionStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    return uuid();
  }
}

function readPersistedMessages(): ChatMessageModel[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    const parsed = safeJsonParse<ChatMessageModel[] | null>(raw, null);
    if (!parsed || !Array.isArray(parsed)) return [];
    return parsed.filter(
      (m) =>
        m &&
        typeof m.id === "string" &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        typeof m.createdAt === "number",
    );
  } catch {
    return [];
  }
}

function persistMessages(messages: ChatMessageModel[]): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(messages));
  } catch {
    /* noop */
  }
}

// ==========================================================
// Компонент
// ==========================================================

export function ChatWidget() {
  const { openModal } = useLead();
  const { isOpen, openChat: open, closeChat: close } = useChat();
  // sessionId и история инициализируются лениво, чтобы первый persist-эффект
  // не записал пустой массив поверх сохранённой истории.
  const [sessionId] = useState<string>(() => readOrCreateSessionId());
  const [messages, setMessages] = useState<ChatMessageModel[]>(() =>
    readPersistedMessages(),
  );
  const [isTyping, setIsTyping] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const hasOpenedRef = useRef(false);
  const tooltipShownRef = useRef(false);

  // Сохранение истории
  useEffect(() => {
    if (!CHAT_ENABLED) return;
    persistMessages(messages);
  }, [messages]);

  // Тултип: показать через 8 с, скрыть через 6 с, один раз
  useEffect(() => {
    if (!CHAT_ENABLED) return;
    if (tooltipShownRef.current) return;
    if (isOpen) return;

    tooltipShownRef.current = true;

    const showTimeout = window.setTimeout(() => {
      setTooltipVisible(true);
    }, TOOLTIP_DELAY_MS);

    const hideTimeout = window.setTimeout(() => {
      setTooltipVisible(false);
    }, TOOLTIP_DELAY_MS + TOOLTIP_DURATION_MS);

    return () => {
      window.clearTimeout(showTimeout);
      window.clearTimeout(hideTimeout);
    };
  }, [isOpen]);

  const openChat = useCallback(() => {
    setTooltipVisible(false);
    open();
    if (!hasOpenedRef.current) {
      hasOpenedRef.current = true;
      track("chat_open", { source: "widget" });
    }
  }, [open]);

  const closeChat = useCallback(() => {
    close();
  }, [close]);

  const toggleChat = useCallback(() => {
    if (isOpen) {
      closeChat();
    } else {
      openChat();
    }
  }, [isOpen, openChat, closeChat]);

  // Отправка сообщения
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) return;

      const userMessage: ChatMessageModel = {
        id: uuid(),
        role: "user",
        content: trimmed,
        createdAt: Date.now(),
        status: "done",
      };

      const assistantId = uuid();

      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);
      track("chat_message_sent");

      // Формируем историю для отправки (последние N сообщений)
      const history = [...messages, userMessage]
        .filter((m) => m.status !== "pending" && m.status !== "error")
        .slice(-MAX_HISTORY_SENT)
        .map((m) => ({ role: m.role, content: m.content }));

      const payload: ChatRequest = {
        session_id: sessionId || "anon",
        message: trimmed,
        history,
      };

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: ChatResponse = await response.json();

        const assistantMessage: ChatMessageModel = {
          id: assistantId,
          role: "assistant",
          content:
            data.answer ||
            "Извините, не удалось подготовить ответ. Попробуйте ещё раз.",
          createdAt: Date.now(),
          status: "done",
          sources: data.sources,
          actions: data.suggested_actions,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch {
        const errorMessage: ChatMessageModel = {
          id: assistantId,
          role: "assistant",
          content:
            "Не удалось получить ответ. Попробуйте ещё раз или позвоните нам — контакты в разделе «Контакты».",
          createdAt: Date.now(),
          status: "error",
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping, messages, sessionId],
  );

  // Обработка клика по действию в сообщении
  const handleActionClick = useCallback(
    (action: NonNullable<ChatMessageModel["actions"]>[number]) => {
      track("chat_action_click", { type: action.type, label: action.label });

      if (action.type === "open_form") {
        // На мобильном закрываем чат, чтобы не мешал
        if (typeof window !== "undefined" && window.innerWidth < 768) {
          closeChat();
        }
        openModal({
          source: "chat",
          courseId: action.payload?.course_id,
        });
        return;
      }

      if (action.type === "open_course") {
        const courseId = action.payload?.course_id;
        if (courseId && typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.set("course", courseId);
          url.hash = "courses";
          window.location.href = url.toString();
        }
        return;
      }

      if (action.type === "link" && action.payload?.url) {
        window.open(action.payload.url, "_blank", "noopener,noreferrer");
      }
    },
    [closeChat, openModal],
  );

  const suggestions = useMemo(() => DEFAULT_SUGGESTIONS, []);

  if (!CHAT_ENABLED) return null;

  return (
    <>
      {/* Окно чата (монтируется только когда открыто) */}
      <AnimatePresence>
        {isOpen ? (
          <ChatWindow
            isOpen={isOpen}
            onClose={closeChat}
            messages={messages}
            isTyping={isTyping}
            onSend={sendMessage}
            suggestions={suggestions}
            onActionClick={handleActionClick}
          />
        ) : null}
      </AnimatePresence>

      {/* Тултип */}
      {tooltipVisible && !isOpen ? (
        <div
          role="status"
          className={cn(
            "fixed right-5 z-[var(--z-chat)] max-w-[260px]",
            "rounded-[var(--radius-md)] border border-[var(--color-border)]",
            "bg-[var(--color-surface)] py-3 pl-3.5 pr-12 shadow-lg",
            "text-small leading-relaxed text-[var(--color-text)]",
          )}
          style={{
            bottom: "calc(88px + env(safe-area-inset-bottom))",
          }}
        >
          <button
            type="button"
            onClick={() => setTooltipVisible(false)}
            aria-label="Скрыть подсказку"
            className={cn(
              "absolute -right-2 -top-2 grid h-11 w-11 place-items-center rounded-full",
              "text-[var(--color-text-muted)]",
              "transition-colors duration-200 ease-out",
              "hover:text-[var(--color-text)]",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
            )}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
          Задайте вопрос ассистенту — поможем выбрать курс
        </div>
      ) : null}

      {/* Плавающая кнопка */}
      {!isOpen ? (
        <button
          type="button"
          onClick={toggleChat}
          aria-label="Открыть чат с ассистентом"
          aria-expanded={isOpen}
          className={cn(
            "fixed right-5 z-[var(--z-chat)]",
            "grid h-14 w-14 place-items-center rounded-full",
            "bg-[var(--color-primary-solid)] text-white shadow-lg",
            "transition-[background-color,transform] duration-200 ease-out",
            "hover:bg-[var(--color-primary-solid-hover)]",
            "active:scale-95",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
          )}
          style={{
            bottom: "calc(20px + env(safe-area-inset-bottom))",
          }}
        >
          {/* Один раз при первом показе — короткая подсказка вместо
              бесконечного пульса. HIG motion: в приложениях постоянная
              анимация фоновых элементов — лишний шум, она отвлекает
              от содержимого и нагружает рендер. */}
          {!hasOpenedRef.current ? (
            <span
              className="pointer-events-none absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[var(--color-progress)] text-caption font-bold text-[var(--color-bg)]"
              aria-hidden="true"
            >
              1
            </span>
          ) : null}
          <MessageCircle className="h-6 w-6" aria-hidden="true" />
        </button>
      ) : null}
    </>
  );
}