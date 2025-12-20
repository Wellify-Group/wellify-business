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
        // Проверяем hash фрагмент на наличие ошибок от Supabase
        if (typeof window !== "undefined" && window.location.hash) {
          const hash = window.location.hash;
          console.log("[email-confirmed] Hash fragment:", hash);
          // Если в hash есть ошибка (например, #error=access_denied&error_code=otp_expired)
          if (hash.includes("error=") || hash.includes("error_code=")) {
            // Проверяем тип ошибки
            const hashParams = new URLSearchParams(hash.substring(1));
            const errorCode = hashParams.get("error_code");
            const error = hashParams.get("error");
            
            console.log("[email-confirmed] Error from hash:", { error, errorCode });
            
            // Если это ошибка истекшего токена или невалидной ссылки
            if (errorCode === "otp_expired" || errorCode === "token_expired" || error === "access_denied") {
              console.log("[email-confirmed] Setting status to invalid_or_expired from hash");
              setStatus("invalid_or_expired");
              // Очищаем hash после обработки
              window.history.replaceState(null, "", window.location.pathname + window.location.search);
              return;
            }
            
            // Очищаем hash после обработки
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
          }
        }
        
        console.log("[email-confirmed] Status param:", searchParams?.get("status"));
        console.log("[email-confirmed] All search params:", Object.fromEntries(searchParams?.entries() || []));
        console.log("[email-confirmed] Full URL:", typeof window !== "undefined" ? window.location.href : "N/A");
        
        const supabase = createBrowserSupabaseClient();
        const { data, error } = await supabase.auth.getUser();
        
        console.log("[email-confirmed] getUser result:", { hasUser: !!data.user, hasError: !!error, errorMessage: error?.message });
        
        // Проверяем наличие статуса в URL параметрах
        const statusParam = searchParams?.get("status");
        
        if (statusParam === "already_confirmed") {
          setStatus("already_confirmed");
          if (data.user?.email) {
            setEmail(data.user.email);
          }
          return;
        }

        if (statusParam === "invalid_or_expired") {
          console.log("[email-confirmed] Status invalid_or_expired from URL param");
          setStatus("invalid_or_expired");
          return;
        }
        
        // Если есть параметры code или token в URL, но статус не установлен,
        // это значит, что ссылка пришла напрямую, минуя /auth/confirm
        // Пытаемся обработать здесь
        const codeParam = searchParams?.get("code");
        const tokenParam = searchParams?.get("token");
        const tokenHashParam = searchParams?.get("token_hash");
        const typeParam = searchParams?.get("type");
        
        if (codeParam || tokenParam || tokenHashParam) {
          console.log("[email-confirmed] Found confirmation params in URL, but status not set. Redirecting to /auth/confirm");
          // Редиректим на /auth/confirm для обработки
          router.push(`/auth/confirm?${new URLSearchParams(searchParams?.toString() || "").toString()}`);
          return;
        }
        
        if (!data.user) {
          // Если пользователь не найден, возможно, ссылка невалидна
          console.log("[email-confirmed] No user found, setting invalid_or_expired");
          setStatus("invalid_or_expired");
          return;
        }

        setEmail(data.user.email ?? null);

        // Автоматическая синхронизация профиля после подтверждения email
        if (data.user.id && data.user.email && data.user.email_confirmed_at) {
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

        // Проверяем, подтвержден ли email
        if (data.user.email_confirmed_at) {
          setStatus("success");
          if (typeof window !== "undefined") {
            localStorage.setItem("wellify_email_confirmed", "true");
          }
        } else {
          setStatus("error");
        }
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
