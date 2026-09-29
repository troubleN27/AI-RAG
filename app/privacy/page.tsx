import type { Metadata } from "next";
import Link from "next/link";

import { getSiteConfig } from "@/lib/content";
import { cn } from "@/lib/utils";

// ==========================================================
// Метаданные
// ==========================================================

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
  description:
    "Политика обработки персональных данных образовательного центра: какие данные мы собираем, как используем и защищаем.",
  alternates: {
    canonical: "/privacy",
  },
  robots: {
    index: true,
    follow: true,
  },
};

// ==========================================================
// Компонент
// ==========================================================

export default function PrivacyPage() {
  const site = getSiteConfig();
  const year = new Date().getFullYear();

  return (
    <article className="section bg-[var(--color-bg)]">
      <div className="container">
        <div className="mx-auto max-w-3xl">
          {/* Хлебные крошки */}
          <nav aria-label="Хлебные крошки" className="mb-6">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <li>
                <Link
                  href="/"
                  className="transition-colors duration-200 ease-out hover:text-[var(--color-primary)]"
                >
                  Главная
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-[var(--color-text)]">
                Политика конфиденциальности
              </li>
            </ol>
          </nav>

          <header>
            <h1 className="text-h2 font-heading font-bold text-[var(--color-text)]">
              Политика конфиденциальности
            </h1>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">
              Последнее обновление: 1 января {year} года
            </p>
          </header>

          <div
            className={cn(
              "mt-8 flex flex-col gap-8",
              "text-base leading-relaxed text-[var(--color-text-muted)]",
            )}
          >
            <section>
              <h2 className="text-h3 font-heading font-semibold text-[var(--color-text)]">
                1. Общие положения
              </h2>
              <p className="mt-3">
                Настоящая Политика конфиденциальности (далее — «Политика»)
                определяет порядок обработки и защиты персональных данных
                пользователей сайта образовательного центра {site.name} (далее
                — «Центр»). Используя сайт, вы соглашаетесь с условиями
                настоящей Политики.
              </p>
            </section>

            <section>
              <h2 className="text-h3 font-heading font-semibold text-[var(--color-text)]">
                2. Какие данные мы собираем
              </h2>
              <p className="mt-3">
                При заполнении формы записи на консультацию и/или использовании
                чата мы можем собирать следующие данные:
              </p>
              <ul className="mt-3 list-disc space-y-1.5 pl-6">
                <li>имя;</li>
                <li>номер телефона;</li>
                <li>адрес электронной почты (при самостоятельном указании);</li>
                <li>
                  интересующий курс, удобное время звонка и комментарий к заявке;
                </li>
                <li>
                  технические данные: IP-адрес, user-agent, URL страницы, с которой
                  отправлена заявка, UTM-метки.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-h3 font-heading font-semibold text-[var(--color-text)]">
                3. Цели обработки данных
              </h2>
              <p className="mt-3">
                Персональные данные обрабатываются в следующих целях:
              </p>
              <ul className="mt-3 list-disc space-y-1.5 pl-6">
                <li>
                  связь с пользователем для уточнения деталей заявки и подбора
                  программы обучения;
                </li>
                <li>предоставление информации об услугах Центра;</li>
                <li>улучшение качества работы сайта и сервиса;</li>
                <li>соблюдение требований законодательства.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-h3 font-heading font-semibold text-[var(--color-text)]">
                4. Правовые основания
              </h2>
              <p className="mt-3">
                Обработка персональных данных осуществляется на основании
                согласия пользователя, выраженного путём отметки соответствующего
                чекбокса при отправке формы на сайте, а также в целях исполнения
                договора об оказании образовательных услуг.
              </p>
            </section>

            <section>
              <h2 className="text-h3 font-heading font-semibold text-[var(--color-text)]">
                5. Передача данных третьим лицам
              </h2>
              <p className="mt-3">
                Центр не передаёт персональные данные пользователей третьим лицам,
                за исключением случаев:
              </p>
              <ul className="mt-3 list-disc space-y-1.5 pl-6">
                <li>получения явного согласия пользователя;</li>
                <li>
                  привлечения подрядчиков для оказания услуг (например, службы
                  доставки уведомлений) — в объёме, необходимом для исполнения
                  обязательств перед пользователем;
                </li>
                <li>требования уполномоченных государственных органов.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-h3 font-heading font-semibold text-[var(--color-text)]">
                6. Хранение и защита данных
              </h2>
              <p className="mt-3">
                Центр принимает необходимые организационные и технические меры
                для защиты персональных данных от неправомерного доступа,
                изменения, раскрытия или уничтожения. Данные хранятся не дольше,
                чем это необходимо для целей их обработки, либо до отзыва
                согласия пользователем.
              </p>
            </section>

            <section>
              <h2 className="text-h3 font-heading font-semibold text-[var(--color-text)]">
                7. Права пользователя
              </h2>
              <p className="mt-3">Вы вправе:</p>
              <ul className="mt-3 list-disc space-y-1.5 pl-6">
                <li>
                  запросить информацию об обработке ваших персональных данных;
                </li>
                <li>
                  потребовать уточнения, блокирования или уничтожения данных,
                  если они являются неполными, устаревшими или неточными;
                </li>
                <li>отозвать согласие на обработку персональных данных;</li>
                <li>
                  обратиться с жалобой в уполномоченный орган по защите прав
                  субъектов персональных данных.
                </li>
              </ul>
              <p className="mt-3">
                Для реализации своих прав свяжитесь с нами по телефону{" "}
                <a
                  href={`tel:${site.phone.replace(/[^+\d]/g, "")}`}
                  className="font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
                >
                  {site.phone}
                </a>{" "}
                или по email{" "}
                <a
                  href={`mailto:${site.email}`}
                  className="font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
                >
                  {site.email}
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-h3 font-heading font-semibold text-[var(--color-text)]">
                8. Файлы cookie и аналитика
              </h2>
              <p className="mt-3">
                Сайт может использовать файлы cookie и сервисы веб-аналитики
                (Google Analytics, Яндекс.Метрика) для оценки эффективности
                работы сайта и улучшения пользовательского опыта. Вы можете
                отключить cookie в настройках своего браузера.
              </p>
            </section>

            <section>
              <h2 className="text-h3 font-heading font-semibold text-[var(--color-text)]">
                9. Изменения в Политике
              </h2>
              <p className="mt-3">
                Центр вправе вносить изменения в настоящую Политику. Актуальная
                редакция всегда доступна на этой странице. Продолжение
                использования сайта после внесения изменений означает согласие с
                новой редакцией Политики.
              </p>
            </section>

            <section>
              <h2 className="text-h3 font-heading font-semibold text-[var(--color-text)]">
                10. Контакты
              </h2>
              <p className="mt-3">
                {site.legal.company}
                {site.legal.details ? `, ${site.legal.details}` : ""}.
              </p>
              <p className="mt-2">
                Адрес:{" "}
                {site.addresses.map((addr) => addr.address).join("; ") || "—"}.
              </p>
            </section>
          </div>

          <div className="mt-10">
            <Link
              href="/"
              className="inline-flex h-11 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-sm font-semibold text-[var(--color-text)] transition-colors duration-200 ease-out hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]"
            >
              ← Вернуться на главную
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}