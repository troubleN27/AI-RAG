import { describe, expect, it } from "vitest";

import { applyCourseFilters } from "@/components/course/CourseFilters";
import type { Course, CourseFilterState } from "@/lib/content/types";

// ==========================================================
// Мок-курсы для тестов
// ==========================================================

function buildCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: "course-1",
    title: "Frontend-разработчик",
    directionId: "programming",
    shortDescription: "React, TypeScript, современный инструментарий",
    duration: "6 месяцев",
    format: "hybrid",
    level: "beginner",
    teacherIds: ["teacher-01"],
    ...overrides,
  };
}

const courses: Course[] = [
  buildCourse({
    id: "frontend",
    title: "Frontend-разработчик",
    directionId: "programming",
    format: "hybrid",
    level: "beginner",
    shortDescription: "React, TypeScript, современный инструментарий",
  }),
  buildCourse({
    id: "python",
    title: "Backend на Python",
    directionId: "programming",
    format: "online",
    level: "intermediate",
    shortDescription: "Django, FastAPI, PostgreSQL",
  }),
  buildCourse({
    id: "ux-ui",
    title: "UX/UI-дизайн",
    directionId: "design",
    format: "hybrid",
    level: "beginner",
    shortDescription: "Проектирование интерфейсов, Figma",
  }),
  buildCourse({
    id: "graphic",
    title: "Графический дизайн",
    directionId: "design",
    format: "offline",
    level: "beginner",
    shortDescription: "Photoshop, Illustrator, брендинг",
  }),
  buildCourse({
    id: "english-c1",
    title: "Английский C1",
    directionId: "languages",
    format: "online",
    level: "advanced",
    shortDescription: "Advanced English, IELTS",
  }),
];

// ==========================================================
// Хелпер: базовое состояние фильтра
// ==========================================================

function baseState(overrides: Partial<CourseFilterState> = {}): CourseFilterState {
  return {
    directionId: "all",
    format: "all",
    level: "all",
    query: "",
    visibleCount: 4,
    ...overrides,
  };
}

// ==========================================================
// Тесты
// ==========================================================

describe("applyCourseFilters", () => {
  describe("без фильтров", () => {
    it("возвращает все курсы", () => {
      const result = applyCourseFilters(courses, baseState());
      expect(result).toHaveLength(courses.length);
    });
  });

  describe("фильтр по направлению", () => {
    it("возвращает только курсы выбранного направления", () => {
      const result = applyCourseFilters(
        courses,
        baseState({ directionId: "programming" }),
      );
      expect(result).toHaveLength(2);
      expect(result.every((c) => c.directionId === "programming")).toBe(true);
    });

    it("возвращает пустой массив для несуществующего направления", () => {
      const result = applyCourseFilters(
        courses,
        baseState({ directionId: "unknown" }),
      );
      expect(result).toHaveLength(0);
    });

    it("directionId=all возвращает все курсы", () => {
      const result = applyCourseFilters(courses, baseState({ directionId: "all" }));
      expect(result).toHaveLength(courses.length);
    });
  });

  describe("фильтр по формату", () => {
    it("возвращает только онлайн-курсы", () => {
      const result = applyCourseFilters(courses, baseState({ format: "online" }));
      expect(result).toHaveLength(2);
      expect(result.every((c) => c.format === "online")).toBe(true);
    });

    it("возвращает только офлайн-курсы", () => {
      const result = applyCourseFilters(courses, baseState({ format: "offline" }));
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe("graphic");
    });

    it("возвращает только гибридные курсы", () => {
      const result = applyCourseFilters(courses, baseState({ format: "hybrid" }));
      expect(result).toHaveLength(2);
      expect(result.every((c) => c.format === "hybrid")).toBe(true);
    });

    it("format=all не фильтрует", () => {
      const result = applyCourseFilters(courses, baseState({ format: "all" }));
      expect(result).toHaveLength(courses.length);
    });

    it("format=undefined не фильтрует", () => {
      const result = applyCourseFilters(courses, baseState({ format: undefined }));
      expect(result).toHaveLength(courses.length);
    });
  });

  describe("фильтр по уровню", () => {
    it("возвращает только beginner", () => {
      const result = applyCourseFilters(courses, baseState({ level: "beginner" }));
      expect(result).toHaveLength(3);
      expect(result.every((c) => c.level === "beginner")).toBe(true);
    });

    it("возвращает только advanced", () => {
      const result = applyCourseFilters(courses, baseState({ level: "advanced" }));
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe("english-c1");
    });

    it("level=all не фильтрует", () => {
      const result = applyCourseFilters(courses, baseState({ level: "all" }));
      expect(result).toHaveLength(courses.length);
    });
  });

  describe("поиск по тексту", () => {
    it("находит курс по названию", () => {
      const result = applyCourseFilters(courses, baseState({ query: "python" }));
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe("python");
    });

    it("поиск нечувствителен к регистру", () => {
      const result = applyCourseFilters(courses, baseState({ query: "PYTHON" }));
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe("python");
    });

    it("находит курс по описанию", () => {
      const result = applyCourseFilters(courses, baseState({ query: "figma" }));
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe("ux-ui");
    });

    it("игнорирует пробелы по краям", () => {
      const result = applyCourseFilters(courses, baseState({ query: "  python  " }));
      expect(result).toHaveLength(1);
    });

    it("пустая строка не фильтрует", () => {
      const result = applyCourseFilters(courses, baseState({ query: "" }));
      expect(result).toHaveLength(courses.length);
    });

    it("возвращает пустой массив для несуществующего запроса", () => {
      const result = applyCourseFilters(
        courses,
        baseState({ query: "невероятное-слово-xyz" }),
      );
      expect(result).toHaveLength(0);
    });
  });

  describe("комбинация фильтров", () => {
    it("направление + формат", () => {
      const result = applyCourseFilters(
        courses,
        baseState({ directionId: "programming", format: "online" }),
      );
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe("python");
    });

    it("направление + уровень", () => {
      const result = applyCourseFilters(
        courses,
        baseState({ directionId: "design", level: "beginner" }),
      );
      expect(result).toHaveLength(2);
      expect(result.every((c) => c.directionId === "design")).toBe(true);
      expect(result.every((c) => c.level === "beginner")).toBe(true);
    });

    it("направление + формат + уровень + поиск", () => {
      const result = applyCourseFilters(
        courses,
        baseState({
          directionId: "programming",
          format: "online",
          level: "intermediate",
          query: "django",
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe("python");
    });

    it("возвращает пустой массив при несовместимых фильтрах", () => {
      const result = applyCourseFilters(
        courses,
        baseState({
          directionId: "languages",
          format: "offline",
        }),
      );
      expect(result).toHaveLength(0);
    });
  });

  describe("не мутирует исходный массив", () => {
    it("исходный массив остаётся неизменным", () => {
      const snapshot = [...courses];
      applyCourseFilters(courses, baseState({ directionId: "programming" }));
      expect(courses).toEqual(snapshot);
    });
  });
});