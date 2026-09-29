"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

// ==========================================================
// Компонент
// ==========================================================

export function ScrollTopButton() {
  const [visible, setVisible] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      setVisible(window.scrollY > 600);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    if (typeof window === "undefined") return;

    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [reduceMotion]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.button
          key="scroll-top"
          type="button"
          onClick={scrollToTop}
          aria-label="Наверх"
          initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.9 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "fixed right-5 z-[var(--z-chat)]",
            "inline-flex h-11 w-11 items-center justify-center",
            "rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]",
            "text-[var(--color-text)] shadow-md",
            "transition-colors duration-200 ease-out",
            "hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
          )}
          style={{
            bottom: "calc(88px + env(safe-area-inset-bottom))",
          }}
        >
          <ArrowUp className="h-5 w-5" aria-hidden="true" />
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}