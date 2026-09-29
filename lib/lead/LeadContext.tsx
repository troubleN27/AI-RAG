"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { LeadInput } from "@/lib/lead/schema";
import { persistUtmFromLocation, readPersistedUtm } from "@/lib/utils";

// ==========================================================
// Типы
// ==========================================================

export type LeadSource = LeadInput["source"];

export interface LeadModalOptions {
  courseId?: string;
  source?: LeadSource;
  preferredTime?: string;
}

export interface LeadContextValue {
  /** Открыто ли модальное окно с формой */
  isOpen: boolean;
  /** Опции для текущего открытия */
  options: LeadModalOptions;
  /** Открыть модальное окно с формой */
  openModal: (options?: LeadModalOptions) => void;
  /** Закрыть модальное окно */
  closeModal: () => void;
  /** Установленный courseId, если форма открыта по конкретному курсу */
  presetCourseId?: string;
}

// ==========================================================
// Контекст
// ==========================================================

const LeadContext = createContext<LeadContextValue | null>(null);

// ==========================================================
// Провайдер
// ==========================================================

export function LeadProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<LeadModalOptions>({});

  // Сохраняем UTM-метки в sessionStorage при первом рендере
  useEffect(() => {
    persistUtmFromLocation();
    // Прогреваем чтением (чтобы не сработало только при первом submit)
    readPersistedUtm();
  }, []);

  const openModal = useCallback((opts: LeadModalOptions = {}) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    // Не сбрасываем options сразу — нужно для анимации закрытия
    window.setTimeout(() => setOptions({}), 250);
  }, []);

  const value = useMemo<LeadContextValue>(
    () => ({
      isOpen,
      options,
      openModal,
      closeModal,
      presetCourseId: options.courseId,
    }),
    [isOpen, options, openModal, closeModal],
  );

  return <LeadContext.Provider value={value}>{children}</LeadContext.Provider>;
}

// ==========================================================
// Хук
// ==========================================================

export function useLead(): LeadContextValue {
  const context = useContext(LeadContext);
  if (!context) {
    throw new Error("useLead должен использоваться внутри <LeadProvider>");
  }
  return context;
}

// ==========================================================
// Утилита: получить курс из URL (?course=...)
// ==========================================================

export function getCourseFromUrl(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const params = new URLSearchParams(window.location.search);
    const course = params.get("course");
    return course && course.trim().length > 0 ? course : undefined;
  } catch {
    return undefined;
  }
}