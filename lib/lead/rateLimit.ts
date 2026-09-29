// ==========================================================
// Типы
// ==========================================================

export interface RateLimitResult {
  /** Разрешён ли запрос */
  allowed: boolean;
  /** Осталось попыток */
  remaining: number;
  /** Unix ms, когда лимит сбросится */
  resetAt: number;
  /** Максимум попыток в окне */
  limit: number;
}

export interface RateLimiter {
  /** Проверить и увеличить счётчик */
  check(key: string): Promise<RateLimitResult>;
}

// ==========================================================
// In-memory реализация (sliding window counter)
// ==========================================================

interface BucketEntry {
  count: number;
  resetAt: number;
}

class InMemoryRateLimiter implements RateLimiter {
  private readonly buckets = new Map<string, BucketEntry>();
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  async check(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const existing = this.buckets.get(key);

    // Периодическая очистка «протухших» записей (без таймера)
    if (this.buckets.size > 5000) {
      for (const [k, entry] of this.buckets) {
        if (entry.resetAt <= now) this.buckets.delete(k);
      }
    }

    if (!existing || existing.resetAt <= now) {
      const fresh: BucketEntry = {
        count: 1,
        resetAt: now + this.windowMs,
      };
      this.buckets.set(key, fresh);

      return {
        allowed: true,
        remaining: this.limit - 1,
        resetAt: fresh.resetAt,
        limit: this.limit,
      };
    }

    if (existing.count >= this.limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: existing.resetAt,
        limit: this.limit,
      };
    }

    existing.count += 1;

    return {
      allowed: true,
      remaining: this.limit - existing.count,
      resetAt: existing.resetAt,
      limit: this.limit,
    };
  }
}

// ==========================================================
// Upstash Redis (REST) реализация
// ==========================================================

interface UpstashPipelineResult {
  result: number | string | null;
}

class UpstashRateLimiter implements RateLimiter {
  private readonly url: string;
  private readonly token: string;
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(url: string, token: string, limit: number, windowMs: number) {
    this.url = url.replace(/\/$/, "");
    this.token = token;
    this.limit = limit;
    this.windowMs = windowMs;
  }

  async check(key: string): Promise<RateLimitResult> {
    const windowSeconds = Math.ceil(this.windowMs / 1000);
    const redisKey = `rl:${key}`;

    // Используем pipeline: INCR + EXPIRE NX + TTL
    // Безопасно при гонках: EXPIRE NX ставит TTL только при первой установке.
    const pipeline = [
      ["INCR", redisKey],
      ["EXPIRE", redisKey, String(windowSeconds), "NX"],
      ["TTL", redisKey],
    ];

    const response = await fetch(`${this.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pipeline),
      // Защита от подвисаний
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      throw new Error(`Upstash REST ${response.status}`);
    }

    const data = (await response.json()) as UpstashPipelineResult[];
    const incrResult = data[0]?.result;
    const ttlResult = data[2]?.result;

    const currentCount =
      typeof incrResult === "number"
        ? incrResult
        : typeof incrResult === "string"
          ? Number(incrResult)
          : 0;

    const ttlSeconds =
      typeof ttlResult === "number" && ttlResult > 0 ? ttlResult : windowSeconds;

    const resetAt = Date.now() + ttlSeconds * 1000;

    if (currentCount > this.limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        limit: this.limit,
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, this.limit - currentCount),
      resetAt,
      limit: this.limit,
    };
  }
}

// ==========================================================
// Fallback: если Redis недоступен, используем in-memory
// ==========================================================

class FallbackRateLimiter implements RateLimiter {
  constructor(
    private readonly primary: RateLimiter,
    private readonly fallback: RateLimiter,
  ) {}

  async check(key: string): Promise<RateLimitResult> {
    try {
      return await this.primary.check(key);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(
        "[RateLimit] Redis недоступен, используется in-memory fallback:",
        error instanceof Error ? error.message : error,
      );
      return this.fallback.check(key);
    }
  }
}

// ==========================================================
// Конфигурация и фабрика
// ==========================================================

export interface RateLimitConfig {
  /** Максимум запросов в окне */
  limit: number;
  /** Размер окна в мс */
  windowMs: number;
  /** Имя лимитера (для ключей Redis) */
  scope: string;
}

export const LEAD_RATE_LIMIT: RateLimitConfig = {
  limit: 5,
  windowMs: 10 * 60 * 1000, // 10 минут
  scope: "lead",
};

export const CHAT_RATE_LIMIT: RateLimitConfig = {
  limit: 20,
  windowMs: 60 * 1000, // 1 минута
  scope: "chat",
};

function buildUpstashFromEnv(): RateLimiter | null {
  const url = process.env.RATE_LIMIT_REDIS_URL;
  if (!url || url.trim().length === 0) return null;

  // Парсим формат: redis(s)://default:TOKEN@host:port
  // Для Upstash REST ожидается https URL + отдельный токен.
  // Поддерживаем два варианта:
  //   1) https://xxx.upstash.io  +  RATE_LIMIT_REDIS_TOKEN
  //   2) rediss://default:TOKEN@xxx.upstash.io:6379 — извлекаем и преобразуем
  try {
    if (url.startsWith("http")) {
      const token = process.env.RATE_LIMIT_REDIS_TOKEN;
      if (!token) return null;
      return new UpstashRateLimiter(url, token, LEAD_RATE_LIMIT.limit, LEAD_RATE_LIMIT.windowMs);
    }

    if (url.startsWith("redis://") || url.startsWith("rediss://")) {
      const parsed = new URL(url);
      const token = parsed.password || process.env.RATE_LIMIT_REDIS_TOKEN || "";
      const host = parsed.hostname;
      if (!token || !host) return null;
      const httpsUrl = `https://${host}`;
      return new UpstashRateLimiter(httpsUrl, token, LEAD_RATE_LIMIT.limit, LEAD_RATE_LIMIT.windowMs);
    }
  } catch {
    return null;
  }

  return null;
}

// ==========================================================
// Кеш экземпляров
// ==========================================================

const limiters = new Map<string, RateLimiter>();

export function getRateLimiter(config: RateLimitConfig): RateLimiter {
  const cached = limiters.get(config.scope);
  if (cached) return cached;

  const inMemory = new InMemoryRateLimiter(config.limit, config.windowMs);
  const upstash = buildUpstashFromEnv();

  let limiter: RateLimiter;
  if (upstash && config.scope === LEAD_RATE_LIMIT.scope) {
    limiter = new FallbackRateLimiter(upstash, inMemory);
  } else {
    limiter = inMemory;
  }

  limiters.set(config.scope, limiter);
  return limiter;
}

// ==========================================================
// Утилита: извлечение ключа лимита (IP)
// ==========================================================

export function getClientIp(request: Request): string {
  const headers = request.headers;

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp;

  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;

  return "unknown";
}

export function buildRateLimitKey(scope: string, identifier: string): string {
  return `${scope}:${identifier}`;
}