import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./content/**/*.json",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "clamp(16px, 4vw, 32px)",
      },
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      colors: {
        bg: {
          DEFAULT: "var(--color-bg)",
          alt: "var(--color-bg-alt)",
        },
        surface: "var(--color-surface)",
        "surface-2": "var(--color-surface-2)",
        text: {
          DEFAULT: "var(--color-text)",
          muted: "var(--color-text-muted)",
        },
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          // Заливка под белый текст. Отдельный токен: светлый --color-primary
          // не даёт 4.5:1 с белым.
          solid: "var(--color-primary-solid)",
          "solid-hover": "var(--color-primary-solid-hover)",
        },
        // Единственный тёплый цвет: прогресс по программе курса.
        progress: {
          DEFAULT: "var(--color-progress)",
          dim: "var(--color-progress-dim)",
        },
        success: {
          DEFAULT: "var(--color-success)",
          solid: "var(--color-success-solid)",
        },
        error: "var(--color-error)",
        border: "var(--color-border)",
        "border-strong": "var(--color-border-strong)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      spacing: {
        section: "var(--section-py)",
      },
      maxWidth: {
        container: "var(--container-max)",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "var(--font-ui)"],
        // UI, навигация, формы, body — системный стек (SF Pro на Apple).
        sans: ["var(--font-ui)"],
      },
      /* Шкала размеров живёт в globals.css как токены, чтобы одна
         правка меняла и clamp, и line-height, и трекинг сразу. */
      fontSize: {
        display: ["var(--text-display)", { lineHeight: "var(--text-display-lh)" }],
        h1: ["var(--text-h1)", { lineHeight: "var(--text-h1-lh)" }],
        h2: ["var(--text-h2)", { lineHeight: "var(--text-h2-lh)" }],
        h3: ["var(--text-h3)", { lineHeight: "var(--text-h3-lh)" }],
        "body-lg": ["var(--text-body-lg)", { lineHeight: "1.55" }],
        body: ["var(--text-body)", { lineHeight: "var(--text-body-lh)" }],
        small: ["var(--text-small)", { lineHeight: "1.5" }],
        caption: ["var(--text-caption)", { lineHeight: "1.45" }],
        overline: ["var(--text-overline)", { lineHeight: "1.4" }],
      },
      letterSpacing: {
        display: "var(--tracking-display)",
        tight: "var(--tracking-tight)",
        normal: "var(--tracking-normal)",
        wide: "var(--tracking-wide)",
        overline: "var(--tracking-overline)",
      },
      height: {
        /* HIG: минимальная высота интерактивного элемента — 44pt */
        target: "44px",
        "target-lg": "52px",
      },
      minHeight: {
        target: "44px",
      },
      minWidth: {
        target: "44px",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        fast: "200ms",
        base: "400ms",
        slow: "700ms",
      },
      zIndex: {
        header: "50",
        menu: "60",
        chat: "65",
        modal: "70",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1440px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        float: {
          "0%, 100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(0, -14px, 0)" },
        },
        "check-draw": {
          "0%": { strokeDashoffset: "48" },
          "100%": { strokeDashoffset: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 600ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 400ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "scale-in": "scale-in 250ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "pulse-ring": "pulse-ring 2400ms cubic-bezier(0.22, 1, 0.36, 1) infinite",
        float: "float 16s ease-in-out infinite",
        "check-draw": "check-draw 600ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;