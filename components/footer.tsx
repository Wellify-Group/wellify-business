"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/language-provider";
import { type WelcomeLanguage, welcomeTranslations } from "@/lib/i18n/welcome";

type AppFooterProps = {
  lang?: WelcomeLanguage;
};

const t = welcomeTranslations;

export function AppFooter({ lang }: AppFooterProps) {
  const pathname = usePathname();
  const { t: generalT } = useLanguage();
  const isDashboard = pathname?.startsWith('/dashboard');
  const hideFooterOn = ['/register', '/login'];
  
  // Скрываем футер в дашборде и на страницах регистрации/входа
  // Если передан lang, значит футер используется явно (например, на welcome-странице) и не скрываем его
  if (!lang && (isDashboard || (pathname && hideFooterOn.includes(pathname)))) return null;

  // Если передан lang, используем переводы из welcomeTranslations
  const useWelcomeTranslations = lang !== undefined;
  const currentLang = lang || 'ru'; // Fallback на русский, если lang не передан

  // Специальные стили для welcome-страницы (темная тема)
  const isWelcomePage = lang !== undefined;
  
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
              {useWelcomeTranslations ? t.footerBrandTitle[currentLang] : 'WELLIFY business'}
            </h3>
            <p className={isWelcomePage
              ? "text-xs text-white/60"
              : "text-xs text-muted-foreground"
            }>
              {useWelcomeTranslations ? t.footerBrandDescription[currentLang] : 'Вся выручка, смены и сотрудники в одном кабинете.'}
            </p>
          </div>
          
          <div>
            <h3 className={isWelcomePage
              ? "mb-3 text-sm font-semibold text-white"
              : "mb-3 text-sm font-semibold text-foreground"
            }>
              {useWelcomeTranslations ? t.footerLinksTitle[currentLang] : 'Ссылки'}
            </h3>
            <nav className="flex flex-col gap-2">
              <Link
                href="/privacy"
                className={isWelcomePage
                  ? "text-xs text-white/70 hover:text-white transition-colors"
                  : "text-xs text-muted-foreground hover:text-foreground transition-colors"
                }
              >
                {useWelcomeTranslations ? t.footerLinkPrivacy[currentLang] : 'Политика конфиденциальности'}
              </Link>
              <Link
                href="/terms"
                className={isWelcomePage
                  ? "text-xs text-white/70 hover:text-white transition-colors"
                  : "text-xs text-muted-foreground hover:text-foreground transition-colors"
                }
              >
                {useWelcomeTranslations ? t.footerLinkTerms[currentLang] : 'Пользовательское соглашение'}
              </Link>
              <Link
                href="/support"
                className={isWelcomePage
                  ? "text-xs text-white/70 hover:text-white transition-colors"
                  : "text-xs text-muted-foreground hover:text-foreground transition-colors"
                }
              >
                {useWelcomeTranslations ? t.footerLinkSupport[currentLang] : 'Поддержка'}
              </Link>
            </nav>
          </div>
          
          <div>
            <h3 className={isWelcomePage
              ? "mb-3 text-sm font-semibold text-white"
              : "mb-3 text-sm font-semibold text-foreground"
            }>
              {useWelcomeTranslations ? t.footerContactsTitle[currentLang] : 'Контакты'}
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
                {useWelcomeTranslations ? t.footerContactTelegram[currentLang] : 'Telegram бот'}
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
            {useWelcomeTranslations 
              ? t.footerBottomText[currentLang].replace('2025', String(new Date().getFullYear()))
              : `© ${new Date().getFullYear()} WELLIFY business. Все права защищены.`}
          </p>
        </div>
      </div>
    </footer>
  );
}

// Экспорт для обратной совместимости
export const Footer = AppFooter;

