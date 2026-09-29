import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

import type { Auth } from "googleapis";

// ==========================================================
// Google Service Account Auth (singleton)
// ==========================================================

let cachedAuth: Auth.GoogleAuth | null = null;

interface GoogleModule {
  google: {
    auth: {
      GoogleAuth: new (options: {
        credentials: Record<string, unknown>;
        scopes: string[];
      }) => Auth.GoogleAuth;
    };
  };
}

async function loadGoogle(): Promise<GoogleModule> {
  try {
    const mod = (await import("googleapis")) as unknown as
      | GoogleModule
      | { default: GoogleModule };
    return "default" in mod ? mod.default : mod;
  } catch {
    throw new Error(
      "Для Google-интеграции требуется пакет googleapis. Установите: npm install googleapis",
    );
  }
}

// ==========================================================
// Загрузка credentials
// ==========================================================

function loadCredentialsFromFile(filePath: string): Record<string, unknown> {
  const absolute = isAbsolute(filePath)
    ? filePath
    : resolve(process.cwd(), filePath);

  if (!existsSync(absolute)) {
    throw new Error(
      `Файл с credentials не найден: ${absolute}. Проверьте переменную GOOGLE_SERVICE_ACCOUNT_FILE.`,
    );
  }

  let raw: string;
  try {
    raw = readFileSync(absolute, "utf-8");
  } catch (error) {
    throw new Error(
      `Не удалось прочитать файл ${absolute}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch (error) {
    throw new Error(
      `Файл ${absolute} содержит невалидный JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

function loadCredentialsFromEnv(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();

  // Если значение случайно обёрнуто в одинарные/двойные кавычки — снимаем их
  const withoutOuterQuotes =
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
      ? trimmed.slice(1, -1)
      : trimmed;

  try {
    return JSON.parse(withoutOuterQuotes) as Record<string, unknown>;
  } catch (error) {
    throw new Error(
      `Не удалось распарсить GOOGLE_SERVICE_ACCOUNT_JSON: ${
        error instanceof Error ? error.message : String(error)
      }. Рекомендуем использовать GOOGLE_SERVICE_ACCOUNT_FILE (путь к файлу) вместо inline JSON.`,
    );
  }
}

function resolveCredentials(): Record<string, unknown> {
  const filePath = process.env.GOOGLE_SERVICE_ACCOUNT_FILE?.trim();
  if (filePath && filePath.length > 0) {
    return loadCredentialsFromFile(filePath);
  }

  const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (rawJson && rawJson.trim().length > 0) {
    return loadCredentialsFromEnv(rawJson);
  }

  throw new Error(
    "Не заданы credentials для Google API. Укажите GOOGLE_SERVICE_ACCOUNT_FILE (путь к JSON-файлу) или GOOGLE_SERVICE_ACCOUNT_JSON в .env.local.",
  );
}

// ==========================================================
// Публичный API
// ==========================================================

export async function getGoogleAuth(): Promise<Auth.GoogleAuth> {
  if (cachedAuth) return cachedAuth;

  const credentials = resolveCredentials();
  const { google } = await loadGoogle();

  cachedAuth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/spreadsheets.readonly",
    ],
  });

  return cachedAuth;
}

/**
 * Сброс singleton-авторизации (для тестов или hot-reload в dev).
 */
export function resetGoogleAuthCache(): void {
  cachedAuth = null;
}