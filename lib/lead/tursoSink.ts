import { getDb } from "@/lib/db/client";
import { normalizePhone } from "@/lib/utils";

// Только типы: стирается при сборке, поэтому цикла с sink.ts
// в рантайме не возникает.
import type { Lead, LeadSink } from "./sink";

/**
 * Приёмник, пишущий заявку в Turso.
 *
 * Живёт отдельным файлом, а не в sink.ts: у остальных приёмников
 * нет зависимостей кроме fetch, а тут клиент БД. В serverless-бандл
 * он попадёт только если реально выбран через LEAD_SINKS, потому
 * что импорт статический — но это цена одного файла.
 */

const INSERT_SQL = `
  INSERT INTO leads (
    id, created_at, name, phone, phone_normalized,
    course_id, course_title, preferred_time, comment,
    source, utm_json, page_url, status
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')
  ON CONFLICT(id) DO NOTHING
`;

export class TursoSink implements LeadSink {
  readonly name = "turso";

  async send(lead: Lead): Promise<void> {
    const db = getDb();
    if (!db) {
      throw new Error(
        "TURSO_DATABASE_URL не задан: Turso-приёмник не может работать",
      );
    }

    // UTM — свободная структура, поэтому в колонку идёт JSON.
    // null вместо "{}": пустой объект не должен выглядеть как
    // «кампания была, но без меток».
    const utmJson =
      lead.utm && Object.keys(lead.utm).length > 0
        ? JSON.stringify(lead.utm)
        : null;

    await db.execute({
      sql: INSERT_SQL,
      args: [
        lead.id,
        lead.createdAt,
        lead.name,
        lead.phone,
        normalizePhone(lead.phone),
        lead.courseId ?? null,
        lead.courseTitle ?? null,
        lead.preferredTime ?? null,
        lead.comment ?? null,
        lead.source,
        utmJson,
        lead.pageUrl ?? null,
      ],
    });
  }
}

/**
 * Сколько раз этот номер уже присылал заявку за последние 24 часа.
 *
 * Форма перезагружают, кнопку жмут дважды, Connection-ов на Vercel
 * несколько. Дубликаты стоит отсекать на записи, а не полагаться на
 * то, что их не будет.
 */
export async function countRecentByPhone(
  phone: string,
  withinHours = 24,
): Promise<number> {
  const db = getDb();
  if (!db) return 0;

  const result = await db.execute({
    sql: `
      SELECT COUNT(*) AS n
      FROM leads
      WHERE phone_normalized = ?
        AND status != 'rejected'
        AND created_at >= datetime('now', ?)
    `,
    args: [normalizePhone(phone), `-${withinHours} hours`],
  });

  return Number(result.rows[0]?.n ?? 0);
}
