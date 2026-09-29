import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

// ==========================================================
// Автоочистка после каждого теста
// ==========================================================

afterEach(() => {
  cleanup();
});

// ==========================================================
// Мок matchMedia (jsdom не реализует)
// ==========================================================

interface MediaQueryListMock {
  matches: boolean;
  media: string;
  onchange: null;
  addListener: (listener: (event: MediaQueryListEvent) => void) => void;
  removeListener: (listener: (event: MediaQueryListEvent) => void) => void;
  addEventListener: (
    type: string,
    listener: (event: MediaQueryListEvent) => void,
  ) => void;
  removeEventListener: (
    type: string,
    listener: (event: MediaQueryListEvent) => void,
  ) => void;
  dispatchEvent: (event: Event) => boolean;
}

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string): MediaQueryListMock => {
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    }),
  });
});

// ==========================================================
// Мок IntersectionObserver
// ==========================================================

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = "0px";
  readonly thresholds: ReadonlyArray<number> = [0];

  private callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element): void {
    // Немедленно вызываем callback с "пересечением", чтобы Reveal/Counter
    // сразу показывали контент в тестах.
    const entry: IntersectionObserverEntry = {
      isIntersecting: true,
      target,
      boundingClientRect: target.getBoundingClientRect(),
      intersectionRatio: 1,
      intersectionRect: target.getBoundingClientRect(),
      rootBounds: null,
      time: Date.now(),
    };
    this.callback([entry], this);
  }

  unobserve(): void {
    /* noop */
  }

  disconnect(): void {
    /* noop */
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

Object.defineProperty(globalThis, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

// ==========================================================
// Мок ResizeObserver
// ==========================================================

class MockResizeObserver implements ResizeObserver {
  observe(): void {
    /* noop */
  }
  unobserve(): void {
    /* noop */
  }
  disconnect(): void {
    /* noop */
  }
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  configurable: true,
  value: MockResizeObserver,
});

// ==========================================================
// Мок scrollTo
// ==========================================================

Object.defineProperty(window, "scrollTo", {
  writable: true,
  configurable: true,
  value: vi.fn(),
});

Object.defineProperty(window.HTMLElement.prototype, "scrollIntoView", {
  writable: true,
  configurable: true,
  value: vi.fn(),
});

// ==========================================================
// Мок fetch (по умолчанию — успешный пустой ответ)
// ==========================================================

beforeEach(() => {
  if (!globalThis.fetch) {
    Object.defineProperty(globalThis, "fetch", {
      writable: true,
      configurable: true,
      value: vi.fn(),
    });
  }
});

// ==========================================================
// Полифилл requestAnimationFrame (jsdom иногда отсутствует)
// ==========================================================

if (typeof window.requestAnimationFrame !== "function") {
  Object.defineProperty(window, "requestAnimationFrame", {
    writable: true,
    configurable: true,
    value: (callback: FrameRequestCallback) =>
      setTimeout(() => callback(Date.now()), 16) as unknown as number,
  });
}

if (typeof window.cancelAnimationFrame !== "function") {
  Object.defineProperty(window, "cancelAnimationFrame", {
    writable: true,
    configurable: true,
    value: (handle: number) => clearTimeout(handle),
  });
}

// ==========================================================
// Мок crypto.randomUUID (для Node < 19)
// ==========================================================

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, "crypto", {
    writable: true,
    configurable: true,
    value: {
      randomUUID: () =>
        "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        }),
    },
  });
} else if (typeof globalThis.crypto.randomUUID !== "function") {
  Object.defineProperty(globalThis.crypto, "randomUUID", {
    writable: true,
    configurable: true,
    value: () =>
      "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }),
  });
}