"use client";

/**
 * ⚠️ ЗАФИКСИРОВАННЫЙ КОД - НЕ ИЗМЕНЯТЬ БЕЗ ЯВНОГО РАЗРЕШЕНИЯ ⚠️
 * 
 * Этот компонент переключения темы зафиксирован и защищен от изменений.
 * Любые правки могут привести к поломке функциональности темы.
 * 
 * ФИКСИРОВАННЫЕ ПРОБЛЕМЫ:
 * - Добавлена обработка mounted состояния для предотвращения проблем с гидратацией
 * - Используется resolvedTheme вместо theme для корректной работы с "system" темой
 * - Правильное переключение между light и dark темами
 * - Сохранение выбора пользователя в localStorage
 */

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Предотвращение проблем с гидратацией
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Не рендерим кнопку до монтирования, чтобы избежать несоответствия SSR/CSR
  if (!mounted) {
    return (
      <div className="relative h-9 w-9 flex items-center justify-center">
        <div className="h-5 w-5" />
      </div>
    );
  }

  const isDark = resolvedTheme === "dark";

  const handleToggle = () => {
    // Always toggle between 'light' and 'dark', never 'system'
    // Use resolvedTheme to get the actual theme (handles 'system' theme)
    const newTheme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  return (
    <button
      onClick={handleToggle}
      className="relative h-8 w-8 flex items-center justify-center p-1.5 hover:opacity-70 transition-opacity text-zinc-500 dark:text-zinc-400"
      aria-label={isDark ? "Переключить на светлую тему" : "Переключить на темную тему"}
    >
      <Sun className="absolute h-[17px] w-[17px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 stroke-[1.5]" />
      <Moon className="absolute h-[17px] w-[17px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 stroke-[1.5]" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
