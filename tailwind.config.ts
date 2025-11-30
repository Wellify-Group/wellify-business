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
        // WELLIFY Design Tokens
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        "surface-soft": "var(--color-surface-soft)",
        brand: "var(--color-brand)",
        "brand-soft": "var(--color-brand-soft)",
        "brand-strong": "var(--color-brand-strong)",
        text: {
          main: "var(--color-text-main)",
          muted: "var(--color-text-muted)",
          soft: "var(--color-text-soft)",
          inverse: "var(--color-text-inverse)",
        },
        border: {
          DEFAULT: "hsl(var(--border))",             // обратная совместимость для border-border
          subtle: "var(--color-border-subtle)",       // border-border-subtle
          strong: "var(--color-border-strong)",       // border-border-strong
        },
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "var(--radius-xs)",
        "radius-sm": "var(--radius-sm)",
        "radius-md": "var(--radius-md)",
        "radius-lg": "var(--radius-lg)",
        xl: "var(--radius-xl)",
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        card: "var(--shadow-card)",
        navbar: "var(--shadow-navbar)",
        modal: "var(--shadow-modal)",
        floating: "var(--shadow-floating)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: "var(--font-size-xs)",
        sm: "var(--font-size-sm)",
        base: "var(--font-size-base)",
        lg: "var(--font-size-lg)",
        xl: "var(--font-size-xl)",
        "2xl": "var(--font-size-2xl)",
        "3xl": "var(--font-size-3xl)",
        "4xl": "var(--font-size-4xl)",
      },
      fontWeight: {
        regular: "var(--font-weight-regular)",
        medium: "var(--font-weight-medium)",
        semibold: "var(--font-weight-semibold)",
        bold: "var(--font-weight-bold)",
      },
      transitionDuration: {
        fast: "var(--transition-fast)",
        base: "var(--transition-base)",
        slow: "var(--transition-slow)",
      },
      transitionTimingFunction: {
        "ease-soft": "var(--ease-soft)",
      },
    },
  },
  plugins: [],
};

export default config;
