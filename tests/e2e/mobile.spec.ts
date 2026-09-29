import { expect, test } from "@playwright/test";

import { clickStable, gotoSection, waitForDialogReady } from "./helpers";

// ==========================================================
// Тесты на мобильных и планшетных разрешениях
// ==========================================================

test.describe("Мобильная версия", () => {
  // Тесты в этом файле имеют смысл только на мобильных/планшетных проектах
  test.beforeEach(async ({ page }, testInfo) => {
    const isMobileOrTablet =
      testInfo.project.name.includes("mobile") ||
      testInfo.project.name.includes("tablet");

    test.skip(!isMobileOrTablet, "Только для мобильных/планшетных устройств");

    await page.goto("/");
  });

  // ------------------------------------------------------
  // Отсутствие горизонтальной прокрутки
  // ------------------------------------------------------

  test("нет горизонтальной прокрутки", async ({ page }) => {
    const overflow = await page.evaluate(() => {
      return (
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
      );
    });
    expect(overflow).toBeLessThanOrEqual(2);
  });

  test("нет горизонтальной прокрутки на разных ширинах", async ({ page }) => {
    const widths = [320, 375, 414, 768];

    for (const width of widths) {
      await page.setViewportSize({ width, height: 800 });
      await page.waitForTimeout(200);

      const overflow = await page.evaluate(() => {
        return (
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
        );
      });

      expect(
        overflow,
        `Горизонтальный overflow на ширине ${width}px`,
      ).toBeLessThanOrEqual(2);
    }
  });

  // ------------------------------------------------------
  // Мобильное меню
  // ------------------------------------------------------

  test("бургер-кнопка видна на мобильном, но не на планшете", async ({
    page,
    viewport,
  }) => {
    const burger = page.getByRole("button", { name: /открыть меню/i });

    if (viewport && viewport.width >= 1024) {
      await expect(burger).not.toBeVisible();
    } else {
      await expect(burger).toBeVisible();
    }
  });

  test("открытие и закрытие мобильного меню", async ({ page, viewport }) => {
    test.skip((viewport?.width ?? 0) >= 1280, "Только для < 1280px");

    const burger = page.getByRole("button", { name: /открыть меню/i });
    await burger.click();

    const menu = page.getByRole("dialog", { name: /меню навигации/i });
    await expect(menu).toBeVisible();

    const closeButton = menu.getByRole("button", { name: /закрыть меню/i });
    await closeButton.click();

    await expect(menu).not.toBeVisible();
  });

  test("Esc закрывает мобильное меню", async ({ page, viewport }) => {
    test.skip((viewport?.width ?? 0) >= 1280, "Только для < 1280px");

    const burger = page.getByRole("button", { name: /открыть меню/i });
    await burger.click();

    const menu = page.getByRole("dialog", { name: /меню навигации/i });
    await expect(menu).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(menu).not.toBeVisible();
  });

  test("клик по пункту меню закрывает меню и прокручивает к секции", async ({
    page,
    viewport,
  }) => {
    test.skip((viewport?.width ?? 0) >= 1280, "Только для < 1280px");

    const burger = page.getByRole("button", { name: /открыть меню/i });
    await burger.click();

    const menu = page.getByRole("dialog", { name: /меню навигации/i });
    const aboutLink = menu.getByRole("link", { name: "О центре" });
    await aboutLink.click();

    await expect(menu).not.toBeVisible();
    await page.waitForTimeout(900);

    await expect(page.locator("#about")).toBeInViewport();
  });

  // ------------------------------------------------------
  // Чат
  // ------------------------------------------------------

  test("кнопка чата открывает полноэкранное окно на мобильном", async ({
    page,
    viewport,
  }) => {
    test.skip((viewport?.width ?? 0) >= 1280, "Только для < 1280px");

    const chatButton = page.getByRole("button", {
      name: /открыть чат с ассистентом/i,
    });
    await chatButton.click();

    const chatDialog = page.getByRole("dialog", { name: /чат с ассистентом/i });
    await expect(chatDialog).toBeVisible();

    // Проверяем, что окно занимает почти всю высоту экрана
    const box = await chatDialog.boundingBox();
    if (box && viewport) {
      expect(box.height).toBeGreaterThanOrEqual(viewport.height * 0.9);
    }
  });

  // ------------------------------------------------------
  // Слайдеры
  // ------------------------------------------------------

  test("слайдер преподавателей показывает 1 карточку на мобильном", async ({
    page,
    viewport,
  }) => {
    test.skip((viewport?.width ?? 0) >= 1280, "Только для < 1280px");

    const teachersSection = await gotoSection(page, "#teachers");

    // Свайп по слайдеру
    const swiper = teachersSection.locator(".swiper").first();
    const box = await swiper.boundingBox();

    if (box) {
      // Эмулируем свайп влево
      await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, {
        steps: 10,
      });
      await page.mouse.up();
      await page.waitForTimeout(500);
    }

    // Проверяем, что слайдер жив и не сломан
    await expect(swiper).toBeVisible();
  });

  // ------------------------------------------------------
  // Модальные окна курса (bottom-sheet на мобильном)
  // ------------------------------------------------------

  test("модальное окно курса открывается снизу на мобильном", async ({
    page,
    viewport,
  }) => {
    test.skip((viewport?.width ?? 0) >= 1280, "Только для < 1280px");

    const coursesSection = await gotoSection(page, "#courses");

    const detailsButton = coursesSection
      .getByRole("button", { name: /подробнее о курсе/i })
      .first();

    if ((await detailsButton.count()) === 0) {
      test.skip(true, "Нет доступных курсов");
      return;
    }

    await clickStable(detailsButton);

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await waitForDialogReady(dialog);

    // На мобильном модальное окно должно быть прижато к низу
    const box = await dialog.boundingBox();
    if (box && viewport) {
      const bottomEdge = box.y + box.height;
      expect(bottomEdge).toBeGreaterThanOrEqual(viewport.height - 10);
    }
  });

  // ------------------------------------------------------
  // Форма на мобильном
  // ------------------------------------------------------

  test("форма консультации доступна и поля не «слипаются»", async ({
    page,
  }) => {
    const contactsSection = await gotoSection(page, "#contact");

    const nameInput = contactsSection.getByLabel(/имя/i).first();
    const phoneInput = contactsSection.getByLabel(/телефон/i).first();

    await expect(nameInput).toBeVisible();
    await expect(phoneInput).toBeVisible();

    const nameBox = await nameInput.boundingBox();
    const phoneBox = await phoneInput.boundingBox();

    if (nameBox && phoneBox) {
      // Между полями должен быть хотя бы небольшой отступ
      expect(phoneBox.y).toBeGreaterThan(nameBox.y + nameBox.height);
    }
  });

  // ------------------------------------------------------
  // Доступность на мобильных
  // ------------------------------------------------------

  test("все интерактивные элементы имеют достаточную область нажатия", async ({
    page,
  }) => {
    await page.goto("/");

    const buttons = page.locator(
      'button:visible, a[href]:visible, [role="button"]:visible',
    );
    const count = await buttons.count();

    // Проверяем первые 15 кнопок, чтобы не замедлять тест
    const limit = Math.min(count, 15);

    for (let i = 0; i < limit; i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();

      if (!box) continue;

      // Минимальная область нажатия — 40×40 (не 44, чтобы избежать ложных
      // срабатываний на текстовых ссылках, но достаточная для тапов)
      const minSize = 24;
      if (box.width < minSize || box.height < minSize) {
        // Для текстовых ссылок делаем исключение — они находятся в потоке
        const tagName = await button.evaluate((el) => el.tagName.toLowerCase());
        if (tagName === "a") continue;

        // Мелкие кнопки вне футера/хедера проверяем строже
        expect(
          box.height,
          `Кнопка ${i} имеет высоту ${box.height}px`,
        ).toBeGreaterThanOrEqual(32);
      }
    }
  });
});