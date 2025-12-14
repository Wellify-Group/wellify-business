"use client";

import { CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function EmailConfirmedPage() {
  const { t, language } = useLanguage();
  const [userLanguage, setUserLanguage] = useState<"ru" | "uk" | "en">("ru");
  const supabase = createBrowserSupabaseClient();

  // Загружаем язык пользователя из БД
  useEffect(() => {
    const loadUserLanguage = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("language")
            .eq("id", session.user.id)
            .maybeSingle();
          
          if (profile?.language) {
            const lang = profile.language === "ua" ? "uk" : profile.language;
            if (["ru", "uk", "en"].includes(lang)) {
              setUserLanguage(lang as "ru" | "uk" | "en");
            }
          }
        }
      } catch (error) {
        console.error("Error loading user language:", error);
      }
    };
    loadUserLanguage();
  }, [supabase]);

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
      title: "Email Confirmation",
      message: "Your email has been successfully confirmed.",
      closeButton: "Close Window",
    },
  };

  const texts = translations[userLanguage];

  const handleClose = () => {
    // Закрываем окно браузера
    if (window.opener) {
      window.close();
    } else {
      window.close();
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-xl rounded-[32px] border border-[var(--border)] bg-[var(--card)] px-8 py-10 shadow-[var(--shadow-modal)]">
        <div className="flex flex-col items-center text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-[var(--color-success)]" />

          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            {texts.title}
          </h1>

          <p className="max-w-md text-sm leading-relaxed text-[var(--muted-foreground)]">
            {texts.message}
          </p>

          <button
            type="button"
            onClick={handleClose}
            className="mt-2 inline-flex h-10 items-center justify-center rounded-full bg-[var(--primary)] px-6 text-sm font-semibold text-[var(--primary-foreground)] shadow-[var(--shadow-floating)] transition hover:bg-[var(--primary)]/90"
          >
            {texts.closeButton}
          </button>
        </div>
      </div>
    </main>
  );
}
