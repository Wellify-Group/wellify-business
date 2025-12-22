"use client";

import { useEffect, useState, Suspense } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

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
  const [canClose, setCanClose] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        // Статус определяется из URL параметра status, который устанавливает /api/auth/confirm-email
        const statusParam = searchParams?.get("status");
        
        if (statusParam === "success") {
          // Успешное подтверждение
          setStatus("success");
          
          // Проверяем, что email действительно подтвержден через getUser
          const supabase = createBrowserSupabaseClient();
          const { data: userData } = await supabase.auth.getUser();
          
          if (!userData?.user?.email_confirmed_at) {
            // Если email не подтвержден, но статус success - это странно, но показываем success
            console.warn("[email-confirmed] Status is success but email_confirmed_at is not set");
          }
          
          return;
        }
        
        if (statusParam === "already_confirmed") {
          setStatus("already_confirmed");
          
          // Проверяем, что email действительно подтвержден
          const supabase = createBrowserSupabaseClient();
          const { data: userData } = await supabase.auth.getUser();
          
          if (!userData?.user?.email_confirmed_at) {
            // Если email не подтвержден, но статус already_confirmed - это странно
            console.warn("[email-confirmed] Status is already_confirmed but email_confirmed_at is not set");
          }
          
          return;
        }

        if (statusParam === "invalid" || statusParam === "expired" || statusParam === "invalid_or_expired") {
          // Проверяем, может быть email уже подтвержден на самом деле
          const supabase = createBrowserSupabaseClient();
          const { data: userData } = await supabase.auth.getUser();
          
          if (userData?.user?.email_confirmed_at) {
            // Email уже подтвержден - показываем success вместо ошибки
            console.log("[email-confirmed] ✅ Email already confirmed (link was invalid but email is confirmed)");
            setStatus("success");
            return;
          }
          
          setStatus("invalid_or_expired");
          return;
        }
        
        // Если нет статуса в URL - проверяем текущую сессию
        const supabase = createBrowserSupabaseClient();
        const { data: userData } = await supabase.auth.getUser();
        
        if (userData?.user?.email_confirmed_at) {
          // Email уже подтвержден - показываем success
          console.log("[email-confirmed] No status param but email already confirmed, showing success");
          setStatus("success");
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
    // 1) window.close()
    if (typeof window !== "undefined") {
      try {
        window.close();
        // Если window.close() не сработал, пробуем history.back()
        setTimeout(() => {
          if (window.history.length > 1) {
            window.history.back();
            // Если history.back() не сработал, показываем текст
            setTimeout(() => {
              setCanClose(false);
            }, 100);
          } else {
            setCanClose(false);
          }
        }, 100);
      } catch (e) {
        // Если window.close() бросил исключение, пробуем history.back()
        if (window.history.length > 1) {
          window.history.back();
          setTimeout(() => {
            setCanClose(false);
          }, 100);
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
            Вы уже подтверждали эту почту ранее. Вы можете войти в аккаунт, используя ваш e-mail и пароль.
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="relative w-full rounded-[24px] border border-gray-200 bg-white px-8 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.15)]">
          {/* НЕТ крестика, НЕТ закрытия в углу */}
          
          {renderContent()}
          
          {/* Кнопки действий */}
          <div className="mt-8 pt-6 border-t border-gray-200 space-y-3">
            {/* Кнопка "Войти" только для success и already_confirmed */}
            {(status === "success" || status === "already_confirmed") && (
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center h-10 px-6 rounded-xl bg-[var(--accent-primary,#3b82f6)] text-white font-medium text-sm hover:bg-[var(--accent-primary-hover,#2563eb)] transition-colors w-full"
              >
                Войти
              </Link>
            )}
            
            {/* Кнопка "Закрыть окно" - обязательная, всегда внизу */}
            <button
              onClick={handleClose}
              className="inline-flex items-center justify-center h-10 px-6 rounded-xl border border-gray-300 bg-gray-50 text-gray-700 font-medium text-sm hover:bg-gray-100 transition-colors w-full"
            >
              Закрыть окно
            </button>
            
            {/* Текст если не удалось закрыть */}
            {!canClose && (
              <p className="mt-3 text-xs text-gray-500">
                Вы можете просто закрыть эту вкладку браузера
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EmailConfirmedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
          <div className="w-full max-w-md">
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
        </div>
      }
    >
      <EmailConfirmedContent />
    </Suspense>
  );
}
