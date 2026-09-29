import type { LeadInput } from "@/lib/lead/schema";
import { TursoSink } from "@/lib/lead/tursoSink";
import { normalizePhone } from "@/lib/utils";

// ==========================================================
// Типы
// ==========================================================

export interface Lead {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  courseId?: string;
  courseTitle?: string;
  preferredTime?: string;
  comment?: string;
  source: LeadInput["source"];
  utm?: Record<string, string>;
  pageUrl?: string;
  userAgent?: string;
}

export interface LeadSink {
  readonly name: string;
  send(lead: Lead): Promise<void>;
}

// ==========================================================
// Утилиты
// ==========================================================

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function maskPhone(phone: string): string {
  const normalized = normalizePhone(phone);
  if (normalized.length <= 4) return "***";
  const visibleTail = normalized.slice(-2);
  const visibleHead = normalized.startsWith("+") ? normalized.slice(0, 3) : normalized.slice(0, 1);
  return `${visibleHead} ** *** ** ${visibleTail}`;
}

export function maskLeadForLog(lead: Lead): Lead {
  return {
    ...lead,
    phone: maskPhone(lead.phone),
  };
}

// ==========================================================
// Формат сообщения
// ==========================================================

export function formatLeadText(lead: Lead): string {
  const lines: string[] = [
    "🆕 Новая заявка с сайта",
    "",
    `👤 Имя: ${lead.name}`,
    `📞 Телефон: ${lead.phone}`,
  ];

  if (lead.courseTitle) lines.push(`📚 Курс: ${lead.courseTitle}`);
  else if (lead.courseId) lines.push(`📚 Курс: ${lead.courseId}`);

  if (lead.preferredTime) lines.push(`🕒 Удобное время: ${lead.preferredTime}`);
  if (lead.comment) lines.push(`💬 Комментарий: ${lead.comment}`);

  lines.push("");
  lines.push(`📍 Источник: ${lead.source}`);
  if (lead.pageUrl) lines.push(`🔗 Страница: ${lead.pageUrl}`);

  if (lead.utm && Object.keys(lead.utm).length > 0) {
    const utmParts = Object.entries(lead.utm)
      .map(([k, v]) => `${k}=${v}`)
      .join(" · ");
    lines.push(`📈 UTM: ${utmParts}`);
  }

  lines.push("");
  lines.push(`🆔 ${lead.id}`);
  lines.push(`⏱ ${lead.createdAt}`);

  return lines.join("\n");
}

export function formatLeadHtml(lead: Lead): string {
  const rows: Array<[string, string]> = [
    ["Имя", escapeHtml(lead.name)],
    ["Телефон", escapeHtml(lead.phone)],
  ];

  if (lead.courseTitle) rows.push(["Курс", escapeHtml(lead.courseTitle)]);
  else if (lead.courseId) rows.push(["Курс", escapeHtml(lead.courseId)]);

  if (lead.preferredTime) rows.push(["Удобное время", escapeHtml(lead.preferredTime)]);
  if (lead.comment) rows.push(["Комментарий", escapeHtml(lead.comment)]);

  rows.push(["Источник", escapeHtml(lead.source)]);
  if (lead.pageUrl) rows.push(["Страница", escapeHtml(lead.pageUrl)]);

  if (lead.utm && Object.keys(lead.utm).length > 0) {
    rows.push([
      "UTM",
      escapeHtml(
        Object.entries(lead.utm)
          .map(([k, v]) => `${k}=${v}`)
          .join(" · "),
      ),
    ]);
  }

  rows.push(["ID", escapeHtml(lead.id)]);
  rows.push(["Создано", escapeHtml(lead.createdAt)]);

  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px;font-weight:600;background:#f6f7fb;border:1px solid #e4e6ee;">${label}</td><td style="padding:6px 12px;border:1px solid #e4e6ee;">${value}</td></tr>`,
    )
    .join("");

  return `
    <div style="font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:14px;color:#12141c;">
      <h2 style="margin:0 0 12px;">🆕 Новая заявка с сайта</h2>
      <table style="border-collapse:collapse;min-width:360px;">${tableRows}</table>
    </div>
  `.trim();
}

// ==========================================================
// ConsoleSink
// ==========================================================

export class ConsoleSink implements LeadSink {
  readonly name = "console";

