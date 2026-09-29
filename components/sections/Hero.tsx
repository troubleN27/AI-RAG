"use client";

import { motion } from "framer-motion";
import { ArrowRight, CalendarDays, Clock, Users } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

import { Button } from "@/components/ui/Button";
import { Counter } from "@/components/ui/Counter";
import { ProgramRail } from "@/components/ui/ProgramRail";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { trackCta, track } from "@/lib/analytics";
import { getCourses, getSiteConfig } from "@/lib/content";
import { useLead } from "@/lib/lead/LeadContext";

// ==========================================================
// Компонент
// ==========================================================

export function Hero() {
  const site = getSiteConfig();
  const { openModal } = useLead();
  const reduceMotion = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isHoverable = useMediaQuery("(hover: hover) and (pointer: fine)");
  const cohortRef = useRef<HTMLDivElement>(null);

  /* Ближайшая группа: курс с самой ранней датой старта. Это
     настоящее предложение, а не абстрактная картинка — на нём
     сразу видно структуру программы. */
  const cohort = getCourses()
    .filter((course) => course.nextStart)
    .sort((a, b) => (a.nextStart! < b.nextStart! ? -1 : 1))[0];

  /* Параллакс мышью (только desktop + hover + не reduced-motion) */
  useEffect(() => {
    if (!isDesktop || !isHoverable || reduceMotion) return;
    if (typeof window === "undefined") return;

    const node = cohortRef.current;
    if (!node) return;

    let raf = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const onMove = (event: MouseEvent) => {
      const rect = node.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const offsetX = (event.clientX - centerX) / rect.width;
      const offsetY = (event.clientY - centerY) / rect.height;
      targetX = Math.max(-1, Math.min(1, offsetX)) * 8;
      targetY = Math.max(-1, Math.min(1, offsetY)) * 8;
    };

    const tick = () => {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      node.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;
      raf = window.requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.cancelAnimationFrame(raf);
      node.style.transform = "";
    };
  }, [isDesktop, isHoverable, reduceMotion]);

  const handleConsult = useCallback(() => {
    trackCta("hero");
    openModal({ source: "modal" });
  }, [openModal]);

  const handleCourses = useCallback(() => {
    track("cta_click", { location: "hero", action: "courses" });
    const target = document.getElementById("courses");
    if (target) {
      target.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    }
  }, [reduceMotion]);

  const fadeUp = (delay: number) =>
    reduceMotion
      ? { initial: false, animate: { opacity: 1, y: 0 } }
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: {
            duration: 0.6,
            delay,
            ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
          },
        };

  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden"
      style={{ minHeight: "calc(100svh - var(--header-h))" }}
    >
      <div className="container flex min-h-[inherit] flex-col justify-center py-16 md:py-20 lg:py-24">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-12 lg:gap-16">
          {/* Левая колонка */}
          <div className="lg:col-span-7">
            <motion.p
              className="mb-5 inline-flex min-h-[32px] items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-1.5 text-small font-medium text-[var(--color-text-muted)]"
              {...fadeUp(0)}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-success)]"
                aria-hidden="true"
              />
              Набор в группы открыт
            </motion.p>

            <motion.h1
              id="hero-title"
              className="text-display font-heading"
              {...fadeUp(0.12)}
            >
              Учитесь тому, что пригодится в жизни и карьере
            </motion.h1>

            <motion.p
              className="mt-6 max-w-xl text-body-lg text-[var(--color-text-muted)]"
              {...fadeUp(0.24)}
            >
              {site.tagline}. Практические курсы, преподаватели-практики и малые
              группы — от первого занятия до первого оффера.
            </motion.p>

            <motion.div
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
              {...fadeUp(0.36)}
            >
              <Button
                size="lg"
                onClick={handleConsult}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Записаться на консультацию
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={handleCourses}
              >
                Смотреть курсы
              </Button>
            </motion.div>

            <motion.dl
              className="mt-14 grid grid-cols-2 gap-x-6 gap-y-7 border-t border-[var(--color-border)] pt-8 sm:grid-cols-4"
              {...fadeUp(0.48)}
            >
              {site.stats.map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <dd className="text-h3 font-heading text-[var(--color-text)]">
                    <Counter value={stat.value} suffix={stat.suffix} />
                  </dd>
                  <dt className="order-last mt-1 text-small text-[var(--color-text-muted)]">
                    {stat.label}
                  </dt>
                </div>
              ))}
            </motion.dl>
          </div>

          {/* Правая колонка — ближайшая группа */}
          {cohort ? (
            <div className="lg:col-span-5">
              <motion.div
                ref={cohortRef}
                {...fadeUp(0.3)}
                className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg md:p-7"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-overline text-[var(--color-text-muted)]">
                    Ближайший старт
                  </p>
                  <p className="text-small font-semibold text-[var(--color-text)]">
                    {formatStartDate(cohort.nextStart!)}
                  </p>
                </div>

                <h2 className="mt-4 text-h3 font-heading text-[var(--color-text)]">
                  {cohort.title}
                </h2>
                <p className="mt-2 text-small text-[var(--color-text-muted)]">
                  {cohort.shortDescription}
                </p>

                <ul className="mt-6 space-y-3">
                  <li className="flex items-center gap-3 text-small text-[var(--color-text-muted)]">
                    <Clock className="h-5 w-5 shrink-0 text-[var(--color-text-muted)]" aria-hidden="true" />
                    {cohort.schedule ?? cohort.duration}
                  </li>
                  <li className="flex items-center gap-3 text-small text-[var(--color-text-muted)]">
                    <Users className="h-5 w-5 shrink-0 text-[var(--color-text-muted)]" aria-hidden="true" />
                    Малая группа, преподаватель ведёт лично
                  </li>
                </ul>

                <div className="mt-7 border-t border-[var(--color-border)] pt-6">
                  <ProgramRail
                    total={cohort.program?.length ?? 0}
                    label="Программа"
                    meta={`${cohort.program?.length ?? 0} ${pluralModules(cohort.program?.length ?? 0)}`}
                    animate={!reduceMotion}
                  />
                </div>

                <Button
                  className="mt-6 w-full"
                  size="lg"
                  onClick={handleConsult}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Забронировать место
                </Button>

                <p className="mt-4 flex items-center justify-center gap-2 text-caption text-[var(--color-text-muted)]">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  Консультация бесплатная, 30 минут
                </p>
              </motion.div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

// ==========================================================
// Хелперы
// ==========================================================

const MONTHS = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

function formatStartDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

function pluralModules(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "модуль";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "модуля";
  return "модулей";
}
