"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/language-provider";
import { welcomeTranslations } from "@/lib/i18n/welcome";
import { useInterfaceLanguageStore } from "@/lib/store/interfaceLanguageStore";

const t = welcomeTranslations;

export function AppFooter() {
  const pathname = usePathname();
  const { t: generalT } = useLanguage();
  const { lang } = useInterfaceLanguageStore();
  const isDashboard = pathname?.startsWith('/dashboard');
  const hideFooterOn = ['/register', '/login'];
  // Определяем welcome-страницу более надёжно
  const isWelcomePage = pathname === '/welcome' || pathname?.startsWith('/welcome');
  
  // Скрываем футер в дашборде и на страницах регистрации/входа
  // На welcome-странице показываем футер с переводами
  if (isDashboard || (pathname && hideFooterOn.includes(pathname))) {
    // На welcome-странице всегда показываем футер
    if (!isWelcomePage) return null;
  }

  // На welcome-странице всегда используем переводы из welcomeTranslations
  // На других страницах используем общие переводы или fallback
  
  return (
    <footer className={isWelcomePage 
      ? "border-t border-white/10 bg-[#05070A] text-sm text-white/70"
      : "border-t border-zinc-100/50 dark:border-zinc-800/50 bg-[var(--bg-secondary)] dark:bg-background"
    }>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <h3 className={isWelcomePage 
              ? "mb-3 text-sm font-semibold text-white"
              : "mb-3 text-sm font-semibold text-foreground"
            }>
              {isWelcomePage ? t.footerBrandTitle[lang] : 'WELLIFY business'}
            </h3>
            <p className={isWelcomePage
              ? "text-xs text-white/60"
              : "text-xs text-muted-foreground"
            }>
              {isWelcomePage ? t.footerBrandDescription[lang] : 'Вся выручка, смены и сотрудники в одном кабинете.'}
            </p>
          </div>
          
          <div>
            <h3 className={isWelcomePage
              ? "mb-3 text-sm font-semibold text-white"
              : "mb-3 text-sm font-semibold text-foreground"
            }>
              {isWelcomePage ? t.footerLinksTitle[lang] : 'Ссылки'}
            </h3>
            <nav className="flex flex-col gap-2">
              <Link
                href="/privacy"
                className={isWelcomePage
                  ? "text-xs text-white/70 hover:text-white transition-colors"
                  : "text-xs text-muted-foreground hover:text-foreground transition-colors"
                }
              >
                {isWelcomePage ? t.footerLinkPrivacy[lang] : 'Политика конфиденциальности'}
              </Link>
              <Link
                href="/terms"
                className={isWelcomePage
                  ? "text-xs text-white/70 hover:text-white transition-colors"
                  : "text-xs text-muted-foreground hover:text-foreground transition-colors"
                }
              >
                {isWelcomePage ? t.footerLinkTerms[lang] : 'Пользовательское соглашение'}
              </Link>
              <Link
                href="/support"
                className={isWelcomePage
                  ? "text-xs text-white/70 hover:text-white transition-colors"
                  : "text-xs text-muted-foreground hover:text-foreground transition-colors"
                }
              >
                {isWelcomePage ? t.footerLinkSupport[lang] : 'Поддержка'}
              </Link>
            </nav>
          </div>
          
          <div>
            <h3 className={isWelcomePage
              ? "mb-3 text-sm font-semibold text-white"
              : "mb-3 text-sm font-semibold text-foreground"
            }>
              {isWelcomePage ? t.footerContactsTitle[lang] : 'Контакты'}
            </h3>
            <div className={isWelcomePage
              ? "space-y-2 text-xs text-white/70"
              : "space-y-2 text-xs text-muted-foreground"
            }>
              <a href="mailto:support@wellify.business" className={isWelcomePage
                ? "block hover:text-white transition-colors"
                : "block hover:text-foreground transition-colors"
              }>
                support@wellify.business
              </a>
              <a href="https://t.me/wellify_business_bot" target="_blank" rel="noopener noreferrer" className={isWelcomePage
                ? "block hover:text-white transition-colors"
                : "block hover:text-foreground transition-colors"
              }>
                {isWelcomePage ? t.footerContactTelegram[lang] : 'Telegram бот'}
              </a>
            </div>
          </div>
        </div>
        
        <div className={isWelcomePage
          ? "mt-8 border-t border-white/5 pt-6"
          : "mt-8 border-t border-zinc-100/50 dark:border-zinc-800/50 pt-6"
        }>
          <p className={isWelcomePage
            ? "text-center text-xs text-white/40"
            : "text-center text-xs text-muted-foreground"
          }>
            {isWelcomePage 
              ? t.footerBottomText[lang].replace('2025', String(new Date().getFullYear()))
              : `© ${new Date().getFullYear()} WELLIFY business. Все права защищены.`}
          </p>
        </div>
      </div>
    </footer>
  );
}

// Экспорт для обратной совместимости
export const Footer = AppFooter;

