import { createClient, type Client } from "@libsql/client";

/**
 * Подключение к Turso (libSQL).
 *
 * Только для серверного кода: из клиентских компонентов импортировать
 * нельзя, иначе TURSO_AUTH_TOKEN уедет в бандл.
 *
 * Клиент кэшируется на globalThis, а не в переменной модуля: на Vercel
 * это не обязательно, но при `next dev` модуль перезагружается на каждое
 * изменение, и без кэша на каждый hot-reload плодился бы новый пул
 * HTTP-соединений к Turso.
 */

const globalForDb = globalThis as unknown as {
  __tursoClient?: Client;
};

export class DbConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DbConfigError";
  }
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.TURSO_DATABASE_URL);
}

/**
 * Возвращает готовый клиент или null, если БД не настроена.
 * null удобен для вызывающего кода: «БД не подключена» — это
 * штатная ситуация на локальной разработке, а не ошибка.
 */
export function getDb(): Client | null {
  if (!isDbConfigured()) return null;

  if (!globalForDb.__tursoClient) {
    const url = process.env.TURSO_DATABASE_URL!;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!authToken) {
      // Без токена Turso ответит 401, но понятнее сказать это тут.
      if (url.startsWith("file:")) {
        // Локальный файл работает без токена — это нормально.
      } else {
        throw new DbConfigError(
          "TURSO_AUTH_TOKEN не задан, а TURSO_DATABASE_URL указывает на удалённую базу",
        );
      }
    }

    // Для libsql:// и https:// драйвер сам выберет hrana по HTTP,
    // что и нужно на serverless: нативных биндингов там нет.
    globalForDb.__tursoClient = createClient({ url, authToken });
  }

  return globalForDb.__tursoClient;
}
