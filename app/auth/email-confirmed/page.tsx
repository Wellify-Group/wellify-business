"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function EmailConfirmedPage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data } = await supabase.auth.getUser();
        
        if (!data.user) {
          setLoading(false);
          return;
        }

        setEmail(data.user.email ?? null);

        // Автоматическая синхронизация профиля после подтверждения email
        if (data.user.id && data.user.email) {
          try {
            const res = await fetch("/api/auth/email-sync-profile", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: data.user.id,
                email: data.user.email,
              }),
            });

            if (!res.ok) {
              console.error("[email-confirmed] Failed to sync profile");
            }
          } catch (syncError) {
            console.error("[email-confirmed] Error syncing profile", syncError);
          }
        }

        if (typeof window !== "undefined") {
          localStorage.setItem("wellify_email_confirmed", "true");
        }
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl bg-[#050816] border border-white/5 px-8 py-10 text-center">
        <h1 className="text-white text-xl font-semibold mb-3">
          E-mail подтверждён
        </h1>

        {loading ? (
          <p className="text-sm text-zinc-400">
            Завершаем подтверждение...
          </p>
        ) : (
          <>
            <p className="text-sm text-zinc-300">
              Ваша почта успешно подтверждена.
            </p>
            {email && (
              <p className="mt-3 text-xs text-zinc-500">
                {email}
              </p>
            )}
            <div className="mt-6 flex justify-center gap-3">
              <a href="/login" className="text-sm text-blue-400">
                Войти
              </a>
              <a href="/register" className="text-sm text-blue-400">
                Регистрация
              </a>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
