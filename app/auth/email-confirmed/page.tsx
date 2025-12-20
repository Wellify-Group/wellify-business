"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { CheckCircle2 } from "lucide-react";

export default function EmailConfirmedPage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data } = await supabase.auth.getUser();
        
        if (!data.user) {
          setLoading(false);
          return;
        }

        setEmail(data.user.email ?? null);

        // Автоматическая синхронизация профиля после подтверждения email
        if (data.user.id && data.user.email) {
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

        if (typeof window !== "undefined") {
          localStorage.setItem("wellify_email_confirmed", "true");
        }
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div 
        className="max-w-md w-full rounded-2xl border px-8 py-10 text-center shadow-lg"
        style={{
          backgroundColor: 'var(--email-confirmed-card-bg)',
          borderColor: 'var(--email-confirmed-border)',
        }}
      >
        <div className="flex justify-center mb-4">
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
        </div>

        <h1 
          className="text-xl font-semibold mb-3"
          style={{
            color: 'var(--email-confirmed-text)',
          }}
        >
          E-mail подтверждён
        </h1>

        {loading ? (
          <p 
            className="text-sm"
            style={{
              color: 'var(--email-confirmed-muted)',
            }}
          >
            Завершаем подтверждение...
          </p>
        ) : (
          <>
            <p 
              className="text-sm mb-4"
              style={{
                color: 'var(--email-confirmed-muted)',
              }}
            >
              Ваша почта успешно подтверждена.
            </p>
            {email && (
              <p 
                className="mb-6 text-xs"
                style={{
                  color: 'var(--email-confirmed-muted)',
                }}
              >
                {email}
              </p>
            )}
            <div className="mt-6 flex justify-center gap-3">
              <a 
                href="/auth/login" 
                className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                style={{
                  color: 'var(--email-confirmed-primary)',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Войти
              </a>
              <a 
                href="/register" 
                className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                style={{
                  color: 'var(--email-confirmed-primary)',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Регистрация
              </a>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
