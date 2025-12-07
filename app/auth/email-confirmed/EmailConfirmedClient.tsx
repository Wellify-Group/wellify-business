"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Status = "pending" | "success" | "error";

// Используем тот же клиент что и в форме регистрации для синхронизации cookies

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

      // Для старых ссылок (type=signup) нужен email
      if (type === "signup") {
        if (!emailParam) {
          setStatus("error");
          return;
        }
        payload.email = emailParam;
      }

      // 1. Подтверждаем e-mail
      const { error } = await supabase.auth.verifyOtp(payload);

      if (error) {
        console.error("Email confirmation error:", error.message);
        setStatus("error");
        return;
      }

      // 2. Берём текущего пользователя
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Error getting user after verifyOtp:", userError?.message);
        setStatus("error");
        return;
      }

      // 3. Извлекаем данные из user_metadata (они были переданы при signUp)
      const metadata = user.user_metadata || {};
      const firstName = metadata.firstName || "";
      const lastName = metadata.lastName || "";
      const middleName = metadata.middleName || "";
      const birthDate = metadata.birthDate || null;

      // Формируем full_name
      const fullName = [lastName, firstName, middleName]
        .filter(Boolean)
        .join(" ") || null;

      // 4. Обновляем профиль: email_verified + все личные данные
      const profileUpdate: Record<string, any> = {
        id: user.id,
        email: user.email || "",
        email_verified: true,
        роль: "директор",
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        middle_name: middleName.trim() || null,
        full_name: fullName,
        дата_рождения: birthDate || null,
        updated_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(profileUpdate, { onConflict: "id" });

      if (profileError) {
        console.error(
          "Error updating profile:",
          profileError.message,
        );
      }

      // 5. Принудительно обновляем сессию (важно для синхронизации между вкладками)
      try {
        await supabase.auth.getSession();
      } catch (e) {
        console.warn("Error refreshing session:", e);
      }

      // 6. Уведомляем форму регистрации через localStorage событие
      try {
        window.localStorage.setItem("wellify_email_confirmed", "true");
        // Триггерим событие storage для синхронизации между вкладками
        // Важно: событие storage срабатывает ТОЛЬКО в других вкладках
        window.dispatchEvent(new StorageEvent("storage", {
          key: "wellify_email_confirmed",
          newValue: "true",
          storageArea: localStorage,
        }));
        // Также отправляем кастомное событие для текущего окна
        window.dispatchEvent(new CustomEvent("emailConfirmed"));
      } catch (e) {
        console.warn("Cannot set localStorage:", e);
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
