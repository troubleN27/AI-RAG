"use client";

import { Clock, Mail, MapPin, Phone, Send } from "lucide-react";
import { useState } from "react";

import { LeadForm } from "@/components/lead/LeadForm";
import { LeadFormSuccess } from "@/components/lead/LeadFormSuccess";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import { track } from "@/lib/analytics";
import { getSiteConfig } from "@/lib/content";
import { cn } from "@/lib/utils";

// ==========================================================
// Компонент
// ==========================================================

export function Contacts() {
  const site = getSiteConfig();
  const [activeAddressIndex, setActiveAddressIndex] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);

  const activeAddress = site.addresses[activeAddressIndex];

  const handlePhoneClick = () => {
    track("contact_click", { type: "phone" });
  };

  const handleEmailClick = () => {
    track("contact_click", { type: "email" });
  };

  const handleMessengerClick = () => {
    track("contact_click", { type: "messenger" });
  };

  const handleMapClick = () => {
    track("contact_click", { type: "map" });
  };

  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="section bg-[var(--color-bg-alt)]"
    >
      <div className="container">
        {/* Заголовок */}
        <div className="mx-auto max-w-3xl text-center">
          <Reveal animation="fade-up" delay={80}>
            <h2
              id="contact-title"
              className="text-h2 font-heading text-[var(--color-text)]"
            >
              Запишитесь на бесплатную консультацию
            </h2>
          </Reveal>
          <Reveal animation="fade-up" delay={160}>
            <p className="mt-4 text-body text-[var(--color-text-muted)] md:text-body-lg">
              Поможем выбрать курс, расскажем про расписание, форматы и
              стоимость. Отвечаем в течение рабочего дня.
            </p>
          </Reveal>
        </div>

        {/* Сетка: контакты + форма */}
        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Контакты */}
          <div className="lg:col-span-5">
            <Reveal animation="fade-up" delay={120}>
              <Card variant="default" padding="lg" className="flex flex-col gap-6">
                {/* Телефон */}
                <a
                  href={`tel:${site.phone.replace(/[^+\d]/g, "")}`}
                  onClick={handlePhoneClick}
                  className={cn(
                    "group flex items-start gap-4",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-md)]",
                      "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
                      "transition-colors duration-200 ease-out",
                      "group-hover:bg-[var(--color-primary-solid)] group-hover:text-white",
                    )}
                    aria-hidden="true"
                  >
                    <Phone className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-small uppercase tracking-wide text-[var(--color-text-muted)]">
                      Телефон
                    </p>
                    <p className="mt-0.5 text-body font-semibold text-[var(--color-text)] transition-colors duration-200 ease-out group-hover:text-[var(--color-primary)]">
                      {site.phone}
                    </p>
                  </div>
                </a>

                {/* Email */}
                <a
                  href={`mailto:${site.email}`}
                  onClick={handleEmailClick}
                  className={cn(
                    "group flex items-start gap-4",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-md)]",
                      "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
                      "transition-colors duration-200 ease-out",
                      "group-hover:bg-[var(--color-primary-solid)] group-hover:text-white",
                    )}
                    aria-hidden="true"
                  >
                    <Mail className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-small uppercase tracking-wide text-[var(--color-text-muted)]">
                      Email
                    </p>
                    <p className="mt-0.5 break-all text-body font-semibold text-[var(--color-text)] transition-colors duration-200 ease-out group-hover:text-[var(--color-primary)]">
                      {site.email}
                    </p>
                  </div>
                </a>

                {/* График работы */}
                <div className="flex items-start gap-4">
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                    aria-hidden="true"
                  >
                    <Clock className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-small uppercase tracking-wide text-[var(--color-text-muted)]">
                      График работы
                    </p>
                    <p className="mt-0.5 text-body font-semibold text-[var(--color-text)]">
                      {site.workingHours}
                    </p>
                  </div>
                </div>

                {/* Адреса */}
                {site.addresses.length > 0 ? (
                  <div className="flex items-start gap-4">
                    <span
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                      aria-hidden="true"
                    >
                      <MapPin className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-small uppercase tracking-wide text-[var(--color-text-muted)]">
                        Адрес
                      </p>

                      {site.addresses.length > 1 ? (
                        <div
                          role="tablist"
                          aria-label="Выбор адреса"
                          className="mt-1 flex flex-wrap gap-1.5"
                        >
                          {site.addresses.map((addr, index) => (
                            <button
                              key={addr.label}
                              type="button"
                              role="tab"
                              aria-selected={activeAddressIndex === index}
                              onClick={() => setActiveAddressIndex(index)}
                              className={cn(
                                "rounded-full border px-2.5 py-1 text-small font-medium",
                                "transition-colors duration-200 ease-out",
                                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
                                activeAddressIndex === index
                                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                                  : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/40",
                              )}
                            >
                              {addr.label}
                            </button>
                          ))}
                        </div>
                      ) : null}

                      <p className="mt-1 text-body font-semibold text-[var(--color-text)]">
                        {activeAddress?.address ?? "—"}
                      </p>
                    </div>
                  </div>
                ) : null}

                {/* Мессенджеры */}
                {site.messengers.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {site.messengers.map((messenger) => (
                      <a
                        key={messenger.type}
                        href={messenger.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleMessengerClick}
                        className={cn(
                          "inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)]",
                          "border border-[var(--color-border)] bg-[var(--color-surface)] px-3",
                          "text-small font-medium text-[var(--color-text)]",
                          "transition-colors duration-200 ease-out",
                          "hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]",
                          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
                        )}
                      >
                        <Send className="h-4 w-4" aria-hidden="true" />
                        <span className="capitalize">{messenger.type}</span>
                      </a>
                    ))}
                  </div>
                ) : null}
              </Card>
            </Reveal>

            {/* Карта */}
            {activeAddress?.mapEmbedUrl ? (
              <Reveal animation="fade-up" delay={200}>
                <div
                  className={cn(
                    "mt-6 overflow-hidden rounded-[var(--radius-lg)]",
                    "border border-[var(--color-border)] shadow-sm",
                  )}
                  onClick={handleMapClick}
                >
                  <iframe
                    src={activeAddress.mapEmbedUrl}
                    title={`Карта — ${activeAddress.label}`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="h-64 w-full border-0 md:h-72"
                    allowFullScreen
                  />
                </div>
              </Reveal>
            ) : null}
          </div>

          {/* Форма */}
          <div className="lg:col-span-7">
            <Reveal animation="fade-up" delay={160}>
              <Card variant="elevated" padding="lg">
                {isSuccess ? (
                  <LeadFormSuccess onClose={() => setIsSuccess(false)} />
                ) : (
                  <>
                    <h3 className="text-h3 font-heading font-semibold text-[var(--color-text)]">
                      Оставьте заявку
                    </h3>
                    <p className="mt-2 text-small text-[var(--color-text-muted)]">
                      Заполните форму — менеджер свяжется с вами, поможет выбрать
                      программу и подберёт удобное время для консультации.
                    </p>
                    <div className="mt-6">
                      <LeadForm
                        source="form"
                        onSuccess={() => setIsSuccess(true)}
                        showCourseSelect
                      />
                    </div>
                  </>
                )}
              </Card>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}