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

const DEFAULT_MODEL = "gemini-2.0-flash";
const DEFAULT_TIMEOUT_MS = 25_000;

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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const onExternalAbort = () => controller.abort();
    signal?.addEventListener("abort", onExternalAbort, { once: true });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
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
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", onExternalAbort);
    }
  }
}