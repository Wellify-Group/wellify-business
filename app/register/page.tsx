"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/language-provider";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import Link from "next/link";
import { CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Шаг 1
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  // Шаг 2
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  // Шаг 3
  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);

  // Общие
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shakeForm, setShakeForm] = useState(false);

  const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (typeof window !== "undefined" ? window.location.origin : "");

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

  // При открытии с emailRedirectTo на шаг 3
  useEffect(() => {
    const stepFromUrl = searchParams?.get("step");
    if (stepFromUrl === "3") {
      setStep(3);
    }
  }, [searchParams]);

  // Проверка сессии на шаге 3 и восстановление данных из localStorage
  useEffect(() => {
    if (step === 3) {
      const checkSession = async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setError(
            "Сначала подтвердите e-mail. Перейдите по ссылке из письма, которое мы отправили."
          );
        } else {
          // Восстанавливаем данные шага 1 из localStorage
          if (typeof window !== "undefined") {
            const savedData = localStorage.getItem("register_step1_data");
            if (savedData) {
              try {
                const data = JSON.parse(savedData);
                setFirstName(data.firstName || "");
                setLastName(data.lastName || "");
                setMiddleName(data.middleName || "");
                setBirthDate(data.birthDate || "");
              } catch (e) {
                console.error("Failed to restore step 1 data:", e);
              }
            }
          }
        }
      };

      checkSession();
    }
  }, [step, supabase]);

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

    if (!birthDate) {
      setError("Пожалуйста, укажите дату рождения");
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

    // Сохраняем данные шага 1 в localStorage для использования на шаге 3
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "register_step1_data",
        JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          middleName: middleName.trim() || null,
          birthDate,
          password,
        })
      );
    }

    setStep(2);
  };

  // Шаг 2: Отправка письма подтверждения
  const handleStep2SendEmail = async () => {
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
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${SITE_URL}/register?step=3`,
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            middle_name: middleName.trim() || null,
            birth_date: birthDate || null,
            phone: phone || null,
            role: "director",
          },
        },
      });

      if (signUpError) {
        if (
          signUpError.message?.includes("User already registered") ||
          signUpError.message?.includes("already exists")
        ) {
          throw new Error(
            "Аккаунт с таким email уже существует. Войдите или восстановите пароль."
          );
        }
        throw signUpError;
      }

      if (!data.user) {
        throw new Error("Не удалось создать пользователя");
      }

      setEmailSent(true);
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Произошла ошибка при регистрации. Попробуйте позже.");
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  // Шаг 3: Отправка кода на телефон
  const handleSendPhoneCode = async () => {
    setError(null);

    if (!phone.trim()) {
      setError("Пожалуйста, укажите номер телефона");
      triggerShake();
      return;
    }

    setIsLoading(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!backendUrl) {
        throw new Error("Backend URL не настроен");
      }

      const res = await fetch(`${backendUrl}/auth/send-phone-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
          errorData?.message || "Не удалось отправить код. Попробуйте позже."
        );
      }

      setPhoneCodeSent(true);
    } catch (e: any) {
      console.error("Send phone code error:", e);
      setError(e.message || "Ошибка при отправке кода");
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  // Шаг 3: Проверка кода и завершение регистрации
  const handleVerifyPhone = async () => {
    setError(null);

    if (!phoneCode.trim()) {
      setError("Пожалуйста, введите код подтверждения");
      triggerShake();
      return;
    }

    setIsLoading(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!backendUrl) {
        throw new Error("Backend URL не настроен");
      }

      const res = await fetch(`${backendUrl}/auth/verify-phone-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, code: phoneCode }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Неверный код подтверждения");
      }

      // Успешная верификация – обновляем профиль в Supabase
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (userId) {
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert(
            {
              id: userId,
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              middle_name: middleName.trim() || null,
              birth_date: birthDate || null,
              phone,
              phone_verified: true,
              role: "director",
            },
            { onConflict: "id" }
          );

        if (profileError) {
          console.error("Profile update error:", profileError);
          throw profileError;
        }
      }

      // Очищаем сохраненные данные
      if (typeof window !== "undefined") {
        localStorage.removeItem("register_step1_data");
      }

      // Редирект в дашборд директора
      router.replace("/dashboard/director");
    } catch (e: any) {
      console.error("Verify phone error:", e);
      setError(e.message || "Ошибка при подтверждении телефона");
      triggerShake();
    } finally {
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
                {[1, 2, 3].map((stepNum) => (
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
                Шаг {step} из 3
              </p>
            </div>

            {/* Title */}
            <div className="mb-4 text-center">
              <h1 className="mb-1 text-xl font-bold tracking-tight text-foreground">
                {step === 1
                  ? t("register_title") || "Создать аккаунт"
                  : step === 2
                  ? "Подтверждение e-mail"
                  : "Подтверждение телефона"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {step === 1
                  ? t("register_subtitle") || "Заполните форму для регистрации"
                  : step === 2
                  ? "Введите ваш e-mail для подтверждения"
                  : "Введите код подтверждения из Telegram"}
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
                else if (step === 2 && !emailSent) handleStep2SendEmail();
                else if (step === 3 && phoneCodeSent) handleVerifyPhone();
              }}
              className="space-y-3"
            >
              {/* Шаг 1: ФИО, дата рождения, пароль */}
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
                      Дата рождения *
                    </label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      required
                      max={new Date().toISOString().split("T")[0]}
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
                <>
                  {emailSent ? (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 rounded-xl p-4 text-sm text-green-600 dark:text-green-400">
                      <p className="mb-2 font-medium">
                        Письмо отправлено на {email}
                      </p>
                      <p className="text-xs">
                        Мы отправили ссылку на e-mail, перейдите по ней, затем
                        вернитесь, чтобы подтвердить телефон.
                      </p>
                    </div>
                  ) : (
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
                  )}
                </>
              )}

              {/* Шаг 3: Телефон и код */}
              {step === 3 && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Телефон *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        disabled={phoneCodeSent}
                        className="h-11 flex-1 bg-card border border-border rounded-[20px] px-4 text-base text-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent focus:ring-ring transition-all disabled:opacity-50"
                      />
                      {!phoneCodeSent && (
                        <motion.button
                          type="button"
                          onClick={handleSendPhoneCode}
                          disabled={isLoading}
                          whileHover={isLoading ? undefined : { scale: 1.02 }}
                          whileTap={isLoading ? undefined : { scale: 0.98 }}
                          className="h-11 px-4 rounded-[20px] bg-primary text-sm font-semibold text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed border border-black/15 dark:border-white/10"
                        >
                          {isLoading ? "..." : "Отправить"}
                        </motion.button>
                      )}
                    </div>
                  </div>

                  {phoneCodeSent && (
                    <div>
                      <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                        Код подтверждения *
                      </label>
                      <input
                        type="text"
                        value={phoneCode}
                        onChange={(e) => setPhoneCode(e.target.value)}
                        required
                        placeholder="Введите код из Telegram"
                        className="h-11 w-full bg-card border border-border rounded-[20px] px-4 text-base text-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent focus:ring-ring transition-all"
                      />
                    </div>
                  )}
                </>
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
                {step > 1 && step !== 3 && (
                  <motion.button
                    type="button"
                    onClick={() => setStep((step - 1) as 1 | 2 | 3)}
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

                {step === 2 && !emailSent && (
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
                        Отправка...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Отправить письмо
                      </>
                    )}
                  </motion.button>
                )}

                {step === 3 && phoneCodeSent && (
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
                        Проверка...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Подтвердить телефон
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
