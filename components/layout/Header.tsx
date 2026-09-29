"use client";

import { Menu, Phone } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Logo } from "@/components/brand/Logo";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { Button } from "@/components/ui/Button";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { track, trackCta } from "@/lib/analytics";
import { getSiteConfig } from "@/lib/content";
import { useLead } from "@/lib/lead/LeadContext";
import { NAV_ITEMS, SECTION_IDS } from "@/lib/nav";
import { cn } from "@/lib/utils";

// ==========================================================
// Компонент
// ==========================================================

export function Header() {
  const site = getSiteConfig();
  const { openModal } = useLead();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeId = useScrollSpy(SECTION_IDS, {
    rootMargin: "-40% 0px -55% 0px",
    updateHash: false,
  });

  // Отслеживание прокрутки
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      setScrolled(window.scrollY > 24);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      event.preventDefault();
      track("nav_click", { target: id });

      const target = document.getElementById(id);
      if (!target) return;

      const reduceMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      target.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });

      if (typeof window !== "undefined") {
        try {
          const url = new URL(window.location.href);
          url.hash = id;
          window.history.replaceState(null, "", url.toString());
        } catch {
          /* noop */
        }
      }
    },
    [],
  );

  const handleCtaClick = useCallback(() => {
    trackCta("header");
    openModal({ source: "modal" });
  }, [openModal]);

  const handlePhoneClick = useCallback(() => {
    track("contact_click", { type: "phone" });
  }, []);

  const handleMobileNavClick = useCallback(
    (id: string) => {
      const target = document.getElementById(id);
      if (!target) return;

      const reduceMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      target.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });

      if (typeof window !== "undefined") {
        try {
          const url = new URL(window.location.href);
          url.hash = id;
          window.history.replaceState(null, "", url.toString());
        } catch {
          /* noop */
        }
      }
    },
    [],
  );

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-[var(--z-header)] w-full",
          "transition-[height,background-color,border-color] duration-250 ease-out",
          // HIG materials: размытие допустимо для функционального слоя
          // навигации, но только когда под ним есть движущийся контент.
          scrolled
            ? "h-16 border-b border-[var(--color-border)] bg-[var(--color-bg)]/85 shadow-sm backdrop-blur-xl"
            : "h-20 border-b border-transparent bg-transparent",
        )}
        style={{ transitionDuration: "250ms" }}
      >
        <div className="container flex h-full items-center justify-between gap-2 sm:gap-3 xl:gap-4">
          {/* Логотип */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              const reduceMotion =
                typeof window !== "undefined" &&
                window.matchMedia("(prefers-reduced-motion: reduce)").matches;

              window.scrollTo({
                top: 0,
                behavior: reduceMotion ? "auto" : "smooth",
              });
            }}
            className="flex shrink-0 items-center rounded-[var(--radius-sm)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-primary)]"
            aria-label={`${site.name} — на главную`}
          >
            <Logo
              name={site.name}
              shortName={site.shortName}
              variant="compact"
              markClassName="shrink-0"
            />
          </a>

          {/* Навигация (desktop). Полное меню показывается с xl: на более
              узких десктопных ширинах семи пунктов вместе с логотипом,
              номером телефона и CTA не помещаются, и название ужималось
              до «Прогр...». Там остаётся бургер. */}
          <nav aria-label="Основная навигация" className="hidden xl:block">
            <ul className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = activeId === item.id;
                return (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => handleNavClick(e, item.id)}
                      aria-current={isActive ? "true" : undefined}
                      className={cn(
                        // h-11 = 44px: минимальная цель для пальца по HIG
                        "relative inline-flex h-11 shrink-0 items-center whitespace-nowrap rounded-[var(--radius-sm)] px-3",
                        "text-small font-medium transition-colors duration-200 ease-out",
                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
                        isActive
                          ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                          : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]",
                      )}
                    >
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Правая часть */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Телефон. Номер раскрывается вместе с полным меню (xl),
                чтобы «О центре» и номер стояли в одну строку, а на более
                узких ширинах оставалась только иконка. */}
            <a
              href={`tel:${site.phone.replace(/[^+\d]/g, "")}`}
              onClick={handlePhoneClick}
              aria-label={`Позвонить: ${site.phone}`}
              className={cn(
                "hidden min-h-target shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-sm)] px-3",
                "text-small font-medium text-[var(--color-text)] md:inline-flex",
                "transition-colors duration-200 ease-out hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)]",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
              )}
            >
              <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="hidden xl:inline">{site.phone}</span>
            </a>

            {/* CTA */}
            <Button
              size="sm"
              onClick={handleCtaClick}
              className="hidden shrink-0 whitespace-nowrap sm:inline-flex"
            >
              Записаться
            </Button>

            {/* Бургер (mobile) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label="Открыть меню"
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)]",
                "shrink-0 text-[var(--color-text)] xl:hidden",
                "transition-colors duration-200 ease-out",
                "hover:bg-[var(--color-bg-alt)]",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
              )}
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Мобильное меню */}
      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        items={NAV_ITEMS}
        activeId={activeId}
        onItemClick={handleMobileNavClick}
      />
    </>
  );
}