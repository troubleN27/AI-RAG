"use client";

import { CheckCircle2 } from "lucide-react";

import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

// ==========================================================
// Факты о центре
// ==========================================================

const FACTS = [
  "12 лет обучаем взрослых и детей в Ташкенте и онлайн",
  "Преподаватели — практики из ведущих IT- и продуктовых компаний",
  "Малые группы: до 12 человек, живой контакт с преподавателем",
  "Помогаем с трудоустройством и развитием карьеры после выпуска",
];

// ==========================================================
// Компонент
// ==========================================================

export function About() {
  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="section bg-[var(--color-bg-alt)]"
    >
      <div className="container">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Левая колонка */}
          <div>
            <Reveal animation="fade-up" delay={80}>
              <h2
                id="about-title"
                className="text-h2 font-heading text-[var(--color-text)]"
              >
                Образование, которое меняет траекторию
              </h2>
            </Reveal>

            <Reveal animation="fade-up" delay={160}>
              <p className="mt-5 text-body text-[var(--color-text-muted)] md:text-body-lg">
                Мы — образовательный центр, где теория и практика идут рука об
                руку. Программы строим вокруг реальных задач индустрии, а занятия
                ведут те, кто каждый день работает в своей профессии. Наша цель —
                чтобы после курса вы могли применить знания сразу.
              </p>
            </Reveal>

            <Reveal animation="fade-up" delay={240}>
              <p className="mt-4 text-body text-[var(--color-text-muted)] md:text-body-lg">
                Помимо обучения, мы создаём сообщество: встречи выпускников,
                воркшопы, поддержка наставников. Даже после окончания курса вы
                остаётесь частью центра и получаете помощь в развитии.
              </p>
            </Reveal>

            {/* Список фактов */}
            <ul className="mt-8 flex flex-col gap-3">
              {FACTS.map((fact, index) => (
                <Reveal
                  key={fact}
                  animation="fade-up"
                  delay={300 + index * 80}
                  as="li"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-primary)]"
                      aria-hidden="true"
                    />
                    <span className="text-small text-[var(--color-text)] md:text-body">
                      {fact}
                    </span>
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>

          {/* Правая колонка — коллаж */}
          <Reveal animation="scale" delay={200}>
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div className="grid grid-cols-2 gap-4">
                {/* Большое изображение */}
                <div
                  className={cn(
                    "col-span-2 aspect-[16/10] overflow-hidden rounded-[var(--radius-lg)]",
                    "border border-[var(--color-border)] bg-[var(--color-bg-alt)] shadow-md",
                  )}
                  aria-hidden="true"
                >
                  <div
                    className="media-plate h-full w-full"
/>
                </div>

                {/* Два маленьких изображения */}
                <div
                  className={cn(
                    "aspect-square overflow-hidden rounded-[var(--radius-md)]",
                    "border border-[var(--color-border)] bg-[var(--color-bg-alt)] shadow-sm",
                  )}
                  aria-hidden="true"
                >
                  <div
                    className="media-plate h-full w-full"
/>
                </div>
                <div
                  className={cn(
                    "aspect-square overflow-hidden rounded-[var(--radius-md)]",
                    "border border-[var(--color-border)] bg-[var(--color-bg-alt)] shadow-sm",
                  )}
                  aria-hidden="true"
                >
                  <div
                    className="media-plate h-full w-full"
/>
                </div>
              </div>

              {/* Плавающая карточка-подпись */}
              <div
                className={cn(
                  "absolute -bottom-5 left-6 hidden rounded-[var(--radius-md)]",
                  "border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-lg",
                  "sm:block",
                )}
              >
                <p className="text-small text-[var(--color-text-muted)]">С нами учится</p>
                <p className="mt-0.5 text-lg font-bold text-[var(--color-text)]">
                  8 500+ студентов
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}