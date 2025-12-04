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
        // Обрабатываем errorCode и показываем соответствующее сообщение
        let errorMessage = "Произошла ошибка при регистрации. Попробуйте позже.";
        
        if (result.errorCode === "EMAIL_ALREADY_REGISTERED") {
          errorMessage = "Аккаунт с таким email уже существует. Войдите или восстановите пароль.";
        } else if (result.errorCode === "REGISTER_UNKNOWN_ERROR") {
          errorMessage = "Произошла ошибка при регистрации. Попробуйте позже.";
        } else if (result.error) {
          // Fallback на старое сообщение, если errorCode нет
          errorMessage = result.error;
        }
        
        setPasswordError(errorMessage);
        setShowPasswordError(true);
        setShakePassword(true);
        setTimeout(() => setShakePassword(false), 500);
        setIsCreating(false);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setPasswordError("Произошла ошибка при регистрации. Попробуйте позже.");
      setShowPasswordError(true);
      setShakePassword(true);
      setTimeout(() => setShakePassword(false), 500);
      setIsCreating(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-background, #050B13)' }}>
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-full max-w-[400px] relative z-10"
        >
          <div className="w-full bg-card border border-border rounded-[24px] shadow-[0_18px_45px_rgba(0,0,0,0.65)] p-8">
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
                className="h-12 w-full bg-card border border-border rounded-[20px] px-4 text-base text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent focus:ring-ring transition-all"
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
                className="h-12 w-full bg-card border border-border rounded-[20px] px-4 text-base text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent focus:ring-ring transition-all"
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
                  className={`h-12 w-full bg-card border rounded-[20px] px-4 text-base text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent transition-all ${
                    showPasswordError
                      ? "border-destructive text-destructive focus:ring-destructive"
                      : "border-border focus:ring-ring"
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
                  className={`h-12 w-full bg-card border rounded-[20px] px-4 text-base text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:border-transparent transition-all ${
                    showPasswordError
                      ? "border-destructive text-destructive focus:ring-destructive"
                      : "border-border focus:ring-ring"
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

          <div className="relative flex items-center justify-center py-1 mt-6 mb-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border"></span>
            </div>
            <span className="relative px-3 bg-card text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("register_or_social") || "ИЛИ ПРОДОЛЖИТЬ ЧЕРЕЗ"}
            </span>
          </div>

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
            className="w-full h-11 flex items-center justify-center gap-2 rounded-full border border-border bg-card hover:bg-muted transition-all text-white"
          >
            <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
              <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.065 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/>
              <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"/>
              <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"/>
              <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.719 1.233 5.313l4.044-3.045Z"/>
            </svg>
            <span className="text-sm font-medium text-white">Google</span>
          </button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
