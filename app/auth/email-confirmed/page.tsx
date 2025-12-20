"use client";

import { useEffect, useState, Suspense } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

type ConfirmationStatus = 
  | "loading"
  | "success"
  | "already_confirmed"
  | "invalid_or_expired"
  | "error";

function EmailConfirmedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<ConfirmationStatus>("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [canClose, setCanClose] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        // Если есть параметры code/token в URL, но нет статуса,
        // редиректим на /auth/confirm для обработки
        const codeParam = searchParams?.get("code");
        const tokenParam = searchParams?.get("token");
        const tokenHashParam = searchParams?.get("token_hash");
        
        if (codeParam || tokenParam || tokenHashParam) {
          console.log("[email-confirmed] Found confirmation params in URL, redirecting to /auth/confirm");
          const confirmUrl = new URL("/auth/confirm", window.location.origin);
          if (codeParam) confirmUrl.searchParams.set("code", codeParam);
          if (tokenParam) confirmUrl.searchParams.set("token", tokenParam);
          if (tokenHashParam) confirmUrl.searchParams.set("token_hash", tokenHashParam);
          const typeParam = searchParams?.get("type");
          if (typeParam) confirmUrl.searchParams.set("type", typeParam);
          window.location.href = confirmUrl.toString();
          return;
        }
        
        // КРИТИЧНО: Статус определяется ТОЛЬКО из URL параметра status,
        // который устанавливает /auth/confirm после успешной обработки токена
        const statusParam = searchParams?.get("status");
        
        if (statusParam === "success") {
          // Успешное подтверждение - пользователь перешел по ссылке из письма
          // Получаем данные пользователя и проверяем финальный статус
          const supabase = createBrowserSupabaseClient();
          const { data } = await supabase.auth.getUser();
          
          // Проверяем, что email действительно подтвержден в Supabase Auth
          if (data.user?.email_confirmed_at && data.user?.id && data.user?.email) {
            console.log("[email-confirmed] Email confirmed in auth, syncing profile");
            setStatus("success");
            setEmail(data.user.email);
            
            // ВАЖНО: Синхронизируем профиль ТОЛЬКО если email_confirmed_at установлен
            // Это установит email_verified = true в таблице profiles
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
              } else {
                console.log("[email-confirmed] Profile synced successfully, email_verified should be true now");
              }
            } catch (syncError) {
              console.error("[email-confirmed] Error syncing profile", syncError);
            }
            
            if (typeof window !== "undefined") {
              localStorage.setItem("wellify_email_confirmed", "true");
            }
            return;
          } else {
            // Если статус success, но email_confirmed_at еще не установлен
            // Это может произойти, если exchangeCodeForSession еще обрабатывается
            // Показываем loading и ждем с retry
            console.log("[email-confirmed] Status is success but email_confirmed_at not set yet, retrying...");
            setStatus("loading");
            
            // Retry с интервалом 500ms до 10 раз (максимум 5 секунд)
            let retryCount = 0;
            const maxRetries = 10;
            const retryInterval = 500;
            
            const checkConfirmation = async () => {
              const retrySupabase = createBrowserSupabaseClient();
              const { data: retryData } = await retrySupabase.auth.getUser();
              
              if (retryData.user?.email_confirmed_at && retryData.user?.id && retryData.user?.email) {
                console.log("[email-confirmed] Email confirmed on retry, syncing profile");
                setStatus("success");
                setEmail(retryData.user.email);
                
                // Синхронизируем профиль
                try {
                  const res = await fetch("/api/auth/email-sync-profile", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      userId: retryData.user.id,
                      email: retryData.user.email,
                    }),
                  });
                  if (!res.ok) {
                    console.error("[email-confirmed] Failed to sync profile");
                  } else {
                    console.log("[email-confirmed] Profile synced successfully");
                  }
                } catch (syncError) {
                  console.error("[email-confirmed] Error syncing profile", syncError);
                }
                
                if (typeof window !== "undefined") {
                  localStorage.setItem("wellify_email_confirmed", "true");
                }
              } else if (retryCount < maxRetries) {
                retryCount++;
                setTimeout(checkConfirmation, retryInterval);
              } else {
                console.error("[email-confirmed] Email not confirmed after retries, showing error");
                setStatus("error");
              }
            };
            
            // Первая попытка через 500ms
            setTimeout(checkConfirmation, retryInterval);
            return;
          }
        }
        
        if (statusParam === "already_confirmed") {
          setStatus("already_confirmed");
          const supabase = createBrowserSupabaseClient();
          const { data } = await supabase.auth.getUser();
          if (data.user?.email) {
            setEmail(data.user.email);
          }
          return;
        }

        if (statusParam === "invalid_or_expired") {
          // Проверяем, может быть email уже подтвержден на самом деле
          // (Supabase обработал токен, но редиректит с ошибкой)
          const supabase = createBrowserSupabaseClient();
          const { data } = await supabase.auth.getUser();
          
          if (data.user?.email_confirmed_at && data.user?.id) {
            // Email уже подтвержден и сессия активна - показываем success вместо ошибки
            console.log("[email-confirmed] Email already confirmed and session active, showing success");
            
            setStatus("success");
            if (data.user?.email) {
              setEmail(data.user.email);
            }
            
            // Синхронизируем профиль
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
            
            if (typeof window !== "undefined") {
              localStorage.setItem("wellify_email_confirmed", "true");
            }
            return;
          }
          
          setStatus("invalid_or_expired");
          return;
        }
        
        // Если нет статуса в URL - проверяем текущую сессию
        // Может быть, пользователь уже подтвержден и попал сюда напрямую
        const supabase = createBrowserSupabaseClient();
        const { data } = await supabase.auth.getUser();
        
        if (data.user?.email_confirmed_at && data.user?.id) {
          // Email уже подтвержден - показываем success
          console.log("[email-confirmed] No status param but email already confirmed, showing success");
          setStatus("success");
          if (data.user?.email) {
            setEmail(data.user.email);
          }
          
          // Синхронизируем профиль
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
          
          if (typeof window !== "undefined") {
            localStorage.setItem("wellify_email_confirmed", "true");
          }
          return;
        }
        
        // Если нет статуса и email не подтвержден - это невалидная ситуация
        setStatus("invalid_or_expired");
      } catch (err) {
        console.error("[email-confirmed] Error:", err);
        setStatus("error");
      }
    };

    run();
  }, [searchParams]);

  const handleClose = () => {
    // Пытаемся закрыть окно через window.close()
    if (typeof window !== "undefined") {
      try {
        window.close();
        // Если window.close() не сработал, пробуем history.back()
        setTimeout(() => {
          if (window.history.length > 1) {
            window.history.back();
          } else {
            setCanClose(false);
          }
        }, 100);
      } catch (e) {
        // Если window.close() бросил исключение, пробуем history.back()
        if (window.history.length > 1) {
          window.history.back();
        } else {
          setCanClose(false);
        }
      }
    }
  };

  const renderContent = () => {
    if (status === "loading") {
      return (
        <>
          <div className="flex justify-center mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
              <div className="h-8 w-8 border-4 border-[var(--accent-primary,#3b82f6)] border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold mb-3 text-gray-900">
            Завершаем подтверждение...
          </h1>
        </>
      );
    }

    if (status === "success") {
      return (
        <>
          <div className="flex justify-center mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold mb-3 text-gray-900">
            E-mail подтверждён
          </h1>
          <p className="text-sm mb-4 text-gray-600">
            Ваша почта успешно подтверждена. Теперь вы можете войти в систему.
          </p>
        </>
      );
    }

    if (status === "already_confirmed") {
      return (
        <>
          <div className="flex justify-center mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold mb-3 text-gray-900">
            E-mail уже подтверждён
          </h1>
          <p className="text-sm mb-4 text-gray-600">
            Вы уже подтверждали эту почту ранее.
            <br />
            Вы можете войти в аккаунт, используя ваш e-mail и пароль.
          </p>
        </>
      );
    }

    if (status === "invalid_or_expired") {
      return (
        <>
          <div className="flex justify-center mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10">
              <XCircle className="h-12 w-12 text-amber-500" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold mb-3 text-gray-900">
            Ссылка недействительна
          </h1>
          <p className="text-sm mb-4 text-gray-600">
            Ссылка подтверждения устарела или недействительна.
          </p>
        </>
      );
    }

    // error fallback
    return (
      <>
        <div className="flex justify-center mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
        </div>
        <h1 className="text-2xl font-semibold mb-3 text-gray-900">
          Произошла ошибка
        </h1>
        <p className="text-sm mb-4 text-gray-600">
          Не удалось подтвердить e-mail. Попробуйте ещё раз.
        </p>
      </>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <div className="relative w-full rounded-[24px] border border-gray-200 bg-white px-8 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.15)]">
        {renderContent()}
        
        {/* Кнопка закрытия внизу */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="inline-flex items-center justify-center h-10 px-6 rounded-xl border border-gray-300 bg-gray-50 text-gray-700 font-medium text-sm hover:bg-gray-100 transition-colors w-full"
          >
            Закрыть окно
          </button>
          {!canClose && (
            <p className="mt-3 text-xs text-gray-500">
              Вы можете просто закрыть эту вкладку браузера
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EmailConfirmedPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md mx-auto px-4">
          <div className="relative w-full rounded-[24px] border border-gray-200 bg-white px-8 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.15)]">
            <div className="flex justify-center mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                <div className="h-8 w-8 border-4 border-[var(--accent-primary,#3b82f6)] border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold mb-3 text-gray-900">
              Загрузка...
            </h1>
          </div>
        </div>
      }
    >
      <EmailConfirmedContent />
    </Suspense>
  );
}
