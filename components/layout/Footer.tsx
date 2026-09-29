import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/brand/Logo";
import { getSiteConfig } from "@/lib/content";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";

// ==========================================================
// Иконки соцсетей
// ==========================================================

function SocialIcon({ type, className }: { type: string; className?: string }) {
  const common = {
    className: cn("h-5 w-5", className),
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": true as const,
  };

  switch (type.toLowerCase()) {
    case "instagram":
      return (
        <svg {...common}>
          <path d="M12 2.2c3.2 0 3.6 0 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.26.07 1.64.07 4.81 0 3.18 0 3.55-.07 4.81-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.26.06-1.64.07-4.85.07-3.2 0-3.58 0-4.85-.07-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.2 15.55 2.2 15.18 2.2 12s0-3.55.07-4.81c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.15 0-3.5 0-4.73.07-.9.04-1.4.19-1.72.32-.44.17-.75.37-1.07.7-.33.32-.53.63-.7 1.07-.13.32-.28.82-.32 1.72C3.39 9.11 3.4 9.46 3.4 12s0 2.89.06 4.12c.04.9.19 1.4.32 1.72.17.44.37.75.7 1.07.32.33.63.53 1.07.7.32.13.82.28 1.72.32 1.23.06 1.58.07 4.73.07 3.14 0 3.5 0 4.73-.07.9-.04 1.4-.19 1.72-.32.44-.17.75-.37 1.07-.7.33-.32.53-.63.7-1.07.13-.32.28-.82.32-1.72.06-1.23.07-1.58.07-4.12s0-2.89-.07-4.12c-.04-.9-.19-1.4-.32-1.72a2.9 2.9 0 0 0-.7-1.07 2.9 2.9 0 0 0-1.07-.7c-.32-.13-.82-.28-1.72-.32C15.5 4 15.14 4 12 4Zm0 3.06a4.94 4.94 0 1 1 0 9.88 4.94 4.94 0 0 1 0-9.88Zm0 1.8a3.14 3.14 0 1 0 0 6.28 3.14 3.14 0 0 0 0-6.28Zm5.14-2.05a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z" />
        </svg>
      );
    case "telegram":
      return (
        <svg {...common}>
          <path d="M21.94 4.2 18.9 19.06c-.23 1.02-.83 1.27-1.68.79l-4.65-3.43-2.24 2.16c-.25.25-.46.46-.94.46l.33-4.75 8.63-7.8c.38-.33-.08-.51-.58-.18L6.53 12.7 1.94 11.27c-1-.31-1.02-1 .21-1.48L20.3 2.75c.83-.31 1.55.2 1.64 1.45Z" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common}>
          <path d="M23.5 6.5a3 3 0 0 0-2.1-2.12C19.5 3.86 12 3.86 12 3.86s-7.5 0-9.4.52A3 3 0 0 0 .5 6.5C0 8.4 0 12 0 12s0 3.6.5 5.5a3 3 0 0 0 2.1 2.12c1.9.52 9.4.52 9.4.52s7.5 0 9.4-.52A3 3 0 0 0 23.5 17.5C24 15.6 24 12 24 12s0-3.6-.5-5.5ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg {...common}>
          <path d="M20.5 3.5A11.9 11.9 0 0 0 12.03 0C5.5 0 .2 5.3.2 11.83c0 2.09.55 4.13 1.6 5.93L0 24l6.4-1.68a11.8 11.8 0 0 0 5.63 1.44h.01c6.52 0 11.83-5.3 11.83-11.83 0-3.16-1.23-6.13-3.47-8.43ZM12.04 21.5a9.7 9.7 0 0 1-4.95-1.36l-.36-.21-3.79.99 1-3.7-.23-.38A9.68 9.68 0 0 1 2.35 12c0-5.35 4.35-9.7 9.7-9.7 2.6 0 5.03 1.01 6.86 2.85a9.63 9.63 0 0 1 2.84 6.86c0 5.35-4.35 9.7-9.7 9.7Zm5.33-7.26c-.29-.15-1.73-.86-2-.96-.27-.1-.46-.15-.66.15-.19.29-.75.96-.92 1.15-.17.19-.34.21-.63.07-.29-.15-1.23-.46-2.34-1.45-.86-.77-1.45-1.72-1.62-2.01-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.15-.66-1.59-.9-2.18-.24-.57-.48-.49-.66-.5l-.56-.01c-.19 0-.51.07-.78.36-.27.29-1.02 1-1.02 2.44 0 1.44 1.05 2.83 1.19 3.02.15.19 2.06 3.14 4.99 4.4.7.3 1.24.48 1.66.62.7.22 1.34.19 1.84.12.56-.08 1.73-.71 1.97-1.4.24-.68.24-1.27.17-1.39-.07-.12-.27-.19-.56-.34Z" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
  }
}

