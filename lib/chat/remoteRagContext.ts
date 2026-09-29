import { loadAllDocsFromFolder } from "@/lib/chat/googleDriveLoader";
import { loadScheduleAsMarkdown } from "@/lib/chat/googleSheetsLoader";

// ==========================================================
// Конфигурация
// ==========================================================

const DEFAULT_TTL_MS = 60_000;

function getTtlMs(): number {
  const raw = process.env.RAG_CACHE_TTL_MS;
  if (!raw) return DEFAULT_TTL_MS;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_TTL_MS;
}

// ==========================================================
// Кеш + защита от race condition
// ==========================================================

interface CacheEntry {
  value: string;
  expiresAt: number;
}

let cached: CacheEntry | null = null;
let inFlight: Promise<string> | null = null;

// ==========================================================
// Сборка контекста
// ==========================================================

async function buildContext(): Promise<string> {
  const folderId = process.env.RAG_DRIVE_FOLDER_ID?.trim();
  const spreadsheetId = process.env.SCHEDULE_SPREADSHEET_ID?.trim();
  const sheetName = process.env.SCHEDULE_SHEET_NAME?.trim() || "Schedule";

  if (!folderId && !spreadsheetId) {
    // eslint-disable-next-line no-console
    console.warn(
      "[remote-rag] Ни RAG_DRIVE_FOLDER_ID, ни SCHEDULE_SPREADSHEET_ID не заданы — контекст пуст.",
    );
    return "";
  }

  const blocks: string[] = [];

  // 1. Документы из Google Drive (папка)
  if (folderId) {
    try {
      const docsText = await loadAllDocsFromFolder(folderId);
      if (docsText.length > 0) blocks.push(docsText);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        "[remote-rag] Ошибка чтения папки Google Drive:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  // 2. Расписание из Google Sheets
  if (spreadsheetId) {
    try {
      const scheduleText = await loadScheduleAsMarkdown(
        spreadsheetId,
        sheetName,
      );
      if (scheduleText.length > 0) blocks.push(scheduleText);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        "[remote-rag] Ошибка чтения Google Sheets:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  const value = blocks.join("\n\n---\n\n");

  // eslint-disable-next-line no-console
  console.info(
    `[remote-rag] Собрано данных: ${value.length} символов (TTL ${getTtlMs()} мс)`,
  );

  return value;
}

// ==========================================================
// Публичный API
// ==========================================================

/**
 * Возвращает актуальный RAG-контекст из Google. Кеш — на TTL
 * (по умолчанию 60 секунд). Параллельные запросы ждут один общий fetch.
 */
export async function loadRemoteRagContext(): Promise<string> {
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  if (inFlight) {
    return inFlight;
  }

  inFlight = (async () => {
    try {
      const value = await buildContext();
      cached = {
        value,
        expiresAt: Date.now() + getTtlMs(),
      };
      return value;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

/**
 * Принудительный сброс кеша (для тестов или эндпоинта /api/chat/refresh).
 */
export function resetRemoteRagCache(): void {
  cached = null;
}