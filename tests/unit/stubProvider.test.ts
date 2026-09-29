import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StubProvider } from "@/lib/chat/stubProvider";
import type { ChatRequest } from "@/lib/chat/types";

// ==========================================================
// Хелпер: базовый запрос
// ==========================================================

function buildRequest(overrides: Partial<ChatRequest> = {}): ChatRequest {
  return {
    session_id: "test-session",
    message: "Какие курсы есть?",
    history: [],
    ...overrides,
  };
}

// ==========================================================
// Тесты
// ==========================================================

describe("StubProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("базовый ответ", () => {
    it("возвращает ответ с текстом и suggested_actions", async () => {
      const provider = new StubProvider();

      const promise = provider.reply(buildRequest());

      // Прокручиваем искусственную задержку
      await vi.advanceTimersByTimeAsync(1000);

      const response = await promise;

      expect(response).toBeDefined();
      expect(typeof response.answer).toBe("string");
      expect(response.answer.length).toBeGreaterThan(0);
      expect(Array.isArray(response.suggested_actions)).toBe(true);
      expect(response.suggested_actions?.length).toBeGreaterThan(0);
    });

    it("включает действие open_form с меткой «Записаться на консультацию»", async () => {
      const provider = new StubProvider();

      const promise = provider.reply(buildRequest());
      await vi.advanceTimersByTimeAsync(1000);
      const response = await promise;

      const openFormAction = response.suggested_actions?.find(
        (a) => a.type === "open_form",
      );

      expect(openFormAction).toBeDefined();
      expect(openFormAction?.label).toBe("Записаться на консультацию");
    });

    it("не возвращает sources", async () => {
      const provider = new StubProvider();

      const promise = provider.reply(buildRequest());
      await vi.advanceTimersByTimeAsync(1000);
      const response = await promise;

      expect(response.sources).toBeUndefined();
    });
  });

  describe("контекст: selected_course_id", () => {
    it("возвращает персонализированный ответ для выбранного курса", async () => {
      const provider = new StubProvider();

      const promise = provider.reply(
        buildRequest({
          context: { selected_course_id: "frontend-developer" },
        }),
      );
      await vi.advanceTimersByTimeAsync(1000);
      const response = await promise;

      // В персонализированном ответе упоминается консультация
      expect(response.answer.toLowerCase()).toContain("консультац");
      expect(response.suggested_actions?.some((a) => a.type === "open_form")).toBe(
        true,
      );
    });
  });

  describe("контекст: page_section = faq", () => {
    it("возвращает ответ со ссылкой на менеджера", async () => {
      const provider = new StubProvider();

      const promise = provider.reply(
        buildRequest({ context: { page_section: "faq" } }),
      );
      await vi.advanceTimersByTimeAsync(1000);
      const response = await promise;

      expect(response.answer.toLowerCase()).toContain("менеджер");
    });
  });

  describe("задержка ответа", () => {
    it("отвечает не раньше MIN_DELAY_MS", async () => {
      const provider = new StubProvider();

      const promise = provider.reply(buildRequest());

      // До истечения задержки — promise ещё не resolved
      let resolved = false;
      promise.then(() => {
        resolved = true;
      });

      await vi.advanceTimersByTimeAsync(500);
      expect(resolved).toBe(false);

      await vi.advanceTimersByTimeAsync(500);
      await promise;
      expect(resolved).toBe(true);
    });
  });

  describe("abort signal", () => {
    it("отклоняет promise при abort", async () => {
      const provider = new StubProvider();
      const controller = new AbortController();

      const promise = provider.reply(buildRequest(), controller.signal);

      // Обработчик rejections подключаем до abort, иначе promise
      // отклонится синхронно и станет unhandled rejection
      const rejection = expect(promise).rejects.toThrow();
      controller.abort();

      await vi.advanceTimersByTimeAsync(0);
      await rejection;
    });

    it("сразу отклоняет, если signal уже aborted", async () => {
      const provider = new StubProvider();
      const controller = new AbortController();
      controller.abort();

      await expect(
        provider.reply(buildRequest(), controller.signal),
      ).rejects.toThrow();
    });
  });

  describe("нечувствительность к содержимому сообщения", () => {
    it("возвращает тот же ответ на разные сообщения без контекста", async () => {
      const provider = new StubProvider();

      const p1 = provider.reply(buildRequest({ message: "Привет" }));
      await vi.advanceTimersByTimeAsync(1000);
      const r1 = await p1;

      const p2 = provider.reply(buildRequest({ message: "Сколько стоит?" }));
      await vi.advanceTimersByTimeAsync(1000);
      const r2 = await p2;

      expect(r1.answer).toBe(r2.answer);
    });
  });
});