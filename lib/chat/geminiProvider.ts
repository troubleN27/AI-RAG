import { loadRagContext } from "@/lib/chat/ragContext";
import { loadRemoteRagContext } from "@/lib/chat/remoteRagContext";
import type {
  ChatAction,
  ChatProvider,
  ChatRequest,
  ChatResponse,
} from "@/lib/chat/types";

// ==========================================================
// Конфигурация
// ==========================================================

export interface GeminiProviderConfig {
  apiKey: string;
  model?: string;
  timeoutMs?: number;
}

// Алиас, а не закреплённая версия: Google отзывает старые модели
// (на gemini-2.0-flash и 2.5-flash уже отдаётся 404 «no longer
// available»), а latest сам подхватывает актуальную. Пин версии
// протухает и роняет ассистента без всякой правки кода.
const DEFAULT_MODEL = "gemini-flash-latest";
const DEFAULT_TIMEOUT_MS = 25_000;

// Google периодически отдаёт 503 «high demand» на загруженных моделях.
// Это транзиентная ошибка: без повтора она превращается в 500 для
// пользователя, хотя через пару секунд тот же запрос проходит.
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = [400, 1200];

/** Статусы, на которых есть смысл повторить запрос. */
function isTransientStatus(status: number): boolean {
  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ==========================================================
// System prompt
// ==========================================================

const SYSTEM_PROMPT_PREFIX = `Ты — AI-ассистент образовательного центра «Прогресс».
Твоя задача — помогать посетителям сайта с вопросами об обучении: курсы, преподаватели, форматы, расписание, стоимость, запись, сертификаты.

Правила:
1. Отвечай кратко и по делу — 2–5 предложений.
2. Отвечай ТОЛЬКО на основе информации из контекста ниже. Не выдумывай факты.
3. Если в контексте нет ответа — честно скажи, что не знаешь, и предложи связаться с менеджером (оставить заявку или позвонить по телефону +998 71 200 00 00).
4. Если вопрос не относится к образовательному центру — вежливо скажи, что можешь помочь только с вопросами об обучении.
5. Цены, названия курсов, имена преподавателей, даты — бери строго из контекста.
6. Пиши на русском языке, дружелюбно, без канцелярита.
7. Не упоминай, что у тебя есть «контекст» или «документы» — просто отвечай как сотрудник центра.

Контекст:

`;

const FALLBACK_ANSWER =
  "Извините, не удалось подготовить ответ. Попробуйте переформулировать вопрос или оставьте заявку — менеджер свяжется с вами.";

const DEFAULT_ACTIONS: ChatAction[] = [
  { type: "open_form", label: "Записаться на консультацию" },
];

// ==========================================================
// Типы Gemini API
// ==========================================================

interface GeminiPart {
  text: string;
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

interface GeminiRequestBody {
  contents: GeminiContent[];
  systemInstruction?: { parts: GeminiPart[] };
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  };
  safetySettings?: Array<{ category: string; threshold: string }>;
}

interface GeminiResponseBody {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
}

// ==========================================================
// Утилиты
// ==========================================================

async function buildSystemInstruction(): Promise<string> {
  const remote = await loadRemoteRagContext();
  // Локальные документы — запасной источник, если Google Drive/Sheets
  // не настроены или отдали пустой результат.
  const context = remote.trim().length > 0 ? remote : loadRagContext();
  return SYSTEM_PROMPT_PREFIX + context;
}

function toGeminiHistory(
  history: ChatRequest["history"],
): GeminiContent[] {
  if (!history || history.length === 0) return [];

  const result: GeminiContent[] = [];

  for (const entry of history) {
    const text = entry.content.trim();
    if (text.length === 0) continue;

    result.push({
      role: entry.role === "assistant" ? "model" : "user",
      parts: [{ text }],
    });
  }

  while (result.length > 0 && result[0]?.role === "model") {
    result.shift();
  }

  return result;
}

function extractAnswer(data: GeminiResponseBody): string {
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((p) => (typeof p.text === "string" ? p.text : ""))
    .join("")
    .trim();
}

// ==========================================================
// Провайдер
// ==========================================================

export class GeminiProvider implements ChatProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(config: GeminiProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? DEFAULT_MODEL;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async reply(req: ChatRequest, signal?: AbortSignal): Promise<ChatResponse> {
    const systemInstruction = await buildSystemInstruction();
    const history = toGeminiHistory(req.history);

    const body: GeminiRequestBody = {
      contents: [
        ...history,
        {
          role: "user",
          parts: [{ text: req.message }],
        },
      ],
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 800,
        topP: 0.95,
        topK: 40,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_ONLY_HIGH",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_ONLY_HIGH",
        },
      ],
    };

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `${encodeURIComponent(this.model)}:generateContent?key=` +
      `${encodeURIComponent(this.apiKey)}`;

    // Бюджет времени общий на все попытки: три попытки по 25 секунд
    // не поместились бы в лимит функции.
    const deadline = Date.now() + this.timeoutMs;
    let lastError: Error | null = null;

    for (let attempt = 1; ; attempt++) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) break;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), remaining);
      const onExternalAbort = () => controller.abort();
      signal?.addEventListener("abort", onExternalAbort, { once: true });

      // Сетевой сбой по умолчанию считаем повторяемым; явный
      // не-транзиентный HTTP-стат его переопределит.
      let retryable = true;

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!response.ok) {
          const text = await response.text().catch(() => "");
          retryable = isTransientStatus(response.status);
          throw new Error(
            `Gemini API ответил ${response.status}: ${text.slice(0, 300)}`,
          );
        }

        const data = (await response.json()) as GeminiResponseBody;

        if (data.promptFeedback?.blockReason) {
          return {
            answer:
              "Извините, не могу ответить на этот вопрос. Если у вас есть вопрос об обучении — задайте его, пожалуйста, иначе.",
            suggested_actions: DEFAULT_ACTIONS,
          };
        }

        const answer = extractAnswer(data);

        if (!answer) {
          return {
            answer: FALLBACK_ANSWER,
            suggested_actions: DEFAULT_ACTIONS,
          };
        }

        return {
          answer,
          suggested_actions: DEFAULT_ACTIONS,
        };
      } catch (error) {
        // Клиент отключился — повторять бессмысленно
        if (signal?.aborted) throw error;
        if (!retryable || attempt >= MAX_ATTEMPTS) throw error;

        lastError = error instanceof Error ? error : new Error(String(error));
        // eslint-disable-next-line no-console
        console.warn(
          `[chat] попытка ${attempt}/${MAX_ATTEMPTS} не удалась, повторяем:`,
          lastError.message,
        );
      } finally {
        clearTimeout(timer);
        signal?.removeEventListener("abort", onExternalAbort);
      }

      if (deadline - Date.now() <= 0) break;
      const delay = RETRY_DELAY_MS[attempt - 1];
      if (delay === undefined) break;
      await sleep(delay);
    }

    throw lastError ?? new Error("Gemini API не ответил");
  }
}