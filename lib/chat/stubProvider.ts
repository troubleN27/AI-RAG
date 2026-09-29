import type {
  ChatProvider,
  ChatRequest,
  ChatResponse,
} from "@/lib/chat/types";

// ==========================================================
// Константы
// ==========================================================

/**
 * Минимальная задержка ответа-заглушки для естественности (мс).
 */
const MIN_DELAY_MS = 700;

/**
 * Текст ответа-заглушки. Персонализируется при первом вопросе
 * про конкретный курс (если course_id передан в контексте).
 */
const BASE_ANSWER =
  "Я пока учусь и скоро смогу отвечать на ваши вопросы о курсах, " +
  "программах и расписании. А пока оставьте заявку на консультацию — " +
  "мы свяжемся с вами.";

// ==========================================================
// Утилиты
// ==========================================================

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    const onAbort = () => {
      cleanup();
      reject(new DOMException("Aborted", "AbortError"));
    };

    const cleanup = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    };

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

// ==========================================================
// StubProvider
// ==========================================================

export class StubProvider implements ChatProvider {
  async reply(
    req: ChatRequest,
    signal?: AbortSignal,
  ): Promise<ChatResponse> {
    // Искусственная задержка: делаем вид, что «думаем»
    await delay(MIN_DELAY_MS, signal);

    const selectedCourseId = req.context?.selected_course_id;
    const pageSection = req.context?.page_section;

    // Формируем ответ с учётом контекста (без обращения к базе знаний)
    let answer = BASE_ANSWER;

    if (selectedCourseId) {
      answer =
        `Спасибо за интерес к курсу. Подробности и актуальное расписание ` +
        `уточнит наш менеджер — оставьте заявку на консультацию, и мы ` +
        `свяжемся с вами в течение рабочего дня.`;
    } else if (pageSection === "faq") {
      answer =
        `Я пока только учусь, но с радостью помогу вам связаться с ` +
        `менеджером — он ответит на все вопросы о курсах, расписании ` +
        `и стоимости.`;
    }

    return {
      answer,
      suggested_actions: [
        {
          type: "open_form",
          label: "Записаться на консультацию",
        },
      ],
    };
  }
}