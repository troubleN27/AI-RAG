"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CourseCard } from "@/components/course/CourseCard";
import {
  applyCourseFilters,
  CourseFilters,
} from "@/components/course/CourseFilters";
import { CourseModal } from "@/components/course/CourseModal";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { getCourses, getDirections } from "@/lib/content";
import type { Course, CourseFilterState } from "@/lib/content/types";
import { useLead } from "@/lib/lead/LeadContext";
import { cn } from "@/lib/utils";

// ==========================================================
// Константы
// ==========================================================

const INITIAL_VISIBLE = 4;
const VISIBLE_STEP = 4;

const initialFilterState: CourseFilterState = {
  directionId: "all",
  format: "all",
  level: "all",
  query: "",
  visibleCount: INITIAL_VISIBLE,
};

// ==========================================================
// Компонент
// ==========================================================

export function Directions() {
  const directions = getDirections();
  const courses = getCourses();
  const { openModal } = useLead();
  const reduceMotion = useReducedMotion();

  const [filters, setFilters] = useState<CourseFilterState>(initialFilterState);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);

  // Чтение ?direction= из URL при монтировании
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const direction = params.get("direction");
      if (direction && directions.some((d) => d.id === direction)) {
        setFilters((prev) => ({ ...prev, directionId: direction }));
      }
      const courseId = params.get("course");
      if (courseId) {
        const found = courses.find((c) => c.id === courseId);
        if (found) {
          setSelectedCourse(found);
          setModalOpen(true);
        }
      }
    } catch {
      /* noop */
    }
  }, [directions, courses]);

  // Синхронизация directionId с URL
  const handleFilterChange = useCallback(
    (next: CourseFilterState) => {
      setFilters(next);
      if (typeof window !== "undefined") {
        try {
          const url = new URL(window.location.href);
          if (next.directionId === "all") {
            url.searchParams.delete("direction");
          } else {
            url.searchParams.set("direction", next.directionId);
          }
          window.history.replaceState(null, "", url.toString());
        } catch {
          /* noop */
        }
      }
    },
    [],
  );

  const filteredCourses = useMemo(
    () => applyCourseFilters(courses, filters),
    [courses, filters],
  );

  const visibleCourses = useMemo(
    () => filteredCourses.slice(0, filters.visibleCount),
    [filteredCourses, filters.visibleCount],
  );

  const hasMore = filteredCourses.length > visibleCourses.length;

  const handleOpenDetails = useCallback((course: Course) => {
    setSelectedCourse(course);
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete("course");
        window.history.replaceState(null, "", url.toString());
      } catch {
        /* noop */
      }
    }
  }, []);

  const handleShowMore = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      visibleCount: prev.visibleCount + VISIBLE_STEP,
    }));
  }, []);

  const handleAskAssistant = useCallback(() => {
    // Заглушка: открывает форму, если чат отключён
    openModal({ source: "form" });
  }, [openModal]);

  const motionProps = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, scale: 0.96 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.96 },
        transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
      };

  return (
    <section
      id="courses"
      aria-labelledby="courses-title"
      className="section bg-[var(--color-bg)]"
    >
      <div className="container">
        {/* Заголовок */}
        <div className="max-w-2xl">
          <Reveal animation="fade-up" delay={80}>
            <h2
              id="courses-title"
              className="text-h2 font-heading text-[var(--color-text)]"
            >
              Выберите программу под свою цель
            </h2>
          </Reveal>
          <Reveal animation="fade-up" delay={160}>
            <p className="mt-4 text-body text-[var(--color-text-muted)] md:text-body-lg">
              Более {courses.length} курсов для начинающих и практикующих
              специалистов. Не знаете, что выбрать? Задайте вопрос ассистенту
              или оставьте заявку — поможем.
            </p>
          </Reveal>
        </div>

        {/* Фильтры */}
        <Reveal animation="fade-up" delay={200}>
          <div className="mt-10">
            <CourseFilters
              directions={directions}
              value={filters}
              onChange={handleFilterChange}
              totalCount={filteredCourses.length}
            />
          </div>
        </Reveal>

        {/* Сетка курсов */}
        <div className="mt-8">
          {filteredCourses.length === 0 ? (
            <Reveal animation="fade-up">
              <div
                className={cn(
                  "mx-auto max-w-lg rounded-[var(--radius-lg)] border border-[var(--color-border)]",
                  "bg-[var(--color-surface)] p-8 text-center shadow-sm",
                )}
              >
                <h3 className="text-h3 font-heading font-semibold text-[var(--color-text)]">
                  Курсы не найдены
                </h3>
                <p className="mt-3 text-small text-[var(--color-text-muted)]">
                  Попробуйте изменить фильтры или задайте вопрос ассистенту —
                  поможем подобрать программу под вашу цель.
                </p>
                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => handleFilterChange(initialFilterState)}
                  >
                    Сбросить фильтры
                  </Button>
                  <Button size="md" onClick={handleAskAssistant}>
                    Задать вопрос
                  </Button>
                </div>
              </div>
            </Reveal>
          ) : (
            <>
              <div
                className={cn(
                  "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3",
                )}
              >
                <AnimatePresence mode="popLayout">
                  {visibleCourses.map((course) => (
                    <motion.div
                      key={course.id}
                      layout
                      {...motionProps}
                      className="h-full"
                    >
                      <CourseCard
                        course={course}
                        onOpenDetails={handleOpenDetails}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Показать ещё */}
              {hasMore ? (
                <div className="mt-10 flex justify-center">
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={handleShowMore}
                  >
                    Показать ещё
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      {/* Модальное окно курса */}
      <CourseModal
        course={selectedCourse}
        open={isModalOpen}
        onClose={handleCloseModal}
      />
    </section>
  );
}