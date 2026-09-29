import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

// ==========================================================
// Конфигурация Vitest
// ==========================================================

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.{test,spec}.{ts,tsx}"],
    exclude: [
      "node_modules",
      ".next",
      "out",
      "dist",
      "tests/e2e/**",
      "tests/integration/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: [
        "node_modules/**",
        ".next/**",
        "out/**",
        "tests/**",
        "**/*.config.{ts,js,mjs}",
        "**/*.d.ts",
        "app/**/layout.tsx",
        "app/**/page.tsx",
        "scripts/**",
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
    css: false,
    clearMocks: true,
    mockReset: false,
    restoreMocks: false,
    reporters: ["default"],
  },
});