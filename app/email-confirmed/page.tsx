"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function EmailConfirmedPage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data, error } = await supabase.auth.getUser();

        if (!error && data.user?.email) {
          const normalized = data.user.email.toLowerCase();
          setEmail(normalized);

          // Синхронизируем профиль через API
          try {
            const res = await fetch("/api/auth/email-sync-profile", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: data.user.id,
                email: normalized,
              }),
            });

            if (!res.ok) {
              console.error("[email-confirmed] Failed to sync profile");
            }
          } catch (syncError) {
            console.error("[email-confirmed] Error syncing profile", syncError);
          }

          // Помечаем верификацию в localStorage
          if (typeof window !== "undefined") {
            localStorage.setItem("wellify_email_confirmed", "true");
            localStorage.setItem("wellify_email_confirmed_for", normalized);
          }
        }
      } catch (e) {
        console.error("[email-confirmed] getUser error", e);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const handleClose = () => {
    // Пытаемся закрыть окно
    window.close();
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12 bg-[#050816]">
      <div className="w-full max-w-md rounded-3xl border border-white/5 bg-[radial-gradient(circle_at_top,_rgba(62,132,255,0.18),_transparent_55%),_rgba(7,13,23,0.96)] px-8 py-12 text-center shadow-[0_18px_70px_rgba(0,0,0,0.75)] backdrop-blur-xl">
        {loading ? (
          <>
            <div className="mb-6 flex justify-center">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
            </div>
            <h1 className="mb-3 text-xl font-semibold text-white">
              Завершаем подтверждение e-mail...
            </h1>
          </>
        ) : (
          <>
            {/* Зеленая иконка галочки */}
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 ring-4 ring-emerald-500/10">
                <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              </div>
            </div>

            {/* Заголовок */}
            <h1 className="mb-4 text-2xl font-semibold text-white">
              E-mail успешно подтвержден!
            </h1>

            {/* Подзаголовок */}
            <p className="mb-8 text-sm text-zinc-400">
              Вы можете закрыть эту страницу и вернуться к вкладке регистрации.
            </p>

            {/* Email (опционально) */}
            {email && (
              <p className="mb-8 text-xs text-zinc-500">
                Подтверждённый e-mail:{" "}
                <span className="font-mono text-zinc-400">{email}</span>
              </p>
            )}

            {/* Кнопка закрытия */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleClose}
                className="w-full bg-primary hover:bg-primary/90"
              >
                Закрыть страницу
              </Button>
              <p className="text-xs text-zinc-500 mt-1">
                Если вкладка не закрылась автоматически, закройте её вручную
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

