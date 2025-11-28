"use client";

/**
 * ThemeProvider для управления светлой и темной темой
 * 
 * Функциональность:
 * - Сохраняет выбор пользователя в localStorage
 * - Поддерживает системные настройки (prefers-color-scheme)
 * - Применяет класс 'dark' к <html> элементу для работы с Tailwind
 * - Предотвращает мерцание при переключении темы
 * - Синхронизирует тему между вкладками
 */

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      storageKey="shiftflow-theme"
      disableTransitionOnChange={true}
    >
      {children}
    </NextThemesProvider>
  );
}
