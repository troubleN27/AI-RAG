// ==========================================================
// Типы контента
// ==========================================================

export type Direction = {
  id: string;
  title: string;
  icon: string;
  description: string;
};

export type CourseFormat = "offline" | "online" | "hybrid";
export type CourseLevel = "beginner" | "intermediate" | "advanced";

export type CoursePrice = {
  amount: number;
  currency: string;
  from?: boolean;
};

export type CourseProgramModule = {
  module: string;
  topics: string[];
};

export type Course = {
  id: string;
  title: string;
  directionId: Direction["id"];
  shortDescription: string;
  description?: string;
  duration: string;
  format: CourseFormat;
  level: CourseLevel;
  price?: CoursePrice;
  nextStart?: string;
  schedule?: string;
  outcomes?: string[];
  program?: CourseProgramModule[];
  teacherIds: Teacher["id"][];
  image?: string;
  badge?: string;
};

export type TeacherLink = {
  type: "instagram" | "telegram" | "linkedin" | "site";
  url: string;
};

export type Teacher = {
  id: string;
  name: string;
  position: string;
  experienceYears?: number;
  bio: string;
  achievements?: string[];
  photo?: string;
  courseIds?: Course["id"][];
  links?: TeacherLink[];
};

export type Review = {
  id: string;
  name: string;
  courseId?: Course["id"];
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  date?: string;
  photo?: string;
  videoUrl?: string;
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  order: number;
};

export type Benefit = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

export type SiteAddress = {
  label: string;
  address: string;
  mapEmbedUrl?: string;
  lat?: number;
  lng?: number;
};

export type SiteSocial = {
  type: string;
  url: string;
};

export type SiteMessenger = {
  type: string;
  url: string;
};

export type SiteStat = {
  value: number;
  suffix?: string;
  label: string;
};

export type SiteConfig = {
  name: string;
  /** Короткое имя для лок-апа логотипа (по умолчанию — name) */
  shortName?: string;
  tagline: string;
  phone: string;
  email: string;
  addresses: SiteAddress[];
  workingHours: string;
  socials: SiteSocial[];
  messengers: SiteMessenger[];
  legal: {
    company: string;
    details?: string;
  };
  stats: SiteStat[];
};

// ==========================================================
// Типы фильтров курсов
// ==========================================================

export type CourseFilterState = {
  directionId: string | "all";
  format?: CourseFormat | "all";
  level?: CourseLevel | "all";
  query?: string;
  visibleCount: number;
};

// ==========================================================
// Хелперы-константы (для UI-подписей)
// ==========================================================

export const COURSE_FORMAT_LABEL: Record<CourseFormat, string> = {
  offline: "Офлайн",
  online: "Онлайн",
  hybrid: "Гибрид",
};

export const COURSE_LEVEL_LABEL: Record<CourseLevel, string> = {
  beginner: "Начальный",
  intermediate: "Средний",
  advanced: "Продвинутый",
};