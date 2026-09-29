import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// ==========================================================
// Загрузка RAG-документов из content/rag
// ==========================================================

const RAG_DIR = join(process.cwd(), "content", "rag");

let cachedContext: string | null = null;

/**
 * Читает все markdown-файлы из content/rag и склеивает их в одну строку.
 * Результат кешируется на время жизни процесса.
 */
export function loadRagContext(): string {
  if (cachedContext !== null) return cachedContext;

  if (!existsSync(RAG_DIR)) {
    // eslint-disable-next-line no-console
    console.warn(`[rag] Папка не найдена: ${RAG_DIR}`);
    cachedContext = "";
    return cachedContext;
  }

  const files = readdirSync(RAG_DIR)
    .filter((name) => name.toLowerCase().endsWith(".md"))
    .sort();

  const parts: string[] = [];

  for (const file of files) {
    try {
      const content = readFileSync(join(RAG_DIR, file), "utf-8").trim();
      if (content.length === 0) continue;
      parts.push(`### Документ: ${file}\n\n${content}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`[rag] Не удалось прочитать ${file}:`, error);
    }
  }

  cachedContext = parts.join("\n\n---\n\n");

  // eslint-disable-next-line no-console
  console.info(
    `[rag] Загружено документов: ${files.length}, символов: ${cachedContext.length}`,
  );

  return cachedContext;
}

/**
 * Сброс кеша (для тестов или hot-reload в dev).
 */
export function resetRagContextCache(): void {
  cachedContext = null;
}