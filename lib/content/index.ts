import { z } from "zod";

import benefitsData from "@/content/benefits.json";
import coursesData from "@/content/courses.json";
import directionsData from "@/content/directions.json";
import faqData from "@/content/faq.json";
import reviewsData from "@/content/reviews.json";
import siteData from "@/content/site.json";
import teachersData from "@/content/teachers.json";
import type {
  Benefit,
  Course,
  Direction,
  FaqItem,
  Review,
  SiteConfig,
  Teacher,
} from "@/lib/content/types";

// ==========================================================
// Zod-схемы контента
// ==========================================================

const directionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  icon: z.string().min(1),
  description: z.string().min(1),
});

const courseFormatSchema = z.enum(["offline", "online", "hybrid"]);
const courseLevelSchema = z.enum(["beginner", "intermediate", "advanced"]);

const courseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  directionId: z.string().min(1),
  shortDescription: z.string().min(1),
  description: z.string().optional(),
  duration: z.string().min(1),
  format: courseFormatSchema,
  level: courseLevelSchema,
  price: z
    .object({
      amount: z.number().nonnegative(),
      currency: z.string().min(1),
      from: z.boolean().optional(),
    })
    .optional(),
  nextStart: z.string().optional(),
  schedule: z.string().optional(),
  outcomes: z.array(z.string()).optional(),
  program: z
    .array(
      z.object({
        module: z.string().min(1),
        topics: z.array(z.string()),
      }),
    )
    .optional(),
  teacherIds: z.array(z.string()),
  image: z.string().optional(),
  badge: z.string().optional(),
});

const teacherLinkSchema = z.object({
  type: z.enum(["instagram", "telegram", "linkedin", "site"]),
  url: z.string().url(),
});

const teacherSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  position: z.string().min(1),
  experienceYears: z.number().int().nonnegative().optional(),
  bio: z.string().min(1),
  achievements: z.array(z.string()).optional(),
  photo: z.string().optional(),
  courseIds: z.array(z.string()).optional(),
  links: z.array(teacherLinkSchema).optional(),
});

const reviewSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  courseId: z.string().optional(),
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  text: z.string().min(1),
  date: z.string().optional(),
  photo: z.string().optional(),
  videoUrl: z.string().url().optional(),
});

const faqSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  answer: z.string().min(1),
  order: z.number().int(),
});

const benefitSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().min(1),
});

const siteSchema = z.object({
  name: z.string().min(1),
  shortName: z.string().min(1).optional(),
  tagline: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  addresses: z.array(
    z.object({
      label: z.string().min(1),
      address: z.string().min(1),
      mapEmbedUrl: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
    }),
  ),
  workingHours: z.string().min(1),
  socials: z.array(
    z.object({
      type: z.string().min(1),
      url: z.string().url(),
    }),
  ),
  messengers: z.array(
    z.object({
      type: z.string().min(1),
      url: z.string().url(),
    }),
  ),
  legal: z.object({
    company: z.string().min(1),
    details: z.string().optional(),
  }),
  stats: z.array(
    z.object({
      value: z.number(),
      suffix: z.string().optional(),
      label: z.string().min(1),
    }),
  ),
});

// ==========================================================
// Парсинг и валидация
// ==========================================================

function parseList<T>(
  schema: z.ZodType<T>,
  data: unknown,
  label: string,
): T[] {
  const result = z.array(schema).safeParse(data);
  if (!result.success) {
    // eslint-disable-next-line no-console
    console.error(`[content] Ошибка валидации ${label}:`, result.error.flatten());
    throw new Error(`Некорректный контент: ${label}`);
  }
  return result.data;
}

function parseObject<T>(
  schema: z.ZodType<T>,
  data: unknown,
  label: string,
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    // eslint-disable-next-line no-console
    console.error(`[content] Ошибка валидации ${label}:`, result.error.flatten());
    throw new Error(`Некорректный контент: ${label}`);
  }
  return result.data;
}

// ==========================================================
// Кешированные загрузчики
// ==========================================================

const directions: Direction[] = parseList(
  directionSchema as unknown as z.ZodType<Direction>,
  directionsData,
  "directions.json",
);

const courses: Course[] = parseList(
  courseSchema as unknown as z.ZodType<Course>,
  coursesData,
  "courses.json",
);

const teachers: Teacher[] = parseList(
  teacherSchema as unknown as z.ZodType<Teacher>,
  teachersData,
  "teachers.json",
);

const reviews: Review[] = parseList(
  reviewSchema as unknown as z.ZodType<Review>,
  reviewsData,
  "reviews.json",
);

const faq: FaqItem[] = parseList(
  faqSchema as unknown as z.ZodType<FaqItem>,
  faqData,
  "faq.json",
).sort((a, b) => a.order - b.order);

const benefits: Benefit[] = parseList(
  benefitSchema as unknown as z.ZodType<Benefit>,
  benefitsData,
  "benefits.json",
);

const siteConfig: SiteConfig = parseObject(
  siteSchema as unknown as z.ZodType<SiteConfig>,
  siteData,
  "site.json",
);

// ==========================================================
// Валидация связей между коллекциями
// ==========================================================

function validateRelations(): void {
  const directionIds = new Set(directions.map((d) => d.id));
  const teacherIds = new Set(teachers.map((t) => t.id));
  const courseIds = new Set(courses.map((c) => c.id));
  const errors: string[] = [];

  for (const course of courses) {
    if (!directionIds.has(course.directionId)) {
      errors.push(`Курс "${course.id}": направление "${course.directionId}" не найдено`);
    }
    for (const tId of course.teacherIds) {
      if (!teacherIds.has(tId)) {
        errors.push(`Курс "${course.id}": преподаватель "${tId}" не найден`);
      }
    }
  }

  for (const teacher of teachers) {
    for (const cId of teacher.courseIds ?? []) {
      if (!courseIds.has(cId)) {
        errors.push(`Преподаватель "${teacher.id}": курс "${cId}" не найден`);
      }
    }
  }

  for (const review of reviews) {
    if (review.courseId && !courseIds.has(review.courseId)) {
      errors.push(`Отзыв "${review.id}": курс "${review.courseId}" не найден`);
    }
  }

  if (errors.length > 0) {
    // eslint-disable-next-line no-console
    console.error("[content] Ошибки связей:\n" + errors.join("\n"));
    throw new Error("Некорректные связи между сущностями контента");
  }
}

validateRelations();

// ==========================================================
// Публичное API
// ==========================================================

export function getSiteConfig(): SiteConfig {
  return siteConfig;
}

export function getDirections(): Direction[] {
  return directions;
}

export function getCourses(): Course[] {
  return courses;
}

export function getCourseById(id: string): Course | undefined {
  return courses.find((c) => c.id === id);
}

export function getTeachers(): Teacher[] {
  return teachers;
}

export function getTeacherById(id: string): Teacher | undefined {
  return teachers.find((t) => t.id === id);
}

export function getTeachersByIds(ids: string[]): Teacher[] {
  const set = new Set(ids);
  return teachers.filter((t) => set.has(t.id));
}

export function getReviews(): Review[] {
  return reviews;
}

export function getReviewsByCourse(courseId: string): Review[] {
  return reviews.filter((r) => r.courseId === courseId);
}

export function getFaq(): FaqItem[] {
  return faq;
}

export function getBenefits(): Benefit[] {
  return benefits;
}