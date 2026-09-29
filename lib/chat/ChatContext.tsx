"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// ==========================================================
// Типы
// ==========================================================

export interface ChatContextValue {
  /** Открыто ли окно чата */
  isOpen: boolean;
  /** Открыть окно чата */
  openChat: () => void;
  /** Закрыть окно чата */
  closeChat: () => void;
}

// ==========================================================
// Контекст
// ==========================================================

const ChatContext = createContext<ChatContextValue | null>(null);

// ==========================================================
// Провайдер
// ==========================================================

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);

  const value = useMemo<ChatContextValue>(
    () => ({ isOpen, openChat, closeChat }),
    [isOpen, openChat, closeChat],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

// ==========================================================
// Хук
// ==========================================================

export function useChat(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat должен использоваться внутри <ChatProvider>");
  }
  return context;
}
