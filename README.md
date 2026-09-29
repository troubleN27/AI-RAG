# Лендинг образовательного центра

Одностраничный адаптивный сайт образовательного центра с формой записи на консультацию и UI-заглушкой AI-чата.

## Стек

- **Next.js 14** (App Router, SSG + Route Handlers)
- **React 18** + **TypeScript** (strict)
- **Tailwind CSS 3** + CSS-переменные (design tokens)
- **Framer Motion** + CSS transitions
- **Swiper** (слайдеры преподавателей и отзывов)
- **React Hook Form** + **Zod**
- **Vitest** + **Testing Library** + **Playwright** + **axe-core** + **Lighthouse CI**

## Требования

- Node.js **18.17+**
- pnpm **9+** (или npm/yarn)

## Быстрый старт

```bash
# 1. Установка зависимостей
pnpm install

# 2. Настройка окружения
cp .env.example .env.local
# откройте .env.local и заполните нужные переменные

# 3. Запуск dev-сервера
pnpm dev