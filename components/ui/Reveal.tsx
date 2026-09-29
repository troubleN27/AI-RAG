"use client";

import {
  motion,
  useInView,
  type Variants,
} from "framer-motion";
import { useRef, type ReactNode } from "react";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

// ==========================================================
// Типы
// ==========================================================

export type RevealAnimation = "fade-up" | "fade" | "scale";

export interface RevealProps {
  children: ReactNode;
  /** Тип анимации */
  animation?: RevealAnimation;
  /** Задержка перед началом, мс */
  delay?: number;
  /** Длительность, сек */
  duration?: number;
  /** Анимировать только один раз */
  once?: boolean;
  /** Порог появления во viewport */
  threshold?: number;
  /** Доп. классы на обёртке */
  className?: string;
  /** Тег обёртки */
  as?: "div" | "section" | "article" | "li" | "span";
}

// ==========================================================
// Варианты
// ==========================================================

const variantsMap: Record<RevealAnimation, Variants> = {
  "fade-up": {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1 },
  },
};

// ==========================================================
// Компонент
// ==========================================================

export function Reveal({
  children,
  animation = "fade-up",
  delay = 0,
  duration = 0.6,
  once = true,
  threshold = 0.15,
  className,
  as = "div",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const inView = useInView(ref, {
    once,
    amount: threshold,
  });

  const Component = motion[as] as typeof motion.div;

  if (reduceMotion) {
    const Static = as as "div";
    return (
      <Static ref={ref} className={className}>
        {children}
      </Static>
    );
  }

  return (
    <Component
      ref={ref}
      className={cn(className)}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={variantsMap[animation]}
      transition={{
        duration,
        delay: delay / 1000,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </Component>
  );
}