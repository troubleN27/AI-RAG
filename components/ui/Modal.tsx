"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  /** Отключить закрытие по клику на оверлей */
  disableOverlayClose?: boolean;
  /** Скрыть крестик */
  hideClose?: boolean;
  /** Дополнительный класс для контента */
  className?: string;
  /** ARIA label, если нет видимого title */
  ariaLabel?: string;
}

const sizeStyles = {
  sm: "md:max-w-md",
  md: "md:max-w-2xl",
  lg: "md:max-w-[880px]",
} as const;

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  disableOverlayClose = false,
  hideClose = false,
  className,
  ariaLabel,
}: ModalProps) {
  const titleId = useId();
  const descId = useId();
  const contentRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const reduceMotion = useReducedMotion();

  useFocusTrap(contentRef, open);
  useLockBodyScroll(open);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  if (typeof window === "undefined") return null;

  const overlayMotion = reduceMotion
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 1 } }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      };

  const contentMotion = reduceMotion
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 1 } }
    : isMobile
      ? {
          initial: { y: "100%", opacity: 0 },
          animate: { y: 0, opacity: 1 },
          exit: { y: "100%", opacity: 0 },
        }
      : {
          initial: { opacity: 0, scale: 0.96 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.96 },
        };

  const modal = (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="modal-overlay"
          className="fixed inset-0 z-[var(--z-modal)] flex items-end justify-center md:items-center"
          {...overlayMotion}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden={false}
        >
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={disableOverlayClose ? undefined : onClose}
            aria-hidden="true"
          />

          {/* Content */}
          <motion.div
            ref={contentRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descId : undefined}
            aria-label={!title ? ariaLabel ?? "Диалог" : undefined}
            tabIndex={-1}
            className={cn(
              "relative z-10 flex w-full flex-col bg-[var(--color-surface)] shadow-lg",
              "max-h-[92svh] md:max-h-[90svh]",
              "rounded-t-[var(--radius-lg)] md:rounded-[var(--radius-lg)]",
              sizeStyles[size],
              className,
            )}
            {...contentMotion}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Ручка для мобильного bottom-sheet */}
            <div className="flex justify-center pt-2 md:hidden" aria-hidden="true">
              <span className="h-1.5 w-12 rounded-full bg-[var(--color-border)]" />
            </div>

            {/* Header */}
            {(title || !hideClose) && (
              <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] p-5 md:p-6">
                <div className="min-w-0">
                  {title ? (
                    <h2
                      id={titleId}
                      className="text-h3 font-heading font-semibold text-[var(--color-text)]"
                    >
                      {title}
                    </h2>
                  ) : null}
                  {description ? (
                    <p
                      id={descId}
                      className="mt-1 text-small text-[var(--color-text-muted)]"
                    >
                      {description}
                    </p>
                  ) : null}
                </div>

                {!hideClose ? (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Закрыть"
                    className={cn(
                      "shrink-0 rounded-md p-2 text-[var(--color-text-muted)]",
                      "transition-colors duration-200 ease-out",
                      "hover:bg-[var(--color-bg-alt)] hover:text-[var(--color-text)]",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                      "focus-visible:outline-[var(--color-primary)]",
                    )}
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 md:p-6">{children}</div>

            {/* Footer */}
            {footer ? (
              <div className="border-t border-[var(--color-border)] p-5 md:p-6">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}