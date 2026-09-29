"use client";

import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type CardVariant = "default" | "interactive" | "outline" | "elevated";
export type CardPadding = "none" | "sm" | "md" | "lg";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  as?: "div" | "article" | "li" | "section";
}

/* HIG materials: карточка — контент, а не control, поэтому стекло
   и подъём на 4px здесь лишние. Глубину даёт слой поверхности
   плюс граница, интерактивность — смена границы и фона, а не
   «прыжок» карточки. */
const variantStyles: Record<CardVariant, string> = {
  default:
    "bg-[var(--color-surface)] border border-[var(--color-border)]",
  interactive:
    "bg-[var(--color-surface)] border border-[var(--color-border)] " +
    "transition-[background-color,border-color] duration-200 ease-out " +
    "hover:bg-[var(--color-surface-2)] hover:border-[var(--color-border-strong)]",
  outline:
    "bg-transparent border border-[var(--color-border-strong)]",
  elevated:
    "bg-[var(--color-surface)] border border-[var(--color-border)] shadow-md",
};

const paddingStyles: Record<CardPadding, string> = {
  none: "",
  sm: "p-4",
  md: "p-5 md:p-6",
  lg: "p-6 md:p-8",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = "default", padding = "md", as = "div", className, children, ...rest },
  ref,
) {
  const Component = as as "div";

  return (
    <Component
      ref={ref}
      className={cn(
        "rounded-[var(--radius-md)]",
        variantStyles[variant],
        paddingStyles[padding],
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
});

Card.displayName = "Card";