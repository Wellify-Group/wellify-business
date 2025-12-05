"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/language-provider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";

export default function RegisterPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const [shakeForm, setShakeForm] = useState(false);

  // Проверяем, авторизован ли уже пользователь
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        // Пользователь уже залогинен – отправляем в онбординг
        router.replace("/onboarding/profile");
        return;
      }
    };

    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShowError(false);

    // Валидация
    if (!firstName.trim() || !lastName.trim()) {
      setError("Пожалуйста, заполните имя и фамилию");
      setShowError(true);
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 500);
      return;
    }

    if (password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов");
      setShowError(true);
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 500);
      return;
    }

    if (password !== passwordConfirmation) {
      setError("Пароли не совпадают");
      setShowError(true);
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 500);
      return;
    }

    if (!phone.trim()) {
      setError("Пожалуйста, укажите номер телефона");
      setShowError(true);
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 500);
      return;
    }

    setIsCreating(true);

    try {
      const supabase = createBrowserSupabaseClient();

      // Регистрация через Supabase
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
        });

      if (signUpError) {
        throw signUpError;
      }

      if (!signUpData.user) {
        throw new Error("Не удалось создать пользователя");
      }

      const userId = signUpData.user.id;

      // Проверяем наличие активной сессии после signUp
      let session = signUpData.session;

      if (!session) {
        const { data: sessionData } = await supabase.auth.getSession();
        session = sessionData?.session || null;
      }

      // Если сессия есть - создаём профиль через авторизованный клиент
      if (session) {
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert(
            {
              id: userId,
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              middle_name: middleName.trim() || null,
              phone: phone.trim(),
              phone_verified: false,
            },
            { onConflict: "id" }
          );

        if (profileError) {
          console.error("Profile creation error:", profileError);
          if (
            profileError.message?.includes("row-level security") ||
            profileError.code === "42501"
          ) {
            throw new Error(
              "Ошибка доступа. Пожалуйста, обновите страницу и попробуйте снова."
            );
          }
          throw new Error("Не удалось создать профиль. Попробуйте позже.");
        }

        router.push("/onboarding/verify-phone");
      } else {
        // Если сессии нет (нужно подтверждение email) – профиль создастся через триггер или при следующем входе
        router.push("/onboarding/verify-phone");
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      let errorMessage =
        "Произошла ошибка при регистрации. Попробуйте позже.";

      if (
        err.message?.includes("User already registered") ||
        err.message?.includes("already exists")
      ) {
        errorMessage =
          "Аккаунт с таким email уже существует. Войдите или восстановите пароль.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setShowError(true);
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 500);
      setIsCreating(false);
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{
        backgroundColor: "var(--color-background, #050B13)",
        paddingTop: "104px",
      }}
    >
      <div className="w-full max-w-[520px] px-4 py-4 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-full relative z-10"
        >
          <div className="w-full bg-card border border-border rounded-[24px] shadow-[0_18px_45px_rgba(0,0,0,0.65)] p-6">
            {/* Title */}
            <div className="mb-4 text-center">
              <h1 className="mb-1 text-xl font-bold tracking-tight text-foreground">
                {t("register_title") || "Создать аккаунт"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {t("register_subtitle") || "Заполните форму для регистрации"}
              </p>
            </div>

            {/* Link to login */}
            <div className="mb-3 text-center">
              <p className="text-xs text-muted-foreground">
                Уже есть аккаунт?{" "}
                <Link
                  href="/login"
                  className="text-primary hover:underline font-medium"
                >
                  Войти
                </Link>
              </p>
            </div>

            {/* Form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={
                shakeForm
                  ? { x: [-10, 10, -10, 10, 0], opacity: 1, y: 0 }
                  : { opacity: 1, y: 0 }
              }
              transition={
                shakeForm
                  ? { duration: 0.5 }
                  : { type: "spring", stiffness: 260, damping: 20 }
              }
              onSubmit={handleSubmit}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Имя *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="h-11 w-full bg-card border border-border rounded-[20px] px-4 text-base text-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent focus:ring-ring transition-all"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Фамилия *
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="h-11 w-full bg-card border border-border rounded-[20px] px-4 text-base text-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent focus:ring-ring transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Отчество
                </label>
                <input
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  className="h-11 w-full bg-card border border-border rounded-[20px] px-4 text-base text-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent focus:ring-ring transition-all"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 w-full bg-card border border-border rounded-[20px] px-4 text-base text-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent focus:ring-ring transition-all"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Мы отправим на этот адрес подтверждение
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Телефон *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="h-11 w-full bg-card border border-border rounded-[20px] px-4 text-base text-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent focus:ring-ring transition-all"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Пароль *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-11 w-full bg-card border border-border rounded-[20px] px-4 text-base text-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent focus:ring-ring transition-all"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Минимум 6 символов
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Подтвердите пароль *
                </label>
                <input
                  type="password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  required
                  minLength={6}
                  className="h-11 w-full bg-card border border-border rounded-[20px] px-4 text-base text-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent focus:ring-ring transition-all"
                />
              </div>

              {showError && error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl p-3 text-xs text-red-600 dark:text-red-400 flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={isCreating}
                whileHover={isCreating ? undefined : { scale: 1.01 }}
                whileTap={isCreating ? undefined : { scale: 0.99 }}
                className="h-11 w-full flex items-center justify-center gap-2 rounded-[20px] bg-primary px-4 text-sm font-semibold text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed border border-black/15 dark:border-white/10 shadow-md shadow-black/10 dark:shadow-black/40 shadow-[inset_0_0_8px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_0_8px_rgba(255,255,255,0.04)] hover:opacity-90 mt-1"
              >
                {isCreating ? (
                  <>
                    <motion.div
                      className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white dark:border-black/30 dark:border-t-black"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    {t("register.creating") || "Создаем..."}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    {t("register.create") || "Создать аккаунт"}
                  </>
                )}
              </motion.button>
            </motion.form>

            {/* Google Auth Button - скрыто
            <div className="relative flex items-center justify-center py-1 mt-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border"></span>
              </div>
              <span className="relative px-3 bg-card text-[10px] uppercase tracking-wider text-muted-foreground">
                {t("login_or_social") || "Или"}
              </span>
            </div>

            <GoogleAuthButton
              className="w-full h-11 flex items-center justify-center gap-2 rounded-full border border-border bg-card hover:bg-muted transition-all text-white mt-4"
            >
              ...
            </GoogleAuthButton>
            */}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