// ==========================================================
// Соцсети и мессенджеры
// ==========================================================

type SocialEntry = { type: string; url: string; kind: "social" | "messenger" };

// ==========================================================
// Компонент
// ==========================================================

export function Footer() {
  const site = getSiteConfig();
  const year = new Date().getFullYear();

  const socialEntries: SocialEntry[] = [
    ...site.socials.map<SocialEntry>((s) => ({ ...s, kind: "social" })),
    ...site.messengers.map<SocialEntry>((m) => ({ ...m, kind: "messenger" })),
  ];

  // Уникальные по типу (соцсеть и мессенджер могут пересекаться)
  const seen = new Set<string>();
  const uniqueSocials = socialEntries.filter((entry) => {
    const key = `${entry.kind}:${entry.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg-alt)]">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* О центре */}
          <div className="lg:col-span-1">
            <Logo
              name={site.name}
              shortName={site.shortName}
              variant="full"
              className="items-start"
            />
            <p className="mt-4 max-w-xs text-small text-[var(--color-text-muted)]">
              {site.tagline}
            </p>

            {/* Соцсети */}
            {uniqueSocials.length > 0 ? (
              <ul className="mt-5 flex flex-wrap items-center gap-2">
                {uniqueSocials.map((entry) => (
                  <li key={`${entry.kind}-${entry.type}`}>
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={entry.type}
                      className={cn(
                        "inline-flex min-h-target min-w-target items-center justify-center rounded-[var(--radius-md)]",
                        "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]",
                        "transition-colors duration-200 ease-out",
                        "hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]",
                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
                      )}
                    >
                      <SocialIcon type={entry.type} />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {/* Навигация */}
          <nav aria-label="Навигация в подвале" className="lg:col-span-1">
            <h3 className="text-small font-semibold uppercase tracking-wide text-[var(--color-text)]">
              Разделы
            </h3>
            <ul className="mt-4 flex flex-col gap-2">
              {NAV_ITEMS.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="text-small text-[var(--color-text-muted)] transition-colors duration-200 ease-out hover:text-[var(--color-primary)]"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Контакты */}
          <div className="lg:col-span-1">
            <h3 className="text-small font-semibold uppercase tracking-wide text-[var(--color-text)]">
              Контакты
            </h3>
            <ul className="mt-4 flex flex-col gap-3 text-small text-[var(--color-text-muted)]">
              <li>
                <a
                  href={`tel:${site.phone.replace(/[^+\d]/g, "")}`}
                  className="inline-flex items-start gap-2 transition-colors duration-200 ease-out hover:text-[var(--color-primary)]"
                >
                  <Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{site.phone}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="inline-flex items-start gap-2 transition-colors duration-200 ease-out hover:text-[var(--color-primary)]"
                >
                  <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{site.email}</span>
                </a>
              </li>
              {site.addresses.map((addr) => (
                <li key={addr.label} className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    <span className="block font-medium text-[var(--color-text)]">
                      {addr.label}
                    </span>
                    {addr.address}
                  </span>
                </li>
              ))}
              <li className="text-small">{site.workingHours}</li>
            </ul>
          </div>

          {/* Юридическое */}
          <div className="lg:col-span-1">
            <h3 className="text-small font-semibold uppercase tracking-wide text-[var(--color-text)]">
              Документы
            </h3>
            <ul className="mt-4 flex flex-col gap-2 text-small text-[var(--color-text-muted)]">
              <li>
                <Link
                  href="/privacy"
                  className="transition-colors duration-200 ease-out hover:text-[var(--color-primary)]"
                >
                  Политика конфиденциальности
                </Link>
              </li>
            </ul>

            <div className="mt-5 text-small text-[var(--color-text-muted)]">
              <p className="font-medium text-[var(--color-text)]">
                {site.legal.company}
              </p>
              {site.legal.details ? <p className="mt-1">{site.legal.details}</p> : null}
            </div>
          </div>
        </div>

        {/* Нижняя строка */}
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-[var(--color-border)] pt-6 text-small text-[var(--color-text-muted)] sm:flex-row sm:items-center">
          <p>
            © {year} {site.name}. Все права защищены.
          </p>
          <p>Сделано с заботой о студентах.</p>
        </div>
      </div>
    </footer>
  );
}