  async send(lead: Lead): Promise<void> {
    // eslint-disable-next-line no-console
    console.info("[LeadSink:console] Новая заявка:", maskLeadForLog(lead));
  }
}

// ==========================================================
// TelegramSink
// ==========================================================

interface TelegramSinkConfig {
  botToken: string;
  chatId: string;
  timeoutMs?: number;
}

export class TelegramSink implements LeadSink {
  readonly name = "telegram";
  private readonly config: Required<TelegramSinkConfig>;

  constructor(config: TelegramSinkConfig) {
    this.config = {
      timeoutMs: 10_000,
      ...config,
    };
  }

  async send(lead: Lead): Promise<void> {
    const url = `https://api.telegram.org/bot${this.config.botToken}/sendMessage`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: this.config.chatId,
          text: formatLeadText(lead),
          disable_web_page_preview: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(
          `Telegram API ответил ${response.status}: ${body.slice(0, 200)}`,
        );
      }
    } finally {
      clearTimeout(timeout);
    }
  }
}

// ==========================================================
// EmailSink
// ==========================================================

interface EmailSinkConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  to: string;
  secure?: boolean;
}

interface NodemailerTransporter {
  sendMail(options: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<unknown>;
}

interface NodemailerModule {
  createTransport(options: {
    host: string;
    port: number;
    secure: boolean;
    auth?: { user: string; pass: string };
  }): NodemailerTransporter;
}

export class EmailSink implements LeadSink {
  readonly name = "email";
  private readonly config: EmailSinkConfig;

  constructor(config: EmailSinkConfig) {
    this.config = config;
  }

  private async getTransporter(): Promise<NodemailerTransporter> {
    let nodemailer: NodemailerModule;

    try {
      // Динамический импорт: пакет нужен только при активном EmailSink
      const mod = (await import(
        /* webpackIgnore: true */ "nodemailer"
      )) as unknown as NodemailerModule | { default: NodemailerModule };

      nodemailer = "default" in mod ? mod.default : mod;
    } catch {
      throw new Error(
        "EmailSink требует пакет nodemailer. Установите: pnpm add nodemailer",
      );
    }

    const port = Number(this.config.port);
    const secure = this.config.secure ?? port === 465;

    return nodemailer.createTransport({
      host: this.config.host,
      port,
      secure,
      auth:
        this.config.user && this.config.pass
          ? { user: this.config.user, pass: this.config.pass }
          : undefined,
    });
  }

  async send(lead: Lead): Promise<void> {
    const transporter = await this.getTransporter();

    await transporter.sendMail({
      from: this.config.from,
      to: this.config.to,
      subject: `Новая заявка с сайта — ${lead.name}`,
      text: formatLeadText(lead),
      html: formatLeadHtml(lead),
    });
  }
}

// ==========================================================
// SheetsSink
// ==========================================================

interface SheetsSinkConfig {
  spreadsheetId: string;
  serviceAccountJson: string;
  sheetName?: string;
}

interface SheetsModule {
  google: {
    auth: {
      GoogleAuth: new (options: {
        credentials: Record<string, unknown>;
        scopes: string[];
      }) => unknown;
    };
    sheets: (options: { version: string; auth: unknown }) => {
      spreadsheets: {
        values: {
          append(options: {
            spreadsheetId: string;
            range: string;
            valueInputOption: string;
            requestBody: { values: string[][] };
          }): Promise<unknown>;
        };
      };
    };
  };
}

export class SheetsSink implements LeadSink {
  readonly name = "sheets";
  private readonly config: Required<SheetsSinkConfig>;

  constructor(config: SheetsSinkConfig) {
    this.config = {
      sheetName: "Leads",
      ...config,
    };
  }

  async send(lead: Lead): Promise<void> {
    let credentials: Record<string, unknown>;
    try {
      credentials = JSON.parse(this.config.serviceAccountJson) as Record<string, unknown>;
    } catch {
      throw new Error("SheetsSink: не удалось распарсить GOOGLE_SERVICE_ACCOUNT_JSON");
    }

    let sheetsMod: SheetsModule;
    try {
      const mod = (await import(
        /* webpackIgnore: true */ "googleapis"
      )) as unknown as SheetsModule | { default: SheetsModule };
      sheetsMod = "default" in mod ? mod.default : mod;
    } catch {
      throw new Error(
        "SheetsSink требует пакет googleapis. Установите: pnpm add googleapis",
      );
    }

    const auth = new sheetsMod.google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = sheetsMod.google.sheets({ version: "v4", auth });

    const row: string[] = [
      lead.createdAt,
      lead.name,
      lead.phone,
      lead.courseTitle ?? lead.courseId ?? "",
      lead.preferredTime ?? "",
      lead.comment ?? "",
      lead.source,
      lead.utm
        ? Object.entries(lead.utm)
            .map(([k, v]) => `${k}=${v}`)
            .join(" · ")
        : "",
      lead.pageUrl ?? "",
      lead.id,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: this.config.spreadsheetId,
      range: `${this.config.sheetName}!A:J`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });
  }
}

