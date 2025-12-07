"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Status = "pending" | "success" | "error";

// Используем браузерный клиент с поддержкой cookies для сессий

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

      const { data: verifyData, error } = await supabase.auth.verifyOtp(payload);

      if (error) {
        console.error("Email confirmation error:", error.message);
        setStatus("error");
        return;
      }

      console.log("verifyOtp success, data:", verifyData);

      // После verifyOtp сессия должна быть установлена автоматически
      // Но иногда нужно немного подождать
      let attempts = 0;
      let session = verifyData?.session || null;
      
      // Если сессия не в ответе - пробуем получить её
      while (!session && attempts < 5) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        const { data: sessionData } = await supabase.auth.getSession();
        session = sessionData?.session || null;
        attempts++;
        
        if (session) {
          console.log("Session obtained after", attempts, "attempts");
          break;
        }
      }
      
      if (!session) {
        console.warn("No session after verifyOtp after", attempts, "attempts");
      } else {
        console.log("Session confirmed, user ID:", session.user.id);
      }

      // после успешного подтверждения - получаем пользователя и синхронизируем профиль
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("Error getting user after verifyOtp:", userError);
          setStatus("error");
          return;
        }

        if (!user) {
          console.error("No user after verifyOtp");
          setStatus("error");
          return;
        }

        console.log("User retrieved after verifyOtp:", {
          id: user.id,
          email: user.email,
          email_confirmed_at: user.email_confirmed_at,
        });

        const meta =
          (user.user_metadata as any) ??
          ((user as any).raw_user_meta_data as any) ??
          {};

        console.log("User metadata:", meta);

        const firstName =
          meta.firstName ?? meta.first_name ?? null;
        const lastName =
          meta.lastName ?? meta.last_name ?? null;
        const middleName =
          meta.middleName ?? meta.middle_name ?? null;
        const birthDate =
          meta.birthDate ?? meta.birth_date ?? null;
        const role = meta.role ?? meta.user_role ?? "director";

        console.log("Extracted data:", {
          firstName,
          lastName,
          middleName,
          birthDate,
          role,
        });

        // Формируем full_name из компонентов
        const fullName = [lastName, firstName, middleName]
          .filter(Boolean)
          .join(" ") || null;

        const profileData: Record<string, any> = {
          id: user.id,
          email: user.email || "",
          email_verified: true,
          role: role,
          updated_at: new Date().toISOString(),
        };

        // Добавляем поля только если они есть
        if (firstName) profileData.first_name = firstName.trim();
        if (lastName) profileData.last_name = lastName.trim();
        if (middleName) profileData.middle_name = middleName.trim();
        if (birthDate) profileData.birth_date = birthDate;
        if (fullName) profileData.full_name = fullName;

        console.log("Profile data to upsert:", profileData);

        // Используем API route для обновления профиля (обходит RLS через service role)
        try {
          const response = await fetch("/api/profile/update-after-confirm", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: user.id,
              profileData: profileData,
            }),
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
            console.error("API route error:", result.error);
            // Пробуем напрямую через Supabase как fallback
            const { data: finalSession } = await supabase.auth.getSession();
            
            if (finalSession?.session) {
              const { data: upsertData, error: upsertError } = await supabase
                .from("profiles")
                .upsert(profileData, { onConflict: "id" })
                .select();

              if (upsertError) {
                console.error("Fallback upsert also failed:", upsertError);
              } else {
                console.log("Profile updated via fallback method:", upsertData);
              }
            }
          } else {
            console.log("Profile successfully updated via API route:", result.profile);
            
            // Уведомляем страницу регистрации через localStorage
            try {
              window.localStorage.setItem("wellify_email_confirmed", "true");
              window.dispatchEvent(new StorageEvent("storage", {
                key: "wellify_email_confirmed",
                newValue: "true",
                storageArea: localStorage,
              }));
              window.dispatchEvent(new CustomEvent("emailConfirmed"));
            } catch (e) {
              console.warn("Cannot set localStorage:", e);
            }
          }
        } catch (apiError) {
          console.error("Error calling API route:", apiError);
          
          // Fallback: пробуем напрямую через Supabase
          const { data: finalSession } = await supabase.auth.getSession();
          
          if (finalSession?.session) {
            const { data: upsertData, error: upsertError } = await supabase
              .from("profiles")
              .upsert(profileData, { onConflict: "id" })
              .select();

            if (upsertError) {
              console.error("Fallback upsert failed:", upsertError);
            } else {
              console.log("Profile updated via fallback:", upsertData);
              
              // Уведомляем страницу регистрации через localStorage
              try {
                window.localStorage.setItem("wellify_email_confirmed", "true");
                window.dispatchEvent(new StorageEvent("storage", {
                  key: "wellify_email_confirmed",
                  newValue: "true",
                  storageArea: localStorage,
                }));
                window.dispatchEvent(new CustomEvent("emailConfirmed"));
              } catch (e) {
                console.warn("Cannot set localStorage:", e);
              }
            }
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
