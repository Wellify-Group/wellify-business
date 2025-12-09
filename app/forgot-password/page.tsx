"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/language-provider";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import CenteredLayout from "@/components/CenteredLayout";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Пожалуйста, введите корректный email адрес");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsSuccess(true);
        setError("");
      } else {
        // Обработка ошибок (rate limiting и т.п.)
        const errorMessage = data.error || "Произошла ошибка. Попробуйте позже.";
        setError(errorMessage);
      }
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError("Произошла ошибка. Попробуйте позже.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CenteredLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="w-full max-w-md"
      >
        <div className="w-full rounded-3xl bg-white dark:bg-zinc-900 shadow-[0_18px_45px_rgba(15,23,42,0.12)] px-8 py-10">
          {/* Back Button */}
          <Link
            href="/login"
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад к входу
          </Link>

          {!isSuccess ? (
            <>
              <h1 className="mb-2 text-center text-3xl font-bold tracking-tight text-card-foreground">
                Восстановление пароля
              </h1>
              <p className="mb-6 text-center text-sm text-muted-foreground">
                Введите ваш email адрес, и мы отправим вам ссылку для восстановления пароля.
              </p>

              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <label className="text-sm font-medium text-card-foreground">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    required
                    className="h-12 w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 text-base text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all"
                    placeholder="you@example.com"
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-400 text-center flex items-center justify-center gap-2"
                  >
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  disabled={isSubmitting || !email}
                  whileHover={isSubmitting || !email ? undefined : { scale: 1.02 }}
                  whileTap={isSubmitting || !email ? undefined : { scale: 0.98 }}
                  className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-primary px-4 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 shadow-[0_10px_35px_rgba(0,0,0,0.07)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.2)]"
                >
                  {isSubmitting ? (
                    <>
                      <motion.div
                        className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Отправка...
                    </>
                  ) : (
                    <>
                      Отправить ссылку для восстановления
                    </>
                  )}
                </motion.button>
              </motion.form>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
                  <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Письмо отправлено!
              </h2>
              <p className="text-sm text-muted-foreground">
                Мы отправили ссылку для восстановления пароля на адрес <strong>{email}</strong>.
                <br />
                Проверьте вашу почту и следуйте инструкциям в письме.
              </p>
              <div className="pt-4 space-y-2">
                <Link
                  href="/login"
                  className="block"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full rounded-[20px] bg-primary px-4 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shadow-[0_10px_35px_rgba(0,0,0,0.07)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.2)]"
                  >
                    Вернуться к входу
                  </motion.button>
                </Link>
                <button
                  onClick={() => {
                    setIsSuccess(false);
                    setEmail("");
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Отправить еще раз
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </CenteredLayout>
  );
}

