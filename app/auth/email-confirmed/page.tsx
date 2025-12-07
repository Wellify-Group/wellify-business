"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Status = "pending" | "success" | "error";

export default function EmailConfirmedPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("pending");

  useEffect(() => {
    const token_hash = searchParams.get("token_hash");
    const typeParam = searchParams.get("type");

    if (!token_hash) {
      setStatus("error");
      return;
    }

    const supabase = createBrowserSupabaseClient();

    const verify = async () => {
      type EmailOtpType = "signup" | "email" | "recovery" | "magiclink";

      const raw = (typeParam ?? "").toLowerCase();
      const type: EmailOtpType =
        raw === "signup" ||
        raw === "email" ||
        raw === "recovery" ||
        raw === "magiclink"
          ? (raw as EmailOtpType)
          : "email";

      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      });

      if (error) {
        console.error("Email confirmation error:", error.message);
        setStatus("error");
        return;
      }

      setStatus("success");
    };

    verify().catch((err) => {
      console.error("Unexpected verify error:", err);
      setStatus("error");
    });
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-[#020617] flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-3xl bg-[#050816] border border-white/5 px-8 py-10 text-center shadow-xl shadow-black/40">
        {status === "pending" && (
          <>
            <h1 className="text-white text-xl font-semibold mb-3">
              Подтверждаем e-mail...
            </h1>
            <p className="text-sm text-zinc-400">
              Пожалуйста, подождите несколько секунд. Мы проверяем ссылку подтверждения.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <h1 className="text-white text-xl font-semibold mb-3">
              E-mail подтвержден
            </h1>
            <p className="text-sm text-zinc-300">
              Ваша почта успешно подтверждена. Можете закрыть это окно и вернуться к регистрации в WELLIFY business.
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-white text-xl font-semibold mb-3">
              Ошибка подтверждения
            </h1>
            <p className="text-sm text-zinc-400">
              Не удалось подтвердить e-mail. Попробуйте ещё раз отправить письмо с подтверждением из формы регистрации.
            </p>
          </>
        )}
      </div>
    </main>
  );
}