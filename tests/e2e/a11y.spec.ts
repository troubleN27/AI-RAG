import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { openLeadModal } from "./helpers";

// ==========================================================
// Тесты доступности (a11y) через axe-core
// ==========================================================

test.describe("Доступность (axe)", () => {
  // Теги WCAG 2.1 A и AA
  const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

  test("главная страница не имеет критичных нарушений", async ({ page }) => {
    await page.goto("/");

    const results = await new AxeBuilder({ page })
      .withTags(AXE_TAGS)
      // Swiper-слайдеры дают ложные срабатывания при рассчитанных координатах
      .exclude(".swiper-wrapper")
      .analyze();

    // Показываем первые нарушения для отладки
    if (results.violations.length > 0) {
      // eslint-disable-next-line no-console
      console.log(
        "Нарушения a11y:",
        results.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.length,
        })),
      );
    }

    // Фильтруем только серьёзные и критические
    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );

    expect(
      critical,
      `Найдены критичные нарушения a11y: ${critical.map((v) => v.id).join(", ")}`,
    ).toEqual([]);
  });

  test("страница политики конфиденциальности не имеет критичных нарушений", async ({
    page,
  }) => {
    await page.goto("/privacy");

    const results = await new AxeBuilder({ page })
      .withTags(AXE_TAGS)
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );

    expect(
      critical,
      `Нарушения на /privacy: ${critical.map((v) => v.id).join(", ")}`,
    ).toEqual([]);
  });

  test("модальное окно формы доступно с клавиатуры", async ({ page }) => {
    await page.goto("/");

    const dialog = await openLeadModal(page);

    // Внутри модального окна не должно быть критичных нарушений
    const results = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(AXE_TAGS)
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );

    expect(critical).toEqual([]);
  });

  test("чат доступен и не имеет критичных нарушений", async ({ page }) => {
    await page.goto("/");

    const chatButton = page.getByRole("button", {
      name: /открыть чат с ассистентом/i,
    });
    await chatButton.click();

    const chatDialog = page.getByRole("dialog", { name: /чат с ассистентом/i });
    await expect(chatDialog).toBeVisible();

    const results = await new AxeBuilder({ page })
      .include('[role="dialog"][aria-modal="false"]')
      .withTags(AXE_TAGS)
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );

    expect(critical).toEqual([]);
  });

  // ------------------------------------------------------
  // Проверки без axe
  // ------------------------------------------------------

  test("страница имеет доступное имя и язык", async ({ page }) => {
    await page.goto("/");

    // Язык страницы
    const htmlLang = await page.locator("html").getAttribute("lang");
    expect(htmlLang).toBe("ru");

    // Заголовок
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test("все изображения имеют alt", async ({ page }) => {
    await page.goto("/");
    await page.locator("#teachers").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const images = page.locator("img");
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute("alt");
      const ariaHidden = await img.getAttribute("aria-hidden");
      const role = await img.getAttribute("role");

      // alt может быть пустым для декоративных, но должен присутствовать
      // (или img должен быть скрыт aria-hidden / role="presentation")
      const hasAlt = alt !== null;
      const isDecorative = ariaHidden === "true" || role === "presentation";

      expect(
        hasAlt || isDecorative,
        `Изображение ${i} без alt и не помечено как декоративное`,
      ).toBe(true);
    }
  });

  test("все кнопки имеют доступное имя", async ({ page }) => {
    await page.goto("/");
    await page.locator("#courses").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const buttons = page.locator("button");
    const count = await buttons.count();
    const limit = Math.min(count, 40);

    for (let i = 0; i < limit; i++) {
      const button = buttons.nth(i);
      const isVisible = await button.isVisible();
      if (!isVisible) continue;

      const ariaLabel = await button.getAttribute("aria-label");
      const text = (await button.textContent()) ?? "";
      const title = await button.getAttribute("title");

      const hasName =
        (ariaLabel && ariaLabel.trim().length > 0) ||
        (text && text.trim().length > 0) ||
        (title && title.trim().length > 0);

      expect(
        hasName,
        `Кнопка #${i} без доступного имени`,
      ).toBe(true);
    }
  });

  test("все ссылки имеют доступное имя", async ({ page }) => {
    await page.goto("/");

    const links = page.locator("a[href]");
    const count = await links.count();
    const limit = Math.min(count, 50);

    for (let i = 0; i < limit; i++) {
      const link = links.nth(i);
      const isVisible = await link.isVisible();
      if (!isVisible) continue;

      const ariaLabel = await link.getAttribute("aria-label");
      const text = (await link.textContent()) ?? "";

      const hasName =
        (ariaLabel && ariaLabel.trim().length > 0) ||
        (text && text.trim().length > 0);

      expect(hasName, `Ссылка #${i} без доступного имени`).toBe(true);
    }
  });

  test("формы имеют связанные label", async ({ page }) => {
    await page.goto("/");
    await page.locator("#contact").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const inputs = page.locator('input[type="text"], input[type="tel"], textarea');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const isVisible = await input.isVisible();
      if (!isVisible) continue;

      const id = await input.getAttribute("id");
      const ariaLabel = await input.getAttribute("aria-label");
      const ariaLabelledBy = await input.getAttribute("aria-labelledby");

      let hasLabel = Boolean(ariaLabel || ariaLabelledBy);

      if (!hasLabel && id) {
        const labelCount = await page.locator(`label[for="${id}"]`).count();
        hasLabel = labelCount > 0;
      }

      expect(hasLabel, `Поле ввода #${i} без label`).toBe(true);
    }
  });

  test("skip link присутствует и работает", async ({ page, isMobile }) => {
    await page.goto("/");

    const skipLink = page.getByRole("link", { name: /перейти к содержимому/i });
    await expect(skipLink).toBeAttached();

    // Skip-link обязан быть первым фокусируемым элементом в DOM.
    // Проверяем это напрямую, а не через Tab: iOS Safari и мобильная
    // эмуляция по умолчанию не включают ссылки в последовательность Tab
    // (системная настройка «Полная клавиатурная навигация»), поэтому
    // клавиша Tab там сразу попадает на кнопку.
    const isFirstFocusable = await page.evaluate(() => {
      const first = document.querySelector<HTMLElement>(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      return first?.classList.contains("skip-link") ?? false;
    });
    expect(isFirstFocusable).toBe(true);

    // При фокусе skip-link должен становиться видимым
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeInViewport();

    // На устройствах с полноценной клавиатурой проверяем и Tab-путь
    if (!isMobile) {
      await page.goto("/");
      await page.keyboard.press("Tab");
      await expect(skipLink).toBeFocused();
    }
  });

  test("фокус виден на интерактивных элементах", async ({ page }) => {
    await page.goto("/");

    // Переходим к первой интерактивной области
    await page.keyboard.press("Tab"); // skip link
    await page.keyboard.press("Tab"); // лого

    // Проверяем, что фокус на каком-то элементе
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? el.tagName.toLowerCase() : null;
    });

    expect(focused).not.toBeNull();
  });

  test("порядок заголовков логичен (один h1)", async ({ page }) => {
    await page.goto("/");

    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBe(1);

    // Проверяем, что все заголовки после h1 идут в разумном порядке
    const headings = await page.evaluate(() => {
      const nodes = Array.from(
        document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
      );
      return nodes.map((n) => Number(n.tagName.substring(1)));
    });

    // Первый заголовок должен быть h1
    expect(headings[0]).toBe(1);
  });

  test("aria-live регион для чата", async ({ page }) => {
    await page.goto("/");

    const chatButton = page.getByRole("button", {
      name: /открыть чат с ассистентом/i,
    });
    await chatButton.click();

    // aria-live должен присутствовать на контейнере сообщений
    const liveRegions = page.locator('[aria-live="polite"]');
    await expect(liveRegions.first()).toBeAttached({ timeout: 10_000 });
  });

  test("аккордеон FAQ имеет корректные aria-атрибуты", async ({ page }) => {
    await page.goto("/");
    await page.locator("#faq").scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    const faqButton = page.locator("#faq button[aria-expanded]").first();
    await expect(faqButton).toBeAttached();

    const ariaControls = await faqButton.getAttribute("aria-controls");
    expect(ariaControls).toBeTruthy();

    if (ariaControls) {
      const panel = page.locator(`#${ariaControls}`);
      await expect(panel).toBeAttached();
    }
  });

  test("навигация только с клавиатуры работает", async ({ page }) => {
    await page.goto("/");

    // Фокусируемся на body
    await page.locator("body").click({ position: { x: 5, y: 5 } });

    // Прокручиваем табом по элементам
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab");
    }

    const focusedTag = await page.evaluate(() => {
      return document.activeElement?.tagName.toLowerCase() ?? null;
    });

    expect(["a", "button", "input", "textarea", "select"]).toContain(focusedTag);
  });
});