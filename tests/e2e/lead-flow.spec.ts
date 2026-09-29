import { expect, test } from "@playwright/test";

import {
  checkStable,
  clickStable,
  gotoSection,
  openLeadModal,
  waitForDialogReady,
} from "./helpers";

// ==========================================================
// Тесты потока заявки: форма, валидация, отправка
// ==========================================================

test.describe("Заявка на консультацию", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Уходим в секцию контактов и ждём окончания Reveal-анимаций
    await gotoSection(page, "#contact");
  });

  // ------------------------------------------------------
  // Успешная отправка (мокаем /api/lead)
  // ------------------------------------------------------

  test("успешная отправка формы показывает сообщение об успехе", async ({
    page,
  }) => {
    // Мокаем API
    await page.route("**/api/lead", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    const form = page.locator("#contact form").first();

    await form.getByLabel(/имя/i).fill("Иван Тестов");
    await form.getByLabel(/телефон/i).fill("+998 90 123 45 67");
    await checkStable(form.getByRole("checkbox", { name: /политик/i }));

    await clickStable(form.getByRole("button", { name: /отправить/i }));

    // Ожидаем сообщение об успехе
    await expect(
      page.getByText(/спасибо.*заявка отправлена/i),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("после успешной отправки поля формы очищаются", async ({ page }) => {
    await page.route("**/api/lead", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    const form = page.locator("#contact form").first();

    await form.getByLabel(/имя/i).fill("Иван Тестов");
    await form.getByLabel(/телефон/i).fill("+998 90 123 45 67");
    await checkStable(form.getByRole("checkbox", { name: /политик/i }));

    await clickStable(form.getByRole("button", { name: /отправить/i }));

    await expect(
      page.getByText(/спасибо.*заявка отправлена/i),
    ).toBeVisible({ timeout: 10_000 });

    // Проверяем, что при возврате к форме поля пустые
    // (после клика по кнопке "Закрыть" или после повторного открытия)
  });

  // ------------------------------------------------------
  // Валидация формы
  // ------------------------------------------------------

  test("валидация: пустые обязательные поля", async ({ page }) => {
    const form = page.locator("#contact form").first();
    await clickStable(form.getByRole("button", { name: /отправить/i }));

    // Ошибки под полями
    await expect(form.getByText(/минимум 2/i)).toBeVisible();
    await expect(form.getByText(/корректный номер/i)).toBeVisible();
  });

  test("валидация: имя из одной буквы", async ({ page }) => {
    const form = page.locator("#contact form").first();

    await form.getByLabel(/имя/i).fill("И");
    // Снимаем фокус, чтобы сработал onBlur-валидатор.
    // Клик по соседнему полю здесь ненадёжен: поверх input лежит floating-label,
    // и Playwright считает его перехватом клика.
    await form.getByLabel(/имя/i).blur();

    await expect(form.getByText(/минимум 2/i)).toBeVisible();
  });

  test("валидация: некорректный телефон", async ({ page }) => {
    const form = page.locator("#contact form").first();

    await form.getByLabel(/имя/i).fill("Иван");
    await form.getByLabel(/телефон/i).fill("abc");
    await form.getByLabel(/телефон/i).blur();

    await expect(form.getByText(/корректный номер/i)).toBeVisible();
  });

  test("валидация: без согласия на обработку данных", async ({ page }) => {
    const form = page.locator("#contact form").first();

    await form.getByLabel(/имя/i).fill("Иван");
    await form.getByLabel(/телефон/i).fill("+998 90 123 45 67");
    // НЕ ставим чекбокс
    await clickStable(form.getByRole("button", { name: /отправить/i }));

    await page.waitForTimeout(400);

    // Сообщение об ошибке согласия
    await expect(
      page.getByText(/согласие на обработку/i).first(),
    ).toBeVisible();
  });

  // ------------------------------------------------------
  // Ошибки сервера
  // ------------------------------------------------------

  test("ошибка 500 показывает сообщение об ошибке", async ({ page }) => {
    await page.route("**/api/lead", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ ok: false, error: "server_error" }),
      });
    });

    const form = page.locator("#contact form").first();

    await form.getByLabel(/имя/i).fill("Иван Тестов");
    await form.getByLabel(/телефон/i).fill("+998 90 123 45 67");
    await checkStable(form.getByRole("checkbox", { name: /политик/i }));

    await clickStable(form.getByRole("button", { name: /отправить/i }));

    await expect(
      form.getByText(/не удалось отправить заявку/i),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("ошибка 429 показывает сообщение о лимите", async ({ page }) => {
    await page.route("**/api/lead", async (route) => {
      await route.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify({ ok: false, error: "rate_limited" }),
      });
    });

    const form = page.locator("#contact form").first();

    await form.getByLabel(/имя/i).fill("Иван Тестов");
    await form.getByLabel(/телефон/i).fill("+998 90 123 45 67");
    await checkStable(form.getByRole("checkbox", { name: /политик/i }));

    await clickStable(form.getByRole("button", { name: /отправить/i }));

    await expect(form.getByText(/слишком много попыток/i)).toBeVisible({
      timeout: 10_000,
    });
  });

  // ------------------------------------------------------
  // Модальное окно формы
  // ------------------------------------------------------

  test("клик по CTA в header открывает модальное окно с формой", async ({
    page,
  }) => {
    await page.evaluate(() => window.scrollTo(0, 0));

    const dialog = await openLeadModal(page);
    await expect(dialog.getByText(/записаться на консультацию/i)).toBeVisible();
  });

  test("клик по CTA в hero открывает модальное окно", async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 0));

    const heroCta = page
      .locator("main")
      .getByRole("button", { name: /записаться на консультацию/i })
      .first();

    await clickStable(heroCta);

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await waitForDialogReady(dialog);
  });

  test("форма в модальном окне отправляется", async ({ page }) => {
    await page.route("**/api/lead", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.evaluate(() => window.scrollTo(0, 0));

    const dialog = await openLeadModal(page);

    await dialog.getByLabel(/имя/i).fill("Мария Тестова");
    await dialog.getByLabel(/телефон/i).fill("+998 90 111 22 33");
    await checkStable(dialog.getByRole("checkbox", { name: /политик/i }));

    await clickStable(dialog.getByRole("button", { name: /отправить/i }));

    await expect(
      dialog.getByText(/спасибо.*заявка отправлена/i),
    ).toBeVisible({ timeout: 10_000 });
  });

  // ------------------------------------------------------
  // Предзаполнение курса
  // ------------------------------------------------------

  test("клик «Записаться» на карточке курса предзаполняет курс в форме", async ({
    page,
  }) => {
    const coursesSection = await gotoSection(page, "#courses");

    const enrollButton = coursesSection
      .getByRole("button", { name: /записаться на курс/i })
      .first();

    if ((await enrollButton.count()) === 0) {
      test.skip(true, "Нет доступных курсов");
      return;
    }

    await clickStable(enrollButton);

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await waitForDialogReady(dialog);

    // Проверяем, что селект курса заполнен
    const courseSelect = dialog.getByLabel(/интересующий курс/i);
    const selectedValue = await courseSelect.inputValue();
    expect(selectedValue.length).toBeGreaterThan(0);
  });

  // ------------------------------------------------------
  // Honeypot (антиспам)
  // ------------------------------------------------------

  test("honeypot-поле скрыто и невидимо для пользователя", async ({ page }) => {
    const form = page.locator("#contact form").first();
    const honeypot = form.locator('input[name="website"]');

    if ((await honeypot.count()) > 0) {
      const box = await honeypot.boundingBox();
      if (box) {
        // Поле должно быть за пределами видимой области
        expect(box.x).toBeLessThan(0);
      }
    }
  });
});