import { describe, expect, it } from "vitest";

import { leadSchema } from "@/lib/lead/schema";

// ==========================================================
// Хелпер: базовая валидная заявка
// ==========================================================

function buildValidLead(overrides: Record<string, unknown> = {}) {
  return {
    name: "Иван Петров",
    phone: "+998 90 123 45 67",
    courseId: "frontend-developer",
    preferredTime: "будни после 18:00",
    comment: "Хочу узнать про курс",
    consent: true,
    website: "",
    formStartedAt: Date.now() - 5000,
    source: "form" as const,
    ...overrides,
  };
}

// ==========================================================
// Тесты
// ==========================================================

describe("leadSchema", () => {
  describe("валидные данные", () => {
    it("принимает полностью заполненную заявку", () => {
      const result = leadSchema.safeParse(buildValidLead());
      expect(result.success).toBe(true);
    });

    it("принимает минимальную заявку (только обязательные поля)", () => {
      const result = leadSchema.safeParse({
        name: "Мария",
        phone: "+998901234567",
        consent: true,
        source: "modal",
      });
      expect(result.success).toBe(true);
    });

    it("принимает телефон в международном формате", () => {
      const variants = [
        "+998 90 123 45 67",
        "+7 (495) 123-45-67",
        "8 800 555 35 35",
        "998901234567",
      ];

      for (const phone of variants) {
        const result = leadSchema.safeParse(buildValidLead({ phone }));
        expect(result.success, `Телефон ${phone} должен быть валидным`).toBe(true);
      }
    });

    it("принимает source = chat/course/modal/form", () => {
      const sources = ["form", "modal", "course", "chat"] as const;
      for (const source of sources) {
        const result = leadSchema.safeParse(buildValidLead({ source }));
        expect(result.success).toBe(true);
      }
    });

    it("по умолчанию использует source=form", () => {
      const result = leadSchema.safeParse({
        name: "Иван",
        phone: "+998901234567",
        consent: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source).toBe("form");
      }
    });

    it("обрезает пробелы в name и comment", () => {
      const result = leadSchema.safeParse(
        buildValidLead({ name: "  Иван  ", comment: "  привет  " }),
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Иван");
        expect(result.data.comment).toBe("привет");
      }
    });

    it("принимает пустые строки для опциональных полей", () => {
      const result = leadSchema.safeParse(
        buildValidLead({
          courseId: "",
          preferredTime: "",
          comment: "",
          website: "",
        }),
      );
      expect(result.success).toBe(true);
    });
  });

  describe("валидация имени", () => {
    it("отклоняет слишком короткое имя", () => {
      const result = leadSchema.safeParse(buildValidLead({ name: "И" }));
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(messages.some((m) => m.includes("минимум 2"))).toBe(true);
      }
    });

    it("отклоняет слишком длинное имя (> 60)", () => {
      const result = leadSchema.safeParse(
        buildValidLead({ name: "И".repeat(61) }),
      );
      expect(result.success).toBe(false);
    });
  });

  describe("валидация телефона", () => {
    it("отклоняет слишком короткий телефон", () => {
      const result = leadSchema.safeParse(buildValidLead({ phone: "12345" }));
      expect(result.success).toBe(false);
    });

    it("отклоняет телефон с буквами", () => {
      const result = leadSchema.safeParse(
        buildValidLead({ phone: "+998 abc 123" }),
      );
      expect(result.success).toBe(false);
    });

    it("отклоняет телефон с символами кроме разрешённых", () => {
      const result = leadSchema.safeParse(
        buildValidLead({ phone: "+998/90/123" }),
      );
      expect(result.success).toBe(false);
    });
  });

  describe("валидация согласия", () => {
    it("требует обязательное согласие", () => {
      const result = leadSchema.safeParse(buildValidLead({ consent: false }));
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(
          messages.some((m) => m.includes("согласие на обработку")),
        ).toBe(true);
      }
    });

    it("отклоняет undefined для consent", () => {
      const result = leadSchema.safeParse(buildValidLead({ consent: undefined }));
      expect(result.success).toBe(false);
    });
  });

  describe("валидация honeypot", () => {
    it("отклоняет заполненный honeypot (website)", () => {
      const result = leadSchema.safeParse(
        buildValidLead({ website: "http://spam.example" }),
      );
      expect(result.success).toBe(false);
    });

    it("принимает пустой website", () => {
      const result = leadSchema.safeParse(buildValidLead({ website: "" }));
      expect(result.success).toBe(true);
    });

    it("принимает отсутствующий website", () => {
      const data = buildValidLead();
      delete (data as Record<string, unknown>).website;
      const result = leadSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("валидация комментария", () => {
    it("отклоняет слишком длинный комментарий (> 500)", () => {
      const result = leadSchema.safeParse(
        buildValidLead({ comment: "x".repeat(501) }),
      );
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(messages.some((m) => m.includes("Не более 500"))).toBe(true);
      }
    });

    it("принимает комментарий ровно 500 символов", () => {
      const result = leadSchema.safeParse(
        buildValidLead({ comment: "x".repeat(500) }),
      );
      expect(result.success).toBe(true);
    });
  });

  describe("UTM-метки", () => {
    it("принимает объект UTM", () => {
      const result = leadSchema.safeParse(
        buildValidLead({
          utm: {
            utm_source: "google",
            utm_medium: "cpc",
            utm_campaign: "spring",
          },
        }),
      );
      expect(result.success).toBe(true);
    });

    it("отклоняет UTM со слишком длинным значением", () => {
      const result = leadSchema.safeParse(
        buildValidLead({
          utm: { utm_source: "x".repeat(201) },
        }),
      );
      expect(result.success).toBe(false);
    });
  });

  describe("валидация source", () => {
    it("отклоняет неизвестный source", () => {
      const result = leadSchema.safeParse(buildValidLead({ source: "unknown" }));
      expect(result.success).toBe(false);
    });
  });
});