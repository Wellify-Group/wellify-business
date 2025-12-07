"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Status = "pending" | "success" | "error";

export default function EmailConfirmedClient() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("pending");

  useEffect(() => {
    const token_hash = searchParams.get("token_hash");
    const typeParam = searchParams.get("type"); // email | signup | null
    const emailParam = searchParams.get("email");

    if (!token_hash) {
      setStatus("error");
      return;
    }

    const supabase = createBrowserSupabaseClient();

    const verify = async () => {
      const type: "email" | "signup" =
        typeParam === "email" ? "email" : "signup";

      const payload: {
        type: "email" | "signup";
        token_hash: string;
        email?: string;
      } = {
        type,
        token_hash,
      };

      if (type === "signup") {
        if (!emailParam) {
          setStatus("error");
          return;
        }
        payload.email = emailParam;
      }

      const { data: verifyData, error } = await supabase.auth.verifyOtp(payload);

      if (error) {
        console.error("Email confirmation error:", error.message);
        setStatus("error");
        return;
      }

      console.log("[email-confirmed] verifyOtp success:", verifyData);

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error(
            "[email-confirmed] Error getting user after verifyOtp:",
            userError,
          );
        } else if (user) {
          console.log("[email-confirmed] User confirmed:", {
            id: user.id,
            email: user.email,
            email_confirmed_at: user.email_confirmed_at,
          });
        }
      } catch (e) {
        console.warn("[email-confirmed] Cannot get user after verifyOtp:", e);
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
              Пожалуйста, подождите несколько секунд. Мы проверяем ссылку
              подтверждения.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <h1 className="text-white text-xl font-semibold mb-3">
              E-mail подтвержден
            </h1>
            <p className="text-sm text-zinc-300">
              Ваша почта успешно подтверждена. Можете закрыть это окно и
              вернуться к регистрации в WELLIFY business.
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-white text-xl font-semibold mb-3">
              Ошибка подтверждения
            </h1>
            <p className="text-sm text-zinc-400">
              Не удалось подтвердить e-mail. Попробуйте ещё раз отправить письмо
              с подтверждением из формы регистрации.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
