import { expect, type Locator, type Page } from "@playwright/test";

// ==========================================================
// Общие хелперы e2e-тестов
// ==========================================================

/**
 * Кнопка «Записаться» в шапке.
 * На ширинах < 640px она скрыта (показывается бургер-меню), поэтому
 * на мобильных профилях кликать по ней нельзя.
 */
export function headerCta(page: Page): Locator {
  return page.locator("header").getByRole("button", { name: /записаться/i }).first();
}

/**
 * Открывает модальное окно заявки любым доступным CTA.
 * Нужно тестам, которые проверяют содержимое модалки, а не конкретную кнопку.
 */
export async function openLeadModal(page: Page): Promise<Locator> {
  const header = headerCta(page);

  if (await header.isVisible()) {
    await clickStable(header);
  } else {
    // На мобильных CTA из шапки скрыт — берём кнопку из Hero.
    // Ограничиваем поиск секцией hero: такие же кнопки есть в футере.
    await clickStable(
      page
        .locator("main")
        .getByRole("button", { name: /записаться на консультацию/i })
        .first(),
    );
  }

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await waitForDialogReady(dialog);
  return dialog;
}

/**
 * Дожидается окончания анимации открытия диалога (opacity 0→1, 0.25 с).
 *
 * `toBeVisible()` проверяет лишь геометрию и display, но не прозрачность,
 * поэтому axe успевает замерить промежуточный композит — например, белый
 * текст на полупрозрачном primary даёт 4.22:1 вместо реальных 6.3:1.
 */
export async function waitForDialogReady(dialog: Locator): Promise<void> {
  await dialog.evaluate(
    (el) =>
      new Promise<void>((resolve) => {
        const check = () => {
          const opacity = Number(getComputedStyle(el).opacity);
          if (opacity >= 0.99) {
            resolve();
            return;
          }
          requestAnimationFrame(check);
        };
        check();
      }),
  );
}

/**
 * Дожидается, пока элемент перестанет двигаться.
 *
 * Секции на сайте появляются через Reveal (framer-motion): opacity 0→1 и
 * y 24→0 за 0.6 с, а карточки курсов дополнительно уезжают на -4px в hover.
 * Пока анимация играет, Playwright hit-test попадает в соседний элемент
 * («element is not stable» / «intercepts pointer events»), хотя в покое
 * вёрстка полностью корректна.
 *
 * Ждём не фиксированное время, а реальное совпадение bounding box между
 * последовательными кадрами — это устойчиво к скорости машины.
 */
export async function waitForStable(locator: Locator): Promise<void> {
  await locator.waitFor({ state: "visible" });
  await locator.evaluate(
    (el) =>
      new Promise<void>((resolve) => {
        let lastX = NaN;
        let lastY = NaN;
        let lastW = NaN;
        let lastH = NaN;
        let stableFrames = 0;

        const check = () => {
          const rect = el.getBoundingClientRect();
          const same =
            Math.abs(rect.x - lastX) < 0.5 &&
            Math.abs(rect.y - lastY) < 0.5 &&
            Math.abs(rect.width - lastW) < 0.5 &&
            Math.abs(rect.height - lastH) < 0.5;

          if (same) {
            stableFrames += 1;
          } else {
            stableFrames = 0;
            lastX = rect.x;
            lastY = rect.y;
            lastW = rect.width;
            lastH = rect.height;
          }

          if (stableFrames >= 4) {
            resolve();
            return;
          }
          requestAnimationFrame(check);
        };

        requestAnimationFrame(check);
      }),
  );
}

/**
 * Клик, устойчивый к анимациям появления и hover-трансформациям.
 * Перехват реальными элементами по-прежнему приводит к падению теста.
 */
export async function clickStable(locator: Locator): Promise<void> {
  await waitForStable(locator);
  await locator.click();
}

/** Отметка чекбокса после стабилизации геометрии (аналог clickStable). */
export async function checkStable(locator: Locator): Promise<void> {
  await waitForStable(locator);
  await locator.check();
}

/**
 * Прокручивает к секции и дожидается окончания Reveal-анимаций внутри неё.
 * Удобно в beforeEach: после этого клики по элементам секции стабильны.
 */
export async function gotoSection(
  page: Page,
  selector: string,
): Promise<Locator> {
  const section = page.locator(selector).first();
  await section.scrollIntoViewIfNeeded();
  await waitForStable(section);
  return section;
}
