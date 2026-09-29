import { NextResponse } from "next/server";

import { getChatProvider } from "@/lib/chat/provider";
import {
  CHAT_HISTORY_SENT_LIMIT,
  CHAT_MAX_MESSAGE_LENGTH,
  type ChatErrorBody,
  type ChatRequest,
  type ChatResponse,
} from "@/lib/chat/types";
import {
  buildRateLimitKey,
  CHAT_RATE_LIMIT,
  getClientIp,
  getRateLimiter,
} from "@/lib/lead/rateLimit";

// ==========================================================
// Константы
// ==========================================================

const MAX_BODY_BYTES = 32 * 1024; // 32 КБ
const ALLOWED_METHODS = "POST";

// ==========================================================
// Утилиты
// ==========================================================

function jsonError(
  status: number,
  code: string,
  message: string,
  extraHeaders?: Record<string, string>,
): NextResponse<ChatErrorBody> {
  return NextResponse.json(
    { error: { code, message } },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        ...extraHeaders,
      },
    },
  );
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

// ==========================================================
// Валидация тела запроса
// ==========================================================

interface ValidatedChatRequest {
  sessionId: string;
  message: string;
  history: NonNullable<ChatRequest["history"]>;
  context: NonNullable<ChatRequest["context"]>;
}

type ValidationResult =
  | { ok: true; value: ValidatedChatRequest }
  | { ok: false; code: string; message: string };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateChatRequest(body: unknown): ValidationResult {
  if (!isPlainObject(body)) {
    return { ok: false, code: "invalid_body", message: "Тело запроса должно быть JSON-объектом" };
  }

  const rawSessionId = body.session_id;
  if (typeof rawSessionId !== "string" || rawSessionId.trim().length === 0) {
    return { ok: false, code: "invalid_session_id", message: "Не указан session_id" };
  }
  const sessionId = rawSessionId.slice(0, 128);

  const rawMessage = body.message;
  if (typeof rawMessage !== "string") {
    return { ok: false, code: "invalid_message", message: "Поле message обязательно" };
  }

  const message = rawMessage.trim();
  if (message.length === 0) {
    return { ok: false, code: "empty_message", message: "Сообщение не может быть пустым" };
  }
  if (message.length > CHAT_MAX_MESSAGE_LENGTH) {
    return {
      ok: false,
      code: "message_too_long",
      message: `Сообщение не должно превышать ${CHAT_MAX_MESSAGE_LENGTH} символов`,
    };
  }

  // History: массив объектов { role, content }
  const rawHistory = body.history;
  const history: NonNullable<ChatRequest["history"]> = [];

  if (Array.isArray(rawHistory)) {
    for (const item of rawHistory) {
      if (!isPlainObject(item)) continue;
      const role = item.role;
      const content = item.content;

      if (role !== "user" && role !== "assistant") continue;
      if (typeof content !== "string") continue;

      const trimmed = content.trim();
      if (trimmed.length === 0) continue;

      history.push({
        role,
        content: trimmed.slice(0, CHAT_MAX_MESSAGE_LENGTH),
      });
    }
  }

  const trimmedHistory = history.slice(-CHAT_HISTORY_SENT_LIMIT);

  // Context: опциональный объект
  const rawContext = body.context;
  const context: NonNullable<ChatRequest["context"]> = {};

  if (isPlainObject(rawContext)) {
    if (typeof rawContext.page_section === "string") {
      context.page_section = rawContext.page_section.slice(0, 64);
    }
    if (typeof rawContext.selected_course_id === "string") {
      context.selected_course_id = rawContext.selected_course_id.slice(0, 64);
    }
  }

  return {
    ok: true,
    value: {
      sessionId,
      message,
      history: trimmedHistory,
      context,
    },
  };
}

// ==========================================================
// POST /api/chat
// ==========================================================

export async function POST(request: Request): Promise<NextResponse> {
  // 1. Origin
  if (!isSameOrigin(request)) {
    return jsonError(403, "forbidden_origin", "Недопустимый источник запроса");
  }

  // 2. Content-Type
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return jsonError(415, "unsupported_media_type", "Ожидается application/json");
  }

  // 3. Ограничение размера тела
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader) {
    const length = Number(contentLengthHeader);
    if (Number.isFinite(length) && length > MAX_BODY_BYTES) {
      return jsonError(413, "payload_too_large", "Тело запроса слишком большое");
    }
  }

  // 4. Rate limit
  const ip = getClientIp(request);
  const limiter = getRateLimiter(CHAT_RATE_LIMIT);
  const rateKey = buildRateLimitKey(CHAT_RATE_LIMIT.scope, ip);

  try {
    const rateResult = await limiter.check(rateKey);
    if (!rateResult.allowed) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((rateResult.resetAt - Date.now()) / 1000),
      );
      return jsonError(
        429,
        "rate_limited",
        "Слишком много сообщений. Попробуйте чуть позже.",
        { "Retry-After": String(retryAfterSeconds) },
      );
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[api/chat] ошибка rate limit:", error);
  }

  // 5. Парсинг тела
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return jsonError(400, "invalid_body", "Не удалось прочитать тело запроса");
  }

  if (rawBody.length > MAX_BODY_BYTES) {
    return jsonError(413, "payload_too_large", "Тело запроса слишком большое");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return jsonError(400, "invalid_json", "Некорректный JSON");
  }

  // 6. Валидация схемы запроса
  const validation = validateChatRequest(parsed);
  if (!validation.ok) {
    return jsonError(400, validation.code, validation.message);
  }

  const { sessionId, message, history, context } = validation.value;

  const chatRequest: ChatRequest = {
    session_id: sessionId,
    message,
    history,
    context,
  };

  // 7. Вызов провайдера
  const provider = getChatProvider();

  try {
    const response: ChatResponse = await provider.reply(chatRequest);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const isAbort =
      error instanceof Error &&
      (error.name === "AbortError" || error.message.includes("aborted"));

    if (isAbort) {
      return jsonError(503, "service_timeout", "Сервис не успел ответить. Повторите попытку.");
    }

    // eslint-disable-next-line no-console
    console.error(
      "[api/chat] ошибка провайдера:",
      error instanceof Error ? error.message : error,
    );

    return jsonError(500, "service_error", "Не удалось получить ответ. Попробуйте ещё раз.");
  }
}

// ==========================================================
// Прочие методы → 405
// ==========================================================

function methodNotAllowed(): NextResponse {
  return NextResponse.json(
    { error: { code: "method_not_allowed", message: "Метод не поддерживается" } },
    {
      status: 405,
      headers: {
        Allow: ALLOWED_METHODS,
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function GET(): Promise<NextResponse> {
  return methodNotAllowed();
}

export async function PUT(): Promise<NextResponse> {
  return methodNotAllowed();
}

export async function PATCH(): Promise<NextResponse> {
  return methodNotAllowed();
}

export async function DELETE(): Promise<NextResponse> {
  return methodNotAllowed();
}

export async function OPTIONS(): Promise<NextResponse> {
  return methodNotAllowed();
}

// ==========================================================
// Конфигурация runtime
// ==========================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";