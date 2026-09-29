// ==========================================================
// Навигационные пункты (общие для Header, Footer, MobileMenu)
// ==========================================================

export type NavItem = {
  id: string;
  label: string;
};

export const NAV_ITEMS: NavItem[] = [
  { id: "about", label: "О центре" },
  { id: "courses", label: "Курсы" },
  { id: "teachers", label: "Преподаватели" },
  { id: "benefits", label: "Преимущества" },
  { id: "reviews", label: "Отзывы" },
  { id: "faq", label: "Вопросы" },
  { id: "contact", label: "Контакты" },
];

export const SECTION_IDS: string[] = NAV_ITEMS.map((item) => item.id);