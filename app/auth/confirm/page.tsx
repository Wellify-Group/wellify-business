"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import CenteredLayout from "@/components/CenteredLayout";

function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const confirmEmail = async () => {
      const code = searchParams.get("code");
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (error || !code) {
        setStatus("error");
        setErrorMessage(
          errorDescription || "Ссылка устарела или недействительна"
        );
        return;
      }

      try {
        const supabase = createBrowserSupabaseClient();

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

        setStatus("success");
      } catch (err: any) {
        console.error("Unexpected email confirmation error", err);
        setStatus("error");
        setErrorMessage("Произошла ошибка при подтверждении e-mail");
      }
    };

    confirmEmail();
  }, [searchParams]);

  if (status === "loading") {
    return (
      <Card className="w-full max-w-md bg-slate-950/80 border border-slate-800/80 shadow-[0_18px_60px_rgba(0,0,0,0.7)] rounded-3xl backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Подтверждение e-mail</CardTitle>
          <CardDescription className="text-center text-slate-400">
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
      <Card className="w-full max-w-md bg-slate-950/80 border border-slate-800/80 shadow-[0_18px_60px_rgba(0,0,0,0.7)] rounded-3xl backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Ошибка подтверждения</CardTitle>
          <CardDescription className="text-center text-slate-400">
            Не удалось подтвердить e-mail
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-900/10 border border-red-900/40 rounded-xl px-3 py-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMessage || "Ссылка устарела или недействительна"}</span>
          </div>
          <p className="text-xs text-slate-500 text-center">
            Не удалось подтвердить e-mail. Ссылка могла устареть. Попробуйте запросить новое письмо из формы регистрации.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (status === "success") {
    return (
      <Card className="w-full max-w-md bg-slate-950/80 border border-slate-800/80 shadow-[0_18px_60px_rgba(0,0,0,0.7)] rounded-3xl backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">E-mail подтверждён</CardTitle>
          <CardDescription className="text-center text-slate-400">
            Ваш адрес e-mail успешно подтверждён
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 py-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            <p className="text-sm text-slate-300 text-center">
              Ваш адрес e-mail успешно подтверждён. Это окно можно закрыть и вернуться к регистрации WELLIFY business.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

export default function ConfirmEmailPage() {
  return (
    <CenteredLayout>
      <div className="w-full max-w-md">
        <Suspense
          fallback={
            <Card className="w-full max-w-md bg-slate-950/80 border border-slate-800/80 shadow-[0_18px_60px_rgba(0,0,0,0.7)] rounded-3xl backdrop-blur-xl">
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
      </div>
    </CenteredLayout>
  );
}
