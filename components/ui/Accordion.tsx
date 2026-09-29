"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import {
  useCallback,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

// ==========================================================
// Типы
// ==========================================================

export interface AccordionItem {
  id: string;
  question: string;
  answer: string | ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  /** Разрешить только один открытый элемент (по умолчанию) */
  single?: boolean;
  /** Открытый по умолчанию элемент */
  defaultOpenId?: string;
  /** Коллбэк при переключении */
  onToggle?: (id: string, open: boolean) => void;
  className?: string;
}

// ==========================================================
// Компонент
// ==========================================================

export function Accordion({
  items,
  single = true,
  defaultOpenId,
  onToggle,
  className,
}: AccordionProps) {
  const [openIds, setOpenIds] = useState<string[]>(defaultOpenId ? [defaultOpenId] : []);
  const reduceMotion = useReducedMotion();
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);
  // useId возвращает id с двоеточиями (например «:r1:»), что ломает CSS-селекторы
  const baseId = useId().replace(/:/g, "");

  const toggle = useCallback(
    (id: string) => {
      setOpenIds((prev) => {
        const isOpen = prev.includes(id);
        let next: string[];

        if (isOpen) {
          next = prev.filter((x) => x !== id);
        } else {
          next = single ? [id] : [...prev, id];
        }

        onToggle?.(id, !isOpen);
        return next;
      });
    },
    [onToggle, single],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      const buttons = buttonsRef.current.filter(Boolean) as HTMLButtonElement[];
      if (buttons.length === 0) return;

      let nextIndex: number | null = null;

      switch (event.key) {
        case "ArrowDown":
          nextIndex = (index + 1) % buttons.length;
          break;
        case "ArrowUp":
          nextIndex = (index - 1 + buttons.length) % buttons.length;
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = buttons.length - 1;
          break;
        default:
          return;
      }

      if (nextIndex !== null) {
        event.preventDefault();
        buttons[nextIndex]?.focus();
      }
    },
    [],
  );

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {items.map((item, index) => {
        const isOpen = openIds.includes(item.id);
        const buttonId = `${baseId}-btn-${item.id}`;
        const panelId = `${baseId}-panel-${item.id}`;

        return (
          <div
            key={item.id}
            className={cn(
              "overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]",
              "transition-colors duration-200 ease-out",
              isOpen && "border-[var(--color-primary)]/40",
            )}
          >
            <h3 className="m-0">
              <button
                ref={(el) => {
                  buttonsRef.current[index] = el;
                }}
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={cn(
                  "flex w-full items-center justify-between gap-4 p-5 text-left md:p-6",
                  "text-body font-semibold text-[var(--color-text)] md:text-lg",
                  "transition-colors duration-200 ease-out",
                  "hover:bg-[var(--color-bg-alt)]",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2",
                  "focus-visible:outline-[var(--color-primary)]",
                )}
              >
                <span className="pr-2">{item.question}</span>
                <span
                  className={cn(
                    "grid min-h-target min-w-target shrink-0 place-items-center rounded-full",
                    "border border-[var(--color-border)] bg-[var(--color-bg-alt)]",
                    "transition-transform duration-300 ease-out",
                    isOpen && "rotate-45 border-[var(--color-primary)] bg-[var(--color-primary-solid)] text-white",
                  )}
                  aria-hidden="true"
                >
                  <Plus className="h-4 w-4" />
                </span>
              </button>
            </h3>

            {/* Панель всегда смонтирована: id из aria-controls должен вести
                к существующему элементу. Анимация — через height/opacity. */}
            <motion.div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              aria-hidden={!isOpen}
              initial={false}
              animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
              className={cn(isOpen ? undefined : "invisible")}
              style={{ overflow: "hidden" }}
            >
              <div className="px-5 pb-5 text-[var(--color-text-muted)] md:px-6 md:pb-6">
                {typeof item.answer === "string" ? (
                  <p className="whitespace-pre-line">{item.answer}</p>
                ) : (
                  item.answer
                )}
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}