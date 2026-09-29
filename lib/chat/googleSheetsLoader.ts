import { getGoogleAuth } from "@/lib/chat/googleAuth";

// ==========================================================
// Типы googleapis
// ==========================================================

interface SheetsModule {
  google: {
    sheets: (options: { version: string; auth: unknown }) => {
      spreadsheets: {
        values: {
          get(options: {
            spreadsheetId: string;
            range: string;
          }): Promise<{ data: { values?: string[][] } }>;
        };
      };
    };
  };
}

async function loadSheets() {
  const mod = (await import("googleapis")) as unknown as
    | SheetsModule
    | { default: SheetsModule };
  const google = "default" in mod ? mod.default : mod;
  const auth = await getGoogleAuth();
  return google.google.sheets({ version: "v4", auth });
}

// ==========================================================
// Утилиты
// ==========================================================

function escapeCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ").trim();
}

function rowsToMarkdownTable(rows: string[][]): string {
  if (rows.length === 0) return "";

  const [header, ...body] = rows;
  if (!header) return "";

  const headerLine = `| ${header.map(escapeCell).join(" | ")} |`;
  const separator = `| ${header.map(() => "---").join(" | ")} |`;

  const bodyLines = body
    .filter((row) => row.some((cell) => (cell ?? "").trim().length > 0))
    .map((row) => {
      // добиваем строку до ширины заголовка
      const padded = [...row];
      while (padded.length < header.length) padded.push("");
      return `| ${padded.map(escapeCell).join(" | ")} |`;
    });

  return [headerLine, separator, ...bodyLines].join("\n");
}

// ==========================================================
// Публичный API
// ==========================================================

/**
 * Читает лист и возвращает его содержимое как markdown-таблицу.
 */
export async function loadScheduleAsMarkdown(
  spreadsheetId: string,
  sheetName = "Schedule",
): Promise<string> {
  const sheets = await loadSheets();

  const range = `${sheetName}!A1:Z200`;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const rows = (response.data.values ?? []).map((row) =>
    row.map((cell) => String(cell ?? "")),
  );

  const table = rowsToMarkdownTable(rows);
  if (table.length === 0) return "";

  return `### Расписание занятий (Google Sheets: ${sheetName})\n\n${table}`;
}