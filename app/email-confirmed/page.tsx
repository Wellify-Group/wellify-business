"use client";

import { CheckCircle2, AlertCircle } from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

function EmailConfirmedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Подтверждение email через token_hash + verifyOtp (без PKCE)
  useEffect(() => {
    const run = async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        const tokenHash = searchParams.get("token_hash");
        const type = searchParams.get("type"); // signup | magiclink | recovery | invite | email_change

        if (!tokenHash || !type) {
          setError("Не удалось подтвердить e-mail: в ссылке отсутствуют параметры подтверждения.");
          setLoading(false);
          return;
        }

        // Подтверждаем через verifyOtp (работает в любом браузере, не требует PKCE)
        const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as any,
        });

        if (verifyError) {
          console.error("[email-confirmed] verifyOtp error", verifyError);
          
          // Определяем тип ошибки для более понятного сообщения
          const errorMessage = verifyError.message?.toLowerCase() || "";
          if (errorMessage.includes("expired") || errorMessage.includes("устарел")) {
            setError("Ссылка для подтверждения устарела. Пожалуйста, запросите новое письмо.");
          } else if (errorMessage.includes("invalid") || errorMessage.includes("неверн")) {
            setError("Неверная ссылка для подтверждения. Пожалуйста, используйте ссылку из последнего письма.");
          } else {
            setError("Не удалось подтвердить e-mail. Ссылка могла устареть или уже была использована.");
          }
          setLoading(false);
          return;
        }

        // После успешного verifyOtp получаем пользователя
        const { data: userData, error: getUserError } = await supabase.auth.getUser();

        if (getUserError) {
          console.error("[email-confirmed] getUser error", getUserError);
          setError("Не удалось проверить сессию после подтверждения.");
          setLoading(false);
          return;
        }

        if (!userData?.user) {
          console.error("[email-confirmed] No user found");
          setError("Пользователь не найден после подтверждения.");
          setLoading(false);
          return;
        }

        // Проверяем, что email действительно подтвержден
        if (!userData.user.email_confirmed_at) {
          console.error("[email-confirmed] Email not confirmed after verifyOtp");
          setError("E-mail не был подтвержден. Попробуйте ещё раз.");
          setLoading(false);
          return;
        }

        const normalized = userData.user.email?.toLowerCase() || null;
        setEmail(normalized);

        // Синхронизируем профиль через API (ставит email_verified=true в profiles)
        try {
          const res = await fetch("/api/auth/email-sync-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: userData.user.id,
              email: normalized,
            }),
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            console.error("[email-confirmed] Failed to sync profile", errorData);
            // Не показываем ошибку пользователю, т.к. email уже подтвержден в Auth
          }
        } catch (syncError) {
          console.error("[email-confirmed] Error syncing profile", syncError);
          // Не показываем ошибку пользователю, т.к. email уже подтвержден в Auth
        }

        // Помечаем верификацию в localStorage
        if (typeof window !== "undefined" && normalized) {
          localStorage.setItem("wellify_email_confirmed", "true");
          localStorage.setItem("wellify_email_confirmed_for", normalized);
          localStorage.setItem("wellify_registration_userId", userData.user.id);
        }

        // Перенаправляем на страницу регистрации, шаг 3 (или другую логику)
        // Используем setTimeout чтобы пользователь увидел сообщение об успехе
        setTimeout(() => {
          router.push("/auth/register?step=3");
        }, 2000);
      } catch (e) {
        console.error("[email-confirmed] Unexpected error", e);
        setError("Произошла ошибка при подтверждении e-mail");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [searchParams, router]);

  return (
    <div className="flex h-full w-full items-center justify-center px-4 py-8">
      <div className="relative w-full max-w-[480px]">
        <div 
          className="relative overflow-hidden rounded-[32px] border px-6 py-5 shadow-xl sm:px-8 sm:py-6"
          style={{
            backgroundColor: 'var(--email-confirmed-card-bg)',
            borderColor: 'var(--email-confirmed-border)',
          }}
        >
          <div className="flex flex-col items-center space-y-4 text-center">
            {/* Brand text */}
            <div 
              className="text-[11px] tracking-[0.16em] uppercase"
              style={{
                color: 'var(--email-confirmed-muted)',
              }}
            >
              <span>WELLIFY <strong style={{ color: 'var(--email-confirmed-text)', fontWeight: 600 }}>BUSINESS</strong></span>
            </div>

            {loading ? (
              <>
                <div 
                  className="flex h-16 w-16 items-center justify-center rounded-full animate-spin"
                  style={{
                    backgroundColor: 'var(--email-confirmed-success-bg)',
                  }}
                >
                  <div className="h-8 w-8 border-4 border-t-transparent rounded-full" style={{ borderColor: 'var(--email-confirmed-success-text)' }} />
                </div>
                <h1 
                  className="text-[22px] leading-[1.3] font-bold"
                  style={{
                    color: 'var(--email-confirmed-text)',
                    margin: '0 0 16px 0',
                  }}
                >
                  Подтверждаем e-mail...
                </h1>
                <p 
                  className="text-sm leading-[1.6] max-w-sm"
                  style={{
                    color: 'var(--email-confirmed-muted)',
                    margin: '0 0 8px 0',
                  }}
                >
                  Пожалуйста, подождите...
                </p>
              </>
            ) : error ? (
              <>
                <div 
                  className="flex h-16 w-16 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                  }}
                >
                  <AlertCircle 
                    className="h-10 w-10"
                    style={{
                      color: '#DC2626',
                    }}
                  />
                </div>
                <h1 
                  className="text-[22px] leading-[1.3] font-bold"
                  style={{
                    color: '#DC2626',
                    margin: '0 0 16px 0',
                  }}
                >
                  Ошибка подтверждения
                </h1>
                <p 
                  className="text-sm leading-[1.6] max-w-sm"
                  style={{
                    color: 'var(--email-confirmed-muted)',
                    margin: '0 0 8px 0',
                  }}
                >
                  {error}
                </p>
                <div className="pt-6 pb-4">
                  <button
                    type="button"
                    onClick={() => router.push("/auth/register")}
                    className={cn(
                      "inline-block rounded-full px-7 py-3 text-sm font-semibold transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                      "hover:opacity-80"
                    )}
                    style={{
                      backgroundColor: 'var(--email-confirmed-primary)',
                      color: 'var(--email-confirmed-primary-foreground)',
                    }}
                  >
                    Вернуться к регистрации
                  </button>
                </div>
              </>
            ) : (
              <>
                <div 
                  className="flex h-16 w-16 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: 'var(--email-confirmed-success-bg)',
                  }}
                >
                  <CheckCircle2 
                    className="h-10 w-10"
                    style={{
                      color: 'var(--email-confirmed-success-text)',
                    }}
                  />
                </div>

                <h1 
                  className="text-[22px] leading-[1.3] font-bold"
                  style={{
                    color: 'var(--email-confirmed-text)',
                    margin: '0 0 16px 0',
                  }}
                >
                  E-mail подтверждён
                </h1>

                <p 
                  className="text-sm leading-[1.6] max-w-sm"
                  style={{
                    color: 'var(--email-confirmed-muted)',
                    margin: '0 0 8px 0',
                  }}
                >
                  Ваша почта успешно подтверждена. Перенаправляем вас на страницу регистрации...
                </p>

                {email && (
                  <p 
                    className="text-xs mt-2"
                    style={{
                      color: 'var(--email-confirmed-muted)',
                    }}
                  >
                    E-mail: <span className="font-mono">{email}</span>
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EmailConfirmedPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full w-full items-center justify-center px-4 py-8">
        <div className="relative w-full max-w-[480px]">
          <div 
            className="relative overflow-hidden rounded-[32px] border px-6 py-5 shadow-xl sm:px-8 sm:py-6"
            style={{
              backgroundColor: 'var(--email-confirmed-card-bg)',
              borderColor: 'var(--email-confirmed-border)',
            }}
          >
            <div className="flex flex-col items-center space-y-4 text-center">
              <div 
                className="text-[11px] tracking-[0.16em] uppercase"
                style={{
                  color: 'var(--email-confirmed-muted)',
                }}
              >
                <span>WELLIFY <strong style={{ color: 'var(--email-confirmed-text)', fontWeight: 600 }}>BUSINESS</strong></span>
              </div>
              <h1 
                className="text-[22px] leading-[1.3] font-bold"
                style={{
                  color: 'var(--email-confirmed-text)',
                  margin: '0 0 16px 0',
                }}
              >
                Загрузка...
              </h1>
            </div>
          </div>
        </div>
      </div>
    }>
      <EmailConfirmedContent />
    </Suspense>
  );
}
