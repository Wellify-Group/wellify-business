"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { AlertCircle } from "lucide-react";
import { PrimaryButton } from "@/components/ui/button";
import { mapProfileFromDb, mapProfileToDb } from "@/lib/types/profile";
import { sendPhoneCode, sendEmailCode } from "@/lib/verificationApi";

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromGoogle = searchParams.get("from") === "google";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    async function checkAuth() {
      const supabase = createBrowserSupabaseClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        router.push("/login");
        return;
      }

      const userEmail = session.user.email || "";

      // Загружаем профиль
      const { data: profileRaw, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profileRaw) {
        console.error('Error loading profile:', profileError);
        setIsChecking(false);
        return;
      }

      const profile = mapProfileFromDb(profileRaw);

      // Заполняем поля из профиля
      if (profile.fullName) {
        const nameParts = profile.fullName.split(" ");
        if (nameParts.length >= 2) {
          setLastName(nameParts[0]);
          setFirstName(nameParts[1]);
          if (nameParts.length >= 3) {
            setMiddleName(nameParts.slice(2).join(" "));
          }
        } else {
          setFirstName(profile.fullName);
        }
      }

      if (profile.phone) {
        setPhone(profile.phone);
      }

      setEmail(userEmail);
      setIsChecking(false);
    }

    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim()) {
      setError("Пожалуйста, заполните имя и фамилию");
      setIsError(true);
      setTimeout(() => setIsError(false), 3000);
      return;
    }

    if (!phone.trim()) {
      setError("Пожалуйста, укажите номер телефона");
      setIsError(true);
      setTimeout(() => setIsError(false), 3000);
      return;
    }

    setIsLoading(true);
    setError("");
    setIsError(false);

    try {
      const supabase = createBrowserSupabaseClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        router.push("/login");
        return;
      }

      const userId = session.user.id;
      const fullName = [lastName, firstName, middleName].filter(Boolean).join(" ");

      // Обновляем профиль
      const updateData = mapProfileToDb({
        fullName: fullName,
        phone: phone.trim(),
      });

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        setError("Ошибка при сохранении профиля. Попробуйте еще раз.");
        setIsError(true);
        setIsLoading(false);
        setTimeout(() => setIsError(false), 3000);
        return;
      }

      // Отправляем коды верификации
      // Проверяем, нужно ли отправлять код на email
      const { data: profileRaw } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileRaw) {
        const profile = mapProfileFromDb(profileRaw);
        
        // Отправляем код на телефон
        const phoneResult = await sendPhoneCode(userId, phone.trim());
        if (!phoneResult.success) {
          console.error("Failed to send phone code:", phoneResult.error);
          // Не прерываем процесс, но логируем ошибку
        }

        // Отправляем код на email, если он ещё не подтверждён
        if (!profile.emailVerified && email) {
          const emailResult = await sendEmailCode(userId, email);
          if (!emailResult.success) {
            console.error("Failed to send email code:", emailResult.error);
            // Не прерываем процесс, но логируем ошибку
          }
        }
      }

      // Редирект на страницу верификации
      router.push("/onboarding/verify");
    } catch (err) {
      console.error("Profile completion error:", err);
      setError("Произошла ошибка. Попробуйте еще раз.");
      setIsError(true);
      setIsLoading(false);
      setTimeout(() => setIsError(false), 3000);
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
    <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background, #050B13)', paddingTop: '104px' }}>
      <div className="w-full max-w-[500px] px-4 py-6 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-full relative z-10"
        >
          <div className="w-full bg-card border border-border rounded-[24px] shadow-[0_18px_45px_rgba(0,0,0,0.65)] p-8">
            <div className="flex flex-col gap-6">
              {/* Title */}
              <div className="text-center space-y-1">
                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                  {fromGoogle ? "Завершение регистрации" : "Дозаполнение профиля"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Пожалуйста, заполните необходимые данные для завершения настройки профиля
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500 ml-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    disabled
                    className="h-12 w-full bg-muted border border-border rounded-[20px] px-4 text-base text-muted-foreground cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Имя *
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        setIsError(false);
                        setError("");
                      }}
                      required
                      autoFocus
                      className={`h-12 w-full bg-card border rounded-[20px] px-4 text-base text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent focus:ring-ring transition-all ${
                        isError ? "border-destructive text-destructive focus:ring-destructive" : "border-border"
                      }`}
                      placeholder="Иван"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Фамилия *
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        setIsError(false);
                        setError("");
                      }}
                      required
                      className={`h-12 w-full bg-card border rounded-[20px] px-4 text-base text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent focus:ring-ring transition-all ${
                        isError ? "border-destructive text-destructive focus:ring-destructive" : "border-border"
                      }`}
                      placeholder="Иванов"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Отчество
                  </label>
                  <input
                    type="text"
                    value={middleName}
                    onChange={(e) => {
                      setMiddleName(e.target.value);
                      setIsError(false);
                      setError("");
                    }}
                    className="h-12 w-full bg-card border border-border rounded-[20px] px-4 text-base text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent focus:ring-ring transition-all"
                    placeholder="Иванович"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500 ml-1">
                    Телефон *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setIsError(false);
                      setError("");
                    }}
                    required
                    className={`h-12 w-full bg-card border rounded-[20px] px-4 text-base text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent focus:ring-ring transition-all ${
                      isError ? "border-destructive text-destructive focus:ring-destructive" : "border-border"
                    }`}
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl p-3 text-xs text-red-600 dark:text-red-400 text-center flex items-center justify-center gap-2"
                  >
                    <AlertCircle className="h-4 w-4" />
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
                    disabled={isLoading}
                    className="w-full h-full rounded-[20px] text-[15px] font-semibold"
                  >
                    {isLoading ? "Сохранение..." : "Продолжить"}
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

export default function OnboardingProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfileContent />
    </Suspense>
  );
}

