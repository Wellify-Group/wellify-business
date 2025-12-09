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
        const { data, error } = await supabase.auth.getUser();

        if (!error && data.user?.email) {
          const normalized = data.user.email.toLowerCase();
          setEmail(normalized);

          // помечаем верификацию в localStorage
          if (typeof window !== "undefined") {
            localStorage.setItem("wellify_email_confirmed", "1");
            localStorage.setItem("wellify_email", normalized);
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

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/5 bg-[rgba(7,13,23,0.96)] px-8 py-10 text-center shadow-[0_18px_70px_rgba(0,0,0,0.75)] backdrop-blur-xl">
        <h1 className="mb-3 text-xl font-semibold text-white">
          E-mail подтверждён
        </h1>

        {loading ? (
          <p className="text-sm text-muted-foreground">
            Завершаем подтверждение e-mail...
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Ваша почта успешно подтверждена.
              <br />
              Можете закрыть это окно и вернуться к регистрации в WELLIFY
              business.
            </p>
            {email && (
              <p className="mt-3 text-xs text-zinc-500">
                Текущий e-mail: <span className="font-mono">{email}</span>
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
