"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  /** Размер логотипа в пикселях */
  size?: number;
  /** Показывать ли текст рядом с логотипом */
  showText?: boolean;
  /** Ссылка для клика (если не указана, логотип не будет кликабельным) */
  href?: string;
  /** Дополнительные классы для контейнера */
  className?: string;
  /** Приоритетная загрузка */
  priority?: boolean;
}

/**
 * ⚠️ КРИТИЧЕСКИ ВАЖНЫЙ КОМПОНЕНТ - НАШ ЛОГОТИП! ⚠️
 * 
 * Централизованный компонент логотипа WELLIFY
 * ВСЕГДА использует /logo.svg из public директории
 * НИКОГДА не должен "слетать" - это наш основной логотип!
 * 
 * Этот компонент используется везде в приложении:
 * - Navbar (главная страница)
 * - Dashboard Sidebar (сайдбар дашборда)
 * - Dashboard Header (хедер дашборда)
 * 
 * ВСЕГДА используйте этот компонент вместо прямого Image с /logo.svg
 * Это гарантирует единообразие и надежность отображения логотипа.
 */
export function Logo({ 
  size = 32, 
  showText = false, 
  href,
  className,
  priority = false 
}: LogoProps) {
  // ⚠️ КРИТИЧЕСКИ ВАЖНО: Используем прямой путь к нашему логотипу
  // Путь на диске: D:\Даня\Cursor микро CRM\public\logo.svg
  // В браузере это будет /logo.svg (Next.js автоматически обслуживает public/)
  // Используем Next.js Image для оптимальной загрузки
  const LOGO_SRC = "/logo.svg";
  
  const logoImage = (
    <Image
      src={LOGO_SRC}
      alt="WELLIFY"
      width={size}
      height={size}
      className="object-contain flex-shrink-0"
      style={{ width: size, height: size }}
      priority={priority}
      unoptimized
    />
  );

  const content = (
    <div className={cn("flex items-center gap-2", className)}>
      {logoImage}
      {showText && (
        <span className="text-lg font-extrabold tracking-tight text-foreground sm:text-xl">
          <span className="font-extrabold">WELLIFY</span><span className="font-light text-muted-foreground ml-1">business</span>
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}

