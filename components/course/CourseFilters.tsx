"use client";

import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Tabs } from "@/components/ui/Tabs";
import { track } from "@/lib/analytics";
import type {
  Course,
  CourseFilterState,
  CourseFormat,
  CourseLevel,
  Direction,
} from "@/lib/content/types";
import { COURSE_FORMAT_LABEL, COURSE_LEVEL_LABEL } from "@/lib/content/types";
import { cn } from "@/lib/utils";

// ==========================================================
// Типы
// ==========================================================

export interface CourseFiltersProps {
  directions: Direction[];
  /** Текущее состояние фильтра (контролируемое) */
  value: CourseFilterState;
  /** Изменение состояния */
  onChange: (next: CourseFilterState) => void;
  /** Дополнительная опция для показа количества курсов */
  totalCount?: number;
}

// ==========================================================
// Хелпер: применение фильтра
// ==========================================================

export function applyCourseFilters(
  courses: Course[],
  state: CourseFilterState,
): Course[] {
  return courses.filter((course) => {
    if (state.directionId !== "all" && course.directionId !== state.directionId) {
      return false;
    }
    if (state.format && state.format !== "all" && course.format !== state.format) {
      return false;
    }
    if (state.level && state.level !== "all" && course.level !== state.level) {
      return false;
    }
    if (state.query && state.query.trim().length > 0) {
      const q = state.query.trim().toLowerCase();
      const haystack = [
        course.title,
        course.shortDescription,
        course.description ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

// ==========================================================
// Компонент
// ==========================================================

export function CourseFilters({
  directions,
  value,
  onChange,
  totalCount,
}: CourseFiltersProps) {
  const [queryInput, setQueryInput] = useState(value.query ?? "");

  // Актуальные value/onChange для debounce-эффекта
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  valueRef.current = value;
  onChangeRef.current = onChange;

  // Синхронизация с внешними изменениями фильтра (сброс, URL, кнопки)
  useEffect(() => {
    setQueryInput((prev) => (prev === (value.query ?? "") ? prev : (value.query ?? "")));
  }, [value.query]);

  // Debounce поиска
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const current = valueRef.current;
      if ((current.query ?? "") !== queryInput) {
        onChangeRef.current({ ...current, query: queryInput, visibleCount: 4 });
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [queryInput]);

  const tabItems = useMemo(
    () => [
      { id: "all", label: "Все" },
      ...directions.map((d) => ({ id: d.id, label: d.title })),
    ],
    [directions],
  );

  const formatOptions: { value: CourseFormat | "all"; label: string }[] = useMemo(
    () => [
      { value: "all", label: "Любой формат" },
      { value: "offline", label: COURSE_FORMAT_LABEL.offline },
      { value: "online", label: COURSE_FORMAT_LABEL.online },
      { value: "hybrid", label: COURSE_FORMAT_LABEL.hybrid },
    ],
    [],
  );

  const levelOptions: { value: CourseLevel | "all"; label: string }[] = useMemo(
    () => [
      { value: "all", label: "Любой уровень" },
      { value: "beginner", label: COURSE_LEVEL_LABEL.beginner },
      { value: "intermediate", label: COURSE_LEVEL_LABEL.intermediate },
      { value: "advanced", label: COURSE_LEVEL_LABEL.advanced },
    ],
    [],
  );

  const handleDirectionChange = (directionId: string) => {
    track("course_filter", {
      direction: directionId,
      format: value.format ?? "all",
      level: value.level ?? "all",
    });
    onChange({ ...value, directionId, visibleCount: 4 });
  };

  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as CourseFormat | "all";
    track("course_filter", {
      direction: value.directionId,
      format: next,
      level: value.level ?? "all",
    });
    onChange({ ...value, format: next, visibleCount: 4 });
  };

  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as CourseLevel | "all";
    track("course_filter", {
      direction: value.directionId,
      format: value.format ?? "all",
      level: next,
    });
    onChange({ ...value, level: next, visibleCount: 4 });
  };

  const clearQuery = () => {
    setQueryInput("");
    onChange({ ...value, query: "", visibleCount: 4 });
  };

  const hasActiveFilters =
    value.directionId !== "all" ||
    (value.format && value.format !== "all") ||
    (value.level && value.level !== "all") ||
    (value.query && value.query.length > 0);

  const resetAll = () => {
    setQueryInput("");
    onChange({
      directionId: "all",
      format: "all",
      level: "all",
      query: "",
      visibleCount: 4,
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Табы направлений */}
      <Tabs
        items={tabItems}
        value={value.directionId}
        onChange={handleDirectionChange}
        variant="chips"
        scrollable
        ariaLabel="Направления обучения"
      />

      {/* Панель фильтров */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        {/* Поиск */}
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-text-muted)]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Поиск по курсам…"
            aria-label="Поиск по курсам"
            className={cn(
              "h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)]",
              "bg-[var(--color-surface)] pl-11 pr-12 text-body text-[var(--color-text)]",
              "placeholder:text-[var(--color-text-muted)]",
              "transition-[border-color,background-color] duration-200 ease-out",
              "hover:border-[var(--color-text-muted)]/50",
              "focus:border-[var(--color-primary)] focus:bg-[var(--color-surface-2)] focus:outline-none",
            )}
          />
          {queryInput.length > 0 ? (
            <button
              type="button"
              onClick={clearQuery}
              aria-label="Очистить поиск"
              className={cn(
                "absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full",
                "text-[var(--color-text-muted)] transition-colors duration-200 ease-out",
                "hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
              )}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        {/* Формат */}
        <label className="relative">
          <span className="sr-only">Формат обучения</span>
          <select
            value={value.format ?? "all"}
            onChange={handleFormatChange}
            className={cn(
              "h-12 w-full appearance-none rounded-[var(--radius-md)] border border-[var(--color-border-strong)]",
              "bg-[var(--color-surface)] px-4 pr-9 text-body text-[var(--color-text)] md:w-48",
              "transition-colors duration-200 ease-out",
              "hover:border-[var(--color-text-muted)]/50 focus:border-[var(--color-primary)] focus:bg-[var(--color-surface-2)] focus:outline-none",
            )}
          >
            {formatOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            aria-hidden="true"
          >
            ▾
          </span>
        </label>

        {/* Уровень */}
        <label className="relative">
          <span className="sr-only">Уровень подготовки</span>
          <select
            value={value.level ?? "all"}
            onChange={handleLevelChange}
            className={cn(
              "h-12 w-full appearance-none rounded-[var(--radius-md)] border border-[var(--color-border-strong)]",
              "bg-[var(--color-surface)] px-4 pr-9 text-body text-[var(--color-text)] md:w-48",
              "transition-colors duration-200 ease-out",
              "hover:border-[var(--color-text-muted)]/50 focus:border-[var(--color-primary)] focus:bg-[var(--color-surface-2)] focus:outline-none",
            )}
          >
            {levelOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            aria-hidden="true"
          >
            ▾
          </span>
        </label>
      </div>

      {/* Нижняя строка: счётчик + сброс */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-small text-[var(--color-text-muted)]">
          {typeof totalCount === "number"
            ? `Найдено курсов: ${totalCount}`
            : null}
        </p>

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={resetAll}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-1",
              "text-small font-medium text-[var(--color-primary)]",
              "transition-colors duration-200 ease-out hover:bg-[var(--color-primary)]/10",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
            )}
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Сбросить фильтры
          </button>
        ) : null}
      </div>
    </div>
  );
}