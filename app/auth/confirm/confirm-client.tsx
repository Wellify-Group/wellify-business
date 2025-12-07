"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

type Status = "loading" | "success" | "error";

export default function ConfirmEmailClient() {
  const [status, setStatus] = useState<Status>("loading");
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      setStatus("error");
      return;
    }

    const supabase = createBrowserSupabaseClient();

    const confirm = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error(error);
        setStatus("error");
        return;
      }

      setStatus("success");

      // Bug 5 Fix: Проверяем роль пользователя перед редиректом
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Получаем роль из профиля или metadata
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        const role = profile?.role || user.user_metadata?.role || 'director';

        // Через 2 секунды отправляем пользователя на соответствующий дашборд
        setTimeout(() => {
          if (role === 'manager') {
            router.push("/dashboard/manager");
          } else if (role === 'employee') {
            router.push("/dashboard/employee");
          } else {
            router.push("/dashboard/director");
          }
        }, 2000);
      } else {
        // Если пользователь не найден, редиректим на логин
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    };

    confirm();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--color-background,#050B13)]">
      <Card className="w-full max-w-md p-8 bg-card border border-border rounded-[24px] shadow-[0_18px_45px_rgba(0,0,0,0.65)] text-center">
        {status === "loading" && (
          <div className="space-y-4">
            <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin" />
            <h1 className="text-xl font-semibold text-foreground">
              Подтверждаем ваш e-mail...
            </h1>
            <p className="text-sm text-muted-foreground">
              Пожалуйста, подождите несколько секунд.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600 dark:text-green-400" />
            <h1 className="text-xl font-semibold text-foreground">
              E-mail подтвержден
            </h1>
            <p className="text-sm text-muted-foreground">
              Мы сохранили ваш аккаунт и перенаправляем вас в кабинет WELLIFY business.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <XCircle className="mx-auto h-12 w-12 text-red-600 dark:text-red-400" />
            <h1 className="text-xl font-semibold text-foreground">
              Не удалось подтвердить e-mail
            </h1>
            <p className="text-sm text-muted-foreground">
              Ссылка устарела или недействительна. Попробуйте ещё раз пройти регистрацию
              или запросите новое письмо.
            </p>
            <div className="pt-4">
              <Link
                href="/login"
                className="inline-block h-10 px-6 rounded-[20px] bg-primary text-sm font-semibold text-white transition-all border border-black/15 dark:border-white/10 shadow-md shadow-black/10 dark:shadow-black/40 shadow-[inset_0_0_8px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_0_8px_rgba(255,255,255,0.04)] hover:opacity-90 flex items-center justify-center"
              >
                Перейти на страницу входа
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

