"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

type Status = "pending" | "success" | "error";

// создаём единый браузерный Supabase-клиент
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  // не валим сборку, но логируем
  // eslint-disable-next-line no-console
  console.warn(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY for EmailConfirmedClient",
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

      // Для старых ссылок (type=signup) нужен email
      if (type === "signup") {
        if (!emailParam) {
          setStatus("error");
          return;
        }
        payload.email = emailParam;
      }

      const { error } = await supabase.auth.verifyOtp(payload);

      if (error) {
        console.error("Email confirmation error:", error.message);
        setStatus("error");
        return;
      }

      // после успешного подтверждения - получаем пользователя и синхронизируем профиль
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (!userError && user) {
          const meta =
            (user.user_metadata as any) ??
            ((user as any).raw_user_meta_data as any) ??
            {};

          const firstName =
            meta.firstName ?? meta.first_name ?? null;
          const lastName =
            meta.lastName ?? meta.last_name ?? null;
          const middleName =
            meta.middleName ?? meta.middle_name ?? null;
          const birthDate =
            meta.birthDate ?? meta.birth_date ?? null;
          const role = meta.role ?? meta.user_role ?? "director";

          const { error: upsertError } = await supabase
            .from("profiles")
            .upsert(
              {
                id: user.id,
                email: user.email,
                first_name: firstName,
                last_name: lastName,
                middle_name: middleName,
                birth_date: birthDate,
                role,
                email_verified: true,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "id" },
            );

          if (upsertError) {
            console.error("Error upserting profile after email confirm:", upsertError);
          }
        }
      } catch (err) {
        console.error("Unexpected error syncing profile after email confirm:", err);
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
