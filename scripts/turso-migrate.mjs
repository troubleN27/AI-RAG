/**
 * Применение миграций к Turso через HTTP API.
 *
 * Зачем не turso CLI: официальный бинарь turso/tursodb умеет только
 * локальный SQL-шел, а npm-пакет turso — то же самое. Управлять
 * удалённой базой из npm нечем, поэтому запросы идут напрямую
 * в /v2/pipeline. Токен при этом не нужен в коде — читается из
 * переменных окружения.
 *
 * Требует TURSO_DATABASE_URL и TURSO_AUTH_TOKEN.
 *
 *   node scripts/turso-migrate.mjs
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(HERE, "..", "migrations");

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("TURSO_DATABASE_URL не задан");
  process.exit(1);
}
if (!authToken) {
  console.error("TURSO_AUTH_TOKEN не задан");
  process.exit(1);
}

// libsql:// на https для HTTP-транспорта
const httpBase = url.replace(/^libsql:\/\//, "https://");
const endpoint = `${httpBase}/v2/pipeline`;

async function pipeline(statements) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: statements.map((sql) => ({
        type: "execute",
        stmt: { sql },
      })),
    }),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 500)}`);
  }

  const data = await res.json();
  const error = data.results?.find((r) => r.type === "error");
  if (error) {
    throw new Error(`SQL ошибка: ${error.error?.message ?? "неизвестно"}`);
  }
  return data;
}

/** Разбивает файл на отдельные запрос: комментарии убираем, режем по ";". */
function splitStatements(sql) {
  return sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

const files = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort();

if (files.length === 0) {
  console.log("Нет .sql файлов в migrations/");
  process.exit(0);
}

console.log(`БД: ${url}`);
console.log(`Миграций: ${files.join(", ")}\n`);

for (const file of files) {
  const statements = splitStatements(readFileSync(join(MIGRATIONS_DIR, file), "utf8"));
  process.stdout.write(`  ${file}: ${statements.length} запрос(ов) ... `);
  try {
    await pipeline(statements);
    console.log("ок");
  } catch (e) {
    console.log("ОШИБКА");
    console.error(`\n${e.message}\n`);
    process.exit(1);
  }
}

console.log("\nГотово.");
