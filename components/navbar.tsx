"use client";

import { useLanguage } from "@/components/language-provider";
import type { TranslationTree } from "@/lib/translations";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function Navbar() {
  const { t } = useLanguage();
  const nav = t<TranslationTree["nav"]>("nav");
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDashboard = pathname?.startsWith("/dashboard");
  const isEmailConfirmed = pathname === "/auth/email-confirmed" || pathname === "/email-confirmed";

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  // Навбар скрыт в дашборде и на странице подтверждения email
  if (isDashboard || isEmailConfirmed) return null;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-30 pt-5 px-4 md:px-6"
      style={{
        height: 'var(--navbar-height)',
        paddingTop: "max(1.25rem, 1.25rem)",
        paddingLeft: "max(1.5rem, 5vw)",
        paddingRight: "max(1.5rem, 5vw)",
      }}
    >
      {/* Плавающая "пилюля" с glass effect */}
      <div
        className="mx-auto w-full max-w-[80%] border rounded-xl backdrop-blur-xl"
        style={{
          backgroundColor: isDark 
            ? "rgba(11, 19, 32, 0.7)" 
            : "rgba(255, 255, 255, 0.7)",
          borderBottom: isDark
            ? "1px solid rgba(148, 163, 184, 0.15)"
            : "1px solid rgba(255,255,255,0.05)",
          borderColor: isDark
            ? "rgba(148, 163, 184, 0.15)"
            : "rgba(255,255,255,0.05)",
          boxShadow: isDark
            ? "0 4px 30px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(148, 163, 184, 0.1)"
            : "0 4px 30px rgba(0,0,0,0.1), 0 0 0 1px rgba(15, 23, 42, 0.05)",
          borderRadius: "var(--radius-xl)",
          backdropFilter: "blur(12px) saturate(180%)",
          WebkitBackdropFilter: "blur(12px) saturate(180%)",
        }}
      >
        <div className="flex h-[64px] items-center justify-between px-6 md:px-8">
          {/* Логотип слева */}
          <Link href="/" className="flex items-center">
            <Logo
              href={undefined}
              size={28}
              showText={true}
              priority={true}
              className="gap-2"
            />
          </Link>

          {/* Правый блок - кнопки */}
          <div className="flex items-center gap-3">
            {/* Кнопка языка */}
            <LanguageSwitcher variant="compact" />

            {/* Переключатель темы */}
            <ThemeToggle />

            {/* Кнопка "Войти" */}
            <Link href="/login">
              <button
                className="hidden sm:inline-flex px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  color: isDark ? "var(--color-text-inverse)" : "var(--color-text-main)",
                }}
              >
                {nav.login}
              </button>
            </Link>

            {/* Кнопка "Создать аккаунт" - премиальный стиль с новыми токенами */}
            <Link href="/register">
              <button
                className="inline-flex items-center justify-center gap-2 px-6 h-12 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  background: "var(--color-brand)",
                  color: "var(--color-text-inverse)",
                  boxShadow: isDark
                    ? "var(--shadow-floating)"
                    : "var(--shadow-soft)",
                  borderRadius: "var(--radius-pill)",
                }}
              >
                {nav.createAccount}
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
