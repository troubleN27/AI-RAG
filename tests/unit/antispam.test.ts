import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  __resetAntispamState,
  ANTISPAM_CONFIG,
  checkSpam,
} from "@/lib/lead/antispam";
import type { LeadInput } from "@/lib/lead/schema";

// ==========================================================
// Хелпер: валидная заявка
// ==========================================================

function buildLead(overrides: Partial<LeadInput> = {}): LeadInput {
  return {
    name: "Иван Петров",
    phone: "+998901234567",
    courseId: "frontend-developer",
    preferredTime: "",
    comment: "",
    consent: true,
    website: "",
    formStartedAt: Date.now() - 5000,
    source: "form",
    ...overrides,
  };
}

// ==========================================================
// Сброс состояния между тестами
// ==========================================================

beforeEach(() => {
  __resetAntispamState();
  vi.useRealTimers();
});

afterEach(() => {
  __resetAntispamState();
  vi.useRealTimers();
});

// ==========================================================
// Тесты
// ==========================================================

describe("checkSpam", () => {
  describe("чистая заявка", () => {
    it("не считает обычную заявку спамом", () => {
      const verdict = checkSpam(buildLead());
      expect(verdict.isSpam).toBe(false);
      expect(verdict.reason).toBeUndefined();
    });
  });

  describe("honeypot", () => {
    it("отбрасывает заявку с заполненным website", () => {
      const verdict = checkSpam(buildLead({ website: "http://spam.example" }));
      expect(verdict.isSpam).toBe(true);
      expect(verdict.reason).toBe("honeypot_filled");
    });

    it("пропускает пустой website", () => {
      const verdict = checkSpam(buildLead({ website: "" }));
      expect(verdict.isSpam).toBe(false);
    });

    it("пропускает отсутствующий website", () => {
      const verdict = checkSpam(buildLead({ website: undefined }));
      expect(verdict.isSpam).toBe(false);
    });
  });

  describe("слишком быстрое заполнение", () => {
    it("отбрасывает заявку, отправленную мгновенно", () => {
      const verdict = checkSpam(
        buildLead({ formStartedAt: Date.now() - 1000 }),
      );
      expect(verdict.isSpam).toBe(true);
      expect(verdict.reason).toBe("too_fast");
    });

    it("пропускает заявку, если с момента старта прошло > minFillTimeMs", () => {
      const verdict = checkSpam(
        buildLead({
          formStartedAt: Date.now() - ANTISPAM_CONFIG.minFillTimeMs - 1000,
        }),
      );
      expect(verdict.isSpam).toBe(false);
    });

    it("отбрасывает заявку с formStartedAt в будущем", () => {
      const verdict = checkSpam(
        buildLead({ formStartedAt: Date.now() + 10_000 }),
      );
      expect(verdict.isSpam).toBe(true);
      expect(verdict.reason).toBe("too_fast");
    });

    it("пропускает, если formStartedAt не задан", () => {
      const verdict = checkSpam(buildLead({ formStartedAt: undefined }));
      expect(verdict.isSpam).toBe(false);
    });
  });

  describe("подозрительное имя", () => {
    it("отбрасывает имя со ссылкой", () => {
      const verdict = checkSpam(
        buildLead({ name: "Иван http://spam.example" }),
      );
      expect(verdict.isSpam).toBe(true);
      expect(verdict.reason).toBe("suspicious_name");
    });

    it("отбрасывает имя с html-тегом", () => {
      const verdict = checkSpam(buildLead({ name: "Иван <a href=...>" }));
      expect(verdict.isSpam).toBe(true);
      expect(verdict.reason).toBe("suspicious_name");
    });

    it("отбрасывает имя со стоп-словом (casino)", () => {
      const verdict = checkSpam(buildLead({ name: "Best Casino" }));
      expect(verdict.isSpam).toBe(true);
      expect(verdict.reason).toBe("suspicious_name");
    });

    it("отбрасывает имя с длинной последовательностью цифр", () => {
      const verdict = checkSpam(buildLead({ name: "Иван 12345" }));
      expect(verdict.isSpam).toBe(true);
      expect(verdict.reason).toBe("suspicious_name");
    });

    it("пропускает обычное имя", () => {
      const verdict = checkSpam(buildLead({ name: "Мария Ивановна" }));
      expect(verdict.isSpam).toBe(false);
    });
  });

  describe("подозрительный телефон", () => {
    it("отбрасывает телефон из одних нулей", () => {
      const verdict = checkSpam(buildLead({ phone: "0000000000" }));
      expect(verdict.isSpam).toBe(true);
      expect(verdict.reason).toBe("suspicious_phone");
    });

    it("отбрасывает телефон из повторяющегося символа", () => {
      const verdict = checkSpam(buildLead({ phone: "1111111111" }));
      expect(verdict.isSpam).toBe(true);
      expect(verdict.reason).toBe("suspicious_phone");
    });

    it("пропускает нормальный номер", () => {
      const verdict = checkSpam(buildLead({ phone: "+998901234567" }));
      expect(verdict.isSpam).toBe(false);
    });
  });

  describe("дубликаты", () => {
    it("отбрасывает третью заявку с тем же номером за короткое время", () => {
      const phone = "+998901234567";

      const first = checkSpam(buildLead({ phone }));
      const second = checkSpam(buildLead({ phone }));
      const third = checkSpam(buildLead({ phone }));

      expect(first.isSpam).toBe(false);
      expect(second.isSpam).toBe(false);
      expect(third.isSpam).toBe(true);
      expect(third.reason).toBe("duplicate");
    });

    it("не считает дубликатом заявки с разными номерами", () => {
      const a = checkSpam(buildLead({ phone: "+998901111111" }));
      const b = checkSpam(buildLead({ phone: "+998902222222" }));
      const c = checkSpam(buildLead({ phone: "+998903333333" }));

      expect(a.isSpam).toBe(false);
      expect(b.isSpam).toBe(false);
      expect(c.isSpam).toBe(false);
    });

    it("сбрасывает счётчик через окно duplicateWindowMs", () => {
      vi.useFakeTimers();

      const phone = "+998901234567";

      checkSpam(buildLead({ phone }));
      checkSpam(buildLead({ phone }));

      // Прокручиваем время за пределы окна
      vi.advanceTimersByTime(ANTISPAM_CONFIG.duplicateWindowMs + 1000);

      const afterWindow = checkSpam(buildLead({ phone }));
      expect(afterWindow.isSpam).toBe(false);
    });
  });

  describe("приоритет проверок", () => {
    it("honeypot имеет приоритет над остальными проверками", () => {
      const verdict = checkSpam(
        buildLead({
          website: "http://spam",
          name: "https://spam",
          phone: "0000000000",
        }),
      );
      expect(verdict.reason).toBe("honeypot_filled");
    });

    it("слишком быстрое заполнение срабатывает раньше подозрительного имени", () => {
      const verdict = checkSpam(
        buildLead({
          formStartedAt: Date.now() - 100,
          name: "Best Casino",
        }),
      );
      expect(verdict.reason).toBe("too_fast");
    });
  });
});