/**
 * Конфигурация lint-staged
 * Запускается из .husky/pre-commit на staged-файлах.
 */

/** @type {import('lint-staged').Config} */
const config = {
  // TS/TSX файлы: ESLint с автопочинкой + Prettier
  "*.{ts,tsx}": [
    "eslint --fix --max-warnings=0",
    "prettier --write",
  ],

  // JS/MJS/CJS конфиги: только Prettier (ESLint их игнорирует)
  "*.{js,mjs,cjs}": ["prettier --write"],

  // JSON: Prettier
  "*.json": ["prettier --write"],

  // CSS: Prettier
  "*.css": ["prettier --write"],

  // Markdown: Prettier
  "*.md": ["prettier --write"],
};

export default config;