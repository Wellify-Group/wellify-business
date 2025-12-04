"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/language-provider";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
        } else if (result.errorCode === "PROFILE_CREATION_FAILED") {
          errorMessage = "Не удалось создать профиль пользователя. Попробуйте позже или обратитесь в поддержку.";
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
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-background, #050B13)', paddingTop: '80px' }}>
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

          {/* Информационный блок про Google временно скрыт */}
          {/* <div className="mt-6 mb-4">
            <div className="bg-muted/50 border border-border rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("register_google_info") || "Регистрация через Google недоступна. Сначала создайте аккаунт через email, затем вы сможете войти через Google."}
              </p>
              <Link
                href="/login"
                className="mt-2 inline-block text-xs text-primary hover:underline"
              >
                {t("register_go_to_login") || "Уже есть аккаунт? Войти через Google"}
              </Link>
            </div>
          </div> */}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
