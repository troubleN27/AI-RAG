import { NextResponse } from "next/server";

import { getCourseById } from "@/lib/content";
import { checkSpam } from "@/lib/lead/antispam";
import {
  buildRateLimitKey,
  getClientIp,
  getRateLimiter,
  LEAD_RATE_LIMIT,
} from "@/lib/lead/rateLimit";
import { leadSchema } from "@/lib/lead/schema";
import {
  dispatchLead,
  maskPhone,
  type Lead,
} from "@/lib/lead/sink";
import { normalizePhone, uuid } from "@/lib/utils";

// ==========================================================
// Константы
// ==========================================================

const MAX_BODY_BYTES = 10 * 1024; // 10 КБ
const ALLOWED_METHODS = "POST";

// ==========================================================
// Утилиты
// ==========================================================

function jsonError(
  status: number,
  body: Record<string, unknown>,
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function jsonOk(body: Record<string, unknown>): NextResponse {
  return NextResponse.json(body, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  // Если origin отсутствует (например, curl) — пропускаем
  if (!origin || !host) return true;

  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}

function truncate(input: string | null | undefined, max = 200): string | undefined {
  if (!input) return undefined;
  const trimmed = input.trim();
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

// ==========================================================
// POST /api/lead
// ==========================================================

export async function POST(request: Request): Promise<NextResponse> {
  // 1. CORS: только собственный origin
  if (!isSameOrigin(request)) {
    return jsonError(403, { ok: false, error: "forbidden_origin" });
  }

  // 2. Content-Type
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return jsonError(415, { ok: false, error: "unsupported_media_type" });
  }

  // 3. Размер тела (защита от больших payload)
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return jsonError(413, { ok: false, error: "payload_too_large" });
    }
  }

  // 4. Rate limit
  const ip = getClientIp(request);
  const limiter = getRateLimiter(LEAD_RATE_LIMIT);
  const rateKey = buildRateLimitKey(LEAD_RATE_LIMIT.scope, ip);

  try {
    const rateResult = await limiter.check(rateKey);

    if (!rateResult.allowed) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((rateResult.resetAt - Date.now()) / 1000),
      );

      return NextResponse.json(
        { ok: false, error: "rate_limited" },
        {
          status: 429,
          headers: {
            "Cache-Control": "no-store",
            "Retry-After": String(retryAfterSeconds),
          },
        },
      );
    }
  } catch (error) {
    // Если лимитер сломался — не блокируем заявку, только логируем
    // eslint-disable-next-line no-console
    console.error("[api/lead] ошибка rate limit:", error);
  }

  // 5. Парсинг тела
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return jsonError(400, { ok: false, error: "invalid_body" });
  }

  if (rawBody.length > MAX_BODY_BYTES) {
    return jsonError(413, { ok: false, error: "payload_too_large" });
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawBody);
  } catch {
    return jsonError(400, { ok: false, error: "invalid_json" });
  }

  // 6. Валидация схемы
  const validation = leadSchema.safeParse(parsedJson);
  if (!validation.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of validation.error.issues) {
      const path = issue.path.join(".") || "form";
      if (!fieldErrors[path]) {
        fieldErrors[path] = issue.message;
      }
    }
    return jsonError(400, { ok: false, errors: fieldErrors });
  }

  const input = validation.data;

  // 7. Антиспам
  const spamVerdict = checkSpam(input);

  if (spamVerdict.isSpam) {
    // Тихо отбрасываем: клиенту возвращаем 200, но ничего не доставляем
    // (кроме honeypot — тоже тихий отброс)
    // eslint-disable-next-line no-console
    console.warn(
      `[api/lead] спам отброшен: reason=${spamVerdict.reason ?? "unknown"} phone=${maskPhone(input.phone)}`,
    );
    return jsonOk({ ok: true });
  }

  // 8. Нормализация и построение объекта Lead
  const courseId = truncate(input.courseId, 64);
  const course = courseId ? getCourseById(courseId) : undefined;

  const lead: Lead = {
    id: uuid(),
    createdAt: new Date().toISOString(),
    name: input.name.trim(),
    phone: normalizePhone(input.phone),
    courseId: courseId || undefined,
    courseTitle: course?.title,
    preferredTime: truncate(input.preferredTime, 80),
    comment: truncate(input.comment, 500),
    source: input.source,
    utm: input.utm,
    pageUrl: truncate(request.headers.get("referer") ?? undefined, 500),
    userAgent: truncate(request.headers.get("user-agent") ?? undefined, 500),
  };

  // 9. Доставка
  let deliveryResult;
  try {
    deliveryResult = await dispatchLead(lead);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      "[api/lead] критическая ошибка доставки:",
      error instanceof Error ? error.message : error,
    );
    return jsonError(502, { ok: false, error: "delivery_failed" });
  }

  if (!deliveryResult.delivered) {
    // eslint-disable-next-line no-console
    console.error(
      "[api/lead] ни один приёмник не доставил заявку:",
      deliveryResult.errors,
    );
    return jsonError(502, { ok: false, error: "delivery_failed" });
  }

  // 10. Успех
  return jsonOk({ ok: true });
}

// ==========================================================
// Прочие методы → 405
// ==========================================================

function methodNotAllowed(): NextResponse {
  return NextResponse.json(
    { ok: false, error: "method_not_allowed" },
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