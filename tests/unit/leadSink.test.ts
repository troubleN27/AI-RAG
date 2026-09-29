import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ConsoleSink,
  dispatchLead,
  escapeHtml,
  formatLeadHtml,
  formatLeadText,
  maskPhone,
  type Lead,
  type LeadSink,
} from "@/lib/lead/sink";

// ==========================================================
// Хелпер: тестовая заявка
// ==========================================================

function buildLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: "lead-uuid-123",
    createdAt: "2026-09-28T10:00:00.000Z",
    name: "Иван Петров",
    phone: "+998901234567",
    courseId: "frontend-developer",
    courseTitle: "Frontend-разработчик",
    preferredTime: "будни после 18:00",
    comment: "Хочу узнать подробности",
    source: "form",
    utm: { utm_source: "google", utm_medium: "cpc" },
    pageUrl: "https://example.com/",
    userAgent: "Mozilla/5.0",
    ...overrides,
  };
}

// ==========================================================
// Тесты
// ==========================================================

describe("escapeHtml", () => {
  it("экранирует опасные символы", () => {
    expect(escapeHtml("<script>alert('x')</script>")).toBe(
      "&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;",
    );
  });

  it("экранирует амперсанды", () => {
    expect(escapeHtml("Tom & Jerry")).toBe("Tom &amp; Jerry");
  });

  it("экранирует двойные кавычки", () => {
    expect(escapeHtml('say "hi"')).toBe("say &quot;hi&quot;");
  });

  it("оставляет безопасный текст без изменений", () => {
    expect(escapeHtml("Обычный текст")).toBe("Обычный текст");
  });
});

describe("maskPhone", () => {
  it("маскирует средние цифры", () => {
    const masked = maskPhone("+998901234567");
    expect(masked).not.toContain("901234");
    expect(masked).toContain("**");
  });

  it("сохраняет префикс и последние 2 цифры", () => {
    const masked = maskPhone("+998901234567");
    expect(masked.startsWith("+99")).toBe(true);
    expect(masked.endsWith("67")).toBe(true);
  });

  it("не падает на коротком номере", () => {
    const masked = maskPhone("123");
    expect(masked).toBe("***");
  });
});

describe("formatLeadText", () => {
  it("включает все ключевые поля", () => {
    const text = formatLeadText(buildLead());

    expect(text).toContain("Иван Петров");
    expect(text).toContain("+998901234567");
    expect(text).toContain("Frontend-разработчик");
    expect(text).toContain("будни после 18:00");
    expect(text).toContain("Хочу узнать подробности");
    expect(text).toContain("form");
    expect(text).toContain("https://example.com/");
    expect(text).toContain("utm_source=google");
    expect(text).toContain("utm_medium=cpc");
    expect(text).toContain("lead-uuid-123");
  });

  it("использует courseId, если courseTitle отсутствует", () => {
    const text = formatLeadText(
      buildLead({ courseTitle: undefined, courseId: "frontend-developer" }),
    );
    expect(text).toContain("frontend-developer");
  });

  it("не содержит лишних строк при пустых опциональных полях", () => {
    const text = formatLeadText(
      buildLead({
        courseId: undefined,
        courseTitle: undefined,
        preferredTime: undefined,
        comment: undefined,
        utm: undefined,
        pageUrl: undefined,
      }),
    );
    expect(text).not.toContain("undefined");
    expect(text).not.toContain("null");
  });
});

describe("formatLeadHtml", () => {
  it("возвращает HTML-таблицу с заявкой", () => {
    const html = formatLeadHtml(buildLead());
    expect(html).toContain("<table");
    expect(html).toContain("Иван Петров");
    expect(html).toContain("+998901234567");
  });

  it("экранирует потенциально опасные значения", () => {
    const html = formatLeadHtml(
      buildLead({ name: "<script>alert(1)</script>" }),
    );
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("ConsoleSink", () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    infoSpy.mockRestore();
  });

  it("логирует заявку с маскированным телефоном", async () => {
    const sink = new ConsoleSink();
    await sink.send(buildLead());

    expect(infoSpy).toHaveBeenCalledTimes(1);

    const [prefix, payload] = infoSpy.mock.calls[0] ?? [];
    expect(prefix).toContain("LeadSink:console");

    const logged = payload as Lead;
    expect(logged.phone).not.toBe("+998901234567");
    expect(logged.phone).toContain("**");
    expect(logged.name).toBe("Иван Петров");
  });

  it("имеет имя sink-а = console", () => {
    const sink = new ConsoleSink();
    expect(sink.name).toBe("console");
  });
});

describe("dispatchLead", () => {
  it("считает заявку доставленной, если сработал хотя бы один приёмник", async () => {
    const sinkA: LeadSink = {
      name: "a",
      send: vi.fn().mockResolvedValue(undefined),
    };
    const sinkB: LeadSink = {
      name: "b",
      send: vi.fn().mockRejectedValue(new Error("boom")),
    };

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await dispatchLead(buildLead(), [sinkA, sinkB]);

    expect(result.delivered).toBe(true);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.sink).toBe("b");

    errorSpy.mockRestore();
  });

  it("возвращает delivered=false, если все приёмники упали", async () => {
    const sinkA: LeadSink = {
      name: "a",
      send: vi.fn().mockRejectedValue(new Error("a-error")),
    };
    const sinkB: LeadSink = {
      name: "b",
      send: vi.fn().mockRejectedValue(new Error("b-error")),
    };

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await dispatchLead(buildLead(), [sinkA, sinkB]);

    expect(result.delivered).toBe(false);
    expect(result.errors).toHaveLength(2);

    errorSpy.mockRestore();
  });

  it("передаёт заявку во все приёмники параллельно", async () => {
    const events: string[] = [];
    let releaseSlow: () => void = () => {};
    let releaseFast: () => void = () => {};

    const slowGate = new Promise<void>((resolve) => {
      releaseSlow = resolve;
    });
    const fastGate = new Promise<void>((resolve) => {
      releaseFast = resolve;
    });

    const makeSink = (name: string, gate: Promise<void>): LeadSink => ({
      name,
      send: async () => {
        events.push(`${name}:start`);
        await gate;
        events.push(`${name}:end`);
      },
    });

    const dispatch = dispatchLead(buildLead(), [
      makeSink("slow", slowGate),
      makeSink("fast", fastGate),
    ]);

    // Оба приёмника должны стартовать до завершения первого —
    // при последовательном выполнении «slow:end» шёл бы раньше «fast:start».
    await vi.waitFor(() => {
      expect(events).toContain("slow:start");
      expect(events).toContain("fast:start");
    });

    releaseFast();
    releaseSlow();

    const result = await dispatch;

    expect(result.delivered).toBe(true);
    expect(events.indexOf("fast:start")).toBeLessThan(events.indexOf("slow:end"));
    expect(events.indexOf("fast:end")).toBeLessThan(events.indexOf("slow:end"));
  });

  it("успешный приёмник получает объект Lead без маскирования", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const sink: LeadSink = { name: "test", send };

    const lead = buildLead();
    await dispatchLead(lead, [sink]);

    expect(send).toHaveBeenCalledTimes(1);
    const passed = send.mock.calls[0]?.[0] as Lead;
    expect(passed.phone).toBe(lead.phone); // не маскируется
    expect(passed.name).toBe(lead.name);
  });
});