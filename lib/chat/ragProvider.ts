import type {
  ChatProvider,
  ChatRequest,
  ChatResponse,
  ChatSource,
  ChatAction,
} from "@/lib/chat/types";

// ==========================================================
// Конфигурация
// ==========================================================

export interface RagProviderConfig {
  /** Базовый URL RAG-сервиса */
  url: string;
  /** Bearer-токен авторизации */
  token: string;
  /** Таймаут запроса, мс */
  timeoutMs?: number;
}

// ==========================================================
// Ответ RAG-сервиса (ожидаемый контракт)
// ==========================================================

interface RagResponseBody {
  answer?: unknown;
  sources?: unknown;
  suggested_actions?: unknown;
}

// ==========================================================
// Санитайзеры ответа
// ==========================================================

function sanitizeSources(raw: unknown): ChatSource[] | undefined {
  if (!Array.isArray(raw)) return undefined;

  const result: ChatSource[] = [];

  for (const item of raw) {
    if (
      item &&
      typeof item === "object" &&
      typeof (item as { title?: unknown }).title === "string" &&
      typeof (item as { url?: unknown }).url === "string"
    ) {
      result.push({
        title: (item as { title: string }).title.slice(0, 200),
        url: (item as { url: string }).url.slice(0, 500),
      });
    }
  }

  return result.length > 0 ? result : undefined;
}

function sanitizeActions(raw: unknown): ChatAction[] | undefined {
  if (!Array.isArray(raw)) return undefined;

  const allowed: ChatAction["type"][] = ["open_form", "open_course", "link"];
  const result: ChatAction[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;

    const type = (item as { type?: unknown }).type;
    const label = (item as { label?: unknown }).label;
    const payload = (item as { payload?: unknown }).payload;

    if (typeof type !== "string" || !allowed.includes(type as ChatAction["type"])) {
      continue;
    }
    if (typeof label !== "string" || label.trim().length === 0) continue;

    const action: ChatAction = {
      type: type as ChatAction["type"],
      label: label.slice(0, 100),
    };

    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      const sanitized: Record<string, string> = {};
      for (const [k, v] of Object.entries(payload)) {
        if (typeof v === "string") {
          sanitized[k] = v.slice(0, 500);
        }
      }
      if (Object.keys(sanitized).length > 0) {
        action.payload = sanitized;
      }
    }

    result.push(action);
  }

  return result.length > 0 ? result : undefined;
}

function sanitizeAnswer(raw: unknown): string {
  if (typeof raw !== "string") {
    return "Не удалось получить ответ. Попробуйте ещё раз или оставьте заявку — мы свяжемся с вами.";
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return "Не удалось получить ответ. Попробуйте ещё раз или оставьте заявку — мы свяжемся с вами.";
  }

  // Ограничение длины, чтобы не отдать пользователю «полотно» текста
  return trimmed.length > 4000 ? trimmed.slice(0, 4000) : trimmed;
}

// ==========================================================
// RagProvider (каркас)
// ==========================================================

export class RagProvider implements ChatProvider {
  private readonly url: string;
  private readonly token: string;
  private readonly timeoutMs: number;

  constructor(config: RagProviderConfig) {
    this.url = config.url.replace(/\/$/, "");
    this.token = config.token;
    this.timeoutMs = config.timeoutMs ?? 20_000;
  }

  async reply(
    req: ChatRequest,
    signal?: AbortSignal,
  ): Promise<ChatResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    // Объединяем внешний signal и внутренний таймаут
    const onExternalAbort = () => controller.abort();
    signal?.addEventListener("abort", onExternalAbort, { once: true });

    try {
      const response = await fetch(`${this.url}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          message: req.message,
          history: req.history ?? [],
          context: req.context ?? {},
          session_id: req.session_id,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const bodyText = await response.text().catch(() => "");
        throw new Error(
          `RAG-сервис ответил ${response.status}: ${bodyText.slice(0, 200)}`,
        );
      }

      const raw = (await response.json()) as RagResponseBody;

      return {
        answer: sanitizeAnswer(raw.answer),
        sources: sanitizeSources(raw.sources),
        suggested_actions: sanitizeActions(raw.suggested_actions),
      };
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", onExternalAbort);
    }
  }

  // -------------------------------------------------------
  // Заложено на будущее: стриминг через SSE.
  // Реализуется на этапе интеграции RAG-пайплайна.
  // -------------------------------------------------------
  // async *stream(req, signal) {
  //   // TODO: реализация после согласования формата с RAG-сервисом
  //   throw new Error("stream() ещё не реализован");
  // }
}