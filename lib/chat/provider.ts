import { GeminiProvider } from "@/lib/chat/geminiProvider";
import { RagProvider } from "@/lib/chat/ragProvider";
import { StubProvider } from "@/lib/chat/stubProvider";
import type { ChatProvider } from "@/lib/chat/types";

// ==========================================================
// Типы провайдеров
// ==========================================================

export type ChatProviderName = "stub" | "rag" | "gemini";

// ==========================================================
// Фабрика
// ==========================================================

/**
 * Возвращает провайдер чата согласно переменной окружения CHAT_PROVIDER.
 *
 *  - CHAT_PROVIDER=stub (по умолчанию) — заглушка
 *  - CHAT_PROVIDER=gemini — Google Gemini + все файлы content/rag как контекст
 *  - CHAT_PROVIDER=rag — HTTP-провайдер к внешнему RAG-сервису
 *
 * Если для выбранного провайдера не хватает переменных,
 * автоматически используется StubProvider с предупреждением в логе.
 */
export function getChatProvider(): ChatProvider {
  const raw = (process.env.CHAT_PROVIDER ?? "stub").toLowerCase();

  if (raw === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const model = process.env.GEMINI_MODEL?.trim() || undefined;

    if (!apiKey) {
      // eslint-disable-next-line no-console
      console.warn(
        "[chat] CHAT_PROVIDER=gemini, но GEMINI_API_KEY не задан. Используется StubProvider.",
      );
      return new StubProvider();
    }

    return new GeminiProvider({ apiKey, model });
  }

  if (raw === "rag") {
    const url = process.env.RAG_SERVICE_URL?.trim();
    const token = process.env.RAG_SERVICE_TOKEN?.trim();

    if (!url || !token) {
      // eslint-disable-next-line no-console
      console.warn(
        "[chat] CHAT_PROVIDER=rag, но RAG_SERVICE_URL / RAG_SERVICE_TOKEN не заданы. Используется StubProvider.",
      );
      return new StubProvider();
    }

    return new RagProvider({ url, token });
  }

  return new StubProvider();
}

// ==========================================================
// Реэкспорт интерфейса
// ==========================================================

export type { ChatProvider } from "@/lib/chat/types";