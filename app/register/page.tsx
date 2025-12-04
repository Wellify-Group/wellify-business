"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/language-provider";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle } from "lucide-react";
import useStore from "@/lib/store";

export default function RegisterPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { registerDirector } = useStore();
  const [isCreating, setIsCreating] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPasswordError, setShowPasswordError] = useState(false);
  const [shakePassword, setShakePassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация
    if (!fullName.trim()) {
      return;
    }
    
    // Валидация паролей
    if (password.length < 6) {
      setPasswordError("Пароль должен содержать минимум 6 символов");
      setShowPasswordError(true);
      setShakePassword(true);
      setTimeout(() => setShakePassword(false), 500);
      return;
    }
    
    if (password !== confirmPassword) {
      setPasswordError(t("register.password_mismatch") || "Пароли не совпадают");
      setShowPasswordError(true);
      setShakePassword(true);
      setTimeout(() => setShakePassword(false), 500);
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Регистрируем директора (автоматически логинит)
      const result = await registerDirector(email, password, fullName.trim());
      
      if (result.success) {
        // Немедленный редирект на дашборд
        router.push("/dashboard/director");
      } else {
        // Show error if registration failed
        setPasswordError(result.error || "Registration failed");
        setShowPasswordError(true);
        setShakePassword(true);
        setTimeout(() => setShakePassword(false), 500);
        setIsCreating(false);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setPasswordError("An error occurred. Please try again.");
      setShowPasswordError(true);
      setShakePassword(true);
      setTimeout(() => setShakePassword(false), 500);
      setIsCreating(false);
    }
  };

  return (
    <main className="flex h-screen items-center justify-center bg-background px-4 overflow-hidden" style={{ backgroundColor: 'var(--color-background, #050B13)' }}>
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-full rounded-3xl bg-white dark:bg-zinc-900 shadow-[0_18px_45px_rgba(15,23,42,0.12)] px-8 py-10"
        >
          {/* Title */}
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
              {t("register_title") || "Создать аккаунт директора"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("register_subtitle") || "Главный аккаунт компании в WELLIFY business. Менеджеры и сотрудники создаются внутри кабинета."}
            </p>
          </div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                {t("reg_name_label") || "Имя / Название"}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-12 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-[20px] px-4 text-base text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 focus:border-transparent focus:ring-primary transition-all"
                placeholder={t("reg_name_placeholder") || "Ваше имя"}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                {t("email_label") || "Email"}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-[20px] px-4 text-base text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 focus:border-transparent focus:ring-primary transition-all"
                placeholder={t("email_placeholder") || "you@example.com"}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                {t("password_label") || "Пароль"}
              </label>
              <motion.div
                animate={shakePassword ? { x: [-10, 10, -10, 10, 0] } : undefined}
                transition={{ duration: 0.5 }}
              >
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (showPasswordError) {
                      setShowPasswordError(false);
                      setPasswordError("");
                    }
                  }}
                  required
                  minLength={6}
                  className={`h-12 w-full bg-white dark:bg-zinc-900 border rounded-[20px] px-4 text-base text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 focus:border-transparent transition-all ${
                    showPasswordError
                      ? "border-red-500 focus:ring-red-500 text-red-500"
                      : "border-zinc-200 dark:border-zinc-700 focus:ring-primary"
                  }`}
                  placeholder="••••••••"
                />
              </motion.div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                {t("register.confirm_password") || "Подтвердите пароль"}
              </label>
              <motion.div
                animate={shakePassword ? { x: [-10, 10, -10, 10, 0] } : undefined}
                transition={{ duration: 0.5 }}
              >
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (showPasswordError) {
                      setShowPasswordError(false);
                      setPasswordError("");
                    }
                  }}
                  required
                  minLength={6}
                  className={`h-12 w-full bg-white dark:bg-zinc-900 border rounded-[20px] px-4 text-base text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 focus:border-transparent transition-all ${
                    showPasswordError
                      ? "border-red-500 focus:ring-red-500 text-red-500"
                      : "border-zinc-200 dark:border-zinc-700 focus:ring-primary"
                  }`}
                  placeholder="••••••••"
                />
              </motion.div>
              {showPasswordError && passwordError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 flex items-center gap-2 text-xs text-red-500"
                >
                  <AlertCircle className="h-3 w-3" />
                  {passwordError}
                </motion.div>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={isCreating || !fullName.trim() || password !== confirmPassword || password.length < 6}
              whileHover={isCreating ? undefined : { scale: 1.01 }}
              whileTap={isCreating ? undefined : { scale: 0.99 }}
              className="h-12 w-full flex items-center justify-center gap-2 rounded-[20px] bg-primary px-4 text-base font-semibold text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed border border-black/15 dark:border-white/10 shadow-md shadow-black/10 dark:shadow-black/40 shadow-[inset_0_0_8px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_0_8px_rgba(255,255,255,0.04)] hover:opacity-90"
            >
              {isCreating ? (
                <>
                  <motion.div
                    className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white dark:border-black/30 dark:border-t-black"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
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

          <p className="mt-6 mb-4 text-center text-xs font-medium text-zinc-400 dark:text-zinc-500">
            {t("register_or_social") || "ИЛИ ПРОДОЛЖИТЬ ЧЕРЕЗ"}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={async () => {
                try {
                  const { createBrowserSupabaseClient } = await import("@/lib/supabase/client");
                  const supabase = createBrowserSupabaseClient();
                  
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: {
                      redirectTo: `${window.location.origin}/auth/callback`,
                    },
                  });

                  if (error) {
                    console.error('Google OAuth error:', error);
                    setPasswordError(error.message || "Ошибка при регистрации через Google");
                    setShowPasswordError(true);
                    setShakePassword(true);
                    setTimeout(() => setShakePassword(false), 500);
                  }
                } catch (error: any) {
                  console.error('Google OAuth error:', error);
                  setPasswordError(error.message || "Ошибка при регистрации через Google");
                  setShowPasswordError(true);
                  setShakePassword(true);
                  setTimeout(() => setShakePassword(false), 500);
                }
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-6 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
                <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.065 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/>
                <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"/>
                <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"/>
                <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.719 1.233 5.313l4.044-3.045Z"/>
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  const { createBrowserSupabaseClient } = await import("@/lib/supabase/client");
                  const supabase = createBrowserSupabaseClient();
                  
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: "apple",
                    options: {
                      redirectTo: `${window.location.origin}/auth/callback`,
                    },
                  });

                  if (error) {
                    console.error('Apple OAuth error:', error);
                    setPasswordError(error.message || "Ошибка при регистрации через Apple");
                    setShowPasswordError(true);
                    setShakePassword(true);
                    setTimeout(() => setShakePassword(false), 500);
                  }
                } catch (error: any) {
                  console.error('Apple OAuth error:', error);
                  setPasswordError(error.message || "Ошибка при регистрации через Apple");
                  setShowPasswordError(true);
                  setShakePassword(true);
                  setTimeout(() => setShakePassword(false), 500);
                }
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-6 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="h-5 w-5">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.127 3.675-.552 9.12 1.519 12.12 1.014 1.454 2.227 3.09 3.82 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.56-1.702z"/>
              </svg>
              Apple
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
