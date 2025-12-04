"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { PrimaryButton } from "@/components/ui/button";
import { mapProfileFromDb, mapProfileToDb } from "@/lib/types/profile";
import { confirmEmailCode, confirmPhoneCode, sendEmailCode, sendPhoneCode } from "@/lib/verificationApi";

export default function OnboardingVerifyPage() {
  const router = useRouter();
  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [error, setError] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingPhone, setIsSendingPhone] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    // Check if user is authenticated and load profile
    async function checkAuth() {
      const supabase = createBrowserSupabaseClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        router.push("/login");
        return;
      }

      const userId = session.user.id;
      setUserId(userId);
      setUserEmail(session.user.email || "");

      // Загружаем профиль
      const { data: profileRaw, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError || !profileRaw) {
        console.error('Error loading profile:', profileError);
        router.push("/onboarding/profile");
        return;
      }

      const profile = mapProfileFromDb(profileRaw);
      setUserPhone(profile.phone || "");

      // Проверяем статус верификации
      setEmailVerified(profile.emailVerified || false);
      setPhoneVerified(profile.phoneVerified || false);

      // Если всё уже подтверждено - редирект в дашборд
      if (profile.emailVerified && profile.phoneVerified) {
        if (profile.role === "директор") {
          router.push("/dashboard/director");
        } else if (profile.role === "менеджер") {
          router.push("/dashboard/manager");
        } else if (profile.role === "сотрудник") {
          router.push("/dashboard/employee");
        } else {
          router.push("/dashboard");
        }
        return;
      }

      setIsChecking(false);
    }

    checkAuth();
  }, [router]);

  const handleResendEmailCode = async () => {
    if (!userId || !userEmail) return;
    
    setIsSendingEmail(true);
    setError("");
    setIsError(false);

    try {
      const result = await sendEmailCode(userId, userEmail);
      if (result.success) {
        // Показываем успешное сообщение (можно через toast)
        setError("Код отправлен на email");
        setIsError(false);
        setTimeout(() => setError(""), 3000);
      } else {
        setError(result.error || "Не удалось отправить код на email");
        setIsError(true);
        setTimeout(() => setIsError(false), 3000);
      }
    } catch (err) {
      console.error("Error sending email code:", err);
      setError("Произошла ошибка при отправке кода");
      setIsError(true);
      setTimeout(() => setIsError(false), 3000);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleResendPhoneCode = async () => {
    if (!userId || !userPhone) return;
    
    setIsSendingPhone(true);
    setError("");
    setIsError(false);

    try {
      const result = await sendPhoneCode(userId, userPhone);
      if (result.success) {
        setError("Код отправлен на телефон");
        setIsError(false);
        setTimeout(() => setError(""), 3000);
      } else {
        setError(result.error || "Не удалось отправить код на телефон");
        setIsError(true);
        setTimeout(() => setIsError(false), 3000);
      }
    } catch (err) {
      console.error("Error sending phone code:", err);
      setError("Произошла ошибка при отправке кода");
      setIsError(true);
      setTimeout(() => setIsError(false), 3000);
    } finally {
      setIsSendingPhone(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsError(false);
    setIsLoading(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      let emailConfirmed = emailVerified;
      let phoneConfirmed = phoneVerified;

      // Подтверждаем email, если нужно
      if (!emailVerified && emailCode.trim()) {
        const emailResult = await confirmEmailCode(emailCode.trim());
        if (emailResult.success) {
          emailConfirmed = true;
          setEmailVerified(true);
        } else {
          setError(emailResult.error || "Неверный код подтверждения email");
          setIsError(true);
          setIsLoading(false);
          return;
        }
      }

      // Подтверждаем телефон, если нужно
      if (!phoneVerified && phoneCode.trim()) {
        const phoneResult = await confirmPhoneCode(phoneCode.trim());
        if (phoneResult.success) {
          phoneConfirmed = true;
          setPhoneVerified(true);
        } else {
          setError(phoneResult.error || "Неверный код подтверждения телефона");
          setIsError(true);
          setIsLoading(false);
          return;
        }
      }

      // Обновляем профиль с подтверждёнными статусами
      if (emailConfirmed || phoneConfirmed) {
        const updateData = mapProfileToDb({
          emailVerified: emailConfirmed,
          phoneVerified: phoneConfirmed,
        });

        const { error: updateError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', session.user.id);

        if (updateError) {
          console.error('Error updating profile:', updateError);
          // Не прерываем процесс, так как коды уже подтверждены
        }
      }

      // Проверяем, всё ли подтверждено
      if (emailConfirmed && phoneConfirmed) {
        // Загружаем профиль для определения роли
        const { data: profileRaw } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileRaw) {
          const profile = mapProfileFromDb(profileRaw);
          // Редирект в дашборд
          if (profile.role === "директор") {
            router.push("/dashboard/director");
          } else if (profile.role === "менеджер") {
            router.push("/dashboard/manager");
          } else if (profile.role === "сотрудник") {
            router.push("/dashboard/employee");
          } else {
            router.push("/dashboard");
          }
        } else {
          router.push("/dashboard");
        }
      } else {
        setError("Подтвердите все коды для продолжения");
        setIsError(true);
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Verification error:", err);
      setError("Произошла ошибка при подтверждении. Попробуйте еще раз.");
      setIsError(true);
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background, #050B13)' }}>
        <div className="text-muted-foreground">Загрузка...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-background, #050B13)', paddingTop: '80px' }}>
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-full max-w-[500px] relative z-10"
        >
          <div className="w-full bg-card border border-border rounded-[24px] shadow-[0_18px_45px_rgba(0,0,0,0.65)] p-8">
            <div className="flex flex-col gap-6">
              {/* Title */}
              <div className="text-center space-y-1">
                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                  Подтверждение контактов
                </h1>
                <p className="text-sm text-muted-foreground">
                  Введите коды подтверждения, отправленные на ваш email и телефон
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Email verification */}
                {!emailVerified && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500 ml-1">
                        Код подтверждения email
                      </label>
                      <button
                        type="button"
                        onClick={handleResendEmailCode}
                        disabled={isSendingEmail}
                        className="text-xs text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSendingEmail ? (
                          <span className="flex items-center gap-1">
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            Отправка...
                          </span>
                        ) : (
                          "Отправить ещё раз"
                        )}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={emailCode}
                      onChange={(e) => {
                        setEmailCode(e.target.value);
                        setIsError(false);
                        setError("");
                      }}
                      required={!emailVerified}
                      className="h-12 w-full bg-card border border-border rounded-[20px] px-4 text-base text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent focus:ring-ring transition-all"
                      placeholder="Введите код из email"
                    />
                    {userEmail && (
                      <p className="text-xs text-muted-foreground ml-1">
                        Код отправлен на {userEmail}
                      </p>
                    )}
                  </div>
                )}

                {emailVerified && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 rounded-xl">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-xs text-green-600 dark:text-green-400">
                      Email подтверждён
                    </span>
                  </div>
                )}

                {/* Phone verification */}
                {!phoneVerified && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500 ml-1">
                        Код подтверждения телефона
                      </label>
                      <button
                        type="button"
                        onClick={handleResendPhoneCode}
                        disabled={isSendingPhone}
                        className="text-xs text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSendingPhone ? (
                          <span className="flex items-center gap-1">
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            Отправка...
                          </span>
                        ) : (
                          "Отправить ещё раз"
                        )}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={phoneCode}
                      onChange={(e) => {
                        setPhoneCode(e.target.value);
                        setIsError(false);
                        setError("");
                      }}
                      required={!phoneVerified}
                      className="h-12 w-full bg-card border border-border rounded-[20px] px-4 text-base text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent focus:ring-ring transition-all"
                      placeholder="Введите код из SMS"
                    />
                    {userPhone && (
                      <p className="text-xs text-muted-foreground ml-1">
                        Код отправлен на {userPhone}
                      </p>
                    )}
                  </div>
                )}

                {phoneVerified && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 rounded-xl">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-xs text-green-600 dark:text-green-400">
                      Телефон подтверждён
                    </span>
                  </div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl p-3 text-xs text-center flex items-center justify-center gap-2 ${
                      isError
                        ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400"
                        : "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    {isError ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    {error}
                  </motion.div>
                )}

                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="h-12 w-full mt-1"
                >
                  <PrimaryButton
                    type="submit"
                    disabled={isLoading || (emailVerified && phoneVerified)}
                    className="w-full h-full rounded-[20px] text-[15px] font-semibold"
                  >
                    {isLoading ? "Подтверждение..." : emailVerified && phoneVerified ? "Всё подтверждено" : "Подтвердить"}
                  </PrimaryButton>
                </motion.div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

