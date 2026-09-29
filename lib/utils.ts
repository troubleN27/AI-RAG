import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Объединение классов с учётом Tailwind (разрешает конфликты).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Форматирование цены.
 */
export function formatPrice(
  amount: number,
  currency: string,
  options?: { from?: boolean; locale?: string },
): string {
  const locale = options?.locale ?? "ru-RU";
  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

  return options?.from ? `от ${formatted}` : formatted;
}

/**
 * Форматирование даты в человекочитаемый вид.
 */
export function formatDate(
  input: string | Date,
  options?: Intl.DateTimeFormatOptions,
  locale = "ru-RU",
): string {
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
  }).format(date);
}

/**
 * Инициалы из имени (для аватаров).
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

/**
 * Нормализация телефона: удаляем пробелы, скобки, дефисы.
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/[\s()\-]/g, "");
}

/**
 * Простой debounce.
 */
export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Ограничение значения в диапазоне.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Генерация UUID с фолбэком.
 */
export function uuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Безопасная проверка на браузер.
 */
export const isBrowser = typeof window !== "undefined";

/**
 * Безопасный парсинг JSON с фолбэком.
 */
export function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/**
 * Получение UTM-меток из текущего URL.
 */
export function getUtmFromLocation(): Record<string, string> | undefined {
  if (!isBrowser) return undefined;

  const params = new URLSearchParams(window.location.search);
  const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
  const result: Record<string, string> = {};

  for (const key of utmKeys) {
    const value = params.get(key);
    if (value) result[key] = value;
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Чтение UTM из sessionStorage с сохранением.
 */
const UTM_STORAGE_KEY = "utm:v1";

export function persistUtmFromLocation(): void {
  if (!isBrowser) return;
  const utm = getUtmFromLocation();
  if (!utm) return;
  try {
    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
  } catch {
    /* noop */
  }
}

export function readPersistedUtm(): Record<string, string> | undefined {
  if (!isBrowser) return undefined;
  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    return safeJsonParse<Record<string, string> | undefined>(raw, undefined);
  } catch {
    return undefined;
  }
}