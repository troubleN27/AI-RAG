"use client";

import { CalendarDays, Clock, Signal } from "lucide-react";
import { useCallback } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgramRail, pluralizeRu } from "@/components/ui/ProgramRail";
import { track, trackCta } from "@/lib/analytics";
import type { Course } from "@/lib/content/types";
import { COURSE_FORMAT_LABEL, COURSE_LEVEL_LABEL } from "@/lib/content/types";
import { useLead } from "@/lib/lead/LeadContext";
import { cn, formatDate, formatPrice } from "@/lib/utils";

// ==========================================================
// Типы
// ==========================================================

export interface CourseCardProps {
  course: Course;
  /** Коллбэк открытия модального окна курса */
  onOpenDetails: (course: Course) => void;
  /** Индекс для каскадных задержек (необязательно) */
  index?: number;
}

// ==========================================================
// Компонент
// ==========================================================

export function CourseCard({ course, onOpenDetails }: CourseCardProps) {
  const { openModal } = useLead();

  const handleDetails = useCallback(() => {
    track("course_view", { course_id: course.id });
    onOpenDetails(course);
  }, [course, onOpenDetails]);

  const handleEnroll = useCallback(() => {
    trackCta("course_card", { course_id: course.id });
    openModal({ source: "course", courseId: course.id });
  }, [course.id, openModal]);

  const priceLabel = course.price
    ? formatPrice(course.price.amount, course.price.currency, {
        from: course.price.from,
      })
    : "По запросу";

  const startLabel = course.nextStart
    ? `Старт: ${formatDate(course.nextStart, { day: "numeric", month: "short" })}`
    : "Дата уточняется";

  const pluralModules = (n: number) =>
    pluralizeRu(n, "модуль", "модуля", "модулей");

  return (
    <Card
      as="article"
      variant="interactive"
      padding="none"
      className="group flex h-full flex-col overflow-hidden"
    >
      {/* Изображение */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[var(--color-bg-alt)]">
        {course.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.image}
            alt={course.title}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div
            className="media-plate h-full w-full"
aria-hidden="true"
          />
        )}

        {course.badge ? (
          <span
            className={cn(
              "absolute left-3 top-3 rounded-full px-3 py-1 text-small font-semibold shadow-sm",
              // Тёмный текст на янтарном: белый давал контраст ~2.1:1
              // (не проходит WCAG AA), а в тёмной теме --color-text стал
              // светлее и стало только хуже. На янтарном нужен тёмный.
              "bg-[var(--color-progress)] text-[var(--color-bg)]",
            )}
          >
            {course.badge}
          </span>
        ) : null}
      </div>

      {/* Контент */}
      <div className="flex flex-1 flex-col p-5 md:p-6">
        <h3 className="text-h3 font-heading text-[var(--color-text)]">
          {course.title}
        </h3>

        <p className="mt-2 line-clamp-3 text-small text-[var(--color-text-muted)]">
          {course.shortDescription}
        </p>

        {/* Мета */}
        <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-small text-[var(--color-text-muted)]">
          <li className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" aria-hidden="true" />
            {course.duration}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Signal className="h-4 w-4" aria-hidden="true" />
            {COURSE_LEVEL_LABEL[course.level]}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full bg-[var(--color-primary)]"
              aria-hidden="true"
            />
            {COURSE_FORMAT_LABEL[course.format]}
          </li>
        </ul>

        {/* Рельс программы: сегмент на каждый реальный модуль */}
        {course.program && course.program.length > 0 ? (
          <div className="mt-5">
            <ProgramRail
              total={course.program.length}
              size="sm"
              label="Программа"
              meta={`${course.program.length} ${pluralModules(course.program.length)}`}
            />
          </div>
        ) : null}

        {/* Цена и дата старта */}
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-[var(--color-border)] pt-5 [&:not(:first-child)]:mt-5">
          <div>
            <p className="text-caption text-[var(--color-text-muted)]">Стоимость</p>
            <p className="text-h3 font-heading text-[var(--color-text)]">{priceLabel}</p>
          </div>
          <p className="inline-flex items-center gap-1.5 pb-1 text-small text-[var(--color-text-muted)]">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            {startLabel}
          </p>
        </div>

        {/* Кнопки */}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            onClick={handleDetails}
            aria-label={`Подробнее о курсе ${course.title}`}
          >
            Подробнее
          </Button>
          <Button
            size="sm"
            fullWidth
            onClick={handleEnroll}
            aria-label={`Записаться на курс ${course.title}`}
          >
            Записаться
          </Button>
        </div>
      </div>
    </Card>
  );
}