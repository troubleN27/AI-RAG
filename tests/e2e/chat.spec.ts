import { expect, test } from "@playwright/test";

// ==========================================================
// Тесты AI-чата (заглушка)
// ==========================================================

test.describe("AI-чат", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  // ------------------------------------------------------
  // Открытие/закрытие
  // ------------------------------------------------------

  test("плавающая кнопка чата видна на странице", async ({ page }) => {
    const chatButton = page.getByRole("button", {
      name: /открыть чат с ассистентом/i,
    });
    await expect(chatButton).toBeVisible();
  });

  test("клик по кнопке открывает окно чата", async ({ page }) => {
    const chatButton = page.getByRole("button", {
      name: /открыть чат с ассистентом/i,
    });
    await chatButton.click();

    const chatDialog = page.getByRole("dialog", { name: /чат с ассистентом/i });
    await expect(chatDialog).toBeVisible();
  });

  test("окно чата содержит приветствие и подсказки", async ({ page }) => {
    const chatButton = page.getByRole("button", {
      name: /открыть чат с ассистентом/i,
    });
    await chatButton.click();

    const chatDialog = page.getByRole("dialog", { name: /чат с ассистентом/i });

    // Приветствие
    await expect(
      chatDialog.getByText(/ассистент образовательного центра/i),
    ).toBeVisible();

    // Подсказки
    await expect(
      chatDialog.getByRole("button", { name: /какие курсы есть/i }),
    ).toBeVisible();
  });

  test("Esc закрывает окно чата", async ({ page }) => {
    const chatButton = page.getByRole("button", {
      name: /открыть чат с ассистентом/i,
    });
    await chatButton.click();

    const chatDialog = page.getByRole("dialog", { name: /чат с ассистентом/i });
    await expect(chatDialog).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(chatDialog).not.toBeVisible();
  });

  // ------------------------------------------------------
  // Отправка сообщений
  // ------------------------------------------------------

  test("отправка сообщения через кнопку получает ответ-заглушку", async ({
    page,
  }) => {
    // Мокаем API
    await page.route("**/api/chat", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          answer: "Тестовый ответ ассистента",
          suggested_actions: [
            {
              type: "open_form",
              label: "Записаться на консультацию",
            },
          ],
        }),
      });
    });

    const chatButton = page.getByRole("button", {
      name: /открыть чат с ассистентом/i,
    });
    await chatButton.click();

    const chatDialog = page.getByRole("dialog", { name: /чат с ассистентом/i });
    const input = chatDialog.getByRole("textbox", { name: /сообщение/i });

    await input.fill("Привет!");
    await chatDialog.getByRole("button", { name: /отправить сообщение/i }).click();

    await expect(chatDialog.getByText("Привет!")).toBeVisible();
    await expect(
      chatDialog.getByText("Тестовый ответ ассистента"),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("отправка по Enter (Shift+Enter — перенос строки)", async ({ page }) => {
    await page.route("**/api/chat", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          answer: "Ответ на вопрос",
        }),
      });
    });

    const chatButton = page.getByRole("button", {
      name: /открыть чат с ассистентом/i,
    });
    await chatButton.click();

    const chatDialog = page.getByRole("dialog", { name: /чат с ассистентом/i });
    const input = chatDialog.getByRole("textbox", { name: /сообщение/i });

    await input.fill("Вопрос через Enter");
    await input.press("Enter");

    await expect(
      chatDialog.getByText("Ответ на вопрос"),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("пустое сообщение не отправляется", async ({ page }) => {
    const chatButton = page.getByRole("button", {
      name: /открыть чат с ассистентом/i,
    });
    await chatButton.click();

    const chatDialog = page.getByRole("dialog", { name: /чат с ассистентом/i });
    const sendButton = chatDialog.getByRole("button", {
      name: /отправить сообщение/i,
    });

    // Кнопка должна быть disabled при пустом поле
    await expect(sendButton).toBeDisabled();
  });

  // ------------------------------------------------------
  // Подсказки (suggestions)
  // ------------------------------------------------------

  test("клик по подсказке отправляет её как сообщение", async ({ page }) => {
    await page.route("**/api/chat", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          answer: "Ответ на подсказку",
        }),
      });
    });

    const chatButton = page.getByRole("button", {
      name: /открыть чат с ассистентом/i,
    });
    await chatButton.click();

    const chatDialog = page.getByRole("dialog", { name: /чат с ассистентом/i });

    const suggestion = chatDialog.getByRole("button", { name: /какие курсы есть/i });
    await suggestion.click();

    await expect(chatDialog.getByText("Какие курсы есть?")).toBeVisible();
    await expect(
      chatDialog.getByText("Ответ на подсказку"),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("после первого сообщения подсказки скрываются", async ({ page }) => {
    await page.route("**/api/chat", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ answer: "Ответ" }),
      });
    });

    const chatButton = page.getByRole("button", {
      name: /открыть чат с ассистентом/i,
    });
    await chatButton.click();

    const chatDialog = page.getByRole("dialog", { name: /чат с ассистентом/i });

    // Подсказки видны до первого сообщения
    await expect(
      chatDialog.getByRole("button", { name: /какие курсы есть/i }),
    ).toBeVisible();

    // Отправляем сообщение
    const input = chatDialog.getByRole("textbox", { name: /сообщение/i });
    await input.fill("Тест");
    await input.press("Enter");

    await page.waitForTimeout(500);

    // Подсказки скрылись
    await expect(
      chatDialog.getByRole("button", { name: /какие курсы есть/i }),
    ).not.toBeVisible();
  });

  // ------------------------------------------------------
  // Действия
  // ------------------------------------------------------

  test("действие open_form открывает форму записи", async ({ page }) => {
    await page.route("**/api/chat", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          answer: "Пожалуйста, оставьте заявку",
          suggested_actions: [
            {
              type: "open_form",
              label: "Записаться на консультацию",
            },
          ],
        }),
      });
    });

    const chatButton = page.getByRole("button", {
      name: /открыть чат с ассистентом/i,
    });
    await chatButton.click();

    const chatDialog = page.getByRole("dialog", { name: /чат с ассистентом/i });
    const input = chatDialog.getByRole("textbox", { name: /сообщение/i });
    await input.fill("Хочу записаться");
    await input.press("Enter");

    // Ждём ответ с действием
    const actionButton = chatDialog.getByRole("button", {
      name: "Записаться на консультацию",
    });
    await expect(actionButton).toBeVisible({ timeout: 10_000 });

    await actionButton.click();

    // Должно открыться модальное окно с формой
    // (уточняем по accessible name, т.к. текст кнопки действия есть и в чате)
    const modal = page.getByRole("dialog", {
      name: /записаться на консультацию/i,
    });
    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  // ------------------------------------------------------
  // Ошибки API
  // ------------------------------------------------------

  test("ошибка API показывает сообщение об ошибке", async ({ page }) => {
    await page.route("**/api/chat", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          error: { code: "service_error", message: "Ошибка" },
        }),
      });
    });

    const chatButton = page.getByRole("button", {
      name: /открыть чат с ассистентом/i,
    });
    await chatButton.click();

    const chatDialog = page.getByRole("dialog", { name: /чат с ассистентом/i });
    const input = chatDialog.getByRole("textbox", { name: /сообщение/i });
    await input.fill("Вопрос");
    await input.press("Enter");

    await expect(
      chatDialog.getByText(/не удалось получить ответ/i),
    ).toBeVisible({ timeout: 10_000 });
  });

  // ------------------------------------------------------
  // История сохраняется при перезагрузке
  // ------------------------------------------------------

  test("история чата сохраняется между перезагрузками в пределах вкладки", async ({
    page,
  }) => {
    await page.route("**/api/chat", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ answer: "Ответ после перезагрузки" }),
      });
    });

    const chatButton = page.getByRole("button", {
      name: /открыть чат с ассистентом/i,
    });
    await chatButton.click();

    const chatDialog = page.getByRole("dialog", { name: /чат с ассистентом/i });
    const input = chatDialog.getByRole("textbox", { name: /сообщение/i });
    await input.fill("Сообщение до перезагрузки");
    await input.press("Enter");

    await expect(
      chatDialog.getByText("Ответ после перезагрузки"),
    ).toBeVisible({ timeout: 10_000 });

    // Перезагружаем
    await page.reload();
    await page.waitForTimeout(500);

    // Открываем чат
    const chatButtonAfterReload = page.getByRole("button", {
      name: /открыть чат с ассистентом/i,
    });
    await chatButtonAfterReload.click();

    const chatDialogAfter = page.getByRole("dialog", { name: /чат с ассистентом/i });

    // История сохранена
    await expect(
      chatDialogAfter.getByText("Сообщение до перезагрузки"),
    ).toBeVisible();
  });
});