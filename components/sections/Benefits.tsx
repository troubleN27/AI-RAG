"use client";

import {
  Award,
  Briefcase,
  CalendarClock,
  HeartHandshake,
  Rocket,
  Sparkles,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import { getBenefits } from "@/lib/content";
import { cn } from "@/lib/utils";

// ==========================================================
// Карта иконок
// ==========================================================

const ICONS: Record<string, LucideIcon> = {
  Rocket,
  UserCheck,
  Users,
  CalendarClock,
  Briefcase,
  Award,
  Sparkles,
  HeartHandshake,
};

function resolveIcon(name: string): LucideIcon {
  return ICONS[name] ?? Sparkles;
}

// ==========================================================
// Компонент
// ==========================================================

export function Benefits() {
  const benefits = getBenefits();

  return (
    <section
      id="benefits"
      aria-labelledby="benefits-title"
      className="section bg-[var(--color-bg-alt)]"
    >
      <div className="container">
        {/* Заголовок */}
        <div className="mx-auto max-w-3xl text-center">
          <Reveal animation="fade-up" delay={80}>
            <h2
              id="benefits-title"
              className="text-h2 font-heading text-[var(--color-text)]"
            >
              Почему студенты выбирают нас
            </h2>
          </Reveal>
          <Reveal animation="fade-up" delay={160}>
            <p className="mt-4 text-body text-[var(--color-text-muted)] md:text-body-lg">
              Мы соединили практику, заботу о студентах и современные программы,
              чтобы обучение приводило к реальным результатам.
            </p>
          </Reveal>
        </div>

        {/* Сетка карточек */}
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit, index) => {
            const Icon = resolveIcon(benefit.icon);
            return (
              <Reveal
                key={benefit.id}
                animation="fade-up"
                delay={Math.min(index * 80, 400)}
                as="div"
                className="h-full"
              >
                <Card
                  as="article"
                  variant="interactive"
                  padding="md"
                  className="group flex h-full flex-col"
                >
                  {/* Иконка: спокойное состояние без поворота —
                      поворот иконки при наведении был декорацией,
                      а не реакцией на действие. */}
                  <div
                    className={cn(
                      "mb-5 grid h-11 w-11 place-items-center rounded-full",
                      "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
                      "transition-colors duration-200 ease-out",
                      "group-hover:bg-[var(--color-primary)]/20",
                    )}
                    aria-hidden="true"
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="text-h3 font-heading text-[var(--color-text)]">
                    {benefit.title}
                  </h3>
                  <p className="mt-2 text-small text-[var(--color-text-muted)] md:text-body">
                    {benefit.description}
                  </p>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}