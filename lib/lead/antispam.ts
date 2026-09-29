import type { LeadInput } from "@/lib/lead/schema";
import { normalizePhone } from "@/lib/utils";

// ==========================================================
// Типы
// ==========================================================

export type SpamReason =
  | "honeypot_filled"
  | "too_fast"
  | "duplicate"
  | "suspicious_name"
  | "suspicious_phone";

export interface AntispamVerdict {
  /** true — заявка считается спамом */
  isSpam: boolean;
  /** Причина (если спам) */
  reason?: SpamReason;
}

// ==========================================================
// Конфигурация (настраиваемая)
// ==========================================================

export const ANTISPAM_CONFIG = {
  /** Минимальное время заполнения формы (мс) — быстрее = спам */
  minFillTimeMs: 3000,
  /** Окно для проверки дубликатов (мс) */
  duplicateWindowMs: 5 * 60 * 1000,
  /** Максимум одинаковых телефонов за окно */
  duplicateThreshold: 2,
};

// ==========================================================
// Список подозрительных паттернов
// ==========================================================

const SUSPICIOUS_NAME_PATTERNS: RegExp[] = [
  /https?:\/\//i,
  /www\./i,
  /<a\s/i,
  /\[url=/i,
  /\bviagra\b/i,
  /\bcasino\b/i,
  /\bcrypto\b/i,
  /\bseo\s+services\b/i,
];

const SUSPICIOUS_PHONE_PATTERNS: RegExp[] = [
  /^0+$/, // все нули
  /^(\d)\1+$/, // один и тот же символ
];

// ==========================================================
// Проверки
// ==========================================================

function checkHoneypot(input: LeadInput): AntispamVerdict | null {
  if (input.website && input.website.trim().length > 0) {
    return { isSpam: true, reason: "honeypot_filled" };
  }
  return null;
}

function checkFillTime(input: LeadInput): AntispamVerdict | null {
  if (typeof input.formStartedAt !== "number") return null;

  const elapsed = Date.now() - input.formStartedAt;

  // Если timestamp в будущем или сильно в прошлом — считаем невалидным
  if (elapsed < 0) {
    return { isSpam: true, reason: "too_fast" };
  }

  if (elapsed < ANTISPAM_CONFIG.minFillTimeMs) {
    return { isSpam: true, reason: "too_fast" };
  }

  return null;
}

function checkSuspiciousName(input: LeadInput): AntispamVerdict | null {
  const name = input.name.trim();

  for (const pattern of SUSPICIOUS_NAME_PATTERNS) {
    if (pattern.test(name)) {
      return { isSpam: true, reason: "suspicious_name" };
    }
  }

  // Имя не должно содержать цифр больше 3 подряд
  if (/\d{4,}/.test(name)) {
    return { isSpam: true, reason: "suspicious_name" };
  }

  return null;
}

function checkSuspiciousPhone(input: LeadInput): AntispamVerdict | null {
  const digits = normalizePhone(input.phone).replace(/[^\d]/g, "");

  for (const pattern of SUSPICIOUS_PHONE_PATTERNS) {
    if (pattern.test(digits)) {
      return { isSpam: true, reason: "suspicious_phone" };
    }
  }

  return null;
}

// ==========================================================
// Проверка дубликатов (in-memory, со скользящим окном)
// ==========================================================

interface DuplicateEntry {
  timestamps: number[];
}

const duplicateBuckets = new Map<string, DuplicateEntry>();

function pruneDuplicates(now: number): void {
  if (duplicateBuckets.size < 100) return;

  const cutoff = now - ANTISPAM_CONFIG.duplicateWindowMs;
  for (const [key, entry] of duplicateBuckets) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) duplicateBuckets.delete(key);
  }
}

function checkDuplicate(input: LeadInput): AntispamVerdict | null {
  const now = Date.now();
  pruneDuplicates(now);

  const phoneKey = normalizePhone(input.phone);
  if (!phoneKey) return null;

  const entry = duplicateBuckets.get(phoneKey) ?? { timestamps: [] };
  const cutoff = now - ANTISPAM_CONFIG.duplicateWindowMs;
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  // Превышение порога: фиксируем, но всё равно инкрементим
  const isDuplicate = entry.timestamps.length >= ANTISPAM_CONFIG.duplicateThreshold;

  entry.timestamps.push(now);
  duplicateBuckets.set(phoneKey, entry);

  if (isDuplicate) {
    return { isSpam: true, reason: "duplicate" };
  }

  return null;
}

// ==========================================================
// Основная функция
// ==========================================================

export function checkSpam(input: LeadInput): AntispamVerdict {
  const checks = [
    checkHoneypot(input),
    checkFillTime(input),
    checkSuspiciousName(input),
    checkSuspiciousPhone(input),
    checkDuplicate(input),
  ];

  for (const verdict of checks) {
    if (verdict?.isSpam) return verdict;
  }

  return { isSpam: false };
}

// ==========================================================
// Утилита для тестов: сбросить внутреннее состояние
// ==========================================================

export function __resetAntispamState(): void {
  duplicateBuckets.clear();
}