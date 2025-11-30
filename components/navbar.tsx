"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/components/language-provider";
import type { TranslationTree } from "@/lib/translations";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const { t } = useLanguage();
  const nav = t<TranslationTree["nav"]>("nav");
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');
  
  // Навбар скрыт только в дашборде
  if (isDashboard) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pt-4 px-4 md:px-6 bg-[#F7F7F7] dark:bg-[#0F0F0F]">
      {/* Плавающая "пилюля" */}
      <div className="mx-auto w-full max-w-[80%] bg-[#F7F7F7] dark:bg-[#0F0F0F] rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
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
              <motion.button
                whileHover={{ opacity: 0.7 }}
                whileTap={{ scale: 0.98 }}
                className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 hover:opacity-70 transition-opacity"
              >
                {nav.login}
              </motion.button>
            </Link>

            {/* Кнопка "Создать аккаунт" */}
            <Link href="/register">
              <motion.button
                whileHover={{ opacity: 0.9 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-white px-5 py-2.5 text-sm font-semibold text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
              >
                {nav.createAccount}
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}



