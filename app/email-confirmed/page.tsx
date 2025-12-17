"use client";

import { CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

function EmailConfirmedContent() {
  const { t, setLanguage } = useLanguage();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Устанавливаем украинский язык для этой страницы
  useEffect(() => {
    setLanguage('ua');
  }, [setLanguage]);

  // Обмениваем code на сессию (если он есть) и синхронизируем профиль
  useEffect(() => {
    const run = async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        const code = searchParams.get("code");
        const tokenHash = searchParams.get("token_hash");
        const type = searchParams.get("type"); // signup | magiclink | recovery | invite | email_change

        // 1) Если Supabase прислал token_hash + type (классический email link), подтверждаем через verifyOtp
        if (tokenHash && type) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as any,
          });

          if (verifyError) {
            console.error("[email-confirmed] verifyOtp error", verifyError);
            setError("Не удалось подтвердить e-mail. Ссылка могла устареть или уже была использована.");
            return;
          }
        } else if (code) {
          // 2) Если пришёл code (PKCE), меняем его на сессию.
          // Важно: для PKCE нужен code_verifier, который хранится в localStorage в ТОМ ЖЕ браузере,
          // где пользователь начинал регистрацию. Если ссылку открыть в другом браузере/инкогнито — обмен не получится.
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            const msg = (exchangeError as any)?.message?.toLowerCase?.() ?? "";
            console.error("[email-confirmed] exchangeCodeForSession error", exchangeError);

            if (msg.includes("code verifier") || msg.includes("code_verifier") || msg.includes("pkce")) {
              setError(
                "Не удалось подтвердить e-mail, потому что ссылка открыта не в том же браузере/профиле, где вы начали регистрацию. " +
                  "Откройте письмо в том же браузере (не инкогнито) и перейдите по ссылке ещё раз, либо запросите новое письмо."
              );
            } else {
              setError("Не удалось подтвердить e-mail. Ссылка могла устареть или уже была использована.");
            }
            return;
          }
        } else {
          // Нет параметров подтверждения
          setError("Не удалось подтвердить e-mail: в ссылке отсутствуют параметры подтверждения.");
          return;
        }

        // 2) После этого пробуем получить пользователя
        const { data, error: getUserError } = await supabase.auth.getUser();

        if (getUserError) {
          console.error("[email-confirmed] getUser error", getUserError);
          setError("Не удалось проверить сессию");
          return;
        }

        if (!data?.user) {
          console.error("[email-confirmed] No user found");
          setError("Пользователь не найден");
          return;
        }

        // Проверяем, подтвержден ли email
        if (!data.user.email_confirmed_at) {
          console.error("[email-confirmed] Email not confirmed");
          setError("E-mail еще не подтвержден");
          return;
        }

        const normalized = data.user.email?.toLowerCase() || null;
        setEmail(normalized);

        // Синхронизируем профиль через API
        try {
          const res = await fetch("/api/auth/email-sync-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: data.user.id,
              email: normalized,
            }),
          });

          if (!res.ok) {
            console.error("[email-confirmed] Failed to sync profile");
          }
        } catch (syncError) {
          console.error("[email-confirmed] Error syncing profile", syncError);
        }

        // Помечаем верификацию в localStorage
        if (typeof window !== "undefined" && normalized) {
          localStorage.setItem("wellify_email_confirmed", "true");
          localStorage.setItem("wellify_email_confirmed_for", normalized);
        }
      } catch (e) {
        console.error("[email-confirmed] Unexpected error", e);
        setError("Произошла ошибка при подтверждении e-mail");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [searchParams]);

  const handleClose = () => {
    if (window.opener) {
      window.close();
      return;
    }
    window.close();
  };

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

            {loading ? (
              <>
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
                    onClick={handleClose}
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
                    Закрыть
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1 
                  className="text-[22px] leading-[1.3] font-bold"
                  style={{
                    color: 'var(--email-confirmed-text)',
                    margin: '0 0 16px 0',
                  }}
                >
                  {t<string>("email_confirmed_title")}
                </h1>

                <p 
                  className="text-sm leading-[1.6] max-w-sm"
                  style={{
                    color: 'var(--email-confirmed-muted)',
                    margin: '0 0 8px 0',
                  }}
                >
                  {t<string>("email_confirmed_message")}
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

                <div className="pt-6 pb-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className={cn(
                      "inline-block rounded-full px-7 py-3 text-sm font-semibold transition-colors",
                      // Используем CSS-переменные для адаптивности:
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                      "hover:opacity-80" // Добавляем простой hover эффект
                    )}
                    style={{
                      backgroundColor: 'var(--email-confirmed-primary)',
                      color: 'var(--email-confirmed-primary-foreground)',
                    }}
                  >
                    {t<string>("email_confirmed_close_button")}
                  </button>
                </div>
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