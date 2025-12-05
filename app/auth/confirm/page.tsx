"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function ConfirmEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // Получаем параметры из URL
        const code = searchParams.get("code");
        const next = searchParams.get("next") || "/dashboard/director";

        if (!code) {
          setStatus("error");
          setErrorMessage("Отсутствует код подтверждения. Проверьте ссылку из письма.");
          return;
        }

        // Обмениваем код на сессию
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error("Error exchanging code for session:", error);
          setStatus("error");
          
          let message = "Не удалось подтвердить email. Попробуйте позже.";
          if (error.message?.includes("expired") || error.message?.includes("invalid")) {
            message = "Ссылка подтверждения устарела или недействительна. Запросите новую ссылку.";
          } else if (error.message) {
            message = error.message;
          }
          
          setErrorMessage(message);
          return;
        }

        if (!data.session || !data.user) {
          setStatus("error");
          setErrorMessage("Не удалось создать сессию. Попробуйте войти вручную.");
          return;
        }

        // Успешное подтверждение
        setStatus("success");

        // Редирект через 2-3 секунды
        setTimeout(() => {
          router.push(next);
        }, 2500);
      } catch (err: any) {
        console.error("Unexpected error during email confirmation:", err);
        setStatus("error");
        setErrorMessage(err.message || "Произошла непредвиденная ошибка. Попробуйте позже.");
      }
    };

    confirmEmail();
  }, [searchParams, supabase, router]);

  return (
    <main className="min-h-screen bg-[color:var(--color-background,#050B13)] pt-[104px]">
      <div
        className="max-w-[520px] mx-auto flex items-center justify-center px-4"
        style={{ minHeight: "calc(100vh - 104px)" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-full relative z-10"
        >
          <div className="w-full bg-card border border-border rounded-[24px] shadow-[0_18px_45px_rgba(0,0,0,0.65)] p-6">
            {/* Title */}
            <div className="mb-6 text-center">
              <h1 className="mb-2 text-xl font-bold tracking-tight text-foreground">
                {status === "loading" && "Подтверждение email"}
                {status === "success" && "Email подтверждён"}
                {status === "error" && "Ошибка подтверждения"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {status === "loading" && "Пожалуйста, подождите..."}
                {status === "success" && "Сейчас перенаправим в систему"}
                {status === "error" && "Произошла ошибка при подтверждении email"}
              </p>
            </div>

            {/* Content */}
            <div className="space-y-4">
              {status === "loading" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-8"
                >
                  <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Обработка подтверждения...
                  </p>
                </motion.div>
              )}

              {status === "success" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 rounded-xl p-6 text-center"
                >
                  <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                  <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
                    E-mail подтверждён, сейчас перенаправим в систему
                  </p>
                  <p className="text-xs text-green-500 dark:text-green-500/80">
                    Если редирект не произошёл автоматически, нажмите кнопку ниже
                  </p>
                  <motion.button
                    onClick={() => {
                      const next = searchParams.get("next") || "/dashboard/director";
                      router.push(next);
                    }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="mt-4 h-10 px-6 rounded-[20px] bg-primary text-sm font-semibold text-white transition-all border border-black/15 dark:border-white/10 shadow-md shadow-black/10 dark:shadow-black/40 shadow-[inset_0_0_8px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_0_8px_rgba(255,255,255,0.04)] hover:opacity-90"
                  >
                    Перейти в систему
                  </motion.button>
                </motion.div>
              )}

              {status === "error" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl p-6"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                        Ошибка подтверждения
                      </p>
                      <p className="text-xs text-red-500 dark:text-red-500/80">
                        {errorMessage}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/login"
                    className="block text-center h-10 px-6 rounded-[20px] bg-primary text-sm font-semibold text-white transition-all border border-black/15 dark:border-white/10 shadow-md shadow-black/10 dark:shadow-black/40 shadow-[inset_0_0_8px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_0_8px_rgba(255,255,255,0.04)] hover:opacity-90 flex items-center justify-center"
                  >
                    Перейти на страницу входа
                  </Link>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

