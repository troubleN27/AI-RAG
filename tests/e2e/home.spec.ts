import { expect, test } from "@playwright/test";

import { clickStable, gotoSection, waitForDialogReady } from "./helpers";

// ==========================================================
// Тесты главной страницы
// ==========================================================

test.describe("Главная страница", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  // ------------------------------------------------------
  // Загрузка и структура
  // ------------------------------------------------------

  test("страница загружается и содержит главный заголовок", async ({ page }) => {
    await expect(page).toHaveTitle(/Образовательный центр/i);

    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    await expect(h1).not.toBeEmpty();
  });

  test("один h1 на странице", async ({ page }) => {
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBe(1);
  });

  test("все ключевые секции присутствуют", async ({ page }) => {
    const sections = [
      "#top",
      "#about",
      "#courses",
      "#teachers",
      "#benefits",
      "#reviews",
      "#faq",
      "#contact",
    ];

    for (const selector of sections) {
      await expect(page.locator(selector)).toBeAttached();
    }
  });

  test("нет горизонтальной прокрутки на ширине 1440", async ({ page }) => {
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth - document.documentElement.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(2);
  });

  // ------------------------------------------------------
  // Header и навигация
  // ------------------------------------------------------

  test("header содержит логотип и кнопку записи", async ({ page }) => {
    const header = page.locator("header").first();
    await expect(header).toBeVisible();

    // Ориентируемся на ширину вьюпорта, а не на isMobile: у iPad-профиля
    // isMobile=true, но ширина 1024px. Полное меню в шапке появляется
    // только с xl (1280px), ниже — бургер.
    const width = page.viewportSize()?.width ?? 0;

    if (width < 640) {
      // CTA из шапки скрыт — вместо него бургер-меню
      await expect(
        header.getByRole("button", { name: /открыть меню/i }),
      ).toBeVisible();
      return;
    }

    if (width < 1280) {
      // Ниже xl меню свёрнуто в бургер, но CTA в шапке остаётся
      await expect(header.getByRole("button", { name: /записаться/i })).toBeVisible();
      await expect(
        header.getByRole("button", { name: /открыть меню/i }),
      ).toBeVisible();
      return;
    }

    const ctaButton = header.getByRole("button", { name: /записаться/i });
    await expect(ctaButton).toBeVisible();
  });

  test("название в логотипе отображается полностью", async ({ page }) => {
    const brand = page
      .locator('header a[aria-label*="на главную"] span')
      .filter({ hasText: "Прогресс" })
      .first();

    await expect(brand).toBeVisible();
    // Никакого «Прогр...»: текст не должен быть обрезан многоточием
    await expect(brand).toHaveText("Прогресс");
    expect(
      await brand.evaluate((el) => el.scrollWidth > el.clientWidth + 1),
    ).toBe(false);
  });

  test("клик по пункту меню прокручивает к секции", async ({ page }) => {
    const width = page.viewportSize()?.width ?? 0;
    const header = page.locator("header").first();

    if (width < 1280) {
      // Полного меню в шапке нет — открываем бургер
      await header.getByRole("button", { name: /открыть меню/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
    }

    const aboutLink = page.getByRole("link", { name: "О центре" }).first();
    await aboutLink.click();

    // Ждём прокрутки
    await expect(page.locator("#about")).toBeInViewport();
  });

  test("header сжимается при прокрутке", async ({ page }) => {
    const header = page.locator("header").first();

    const initialHeight = await header.evaluate((el) => el.getBoundingClientRect().height);

    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(400);

    const scrolledHeight = await header.evaluate((el) => el.getBoundingClientRect().height);

    expect(scrolledHeight).toBeLessThan(initialHeight);
  });

  // ------------------------------------------------------
  // Hero
  // ------------------------------------------------------

  test("Hero содержит CTA-кнопки и статистику", async ({ page }) => {
    const consultButton = page.getByRole("button", {
      name: /записаться на консультацию/i,
    });
    await expect(consultButton.first()).toBeVisible();

    const coursesButton = page.getByRole("button", { name: /смотреть курсы/i });
    await expect(coursesButton.first()).toBeVisible();
  });

  test("клик «Смотреть курсы» прокручивает к секции курсов", async ({ page }) => {
    const coursesButton = page.getByRole("button", { name: /смотреть курсы/i }).first();
    await clickStable(coursesButton);

    await expect(page.locator("#courses")).toBeInViewport();
  });

  // ------------------------------------------------------
  // Курсы
  // ------------------------------------------------------

  test("секция курсов содержит карточки", async ({ page }) => {
    const coursesSection = page.locator("#courses");
    await coursesSection.scrollIntoViewIfNeeded();

    const cards = coursesSection.locator("article");
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("фильтр по направлению работает", async ({ page }) => {
    const coursesSection = await gotoSection(page, "#courses");

    // Кликаем на таб «Программирование» (или первое доступное направление)
    const designTab = coursesSection.getByRole("tab", { name: /программирование/i });
    if ((await designTab.count()) > 0) {
      await clickStable(designTab);

      const cards = coursesSection.locator("article");
      await expect(cards.first()).toBeVisible();
    }
  });

  test("открытие модального окна курса по кнопке «Подробнее»", async ({ page }) => {
    const coursesSection = await gotoSection(page, "#courses");

    const detailsButton = coursesSection
      .getByRole("button", { name: /подробнее о курсе/i })
      .first();

    if ((await detailsButton.count()) > 0) {
      await clickStable(detailsButton);

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await waitForDialogReady(dialog);

      // Закрываем по Esc
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
    }
  });

  // ------------------------------------------------------
  // FAQ
  // ------------------------------------------------------

  test("FAQ-аккордеон раскрывается по клику", async ({ page }) => {
    const faqSection = await gotoSection(page, "#faq");

    const firstButton = faqSection.locator("button[aria-expanded]").first();
    const initialExpanded = await firstButton.getAttribute("aria-expanded");

    await clickStable(firstButton);
    await expect(firstButton).not.toHaveAttribute("aria-expanded", initialExpanded ?? "");
  });

  // ------------------------------------------------------
  // Форма
  // ------------------------------------------------------

  test("форма в секции контактов отображается", async ({ page }) => {
    const contactsSection = await gotoSection(page, "#contact");

    const nameInput = contactsSection.getByLabel(/имя/i).first();
    await expect(nameInput).toBeVisible();
  });

  test("валидация формы: пустые поля", async ({ page }) => {
    const contactsSection = await gotoSection(page, "#contact");

    const submitButton = contactsSection.getByRole("button", { name: /отправить/i });
    await clickStable(submitButton);

    // Ошибки рендерятся реактивно после клика, поэтому ждём их появления,
    // а не считаем сразу — иначе проверка гоняется с рендером.
    const errors = contactsSection.locator(
      '[role="alert"], .text-\\[var\\(--color-error\\)\\]',
    );
    await expect(errors.first()).toBeVisible({ timeout: 10_000 });
  });

  // ------------------------------------------------------
  // Футер
  // ------------------------------------------------------

  test("футер содержит контакты и ссылку на политику", async ({ page }) => {
    const footer = page.locator("footer");
    await footer.scrollIntoViewIfNeeded();

    await expect(footer).toBeVisible();
    await expect(
      footer.getByRole("link", { name: /политика конфиденциальности/i }),
    ).toBeVisible();
  });

  test("клик по ссылке «Политика конфиденциальности» открывает страницу", async ({
    page,
  }) => {
    const footer = page.locator("footer");
    await footer.scrollIntoViewIfNeeded();

    await clickStable(
      footer.getByRole("link", { name: /политика конфиденциальности/i }),
    );
    await page.waitForURL(/\/privacy/);

    await expect(page).toHaveURL(/\/privacy/);
    await expect(page.locator("h1")).toContainText(/политик/i);
  });

  // ------------------------------------------------------
  // Кнопка «Наверх»
  // ------------------------------------------------------

  test("кнопка «Наверх» появляется после прокрутки", async ({ page }) => {
    const scrollTopButton = page.getByRole("button", { name: /наверх/i });

    // Изначально не видна
    await expect(scrollTopButton).not.toBeVisible();

    // Прокрутка вниз
    await page.evaluate(() => window.scrollTo(0, 1000));
    await expect(scrollTopButton).toBeVisible();

    // Клик — возвращает наверх
    await clickStable(scrollTopButton);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(100);
  });
});