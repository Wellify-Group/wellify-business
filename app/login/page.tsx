"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/language-provider";
import { useRouter } from "next/navigation";
import { Building2, Store, AlertCircle } from "lucide-react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { PrimaryButton } from "@/components/ui/button";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import CenteredLayout from "@/components/CenteredLayout";

const MAX_BLOCKS = 4;
const BLOCK_LENGTH = 4;

function normalizeIdString(raw: string) {
  return raw.replace(/\D/g, "").slice(0, MAX_BLOCKS * BLOCK_LENGTH);
}

function splitToBlocks(id: string): string[] {
  const blocks: string[] = [];
  for (let i = 0; i < MAX_BLOCKS; i++) {
    const start = i * BLOCK_LENGTH;
    const end = start + BLOCK_LENGTH;
    blocks.push(id.slice(start, end));
  }
  return blocks;
}

export default function LoginPage() {
  const { t } = useLanguage();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<"office" | "terminal">("office");
  
  // Terminal Login State
  const [terminalStep, setTerminalStep] = useState<1 | 2>(1);
  const [companyId, setCompanyId] = useState("");
  const [companyIdBlocks, setCompanyIdBlocks] = useState(["", "", "", ""]);
  const [pin, setPin] = useState(["", "", "", ""]);

  // Office Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createBrowserSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Проверяем профиль пользователя
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, phone_verified, first_name, last_name")
          .eq("id", session.user.id)
          .maybeSingle();

        // Если профиль заполнен - редиректим в дашборд
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
          // Если профиль не заполнен - отправляем в дашборд
          router.replace("/dashboard/director");
        }
        return;
      }
    };
    
    checkAuth();
  }, [router]);

  // Check for error query parameter
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const searchParams = new URLSearchParams(window.location.search);
    const errorParam = searchParams.get("error");
    
    if (errorParam === "oauth") {
      const errorDescription = searchParams.get("error_description");
      setError(errorDescription || "Ошибка при входе через Google. Попробуйте еще раз.");
      setIsError(true);
      // Очищаем query параметры без редиректа
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("error");
      newUrl.searchParams.delete("error_description");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [router]);

  const handleTabChange = (tab: "office" | "terminal") => {
    setActiveTab(tab);
    setError("");
    setIsError(false);
    if (tab === "office") {
      setTerminalStep(1);
    }
  };

  const handleOfficeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsError(false);
    setIsLoading(true);
    
    try {
      const supabase = createBrowserSupabaseClient();

      // Вход через Supabase
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Обработка ошибок
        if (signInError.message?.includes("Email not confirmed") || 
            signInError.message?.includes("email_not_confirmed")) {
          setError("E-mail не подтверждён. Проверьте почту и перейдите по ссылке из письма.");
        } else if (signInError.message?.includes("Invalid login credentials") || 
            signInError.message?.includes("User not found")) {
          setError("Неверный e-mail или пароль.");
        } else {
          setError(signInError.message || "Произошла ошибка при входе");
        }
        setIsError(true);
        setIsLoading(false);
        return;
      }

      if (!signInData.user) {
        setError("Не удалось войти. Попробуйте позже.");
        setIsError(true);
        setIsLoading(false);
        return;
      }

      // Проверяем профиль и верификацию телефона
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("phone_verified, role")
        .eq("id", signInData.user.id)
        .maybeSingle();

      // Если профиль не найден - редирект в дашборд директора
      if (profileError || !profile) {
        router.replace("/dashboard/director");
        return;
      }

      // Если телефон не подтверждён - редирект на шаг 3 регистрации
      if (profile.phone_verified !== true) {
        router.replace("/register?step=3");
        return;
      }

      // Всё ок - редирект в дашборд в зависимости от роли
      const role = profile.role || signInData.user.user_metadata?.role || "director";
      if (role === "director") {
        router.replace("/dashboard/director");
      } else if (role === "manager") {
        router.replace("/dashboard/manager");
      } else {
        router.replace("/dashboard/employee");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Произошла ошибка при входе. Попробуйте позже.");
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };


  function getFullCompanyId() {
    return companyIdBlocks.join("-");
  }

  const handleCompanyIdChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, BLOCK_LENGTH);
    const next = [...companyIdBlocks];
    next[index] = digits;
    setCompanyIdBlocks(next);

    if (digits.length === BLOCK_LENGTH && index < MAX_BLOCKS - 1) {
      const nextInput = document.getElementById(`company-id-block-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleCompanyIdKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && companyIdBlocks[index] === "" && index > 0) {
      const prevInput = document.getElementById(`company-id-block-${index - 1}`);
      prevInput?.focus();
    }
  };

  function handleCompanyIdPaste(index: number, e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text");
    const normalized = normalizeIdString(text);
    if (!normalized) return;

    e.preventDefault();

    const blocks = splitToBlocks(normalized);
    setCompanyIdBlocks(blocks);

    const lastFilledIndex = Math.max(
      0,
      blocks.reduce((acc, block, i) => (block ? i : acc), 0)
    );
    
    setTimeout(() => {
        const lastInput = document.getElementById(`company-id-block-${lastFilledIndex}`);
        lastInput?.focus();
    }, 0);
  }

  function handleContinueFromCompanyId() {
    const fullId = getFullCompanyId();
    const digits = fullId.replace(/\D/g, "");
    if (digits.length !== MAX_BLOCKS * BLOCK_LENGTH) {
      setError("Введите полный ID компании");
      setIsError(true);
      setTimeout(() => setIsError(false), 3000);
      return;
    }
    setCompanyId(fullId);
    setTerminalStep(2);
    setError("");
  }

  function handlePinChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(0, 1);
    const next = [...pin];
    next[index] = digit;
    setPin(next);
    if (digit && index < 3) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }
  }

  function handlePinKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      prevInput?.focus();
    }
  }

  async function handleTerminalLogin() {
    const pinCode = pin.join("");
    if (pinCode.length !== 4) {
      setError("Введите 4-значный пин-код");
      setIsError(true);
      setTimeout(() => setIsError(false), 3000);
      return;
    }
    setIsLoading(true);
    try {
      // Здесь должна быть логика входа для терминала
      // Пока оставляем как есть, так как это отдельная система
      setError("Функция входа через терминал временно недоступна");
      setIsError(true);
      setTimeout(() => setIsError(false), 3000);
    } catch (error) {
      console.error("Terminal login error:", error);
      setError("Ошибка входа");
      setIsError(true);
      setTimeout(() => setIsError(false), 3000);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <CenteredLayout>
      <div className="w-full max-w-[520px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-full relative z-10"
        >
          <div className="w-full max-w-[480px] rounded-3xl border border-zinc-800/60 bg-zinc-900/85 shadow-[0_24px_80px_rgba(0,0,0,0.85)] px-8 py-7">
          <div className="flex flex-col gap-6">
            {/* Tabs */}
            <div className="grid w-full grid-cols-2 gap-1 p-1 bg-zinc-800/40 border border-zinc-800/60 rounded-xl">
              <button
                onClick={() => handleTabChange("office")}
                className={`relative flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200 h-9 rounded-lg ${
                  activeTab === "office"
                    ? "bg-zinc-900/80 text-zinc-50 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-300"
                }`}
              >
                <Building2 className="h-4 w-4" />
                <span>{t("login_btn_office") || "Кабинет"}</span>
              </button>

              <button
                onClick={() => handleTabChange("terminal")}
                className={`relative flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200 h-9 rounded-lg ${
                  activeTab === "terminal"
                    ? "bg-zinc-900/80 text-zinc-50 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-300"
                }`}
              >
                <Store className="h-4 w-4" />
                <span>{t("login_btn_terminal") || "Терминал"}</span>
              </button>
            </div>

            {/* Title */}
            <div className="text-center space-y-2">
              <h1 className="text-[22px] font-semibold text-zinc-50">
                {activeTab === "office" 
                  ? (t("login_office_title") || "Вход в кабинет") 
                  : (t("login_terminal_title") || "Вход в терминал")}
              </h1>
              <p className="text-sm text-zinc-400">
                {activeTab === "office"
                  ? (t("login_office_desc") || "Для владельцев и менеджеров")
                  : (terminalStep === 1 ? "Введите ID компании" : "Введите пин-код сотрудника")}
              </p>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              {activeTab === "office" ? (
                <motion.div
                  key="office"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-5"
                >
                  <form onSubmit={handleOfficeSubmit} className="flex flex-col gap-4">
                    <div className="space-y-5">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-zinc-400">
                          {t("email_label") || "E-mail"} <span className="text-red-400">*</span>
                        </span>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setIsError(false);
                            setError("");
                          }}
                          required
                          className={`h-11 rounded-2xl border bg-zinc-900/60 px-3 text-sm text-zinc-50 placeholder:text-zinc-500 outline-none ring-0 focus:bg-zinc-900/80 transition-all ${
                             isError ? "border-red-500/80 text-red-400 focus:border-red-500/80" : "border-zinc-800/70 focus:border-blue-500/80"
                          }`}
                          placeholder={t("email_placeholder") || "you@example.com"}
                        />
                      </label>

                      <label className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-zinc-400">
                            {t("password_label") || "Пароль"} <span className="text-red-400">*</span>
                          </span>
                          <Link
                              href="/forgot-password"
                              className="text-xs font-medium text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                          >
                              {t("login_forgot_password") || "Забыли пароль?"}
                          </Link>
                        </div>
                        <div className="relative">
                            <input
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setIsError(false);
                                setError("");
                            }}
                            required
                            className={`h-11 w-full rounded-2xl border bg-zinc-900/60 px-3 text-sm text-zinc-50 placeholder:text-zinc-500 outline-none ring-0 focus:bg-zinc-900/80 transition-all ${
                                isError ? "border-red-500/80 text-red-400 focus:border-red-500/80" : "border-zinc-800/70 focus:border-blue-500/80"
                            }`}
                            placeholder="••••••••"
                            />
                        </div>
                      </label>
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-red-500/40 bg-red-500/5 px-3 py-2 text-sm text-red-400 flex items-center gap-2"
                      >
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{error}</span>
                      </motion.div>
                    )}

                    <div className="mt-4 flex justify-end">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:bg-blue-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (t("logging_in") || "Вход...") : (t("btn_login") || "Войти")}
                      </button>
                    </div>
                  </form>

                    <div className="text-center">
                        <p className="text-xs text-zinc-500">
                            {t("login_terminal_hint") || "Если вы сотрудник точки — используйте вкладку «Терминал»"}
                        </p>
                    </div>

                  {/* Google Auth Button - скрыто
                  <div className="relative flex items-center justify-center py-1">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border"></span>
                    </div>
                    <span className="relative px-3 bg-card text-[10px] uppercase tracking-wider text-muted-foreground">
                      {t("login_or_social") || "Или"}
                    </span>
                  </div>

                  <GoogleAuthButton
                      className="w-full h-11 flex items-center justify-center gap-2 rounded-full border border-border bg-card hover:bg-muted transition-all text-white"
                  >
                      <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
                          <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.065 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/>
                          <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"/>
                          <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"/>
                          <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.719 1.233 5.313l4.044-3.045Z"/>
                      </svg>
                      <span className="text-sm font-medium text-white">Google</span>
                  </GoogleAuthButton>
                  */}

                  <div className="text-center">
                    <p className="text-xs text-zinc-500">
                      Нет аккаунта?{" "}
                      <Link href="/register" className="font-medium text-blue-400 hover:text-blue-300 hover:underline">
                        Зарегистрироваться
                      </Link>
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="terminal"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-6 py-4"
                >
                  {terminalStep === 1 && (
                    <div className="space-y-8">
                      <div className="flex justify-center">
                        <div className="flex items-center gap-2">
                          {companyIdBlocks.map((value, index) => (
                            <input
                              key={index}
                              id={`company-id-block-${index}`}
                              type="text"
                              inputMode="numeric"
                              autoComplete="off"
                              maxLength={BLOCK_LENGTH}
                              value={value}
                              onChange={(e) => handleCompanyIdChange(index, e.target.value)}
                              onKeyDown={(e) => handleCompanyIdKeyDown(index, e)}
                              onPaste={(e) => handleCompanyIdPaste(index, e)}
                              className="w-[70px] h-[56px] rounded-[20px] text-center text-[18px] font-mono tracking-widest focus:outline-none transition-all border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 focus:border-black dark:focus:border-white focus:ring-0 text-foreground"
                            />
                          ))}
                        </div>
                      </div>

                      {error && (
                        <motion.div
                           initial={{ opacity: 0, y: -10 }}
                           animate={{ opacity: 1, y: 0 }}
                           className="rounded-xl border border-red-500/40 bg-red-500/5 px-3 py-2 text-sm text-red-400 flex items-center gap-2"
                         >
                           <AlertCircle className="h-4 w-4 flex-shrink-0" />
                           <span>{error}</span>
                        </motion.div>
                      )}

                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={handleContinueFromCompanyId}
                          className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:bg-blue-500 transition"
                        >
                          Продолжить
                        </button>
                      </div>
                    </div>
                  )}

                  {terminalStep === 2 && (
                    <div className="space-y-8">
                      <div className="flex justify-center gap-3">
                        {pin.map((value, index) => (
                          <input
                            key={index}
                            id={`pin-${index}`}
                            type="password"
                            inputMode="numeric"
                            autoComplete="off"
                            maxLength={1}
                            value={value}
                            onChange={(e) => handlePinChange(index, e.target.value)}
                            onKeyDown={(e) => handlePinKeyDown(index, e)}
                            className="w-[56px] h-[64px] rounded-[20px] text-center text-[24px] font-bold focus:outline-none transition-all border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 focus:border-black dark:focus:border-white focus:ring-0 text-foreground"
                          />
                        ))}
                      </div>

                      {error && (
                         <motion.div
                           initial={{ opacity: 0, y: -10 }}
                           animate={{ opacity: 1, y: 0 }}
                           className="rounded-xl border border-red-500/40 bg-red-500/5 px-3 py-2 text-sm text-red-400 flex items-center gap-2"
                         >
                           <AlertCircle className="h-4 w-4 flex-shrink-0" />
                           <span>{error}</span>
                        </motion.div>
                      )}

                      <div className="mt-4 flex gap-3">
                        <button
                          type="button"
                          onClick={() => setTerminalStep(1)}
                          className="inline-flex items-center justify-center rounded-2xl border border-zinc-800/70 bg-zinc-900/60 px-6 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800/60 transition"
                        >
                          Назад
                        </button>
                        <button
                          type="button"
                          onClick={handleTerminalLogin}
                          disabled={isLoading}
                          className="flex-1 inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:bg-blue-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isLoading ? "Вход..." : "Войти"}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        </motion.div>
      </div>
    </CenteredLayout>
  );
}
