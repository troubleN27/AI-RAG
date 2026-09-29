/* eslint-disable no-console */

import {
  getBenefits,
  getCourses,
  getDirections,
  getFaq,
  getReviews,
  getSiteConfig,
  getTeachers,
} from "../lib/content";

// ==========================================================
// Вспомогательные функции
// ==========================================================

function logHeader(title: string): void {
  console.log(`\n▶ ${title}`);
}

function logOk(message: string): void {
  console.log(`  ✓ ${message}`);
}

function logError(message: string): void {
  console.error(`  ✗ ${message}`);
}

function pluralizeRu(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) return one;
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return few;
  return many;
}

// ==========================================================
// Основная логика
// ==========================================================

interface Report {
  warnings: string[];
  errors: string[];
}

function validateContent(): Report {
  const report: Report = { warnings: [], errors: [] };

  // ------------------------------------------------------
  // 1. Базовая валидация (запускается при импорте lib/content/index.ts)
  // ------------------------------------------------------
  logHeader("Валидация схем контента");

  const site = getSiteConfig();
  const directions = getDirections();
  const courses = getCourses();
  const teachers = getTeachers();
  const reviews = getReviews();
  const faq = getFaq();
  const benefits = getBenefits();

  logOk(`site.json — ${site.name}`);
  logOk(
    `directions.json — ${directions.length} ${pluralizeRu(directions.length, "направление", "направления", "направлений")}`,
  );
  logOk(
    `courses.json — ${courses.length} ${pluralizeRu(courses.length, "курс", "курса", "курсов")}`,
  );
  logOk(
    `teachers.json — ${teachers.length} ${pluralizeRu(teachers.length, "преподаватель", "преподавателя", "преподавателей")}`,
  );
  logOk(
    `reviews.json — ${reviews.length} ${pluralizeRu(reviews.length, "отзыв", "отзыва", "отзывов")}`,
  );
  logOk(
    `faq.json — ${faq.length} ${pluralizeRu(faq.length, "вопрос", "вопроса", "вопросов")}`,
  );
  logOk(
    `benefits.json — ${benefits.length} ${pluralizeRu(benefits.length, "преимущество", "преимущества", "преимуществ")}`,
  );

  // ------------------------------------------------------
  // 2. Уникальность id внутри коллекций
  // ------------------------------------------------------
  logHeader("Проверка уникальности id");

  const collections: Array<{ name: string; items: Array<{ id: string }> }> = [
    { name: "directions", items: directions },
    { name: "courses", items: courses },
    { name: "teachers", items: teachers },
    { name: "reviews", items: reviews },
    { name: "faq", items: faq },
    { name: "benefits", items: benefits },
  ];

  for (const collection of collections) {
    const seen = new Set<string>();
    for (const item of collection.items) {
      if (seen.has(item.id)) {
        report.errors.push(
          `Дублирующийся id "${item.id}" в ${collection.name}.json`,
        );
      }
      seen.add(item.id);
    }
    logOk(`Уникальность id в ${collection.name}.json — ок`);
  }

  // ------------------------------------------------------
  // 3. Ссылочная целостность
  // ------------------------------------------------------
  logHeader("Проверка связей между сущностями");

  const directionIds = new Set(directions.map((d) => d.id));
  const courseIds = new Set(courses.map((c) => c.id));
  const teacherIds = new Set(teachers.map((t) => t.id));

  // Курсы → направления
  for (const course of courses) {
    if (!directionIds.has(course.directionId)) {
      report.errors.push(
        `Курс "${course.id}": направление "${course.directionId}" не найдено`,
      );
    }
  }
  logOk("Связь courses → directions — ок");

  // Курсы → преподаватели
  for (const course of courses) {
    for (const tId of course.teacherIds) {
      if (!teacherIds.has(tId)) {
        report.errors.push(
          `Курс "${course.id}": преподаватель "${tId}" не найден`,
        );
      }
    }
    if (course.teacherIds.length === 0) {
      report.warnings.push(`Курс "${course.id}": не указан ни один преподаватель`);
    }
  }
  logOk("Связь courses → teachers — ок");

  // Преподаватели → курсы
  for (const teacher of teachers) {
    for (const cId of teacher.courseIds ?? []) {
      if (!courseIds.has(cId)) {
        report.errors.push(
          `Преподаватель "${teacher.id}": курс "${cId}" не найден`,
        );
      }
    }
    if (!teacher.courseIds || teacher.courseIds.length === 0) {
      report.warnings.push(
        `Преподаватель "${teacher.id}": не привязан ни к одному курсу`,
      );
    }
  }
  logOk("Связь teachers → courses — ок");

  // Отзывы → курсы
  for (const review of reviews) {
    if (review.courseId && !courseIds.has(review.courseId)) {
      report.errors.push(
        `Отзыв "${review.id}": курс "${review.courseId}" не найден`,
      );
    }
  }
  logOk("Связь reviews → courses — ок");

  // ------------------------------------------------------
  // 4. Покрытие контентом (предупреждения, не блокируют сборку)
  // ------------------------------------------------------
  logHeader("Покрытие контентом");

  // Каждое направление должно иметь хотя бы один курс
  const coursesByDirection = new Map<string, number>();
  for (const course of courses) {
    coursesByDirection.set(
      course.directionId,
      (coursesByDirection.get(course.directionId) ?? 0) + 1,
    );
  }

  for (const direction of directions) {
    const count = coursesByDirection.get(direction.id) ?? 0;
    if (count === 0) {
      report.warnings.push(
        `Направление "${direction.id}": нет ни одного курса`,
      );
    }
  }
  logOk("Все направления имеют хотя бы один курс");

  // Отзывы покрывают не все курсы — предупреждение
  const coursesWithReviews = new Set(
    reviews.map((r) => r.courseId).filter((id): id is string => Boolean(id)),
  );
  const coursesWithoutReviews = courses.filter(
    (c) => !coursesWithReviews.has(c.id),
  );
  if (coursesWithoutReviews.length > 0) {
    report.warnings.push(
      `Без отзывов: ${coursesWithoutReviews.length} ${pluralizeRu(
        coursesWithoutReviews.length,
        "курс",
        "курса",
        "курсов",
      )} — ${coursesWithoutReviews.map((c) => c.id).join(", ")}`,
    );
  } else {
    logOk("Все курсы имеют отзывы");
  }

  // Пустые FAQ
  if (faq.length === 0) {
    report.warnings.push("faq.json пуст — блок FAQ будет скрыт");
  } else {
    logOk(`FAQ содержит ${faq.length} ${pluralizeRu(faq.length, "вопрос", "вопроса", "вопросов")}`);
  }

  // Проверка статистики
  if (site.stats.length === 0) {
    report.warnings.push("site.json: не задана статистика (stats) для Hero");
  } else {
    logOk(`Статистика в Hero — ${site.stats.length} ${pluralizeRu(site.stats.length, "показатель", "показателя", "показателей")}`);
  }

  // Проверка контактов
  if (site.addresses.length === 0) {
    report.warnings.push("site.json: не задан ни один адрес");
  } else {
    logOk(`Адресов в конфиге — ${site.addresses.length}`);
  }

  // ------------------------------------------------------
  // 5. Проверка дат старта курсов
  // ------------------------------------------------------
  logHeader("Проверка дат старта курсов");

  const now = Date.now();
  let pastDates = 0;

  for (const course of courses) {
    if (!course.nextStart) continue;
    const timestamp = new Date(course.nextStart).getTime();
    if (Number.isNaN(timestamp)) {
      report.errors.push(
        `Курс "${course.id}": некорректная дата nextStart = "${course.nextStart}"`,
      );
      continue;
    }
    if (timestamp < now) {
      pastDates += 1;
      report.warnings.push(
        `Курс "${course.id}": дата старта в прошлом (${course.nextStart})`,
      );
    }
  }

  if (pastDates === 0) {
    logOk("Все даты старта в будущем");
  }

  return report;
}

// ==========================================================
// Запуск
// ==========================================================

function main(): void {
  console.log("\n══════════════════════════════════════════════════");
  console.log("  Валидация контента образовательного центра");
  console.log("══════════════════════════════════════════════════");

  let report: Report;

  try {
    report = validateContent();
  } catch (error) {
    console.error("\n✗ Критическая ошибка валидации контента:");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }

  // Итоги
  console.log("\n══════════════════════════════════════════════════");
  console.log("  Итоги валидации");
  console.log("══════════════════════════════════════════════════");

  if (report.warnings.length > 0) {
    console.log(`\n⚠ Предупреждения (${report.warnings.length}):`);
    for (const warning of report.warnings) {
      console.log(`  • ${warning}`);
    }
  }

  if (report.errors.length > 0) {
    console.error(`\n✗ Ошибки (${report.errors.length}):`);
    for (const error of report.errors) {
      console.error(`  • ${error}`);
    }
    console.error("\n✗ Валидация не пройдена. Сборка прервана.\n");
    process.exit(1);
  }

  console.log(
    `\n✓ Валидация пройдена. Предупреждений: ${report.warnings.length}.\n`,
  );
  process.exit(0);
}

main();