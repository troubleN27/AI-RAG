"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Phone, X } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/Button";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { trackCta } from "@/lib/analytics";
import { getSiteConfig } from "@/lib/content";
import { useLead } from "@/lib/lead/LeadContext";
import type { NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";

// ==========================================================
// Типы
// ==========================================================

export interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  items: NavItem[];
  activeId: string | null;
  onItemClick: (id: string) => void;
}

// ==========================================================
// Компонент
// ==========================================================

export function MobileMenu({
  open,
  onClose,
  items,
  activeId,
  onItemClick,
}: MobileMenuProps) {
  const site = getSiteConfig();
  const { openModal } = useLead();
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);

  useFocusTrap(panelRef, open);
  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleItemClick = useCallback(
    (id: string) => {
      onClose();
      window.setTimeout(() => {
        onItemClick(id);
      }, 120);
    },
    [onClose, onItemClick],
  );

  const handleCtaClick = useCallback(() => {
    trackCta("header");
    onClose();
    window.setTimeout(() => {
      openModal({ source: "modal" });
    }, 150);
  }, [onClose, openModal]);

  if (typeof window === "undefined") return null;

  const panelMotion = reduceMotion
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 1 } }
    : {
        initial: { opacity: 0, y: -12 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -12 },
      };

  const itemMotion = (index: number) =>
    reduceMotion
      ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 12 },
          animate: {
            opacity: 1,
            y: 0,
            transition: {
              delay: 0.05 + index * 0.05,
              duration: 0.35,
              ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
            },
          },
          exit: { opacity: 0, y: 8, transition: { duration: 0.15 } },
        };

  const modal = (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="mobile-menu"
          id="mobile-menu"
          className="fixed inset-0 z-[var(--z-menu)] flex flex-col bg-[var(--color-bg)] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Меню навигации"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            ref={panelRef}
            className="flex h-full flex-col"
            {...panelMotion}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Шапка панели */}
            <div className="flex h-20 shrink-0 items-center justify-between gap-4 px-[var(--container-px)]">
              <span className="text-small font-bold leading-tight text-[var(--color-text)]">
                {site.name}
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть меню"
                className={cn(
                  "inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)]",
                  "text-[var(--color-text)]",
                  "transition-colors duration-200 ease-out",
                  "hover:bg-[var(--color-bg-alt)]",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
                )}
              >
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            {/* Навигация */}
            <nav
              aria-label="Мобильная навигация"
              className="flex-1 overflow-y-auto px-[var(--container-px)] pb-6 pt-4"
            >
              <ul className="flex flex-col gap-1">
                {items.map((item, index) => {
                  const isActive = activeId === item.id;
                  return (
                    <motion.li key={item.id} {...itemMotion(index)}>
                      <a
                        href={`#${item.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          handleItemClick(item.id);
                        }}
                        aria-current={isActive ? "true" : undefined}
                        className={cn(
                          "flex h-14 items-center rounded-[var(--radius-md)] px-3",
                          "text-lg font-semibold transition-colors duration-200 ease-out",
                          isActive
                            ? "bg-[var(--color-bg-alt)] text-[var(--color-primary)]"
                            : "text-[var(--color-text)] hover:bg-[var(--color-bg-alt)]",
                          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
                        )}
                      >
                        {item.label}
                      </a>
                    </motion.li>
                  );
                })}
              </ul>
            </nav>

            {/* Футер панели */}
            <div className="shrink-0 border-t border-[var(--color-border)] p-5 pb-[calc(20px+env(safe-area-inset-bottom))] px-[var(--container-px)]">
              <Button size="lg" fullWidth onClick={handleCtaClick}>
                Записаться на консультацию
              </Button>

              <a
                href={`tel:${site.phone.replace(/[^+\d]/g, "")}`}
                className={cn(
                  "mt-4 flex items-center justify-center gap-2 text-small font-medium",
                  "text-[var(--color-text-muted)] transition-colors duration-200 ease-out",
                  "hover:text-[var(--color-text)]",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
                )}
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                {site.phone}
              </a>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}