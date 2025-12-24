"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { AlertCircle } from "lucide-react";
import { PrimaryButton } from "@/components/ui/button";
import { mapProfileFromDb, mapProfileToDb, isProfileComplete, type Profile } from "@/lib/types/profile";

export default function CompleteProfilePage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    async function checkAuth() {
      const supabase = createBrowserSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }

      // Check if profile already has required fields
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

      // Если профиль полный - перенаправляем на dashboard
      if (isProfileComplete(profile)) {
        let dashboardPath = "/dashboard/director";
        if (profile.role === "менеджер") {
          dashboardPath = "/dashboard/manager";
        } else if (profile.role === "сотрудник") {
          dashboardPath = "/dashboard/employee";
        }
        router.push(dashboardPath);
        return;
      }

      // Если есть имя, заполняем его в поле
      if (profile.fullName) {
        setFullName(profile.fullName);
      }

      setIsChecking(false);
    }

    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      setError("Пожалуйста, введите ваше имя");
      setIsError(true);
      setTimeout(() => setIsError(false), 3000);
      return;
    }

    setIsLoading(true);
    setError("");
    setIsError(false);

    try {
      const supabase = createBrowserSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const shortName = fullName.trim().split(' ')[0] || fullName.trim();

      // Update profile with name using typed mapping
      const updateData = mapProfileToDb({
        fullName: fullName.trim(),
        shortName: shortName,
      });

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', session.user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        setError("Ошибка при сохранении имени. Попробуйте еще раз.");
        setIsError(true);
        setIsLoading(false);
        setTimeout(() => setIsError(false), 3000);
        return;
      }

      // Проверяем, нужно ли перенаправлять на dashboard или остаться на странице
      // Если у пользователя уже есть role и businessId, перенаправляем
      const { data: profileRaw } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileRaw) {
        const profile = mapProfileFromDb(profileRaw);
        if (isProfileComplete(profile)) {
          let dashboardPath = "/dashboard/director";
          if (profile.role === "менеджер") {
            dashboardPath = "/dashboard/manager";
          } else if (profile.role === "сотрудник") {
            dashboardPath = "/dashboard/employee";
          }
          router.push(dashboardPath);
          return;
        }
      }

      // Если профиль все еще неполный, остаемся на странице
      setError("Профиль сохранен, но требуется дополнительная информация. Обратитесь к администратору.");
      setIsError(true);
      setIsLoading(false);
      setTimeout(() => setIsError(false), 5000);
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
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Загрузка...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-background" style={{ paddingTop: '80px' }}>
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-full max-w-[400px] relative z-10"
        >
          <div className="w-full bg-card border border-border rounded-[24px] shadow-[0_18px_45px_rgba(0,0,0,0.65)] p-8">
            <div className="flex flex-col gap-6">
              {/* Title */}
              <div className="text-center space-y-1">
                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                  Завершение регистрации
                </h1>
                <p className="text-sm text-muted-foreground">
                  Пожалуйста, введите ваше имя для завершения настройки профиля
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500 ml-1">
                    Ваше имя
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setIsError(false);
                      setError("");
                    }}
                    required
                    autoFocus
                    className={`h-12 w-full bg-card border rounded-[20px] px-4 text-base text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent focus:ring-ring transition-all ${
                      isError ? "border-destructive text-destructive focus:ring-destructive" : "border-border"
                    }`}
                    placeholder="Иван Иванов"
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

