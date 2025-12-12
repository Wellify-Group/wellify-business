"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function EmailConfirmedPage() {
  const router = useRouter();
  const [supabase] = useState(() => createBrowserSupabaseClient());
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.auth.getUser();

        if (error || !data?.user) {
          setError(
            "E-mail подтвержден. Вы можете вернуться на страницу регистрации и продолжить."
          );
          return;
        }

        const userEmail = data.user.email?.toLowerCase() ?? null;
        setEmail(userEmail);

        if (typeof window !== "undefined" && userEmail) {
          localStorage.setItem("wellify_email_confirmed", "true");
          localStorage.setItem("wellify_email_confirmed_for", userEmail);
        }
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [supabase]);

  const handleBackToRegister = () => {
    router.push("/register");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020617] px-4">
      <Card className="w-full max-w-lg border border-white/8 bg-[radial-gradient(circle_at_top,_rgba(46,106,255,0.16),_transparent_55%),_rgba(10,15,25,0.96)] shadow-[0_20px_80px_rgba(0,0,0,0.85)] backdrop-blur-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-center text-2xl font-semibold text-zinc-50">
            Подтверждение e-mail
          </CardTitle>
          <CardDescription className="text-center text-sm text-zinc-400">
            Ваш e-mail успешно подтвержден. Теперь вы можете вернуться к регистрации
            директора в WELLIFY business.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col items-center gap-4">
            <CheckCircle2 className="h-16 w-16 text-emerald-500" />

            {loading && (
              <p className="text-sm text-zinc-400">
                Проверяем статус вашей учетной записи...
              </p>
            )}

            {!loading && !error && (
              <p className="text-sm text-zinc-300 text-center">
                {email
                  ? `Адрес ${email} подтвержден.`
                  : "E-mail подтвержден."}{" "}
                Вернитесь на вкладку с регистрацией и продолжите оформление аккаунта
                директора.
              </p>
            )}

            {!loading && error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}

            <Button
              type="button"
              size="lg"
              className="mt-2 w-full md:w-auto"
              onClick={handleBackToRegister}
            >
              Вернуться к регистрации
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
