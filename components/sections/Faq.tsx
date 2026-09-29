"use client";

import { MessageCircle } from "lucide-react";

import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import { track, trackCta } from "@/lib/analytics";
import { useChat } from "@/lib/chat/ChatContext";
import { getFaq } from "@/lib/content";
import { useLead } from "@/lib/lead/LeadContext";
import { cn } from "@/lib/utils";

// ==========================================================
// Компонент
// ==========================================================

export function Faq() {
  const faq = getFaq();
  const { openModal } = useLead();
  const { openChat } = useChat();

  const items = faq.map((item) => ({
    id: item.id,
    question: item.question,
    answer: item.answer,
  }));

  const handleToggle = (id: string, open: boolean) => {
    track("faq_toggle", { question_id: id, open });
  };

  const handleAskAssistant = () => {
    track("chat_open", { source: "faq" });
    openChat();
  };

  const handleConsult = () => {
    trackCta("faq");
    openModal({ source: "form" });
  };

  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="section bg-[var(--color-bg)]"
    >
      <div className="container">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          {/* Левая колонка: заголовок + карточка помощи */}
          <div className="lg:col-span-4">
            <Reveal animation="fade-up" delay={80}>
              <h2
                id="faq-title"
                className="text-h2 font-heading text-[var(--color-text)]"
              >
                Частые вопросы
              </h2>
            </Reveal>
            <Reveal animation="fade-up" delay={160}>
              <p className="mt-4 text-body text-[var(--color-text-muted)]">
                Собрали ответы на самые популярные вопросы. Если чего-то не
                хватает — напишите нам или спросите AI-ассистента.
              </p>
            </Reveal>

            {/* Карточка «Не нашли ответ?» */}
            <Reveal animation="fade-up" delay={240}>
              <Card
                variant="default"
                padding="md"
                className={cn(
                  "mt-8 border-[var(--color-primary)]/30 bg-[var(--color-surface)]",
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-md)]",
                      "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
                    )}
                    aria-hidden="true"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-body font-semibold text-[var(--color-text)]">
                      Не нашли ответ?
                    </h3>
                    <p className="mt-1 text-small text-[var(--color-text-muted)]">
                      Задайте вопрос AI-ассистенту или оставьте заявку — мы
                      обязательно поможем.
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-2">
                  <Button size="md" fullWidth onClick={handleAskAssistant}>
                    Спросить AI-ассистента
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    fullWidth
                    onClick={handleConsult}
                  >
                    Оставить заявку
                  </Button>
                </div>
              </Card>
            </Reveal>
          </div>

          {/* Правая колонка: аккордеон */}
          <div className="lg:col-span-8">
            <Reveal animation="fade-up" delay={120}>
              <Accordion items={items} single onToggle={handleToggle} />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}