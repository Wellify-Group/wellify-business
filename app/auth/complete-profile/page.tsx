"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
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
    // Check if user is authenticated and load profile
    async function checkAuth() {
      try {
        // Check if user is authenticated
        const userData = await api.getUser();
        
        if (!userData.user) {
          router.push("/login");
          return;
        }

        // Load profile
        const profileData = await api.getProfile();
        const profile = profileData.profile;

        if (!profile) {
          console.error('Error loading profile: profile not found');
          setIsChecking(false);
          return;
        }

        // Map profile from backend format to frontend format
        const mappedProfile = mapProfileFromDb(profile);

        // Если профиль полный - перенаправляем на dashboard
        if (isProfileComplete(mappedProfile)) {
          let dashboardPath = "/dashboard/director";
          const role = (mappedProfile as any).role;
          if (role === "менеджер" || role === "manager") {
            dashboardPath = "/dashboard/manager";
          } else if (role === "сотрудник" || role === "employee") {
            dashboardPath = "/dashboard/employee";
          }
          router.push(dashboardPath);
          return;
        }

        // Если есть имя, заполняем его в поле
        if (mappedProfile.fullName) {
          setFullName(mappedProfile.fullName);
        }

        setIsChecking(false);
      } catch (error) {
        console.error('Error checking auth:', error);
        // If error, redirect to login
        router.push("/login");
      }
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
      // Check if user is authenticated
      const userData = await api.getUser();
      
      if (!userData.user) {
        router.push("/login");
        return;
      }

      const shortName = fullName.trim().split(' ')[0] || fullName.trim();

      // Update profile with name - backend expects English field names
      // Backend expects: full_name (not 'ФИО'), role, language, etc.
      const updateData = {
        full_name: fullName.trim(),
        // Also update name separately if backend supports it
        // name: shortName, // Only if backend has this field
      };

      // Update profile via API
      const updateResult = await api.updateProfile(null, updateData);

      if (!updateResult.profile) {
        throw new Error('Failed to update profile');
      }

      // Reload profile to check if it's complete
      const profileData = await api.getProfile();
      const profile = profileData.profile;

      if (profile) {
        const mappedProfile = mapProfileFromDb(profile);
        
        // Если профиль полный - перенаправляем на dashboard
        if (isProfileComplete(mappedProfile)) {
          let dashboardPath = "/dashboard/director";
          const role = (mappedProfile as any).role;
          if (role === "менеджер" || role === "manager") {
            dashboardPath = "/dashboard/manager";
          } else if (role === "сотрудник" || role === "employee") {
            dashboardPath = "/dashboard/employee";
          }
          router.push(dashboardPath);
          setIsLoading(false);
          return;
        }
      }

      // Если профиль все еще неполный, показываем успех
      setError("");
      setIsError(false);
      setIsLoading(false);
      // Show success message temporarily
      setTimeout(() => {
        router.push("/dashboard/director");
      }, 1000);
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