// ==========================================================
// Фабрика приёмников
// ==========================================================

function parseSinksList(): string[] {
  const raw = process.env.LEAD_SINKS ?? "console";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function buildTelegramSink(): LeadSink | null {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return null;
  return new TelegramSink({ botToken, chatId });
}

function buildEmailSink(): LeadSink | null {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.LEAD_EMAIL_FROM;
  const to = process.env.LEAD_EMAIL_TO;

  if (!host || !port || !from || !to) return null;

  return new EmailSink({
    host,
    port: Number(port),
    user: user ?? "",
    pass: pass ?? "",
    from,
    to,
  });
}

function buildSheetsSink(): LeadSink | null {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!spreadsheetId || !serviceAccountJson) return null;
  return new SheetsSink({ spreadsheetId, serviceAccountJson });
}

function buildTursoSink(): LeadSink | null {
  if (!process.env.TURSO_DATABASE_URL) return null;
  return new TursoSink();
}

export function getLeadSinks(): LeadSink[] {
  const requested = parseSinksList();
  const sinks: LeadSink[] = [];

  for (const name of requested) {
    switch (name) {
      case "console": {
        sinks.push(new ConsoleSink());
        break;
      }
      case "telegram": {
        const sink = buildTelegramSink();
        if (sink) sinks.push(sink);
        else
          // eslint-disable-next-line no-console
          console.warn(
            "[LeadSink] telegram пропущен: не заданы TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID",
          );
        break;
      }
      case "email": {
        const sink = buildEmailSink();
        if (sink) sinks.push(sink);
        else
          // eslint-disable-next-line no-console
          console.warn(
            "[LeadSink] email пропущен: не заданы SMTP_HOST / SMTP_PORT / LEAD_EMAIL_FROM / LEAD_EMAIL_TO",
          );
        break;
      }
      case "sheets": {
        const sink = buildSheetsSink();
        if (sink) sinks.push(sink);
        else
          // eslint-disable-next-line no-console
          console.warn(
            "[LeadSink] sheets пропущен: не заданы GOOGLE_SHEETS_ID / GOOGLE_SERVICE_ACCOUNT_JSON",
          );
        break;
      }
      case "turso": {
        const sink = buildTursoSink();
        if (sink) sinks.push(sink);
        else
          // eslint-disable-next-line no-console
          console.warn(
            "[LeadSink] turso пропущен: не заданы TURSO_DATABASE_URL / TURSO_AUTH_TOKEN",
          );
        break;
      }
      default: {
        // eslint-disable-next-line no-console
        console.warn(`[LeadSink] неизвестный приёмник: ${name}`);
      }
    }
  }

  // Фолбэк: если ничего не активировалось — используем console
  if (sinks.length === 0) {
    sinks.push(new ConsoleSink());
  }

  return sinks;
}

// ==========================================================
// Доставка во все приёмники (успех = хотя бы один)
// ==========================================================

export interface DispatchResult {
  delivered: boolean;
  errors: Array<{ sink: string; message: string }>;
}

export async function dispatchLead(
  lead: Lead,
  sinks: LeadSink[] = getLeadSinks(),
): Promise<DispatchResult> {
  const results = await Promise.allSettled(
    sinks.map(async (sink) => {
      await sink.send(lead);
      return sink.name;
    }),
  );

  const errors: DispatchResult["errors"] = [];
  let delivered = false;

  results.forEach((result, index) => {
    const sinkName = sinks[index]?.name ?? "unknown";

    if (result.status === "fulfilled") {
      delivered = true;
    } else {
      const message =
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason);
      errors.push({ sink: sinkName, message });

      // eslint-disable-next-line no-console
      console.error(`[LeadSink:${sinkName}] ошибка доставки:`, message);
    }
  });

  return { delivered, errors };
}