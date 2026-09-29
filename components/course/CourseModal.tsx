"use client";

import { CalendarDays, Clock, GraduationCap, Signal } from "lucide-react";
import { useCallback } from "react";

import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ProgramRail } from "@/components/ui/ProgramRail";
import { Rating } from "@/components/ui/Rating";
import { trackCta } from "@/lib/analytics";
import { getReviewsByCourse, getTeachersByIds } from "@/lib/content";
import type { Course } from "@/lib/content/types";
import { COURSE_FORMAT_LABEL, COURSE_LEVEL_LABEL } from "@/lib/content/types";
import { useLead } from "@/lib/lead/LeadContext";
import { cn, formatDate, formatPrice } from "@/lib/utils";

// ==========================================================
// Типы
// ==========================================================

export interface CourseModalProps {
  course: Course | null;
  open: boolean;
  onClose: () => void;
}

// ==========================================================
// Компонент
// ==========================================================

export function CourseModal({ course, open, onClose }: CourseModalProps) {
  const { openModal } = useLead();

  const handleEnroll = useCallback(() => {
    if (!course) return;
    trackCta("course_modal", { course_id: course.id });
    onClose();
    // Небольшая задержка, чтобы старое модальное окно успело закрыться
    window.setTimeout(() => {
      openModal({ source: "course", courseId: course.id });
    }, 180);
  }, [course, onClose, openModal]);

  const teachers = course ? getTeachersByIds(course.teacherIds) : [];
  const reviews = course ? getReviewsByCourse(course.id) : [];

  const priceLabel = course?.price
    ? formatPrice(course.price.amount, course.price.currency, {
        from: course.price.from,
      })
    : "По запросу";

  const startLabel = course?.nextStart
    ? formatDate(course.nextStart, { day: "numeric", month: "long", year: "numeric" })
    : "Дата уточняется";

  const programItems =
    course?.program?.map((module, index) => ({
      id: `module-${index}`,
      question: module.module,
      answer: (
        <ul className="list-disc space-y-1.5 pl-5">
          {module.topics.map((topic) => (
            <li key={topic}>{topic}</li>
          ))}
        </ul>
      ),
    })) ?? [];

  return (
    <Modal
      open={open && Boolean(course)}
      onClose={onClose}
      size="lg"
      title={course?.title}
      description={
        course
          ? `${course.duration} · ${COURSE_FORMAT_LABEL[course.format]} · ${COURSE_LEVEL_LABEL[course.level]}`
          : undefined
      }
      footer={
        <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-small text-[var(--color-text-muted)]">Стоимость</p>
            <p className="text-lg font-bold text-[var(--color-text)]">
              {priceLabel}
            </p>
          </div>
          <Button size="lg" onClick={handleEnroll}>
            Записаться на этот курс
          </Button>
        </div>
      }
    >
      {course ? (
        <div className="flex flex-col gap-8">
          {/* Галерея / изображение */}
          <div
            className={cn(
              "aspect-[16/9] w-full overflow-hidden rounded-[var(--radius-md)]",
              "border border-[var(--color-border)] bg-[var(--color-bg-alt)]",
            )}
          >
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
          </div>

          {/* Мета-полоса */}
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="flex flex-col gap-1">
              <dt className="inline-flex items-center gap-1.5 text-small text-[var(--color-text-muted)]">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                Длительность
              </dt>
              <dd className="text-small font-semibold text-[var(--color-text)]">
                {course.duration}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="inline-flex items-center gap-1.5 text-small text-[var(--color-text-muted)]">
                <Signal className="h-3.5 w-3.5" aria-hidden="true" />
                Уровень
              </dt>
              <dd className="text-small font-semibold text-[var(--color-text)]">
                {COURSE_LEVEL_LABEL[course.level]}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="inline-flex items-center gap-1.5 text-small text-[var(--color-text-muted)]">
                <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                Формат
              </dt>
              <dd className="text-small font-semibold text-[var(--color-text)]">
                {COURSE_FORMAT_LABEL[course.format]}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="inline-flex items-center gap-1.5 text-small text-[var(--color-text-muted)]">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                Старт
              </dt>
              <dd className="text-small font-semibold text-[var(--color-text)]">
                {startLabel}
              </dd>
            </div>
          </dl>

          {/* Описание */}
          {course.description ? (
            <section aria-labelledby="course-modal-about">
              <h3
                id="course-modal-about"
                className="text-lg font-semibold text-[var(--color-text)]"
              >
                О курсе
              </h3>
              <p className="mt-3 whitespace-pre-line text-small text-[var(--color-text-muted)] md:text-body">
                {course.description}
              </p>
            </section>
          ) : null}

          {/* Чему научитесь */}
          {course.outcomes && course.outcomes.length > 0 ? (
            <section aria-labelledby="course-modal-outcomes">
              <h3
                id="course-modal-outcomes"
                className="text-lg font-semibold text-[var(--color-text)]"
              >
                Чему вы научитесь
              </h3>
              <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {course.outcomes.map((outcome) => (
                  <li
                    key={outcome}
                    className="flex items-start gap-2 text-small text-[var(--color-text)]"
                  >
                    <span
                      className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary-solid)]"
                      aria-hidden="true"
                    />
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Программа */}
          {programItems.length > 0 ? (
            <section aria-labelledby="course-modal-program">
              <h3
                id="course-modal-program"
                className="text-h3 font-heading text-[var(--color-text)]"
              >
                Программа курса
              </h3>
              <div className="mt-4">
                <ProgramRail
                  total={programItems.length}
                  label="Модулей"
                  meta={course.duration}
                />
              </div>
              <div className="mt-5">
                <Accordion items={programItems} single />
              </div>
            </section>
          ) : null}

          {/* Расписание */}
          {course.schedule ? (
            <section aria-labelledby="course-modal-schedule">
              <h3
                id="course-modal-schedule"
                className="text-lg font-semibold text-[var(--color-text)]"
              >
                Расписание
              </h3>
              <p className="mt-2 inline-flex items-center gap-2 text-small text-[var(--color-text-muted)]">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                {course.schedule}
              </p>
            </section>
          ) : null}

          {/* Преподаватели */}
          {teachers.length > 0 ? (
            <section aria-labelledby="course-modal-teachers">
              <h3
                id="course-modal-teachers"
                className="text-lg font-semibold text-[var(--color-text)]"
              >
                Преподаватели
              </h3>
              <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {teachers.map((teacher) => (
                  <li
                    key={teacher.id}
                    className={cn(
                      "flex items-center gap-3 rounded-[var(--radius-md)]",
                      "border border-[var(--color-border)] bg-[var(--color-surface)] p-3",
                    )}
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-[var(--color-bg-alt)]">
                      {teacher.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={teacher.photo}
                          alt={teacher.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div
                          className="media-plate h-full w-full"
aria-hidden="true"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-small font-semibold text-[var(--color-text)]">
                        {teacher.name}
                      </p>
                      <p className="truncate text-small text-[var(--color-text-muted)]">
                        {teacher.position}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Отзывы */}
          {reviews.length > 0 ? (
            <section aria-labelledby="course-modal-reviews">
              <h3
                id="course-modal-reviews"
                className="text-lg font-semibold text-[var(--color-text)]"
              >
                Отзывы
              </h3>
              <ul className="mt-3 flex flex-col gap-4">
                {reviews.slice(0, 3).map((review) => (
                  <li
                    key={review.id}
                    className={cn(
                      "rounded-[var(--radius-md)] border border-[var(--color-border)]",
                      "bg-[var(--color-surface)] p-4",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-small font-semibold text-[var(--color-text)]">
                          {review.name}
                        </p>
                        {review.date ? (
                          <p className="mt-0.5 text-small text-[var(--color-text-muted)]">
                            {formatDate(review.date)}
                          </p>
                        ) : null}
                      </div>
                      <Rating value={review.rating} size="sm" />
                    </div>
                    <p className="mt-3 line-clamp-6 text-small text-[var(--color-text-muted)]">
                      {review.text}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}