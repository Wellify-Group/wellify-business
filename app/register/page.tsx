"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/language-provider";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import Link from "next/link";
import { CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [step, setStep] = useState<1 | 2>(1);

  // Шаг 1
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  // Шаг 2
  const [email, setEmail] = useState("");

  // Общие
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shakeForm, setShakeForm] = useState(false);

  // Проверяем, авторизован ли уже пользователь
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, phone_verified, first_name, last_name")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profile && profile.first_name && profile.last_name) {
          const role = profile.role || session.user.user_metadata?.role || "director";
          if (role === "director") {
            router.replace("/dashboard/director");
          } else if (role === "manager") {
            router.replace("/dashboard/manager");
          } else {
            router.replace("/dashboard/employee");
          }
        } else {
          router.replace("/dashboard/director");
        }
        return;
      }
    };

    checkAuth();
  }, [router, supabase]);

  const triggerShake = () => {
    setShakeForm(true);
    setTimeout(() => setShakeForm(false), 500);
  };

  // Шаг 1: Валидация и переход на шаг 2
  const handleStep1Next = () => {
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError("Пожалуйста, заполните имя и фамилию");
      triggerShake();
      return;
    }

    if (!phone.trim()) {
      setError("Пожалуйста, укажите номер телефона");
      triggerShake();
      return;
    }

    if (password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов");
      triggerShake();
      return;
    }

    if (password !== passwordConfirmation) {
      setError("Пароли не совпадают");
      triggerShake();
      return;
    }

    setStep(2);
  };

  // Шаг 2: Регистрация (signUp + создание профиля)
  const handleSubmit = async () => {
    setError(null);

    if (!email.trim()) {
      setError("Пожалуйста, укажите e-mail");
      triggerShake();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Пожалуйста, укажите корректный e-mail");
      triggerShake();
      return;
    }

    setIsLoading(true);

    try {
      // Шаг 1: Создание пользователя в Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signUpError) {
        console.error("SignUp error:", signUpError);
        let errorMessage = "Не удалось создать аккаунт. Попробуйте позже.";

        if (
          signUpError.message?.includes("User already registered") ||
          signUpError.message?.includes("already exists") ||
          signUpError.message?.includes("already registered")
        ) {
          errorMessage = "Аккаунт с таким email уже существует. Войдите или восстановите пароль.";
        } else if (signUpError.message) {
          errorMessage = signUpError.message;
        }

        setError(errorMessage);
        triggerShake();
        setIsLoading(false);
        return;
      }

      // Получаем user из результата signUp
      let user = data?.user;

      // Если user отсутствует в data, пытаемся получить через getUser
      if (!user) {
        const { data: userData, error: getUserError } = await supabase.auth.getUser();
        if (getUserError || !userData?.user) {
          console.error("GetUser error:", getUserError);
          setError("Не удалось получить данные пользователя. Попробуйте позже.");
          triggerShake();
          setIsLoading(false);
          return;
        }
        user = userData.user;
      }

      if (!user || !user.id) {
        setError("Не удалось создать пользователя");
        triggerShake();
        setIsLoading(false);
        return;
      }

      const userId = user.id;

      // Шаг 2: Создание/обновление профиля в profiles
      // Учитываем RLS: пользователь может работать только со своей строкой (id = auth.uid())
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: userId,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            middle_name: middleName.trim() || null,
            phone: phone.trim(),
            role: "director",
            phone_verified: false,
          },
          { onConflict: "id" }
        );

      if (profileError) {
        console.error("Profile creation error:", profileError);
        setError(
          `Не удалось создать профиль: ${profileError.message || "Неизвестная ошибка"}`
        );
        triggerShake();
        setIsLoading(false);
        return;
      }

      // Успешная регистрация – редирект в дашборд директора
      router.push("/dashboard/director");
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Произошла ошибка при регистрации. Попробуйте позже.");
      triggerShake();
      setIsLoading(false);
    }
  };

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
            {/* Прогресс-бар */}
            <div className="mb-6">
              <div className="flex gap-2">
                {[1, 2].map((stepNum) => (
                  <div
                    key={stepNum}
                    className={`flex-1 h-1.5 rounded-full transition-all ${
                      step >= stepNum
                        ? "bg-primary"
                        : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-center text-muted-foreground">
                Шаг {step} из 2
              </p>
            </div>

            {/* Title */}
            <div className="mb-4 text-center">
              <h1 className="mb-1 text-xl font-bold tracking-tight text-foreground">
                {step === 1
                  ? t("register_title") || "Создать аккаунт"
                  : "Подтверждение e-mail"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {step === 1
                  ? t("register_subtitle") || "Заполните форму для регистрации"
                  : "Введите ваш e-mail для завершения регистрации"}
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
              onSubmit={(e) => {
                e.preventDefault();
                if (step === 1) handleStep1Next();
                else if (step === 2) handleSubmit();
              }}
              className="space-y-3"
            >
              {/* Шаг 1: ФИО, телефон, пароль */}
              {step === 1 && (
                <>
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
                </>
              )}

              {/* Шаг 2: E-mail */}
              {step === 2 && (
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
                    Мы используем этот адрес для входа в систему
                  </p>
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl p-3 text-xs text-red-600 dark:text-red-400 flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </motion.div>
              )}

              {/* Кнопки навигации */}
              <div className="flex gap-3 pt-2">
                {step > 1 && (
                  <motion.button
                    type="button"
                    onClick={() => setStep((step - 1) as 1 | 2)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="h-11 px-4 rounded-[20px] border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Назад
                  </motion.button>
                )}

                {step === 1 && (
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="h-11 flex-1 flex items-center justify-center gap-2 rounded-[20px] bg-primary px-4 text-sm font-semibold text-white transition-all border border-black/15 dark:border-white/10 shadow-md shadow-black/10 dark:shadow-black/40 shadow-[inset_0_0_8px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_0_8px_rgba(255,255,255,0.04)] hover:opacity-90"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Дальше
                  </motion.button>
                )}

                {step === 2 && (
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={isLoading ? undefined : { scale: 1.01 }}
                    whileTap={isLoading ? undefined : { scale: 0.99 }}
                    className="h-11 flex-1 flex items-center justify-center gap-2 rounded-[20px] bg-primary px-4 text-sm font-semibold text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed border border-black/15 dark:border-white/10 shadow-md shadow-black/10 dark:shadow-black/40 shadow-[inset_0_0_8px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_0_8px_rgba(255,255,255,0.04)] hover:opacity-90"
                  >
                    {isLoading ? (
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
                        Регистрация...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Зарегистрироваться
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            </motion.form>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
