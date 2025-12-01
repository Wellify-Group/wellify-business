"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { welcomeTranslations } from "@/lib/i18n/welcome";
import { useInterfaceLanguageStore } from "@/lib/store/interfaceLanguageStore";

const t = welcomeTranslations;

export function AppFooter() {
  const pathname = usePathname();
  const { lang } = useInterfaceLanguageStore();

  // Welcome-page должна включать ВСЕ root-варианты:
  // '/', '/welcome', '/welcome/*'
  const isWelcomePage =
    pathname === "/" ||
    pathname === "/welcome" ||
    pathname?.startsWith("/welcome");

  const isDashboard = pathname?.startsWith("/dashboard");
  const hideFooterOn = ["/login", "/register"];

  // Прячем футер только на страницах дашборда и логина/регистрации
  if (isDashboard || hideFooterOn.includes(pathname)) {
    return null;
  }

  // WELCOME FOOTER (переводимый)
  if (isWelcomePage) {
    return (
      <footer className="border-t border-white/10 bg-[#05070A] text-sm text-white/70">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {/* BRAND */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-white">
                {t.footerBrandTitle[lang]}
              </h3>
              <p className="text-xs text-white/60">
                {t.footerBrandDescription[lang]}
              </p>
            </div>

            {/* LINKS */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-white">
                {t.footerLinksTitle[lang]}
              </h3>
              <nav className="flex flex-col gap-2">
                <Link
                  href="/privacy"
                  className="text-xs text-white/70 hover:text-white transition-colors"
                >
                  {t.footerLinkPrivacy[lang]}
                </Link>
                <Link
                  href="/terms"
                  className="text-xs text-white/70 hover:text-white transition-colors"
                >
                  {t.footerLinkTerms[lang]}
                </Link>
                <Link
                  href="/support"
                  className="text-xs text-white/70 hover:text-white transition-colors"
                >
                  {t.footerLinkSupport[lang]}
                </Link>
              </nav>
            </div>

            {/* CONTACTS */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-white">
                {t.footerContactsTitle[lang]}
              </h3>
              <div className="space-y-2 text-xs text-white/70">
                <a
                  href="mailto:support@wellify.business"
                  className="block hover:text-white transition-colors"
                >
                  support@wellify.business
                </a>
                <a
                  href="https://t.me/wellify_business_bot"
                  className="block hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t.footerContactTelegram[lang]}
                </a>
              </div>
            </div>
          </div>

          {/* BOTTOM */}
          <div className="mt-8 border-t border-white/5 pt-6">
            <p className="text-center text-xs text-white/40">
              {t.footerBottomText[lang].replace(
                "2025",
                String(new Date().getFullYear())
              )}
            </p>
          </div>
        </div>
      </footer>
    );
  }

  // DEFAULT FOOTER (для остальных страниц)
  return (
    <footer className="border-t border-zinc-100/50 dark:border-zinc-800/50 bg-[var(--bg-secondary)] dark:bg-background text-sm">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} WELLIFY business. Все права защищены.
        </p>
      </div>
    </footer>
  );
}

export const Footer = AppFooter;