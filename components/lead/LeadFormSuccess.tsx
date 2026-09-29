"use client";

import { motion } from "framer-motion";

import { Button } from "@/components/ui/Button";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

// ==========================================================
// Типы
// ==========================================================

export interface LeadFormSuccessProps {
  /** Коллбэк закрытия / сброса */
  onClose?: () => void;
  /** Заголовок (по умолчанию — стандартный) */
  title?: string;
  /** Описание */
  description?: string;
  /** Показать кнопку «Закрыть» */
  showClose?: boolean;
  className?: string;
}

// ==========================================================
// Анимированная галочка
// ==========================================================

function AnimatedCheck({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div
      className={cn(
        "mx-auto grid h-20 w-20 place-items-center rounded-full",
        "bg-[var(--color-success)]/10",
      )}
      aria-hidden="true"
    >
      <div
        className={cn(
          "grid h-14 w-14 place-items-center rounded-full",
          "bg-[var(--color-success-solid)] text-white shadow-md",
        )}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className="h-7 w-7"
          aria-hidden="true"
        >
          <motion.path
            d="M7 17l6 6 12-14"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduceMotion ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: reduceMotion ? 0 : 0.6,
              ease: [0.22, 1, 0.36, 1],
              delay: reduceMotion ? 0 : 0.15,
            }}
          />
        </svg>
      </div>
    </div>
  );
}

// ==========================================================
// Компонент
// ==========================================================

export function LeadFormSuccess({
  onClose,
  title = "Спасибо! Заявка отправлена",
  description = "Мы свяжемся с вами в ближайшее время, чтобы уточнить детали и подобрать удобное время для консультации.",
  showClose = true,
  className,
}: LeadFormSuccessProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex flex-col items-center gap-5 py-4 text-center", className)}
    >
      <AnimatedCheck reduceMotion={reduceMotion} />

      <div className="flex flex-col gap-2">
        <h3 className="text-h3 font-heading font-semibold text-[var(--color-text)]">
          {title}
        </h3>
        <p className="mx-auto max-w-sm text-small text-[var(--color-text-muted)] md:text-body">
          {description}
        </p>
      </div>

      {showClose && onClose ? (
        <Button
          variant="secondary"
          size="md"
          onClick={onClose}
          className="mt-2"
        >
          Закрыть
        </Button>
      ) : null}
    </motion.div>
  );
}