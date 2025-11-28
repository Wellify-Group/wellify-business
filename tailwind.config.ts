/**
 * ⚠️⚠️⚠️ КРИТИЧЕСКИ ЗАФИКСИРОВАННЫЙ КОД - ЗАПРЕЩЕНО ИЗМЕНЯТЬ! ⚠️⚠️⚠️
 * 
 * ═══════════════════════════════════════════════════════════════════
 * ЭТОТ ФАЙЛ ПОЛНОСТЬЮ ЗАФИКСИРОВАН ПОСЛЕ КРИТИЧЕСКОГО СБРОСА ТЕМЫ
 * ═══════════════════════════════════════════════════════════════════
 * 
 * ❌ ЗАПРЕЩЕНО:
 * - Изменять darkMode: ["class"] - КРИТИЧЕСКИ ВАЖНО для next-themes!
 * - Изменять theme.extend.colors - все цвета связаны с CSS переменными
 * - Удалять или изменять связи hsl(var(--variable))
 * - Менять borderRadius конфигурацию
 * 
 * ✅ ФИКСИРОВАННАЯ КОНФИГУРАЦИЯ:
 * - darkMode: ["class"] - ОБЯЗАТЕЛЬНО для работы next-themes
 * - Все цвета связаны с CSS переменными из app/globals.css
 * - Формат: "hsl(var(--variable))" для всех цветов
 * - borderRadius использует переменную --radius из globals.css
 * 
 * 🔒 БЛОКИРОВКА: Этот код был зафиксирован после полной переписки системы темы.
 *    Любые изменения БЕЗ ЯВНОГО РАЗРЕШЕНИЯ запрещены!
 * 
 * Дата фиксации: 2024 (после критического сброса темы)
 */

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"], // CRITICAL - НЕ УДАЛЯТЬ!
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
