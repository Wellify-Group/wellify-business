"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/language-provider";

export function AppFooter() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const isDashboard = pathname?.startsWith('/dashboard');
  const hideFooterOn = ['/register', '/login'];
  
  // Скрываем футер в дашборде и на страницах регистрации/входа
  if (isDashboard || (pathname && hideFooterOn.includes(pathname))) return null;

  return (
    <footer className="border-t border-zinc-100/50 dark:border-zinc-800/50 bg-[var(--bg-secondary)] dark:bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">WELLIFY business</h3>
            <p className="text-xs text-muted-foreground">
              Вся выручка, смены и сотрудники в одном кабинете.
            </p>
          </div>
          
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Ссылки</h3>
            <nav className="flex flex-col gap-2">
              <Link
                href="/privacy"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Политика конфиденциальности
              </Link>
              <Link
                href="/terms"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Пользовательское соглашение
              </Link>
              <Link
                href="/support"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Поддержка
              </Link>
            </nav>
          </div>
          
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Контакты</h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              <a href="mailto:support@wellify.business" className="block hover:text-foreground transition-colors">
                support@wellify.business
              </a>
              <a href="https://t.me/wellify_business_bot" target="_blank" rel="noopener noreferrer" className="block hover:text-foreground transition-colors">
                Telegram бот
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-8 border-t border-zinc-100/50 dark:border-zinc-800/50 pt-6">
          <p className="text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} WELLIFY business. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
}

// Экспорт для обратной совместимости
export const Footer = AppFooter;

