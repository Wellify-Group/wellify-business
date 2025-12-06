"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2 } from "lucide-react";

function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const confirmEmail = async () => {
      const code = searchParams.get("code");
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      // Если есть ошибка в query параметрах
      if (error || !code) {
        setStatus("error");
        setErrorMessage(
          errorDescription || "Ссылка устарела или недействительна"
        );
        return;
      }

      try {
        const supabase = createBrowserSupabaseClient();

        // Обмениваем код на сессию
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error("Email confirm error:", exchangeError);
          setStatus("error");
          setErrorMessage("Ссылка устарела или недействительна");
          return;
        }

        if (!data.session || !data.user) {
          setStatus("error");
          setErrorMessage("Не удалось создать сессию");
          return;
        }

        const user = data.user;

        // Создаём или обновляем профиль
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert(
            {
              id: user.id,
              email: user.email,
            },
            {
              onConflict: "id",
            }
          );

        if (profileError) {
          console.error("Profile update error:", profileError);
          // Не блокируем успех, если профиль уже существует
        }

        // Успешно - перенаправляем на дашборд
        setStatus("success");
        router.replace("/dashboard/director");
      } catch (err: any) {
        console.error("Unexpected email confirmation error", err);
        setStatus("error");
        setErrorMessage("Произошла ошибка при подтверждении e-mail");
      }
    };

    confirmEmail();
  }, [searchParams, router]);

  if (status === "loading") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Подтверждение e-mail</CardTitle>
          <CardDescription className="text-center">
            Подождите, мы подтверждаем ваш e-mail...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === "error") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Ошибка подтверждения</CardTitle>
          <CardDescription className="text-center">
            Не удалось подтвердить e-mail
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-destructive bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg p-3">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMessage || "Ссылка устарела или недействительна"}</span>
          </div>
          <Button
            onClick={() => router.push("/auth/login")}
            className="w-full"
          >
            Перейти на страницу входа
          </Button>
        </CardContent>
      </Card>
    );
  }

  // status === "success" - но мы уже делаем редирект, так что этот блок не должен отображаться
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl text-center">E-mail подтверждён</CardTitle>
        <CardDescription className="text-center">
          Перенаправление на дашборд...
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center py-8">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ConfirmEmailPage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: "var(--color-background, #050B13)" }}
    >
      <Suspense
        fallback={
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Загрузка...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            </CardContent>
          </Card>
        }
      >
        <ConfirmEmailContent />
      </Suspense>
    </main>
  );
}
