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

      // Получаем пользователя и обновляем профиль
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
          // Показываем успех, так как email уже подтвержден в auth
          setStatus("success");
          return;
        }

        if (!user) {
          console.warn("[email-confirmed] No user after verifyOtp");
          setStatus("success");
          return;
        }

        console.log("[email-confirmed] User confirmed:", {
          id: user.id,
          email: user.email,
          email_confirmed_at: user.email_confirmed_at,
          metadata: user.user_metadata,
        });

        // Обновляем профиль с данными из user_metadata
        const metadata = user.user_metadata || {};
        const firstName = metadata.firstName?.trim() || null;
        const lastName = metadata.lastName?.trim() || null;
        const middleName = metadata.middleName?.trim() || null;
        let birthDate = metadata.birthDate || null;
        const role = metadata.role || "director";

        // Нормализуем формат даты (YYYY-MM-DD для PostgreSQL date)
        if (birthDate) {
          // Если дата в формате YYYY-MM-DD, оставляем как есть
          // Если в другом формате, пытаемся преобразовать
          const dateMatch = birthDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (!dateMatch) {
            // Пытаемся распарсить другие форматы
            const parsed = new Date(birthDate);
            if (!isNaN(parsed.getTime())) {
              birthDate = parsed.toISOString().split("T")[0];
            } else {
              console.warn(
                "[email-confirmed] Invalid birthDate format:",
                birthDate,
              );
              birthDate = null;
            }
          }
        }

        // Формируем full_name (Фамилия Имя Отчество)
        const fullName = [lastName, firstName, middleName]
          .filter(Boolean)
          .join(" ") || null;

        // Обновляем только существующие колонки в базе данных
        // Согласно схеме, в profiles есть только: id, created_at, updated_at, email, full_name
        const profilePayload: {
          id: string;
          email: string | null;
          full_name: string | null;
          updated_at: string;
        } = {
          id: user.id,
          email: user.email ?? null,
          full_name: fullName,
          updated_at: new Date().toISOString(),
        };

        console.log(
          "[email-confirmed] Updating profile with payload:",
          JSON.stringify(profilePayload, null, 2),
        );

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .upsert(profilePayload, { onConflict: "id" })
          .select();

        if (profileError) {
          console.error(
            "[email-confirmed] Error updating profile:",
            profileError,
          );
          console.error(
            "[email-confirmed] Error details:",
            JSON.stringify(profileError, null, 2),
          );
          // Показываем успех, так как email уже подтвержден
          // Профиль можно обновить позже на шаге 3
        } else {
          console.log(
            "[email-confirmed] Profile updated successfully:",
            profileData,
          );
        }
      } catch (e) {
        console.warn("[email-confirmed] Error in profile update:", e);
        // Показываем успех, так как email уже подтвержден
      }

      // Устанавливаем флаг в localStorage и отправляем события для синхронизации
      try {
        window.localStorage.setItem("wellify_email_confirmed", "true");
        console.log(
          "[email-confirmed] localStorage flag set, dispatching events...",
        );

        // Событие для текущей вкладки
        window.dispatchEvent(new CustomEvent("emailConfirmed"));

        // Событие для других вкладок (storage event)
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "wellify_email_confirmed",
            newValue: "true",
            storageArea: localStorage,
          }),
        );

        console.log("[email-confirmed] Events dispatched successfully");
      } catch (e) {
        console.warn("[email-confirmed] Cannot use localStorage:", e);
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
