"use client";

import { CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

const translations = {
  ru: {
    title: "Подтверждение e-mail",
    message: "Ваш e-mail успешно подтверждён.",
    closeButton: "Закрыть окно",
  },
  uk: {
    title: "Підтвердження e-mail",
    message: "Ваш e-mail успішно підтверджено.",
    closeButton: "Закрити вікно",
  },
  en: {
    title: "Email confirmation",
    message: "Your email has been successfully confirmed.",
    closeButton: "Close window",
  },
} as const;

export default function EmailConfirmedPage() {
  const { language } = useLanguage();

  const activeLang = (["ru", "uk", "en"].includes(language)
    ? language
    : "ru") as "ru" | "uk" | "en";

  const texts = translations[activeLang];

  const handleClose = () => {
    if (window.opener) {
      window.close();
      return;
    }
    window.close();
  };

  // Показываем контент сразу, без ожидания монтирования
  // Это предотвращает мигание и промежуточные состояния
  return (
    <div className="flex h-full w-full items-center justify-center px-4 py-8">
      <div className="relative w-full max-w-md">
        <div className="relative overflow-hidden rounded-[32px] border border-border bg-card px-6 py-6 shadow-[var(--shadow-modal)] sm:px-8 sm:py-8">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[color:var(--color-success)]/10 dark:bg-[color:var(--color-success)]/20">
              <CheckCircle2 className="h-12 w-12 text-[color:var(--color-success)]" />
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {texts.title}
            </h1>

            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base">
              {texts.message}
            </p>

            <button
              type="button"
              onClick={handleClose}
              className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-primary px-8 text-sm font-semibold tracking-wide text-primary-foreground shadow-[var(--shadow-floating)] transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {texts.closeButton}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
