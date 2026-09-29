import { isBrowser } from "@/lib/utils";

// ==========================================================
// Типы событий
// ==========================================================

export type AnalyticsEvent =
  | "cta_click"
  | "nav_click"
  | "course_filter"
  | "course_view"
  | "lead_form_start"
  | "lead_submit_success"
  | "lead_submit_error"
  | "chat_open"
  | "chat_message_sent"
  | "chat_suggestion_click"
  | "chat_action_click"
  | "contact_click"
  | "faq_toggle";

export type AnalyticsParams = Record<string, string | number | boolean | undefined>;

// ==========================================================
// Провайдеры
// ==========================================================

type AnalyticsProvider = {
  name: string;
  track: (event: AnalyticsEvent, params?: AnalyticsParams) => void;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    ym?: (id: number, action: string, ...args: unknown[]) => void;
  }
}

const providers: AnalyticsProvider[] = [];

// ==========================================================
// GA4
// ==========================================================

function createGa4Provider(): AnalyticsProvider {
  return {
    name: "ga4",
    track(event, params) {
      if (!isBrowser || typeof window.gtag !== "function") return;
      window.gtag("event", event, params ?? {});
    },
  };
}

// ==========================================================
// Яндекс.Метрика
// ==========================================================

function createYandexProvider(counterId: number): AnalyticsProvider {
  return {
    name: "yandex",
    track(event, params) {
      if (!isBrowser || typeof window.ym !== "function") return;
      window.ym(counterId, "reachGoal", event, params ?? {});
    },
  };
}

// ==========================================================
// Dev-провайдер (для отладки)
// ==========================================================

function createDevProvider(): AnalyticsProvider {
  return {
    name: "dev",
    track(event, params) {
      // eslint-disable-next-line no-console
      console.debug(`[analytics] ${event}`, params ?? {});
    },
  };
}

// ==========================================================
// Инициализация
// ==========================================================

let initialized = false;

export function initAnalytics(): void {
  if (!isBrowser || initialized) return;
  initialized = true;

  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (gaId && gaId.trim().length > 0) {
    providers.push(createGa4Provider());
  }

  const ymId = process.env.NEXT_PUBLIC_YM_ID;
  if (ymId) {
    const numeric = Number(ymId);
    if (Number.isFinite(numeric)) {
      providers.push(createYandexProvider(numeric));
    }
  }

  if (process.env.NODE_ENV !== "production") {
    providers.push(createDevProvider());
  }
}

// ==========================================================
// Основной API
// ==========================================================

/**
 * Отправляет событие аналитики во все подключённые провайдеры.
 * Персональные данные и тексты сообщений передавать запрещено.
 */
export function track(event: AnalyticsEvent, params?: AnalyticsParams): void {
  if (!isBrowser) return;
  if (!initialized) initAnalytics();

  for (const provider of providers) {
    try {
      provider.track(event, params);
    } catch {
      // Молча игнорируем — аналитика не должна ломать UI
    }
  }
}

/**
 * Хелпер для типизированных вызовов (без параметров).
 */
export function trackSimple(event: AnalyticsEvent): void {
  track(event);
}

/**
 * Единая точка для событий CTA.
 */
export function trackCta(
  location: "header" | "hero" | "course_card" | "course_modal" | "faq" | "footer",
  extra?: AnalyticsParams,
): void {
  track("cta_click", { location, ...extra });
}