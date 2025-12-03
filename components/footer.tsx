"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { welcomeTranslations } from "@/lib/i18n/welcome";
import { useInterfaceLanguageStore } from "@/lib/store/interfaceLanguageStore";

const t = welcomeTranslations;

export function AppFooter() {
  const pathname = usePathname();
  const { lang } = useInterfaceLanguageStore();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  // Приветственная и главная
  const isWelcomePage =
    pathname === "/" ||
    pathname === "/welcome" ||
    pathname?.startsWith("/welcome");

  const isDashboard = pathname?.startsWith("/dashboard");
  const hideFooterOn = ["/login", "/register"];

  // Полное отключение футера
  if (isDashboard || hideFooterOn.includes(pathname)) {
    return null;
  }

  // ====== ФУТЕР ДЛЯ ПРИВЕТСТВЕННОЙ И ГЛАВНОЙ ======
  if (isWelcomePage) {
    return (
      <footer
        className="border-t text-sm transition-colors"
        style={{
          borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "var(--color-border-subtle)",
          backgroundColor: isDark ? "#050B13" : "var(--color-surface)",
          color: isDark ? "rgba(255, 255, 255, 0.7)" : "var(--color-text-muted)",
        }}
      >
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {/* BRAND */}
            <div>
              <h3
                className="mb-3 text-sm font-semibold"
                style={{
                  color: isDark ? "#ffffff" : "var(--color-text-main)",
                }}
              >
                {t.footerBrandTitle[lang]}
              </h3>
              <p
                className="text-xs"
                style={{
                  color: isDark ? "rgba(255, 255, 255, 0.6)" : "var(--color-text-muted)",
                }}
              >
                {t.footerBrandDescription[lang]}
              </p>
            </div>

            {/* LINKS */}
            <div>
              <h3
                className="mb-3 text-sm font-semibold"
                style={{
                  color: isDark ? "#ffffff" : "var(--color-text-main)",
                }}
              >
                {t.footerLinksTitle[lang]}
              </h3>
              <nav className="flex flex-col gap-2">
                <Link
                  href="/privacy"
                  className={`text-xs transition-colors ${
                    isDark
                      ? "text-white/70 hover:text-white"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
                  }`}
                >
                  {t.footerLinkPrivacy[lang]}
                </Link>
                <Link
                  href="/terms"
                  className={`text-xs transition-colors ${
                    isDark
                      ? "text-white/70 hover:text-white"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
                  }`}
                >
                  {t.footerLinkTerms[lang]}
                </Link>
                <Link
                  href="/support"
                  className={`text-xs transition-colors ${
                    isDark
                      ? "text-white/70 hover:text-white"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
                  }`}
                >
                  {t.footerLinkSupport[lang]}
                </Link>
              </nav>
            </div>

            {/* CONTACTS */}
            <div>
              <h3
                className="mb-3 text-sm font-semibold"
                style={{
                  color: isDark ? "#ffffff" : "var(--color-text-main)",
                }}
              >
                {t.footerContactsTitle[lang]}
              </h3>
              <div className="space-y-2 text-xs">
                <a
                  href="mailto:wellify_group@proton.me"
                  className={`block transition-colors ${
                    isDark
                      ? "text-white/70 hover:text-white"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
                  }`}
                >
                  wellify_group@proton.me
                </a>
                <a
                  href="https://t.me/wellify_business_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block transition-colors ${
                    isDark
                      ? "text-white/70 hover:text-white"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
                  }`}
                >
                  {t.footerContactTelegram[lang]}
                </a>
              </div>
            </div>
          </div>

          {/* BOTTOM */}
          <div
            className="mt-8 border-t pt-6"
            style={{
              borderColor: isDark ? "rgba(255, 255, 255, 0.05)" : "var(--color-border-subtle)",
            }}
          >
            <p
              className="text-center text-xs"
              style={{
                color: isDark ? "rgba(255, 255, 255, 0.4)" : "var(--color-text-soft)",
              }}
            >
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

  // ====== ОБЫЧНЫЙ ФУТЕР ======
  return (
    <footer className="border-t border-zinc-100/50 dark:border-zinc-800/50 bg-[var(--bg-secondary)] dark:bg-[#050B13] text-sm">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} WELLIFY business. Все права защищены. WELLIFY Business является продуктом компании WELLIFY Group.
        </p>
      </div>
    </footer>
  );
}

export const Footer = AppFooter;
