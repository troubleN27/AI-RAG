import { describe, expect, it } from "vitest";

import {
  getBenefits,
  getCourseById,
  getCourses,
  getDirections,
  getFaq,
  getReviews,
  getReviewsByCourse,
  getSiteConfig,
  getTeacherById,
  getTeachers,
  getTeachersByIds,
} from "@/lib/content";

// ==========================================================
// Тесты: загрузчики контента
// ==========================================================

describe("content loaders", () => {
  describe("getSiteConfig", () => {
    it("возвращает объект конфига сайта", () => {
      const site = getSiteConfig();
      expect(site).toBeDefined();
      expect(typeof site.name).toBe("string");
      expect(site.name.length).toBeGreaterThan(0);
      expect(typeof site.phone).toBe("string");
      expect(typeof site.email).toBe("string");
      expect(Array.isArray(site.addresses)).toBe(true);
      expect(Array.isArray(site.socials)).toBe(true);
      expect(Array.isArray(site.messengers)).toBe(true);
      expect(Array.isArray(site.stats)).toBe(true);
    });

    it("содержит корректный email", () => {
      const site = getSiteConfig();
      expect(site.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });
  });

  describe("getDirections", () => {
    it("возвращает непустой массив направлений", () => {
      const directions = getDirections();
      expect(directions.length).toBeGreaterThan(0);
    });

    it("каждое направление имеет обязательные поля", () => {
      const directions = getDirections();
      for (const direction of directions) {
        expect(typeof direction.id).toBe("string");
        expect(typeof direction.title).toBe("string");
        expect(typeof direction.icon).toBe("string");
        expect(typeof direction.description).toBe("string");
      }
    });

    it("id направлений уникальны", () => {
      const directions = getDirections();
      const ids = new Set(directions.map((d) => d.id));
      expect(ids.size).toBe(directions.length);
    });
  });

  describe("getCourses", () => {
    it("возвращает непустой массив курсов", () => {
      const courses = getCourses();
      expect(courses.length).toBeGreaterThan(0);
    });

    it("каждый курс имеет обязательные поля", () => {
      const courses = getCourses();
      for (const course of courses) {
        expect(typeof course.id).toBe("string");
        expect(typeof course.title).toBe("string");
        expect(typeof course.directionId).toBe("string");
        expect(typeof course.shortDescription).toBe("string");
        expect(typeof course.duration).toBe("string");
        expect(["offline", "online", "hybrid"]).toContain(course.format);
        expect(["beginner", "intermediate", "advanced"]).toContain(course.level);
        expect(Array.isArray(course.teacherIds)).toBe(true);
      }
    });

    it("id курсов уникальны", () => {
      const courses = getCourses();
      const ids = new Set(courses.map((c) => c.id));
      expect(ids.size).toBe(courses.length);
    });

    it("все directionId ссылаются на существующие направления", () => {
      const courses = getCourses();
      const directions = getDirections();
      const directionIds = new Set(directions.map((d) => d.id));

      for (const course of courses) {
        expect(directionIds.has(course.directionId)).toBe(true);
      }
    });

    it("все teacherIds ссылаются на существующих преподавателей", () => {
      const courses = getCourses();
      const teachers = getTeachers();
      const teacherIds = new Set(teachers.map((t) => t.id));

      for (const course of courses) {
        for (const tId of course.teacherIds) {
          expect(teacherIds.has(tId)).toBe(true);
        }
      }
    });

    it("если задана цена — она корректна", () => {
      const courses = getCourses();
      for (const course of courses) {
        if (course.price) {
          expect(course.price.amount).toBeGreaterThan(0);
          expect(typeof course.price.currency).toBe("string");
          expect(course.price.currency.length).toBeGreaterThan(0);
        }
      }
    });

    it("если задана дата старта — она валидна", () => {
      const courses = getCourses();
      for (const course of courses) {
        if (course.nextStart) {
          const timestamp = new Date(course.nextStart).getTime();
          expect(Number.isNaN(timestamp)).toBe(false);
        }
      }
    });
  });

  describe("getCourseById", () => {
    it("находит существующий курс", () => {
      const courses = getCourses();
      const first = courses[0];
      expect(first).toBeDefined();
      if (first) {
        const found = getCourseById(first.id);
        expect(found).toBeDefined();
        expect(found?.id).toBe(first.id);
      }
    });

    it("возвращает undefined для несуществующего id", () => {
      expect(getCourseById("nonexistent-course-xyz")).toBeUndefined();
    });
  });

  describe("getTeachers", () => {
    it("возвращает непустой массив преподавателей", () => {
      const teachers = getTeachers();
      expect(teachers.length).toBeGreaterThan(0);
    });

    it("каждый преподаватель имеет обязательные поля", () => {
      const teachers = getTeachers();
      for (const teacher of teachers) {
        expect(typeof teacher.id).toBe("string");
        expect(typeof teacher.name).toBe("string");
        expect(typeof teacher.position).toBe("string");
        expect(typeof teacher.bio).toBe("string");
        // photo опционально: при отсутствии рендерится инициалы
        expect(
          teacher.photo === undefined || typeof teacher.photo === "string",
        ).toBe(true);
      }
    });

    it("id преподавателей уникальны", () => {
      const teachers = getTeachers();
      const ids = new Set(teachers.map((t) => t.id));
      expect(ids.size).toBe(teachers.length);
    });

    it("все courseIds ссылаются на существующие курсы", () => {
      const teachers = getTeachers();
      const courses = getCourses();
      const courseIds = new Set(courses.map((c) => c.id));

      for (const teacher of teachers) {
        for (const cId of teacher.courseIds ?? []) {
          expect(courseIds.has(cId)).toBe(true);
        }
      }
    });
  });

  describe("getTeacherById", () => {
    it("находит существующего преподавателя", () => {
      const teachers = getTeachers();
      const first = teachers[0];
      if (first) {
        const found = getTeacherById(first.id);
        expect(found?.id).toBe(first.id);
      }
    });

    it("возвращает undefined для несуществующего id", () => {
      expect(getTeacherById("nonexistent-teacher-xyz")).toBeUndefined();
    });
  });

  describe("getTeachersByIds", () => {
    it("возвращает массив преподавателей по их id", () => {
      const teachers = getTeachers();
      const ids = teachers.slice(0, 2).map((t) => t.id);
      const result = getTeachersByIds(ids);

      expect(result).toHaveLength(ids.length);
      expect(result.every((t) => ids.includes(t.id))).toBe(true);
    });

    it("возвращает пустой массив для пустого входа", () => {
      expect(getTeachersByIds([])).toEqual([]);
    });

    it("игнорирует несуществующие id", () => {
      const teachers = getTeachers();
      const realId = teachers[0]?.id;
      if (realId) {
        const result = getTeachersByIds([realId, "nonexistent-xyz"]);
        expect(result).toHaveLength(1);
        expect(result[0]?.id).toBe(realId);
      }
    });
  });

  describe("getReviews", () => {
    it("возвращает непустой массив отзывов", () => {
      const reviews = getReviews();
      expect(reviews.length).toBeGreaterThan(0);
    });

    it("каждый отзыв имеет обязательные поля", () => {
      const reviews = getReviews();
      for (const review of reviews) {
        expect(typeof review.id).toBe("string");
        expect(typeof review.name).toBe("string");
        expect([1, 2, 3, 4, 5]).toContain(review.rating);
        expect(typeof review.text).toBe("string");
        expect(review.text.length).toBeGreaterThan(0);
      }
    });

    it("все courseId ссылаются на существующие курсы", () => {
      const reviews = getReviews();
      const courses = getCourses();
      const courseIds = new Set(courses.map((c) => c.id));

      for (const review of reviews) {
        if (review.courseId) {
          expect(courseIds.has(review.courseId)).toBe(true);
        }
      }
    });
  });

  describe("getReviewsByCourse", () => {
    it("возвращает отзывы для конкретного курса", () => {
      const reviews = getReviews();
      const reviewWithCourse = reviews.find((r) => r.courseId);
      if (reviewWithCourse && reviewWithCourse.courseId) {
        const result = getReviewsByCourse(reviewWithCourse.courseId);
        expect(result.length).toBeGreaterThan(0);
        expect(result.every((r) => r.courseId === reviewWithCourse.courseId)).toBe(
          true,
        );
      }
    });

    it("возвращает пустой массив для несуществующего курса", () => {
      expect(getReviewsByCourse("nonexistent-xyz")).toEqual([]);
    });
  });

  describe("getFaq", () => {
    it("возвращает непустой массив вопросов", () => {
      const faq = getFaq();
      expect(faq.length).toBeGreaterThan(0);
    });

    it("каждый вопрос имеет id, question, answer, order", () => {
      const faq = getFaq();
      for (const item of faq) {
        expect(typeof item.id).toBe("string");
        expect(typeof item.question).toBe("string");
        expect(typeof item.answer).toBe("string");
        expect(typeof item.order).toBe("number");
      }
    });

    it("вопросы отсортированы по order", () => {
      const faq = getFaq();
      for (let i = 1; i < faq.length; i++) {
        const prev = faq[i - 1];
        const curr = faq[i];
        if (prev && curr) {
          expect(prev.order).toBeLessThanOrEqual(curr.order);
        }
      }
    });

    it("id вопросов уникальны", () => {
      const faq = getFaq();
      const ids = new Set(faq.map((f) => f.id));
      expect(ids.size).toBe(faq.length);
    });
  });

  describe("getBenefits", () => {
    it("возвращает непустой массив преимуществ", () => {
      const benefits = getBenefits();
      expect(benefits.length).toBeGreaterThan(0);
    });

    it("каждое преимущество имеет обязательные поля", () => {
      const benefits = getBenefits();
      for (const benefit of benefits) {
        expect(typeof benefit.id).toBe("string");
        expect(typeof benefit.title).toBe("string");
        expect(typeof benefit.description).toBe("string");
        expect(typeof benefit.icon).toBe("string");
      }
    });

    it("id преимуществ уникальны", () => {
      const benefits = getBenefits();
      const ids = new Set(benefits.map((b) => b.id));
      expect(ids.size).toBe(benefits.length);
    });
  });

  describe("согласованность данных", () => {
    it("каждое направление имеет хотя бы один курс", () => {
      const directions = getDirections();
      const courses = getCourses();

      for (const direction of directions) {
        const coursesInDirection = courses.filter(
          (c) => c.directionId === direction.id,
        );
        expect(coursesInDirection.length).toBeGreaterThan(0);
      }
    });

    it("каждый курс имеет хотя бы одного преподавателя", () => {
      const courses = getCourses();
      for (const course of courses) {
        expect(course.teacherIds.length).toBeGreaterThan(0);
      }
    });
  });
});