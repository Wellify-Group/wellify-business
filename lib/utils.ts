import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge for conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Форматирует длительность в секундах в формат HH:MM:SS
 * @param seconds - количество секунд
 * @returns строка в формате HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Вычисляет длительность смены в секундах на основе времени начала
 * @param startTime - ISO строка времени начала смены
 * @returns количество секунд или 0, если startTime невалидно
 */
export function calculateShiftDuration(startTime: string | null): number {
  if (!startTime) return 0;
  const start = new Date(startTime);
  const now = new Date();
  return Math.floor((now.getTime() - start.getTime()) / 1000);
}

