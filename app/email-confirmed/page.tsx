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

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="relative w-full max-w-xl">
        <div className="pointer-events-none absolute inset-x-0 -top-24 flex justify-center">
          <div className="h-48 w-48 rounded-full bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.32),_transparent_65%)] blur-2xl" />
        </div>

        <div className="relative overflow-hidden rounded-[32px] border border-border bg-card px-6 py-8 shadow-[var(--shadow-modal)] sm:px-10 sm:py-12">
          <div className="flex flex-col items-center space-y-5 text-center sm:space-y-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background shadow-[0_0_0_1px_rgba(34,197,94,0.35)]">
              <CheckCircle2 className="h-10 w-10 text-[color:var(--color-success)]" />
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {texts.title}
            </h1>

            <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
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
    </main>
  );
}
