"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/language-provider";
import { useRouter } from "next/navigation";
import { Building2, Store, AlertCircle } from "lucide-react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

  // ВАЖНО: Используем только прямое статическое обращение к NEXT_PUBLIC_APP_URL
  // для гарантии, что Next.js встроит значение в клиентский бандл
  const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');

  // Убрали автоматический редирект авторизованных пользователей
  // Теперь пользователь может видеть страницу входа даже если уже авторизован
  // Это позволяет выйти и войти под другим аккаунтом

  // Check for error query parameter
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const searchParams = new URLSearchParams(window.location.search);
    const errorParam = searchParams.get("error");
    
    if (errorParam === "oauth") {
      // Всегда используем локализованное сообщение
      setError(t("login_error_oauth"));
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
          setError(t("login_error_email_not_confirmed"));
        } else if (signInError.message?.includes("Invalid login credentials") || 
            signInError.message?.includes("User not found")) {
          setError(t("login_error_invalid_credentials"));
        } else {
          // Всегда используем локализованное сообщение
          setError(t("login_error_generic"));
        }
        setIsError(true);
        setIsLoading(false);
        return;
      }

      if (!signInData.user) {
        setError(t("login_error_failed"));
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
      setError(t("login_error_failed"));
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
      setError(t("login_error_company_id_incomplete"));
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
      setError(t("login_error_pin_incomplete"));
      setIsError(true);
      setTimeout(() => setIsError(false), 3000);
      return;
    }
    setIsLoading(true);
    try {
      // Здесь должна быть логика входа для терминала
      // Пока оставляем как есть, так как это отдельная система
      setError(t("login_error_terminal_unavailable"));
      setIsError(true);
      setTimeout(() => setIsError(false), 3000);
    } catch (error) {
      console.error("Terminal login error:", error);
      setError(t("login_error_terminal_generic"));
      setIsError(true);
      setTimeout(() => setIsError(false), 3000);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen pt-[112px] pb-12 flex items-center justify-center bg-background px-4">
      <div className="relative w-full max-w-xl">
        <Card className="relative z-10 w-full rounded-[28px] border border-[color:var(--color-border-strong)] dark:border-border bg-card dark:backdrop-blur-[14px]">
          <CardHeader className="px-8 pt-6 pb-4">
            <div className="flex flex-col gap-4">
              {/* Tabs */}
              <div className="flex items-center justify-between rounded-full border border-border/50 bg-muted/30 backdrop-blur-sm px-1 py-1 text-[13px]">
                <button
                  onClick={() => handleTabChange("office")}
                  className={cn(
                    "flex-1 rounded-full px-3 py-1.5 text-center transition-all duration-250 ease-out",
                    activeTab === "office"
                      ? "bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-600 dark:to-blue-500 text-white shadow-[0_0_24px_rgba(88,130,255,0.6)] dark:shadow-[0_0_24px_rgba(88,130,255,0.45)] translate-y-[-1px] font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>{t("login_btn_office") || "Кабинет"}</span>
                  </div>
                </button>

                <button
                  onClick={() => handleTabChange("terminal")}
                  className={cn(
                    "flex-1 rounded-full px-3 py-1.5 text-center transition-all duration-250 ease-out",
                    activeTab === "terminal"
                      ? "bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-600 dark:to-blue-500 text-white shadow-[0_0_24px_rgba(88,130,255,0.6)] dark:shadow-[0_0_24px_rgba(88,130,255,0.45)] translate-y-[-1px] font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Store className="h-4 w-4" />
                    <span>{t("login_btn_terminal") || "Терминал"}</span>
                  </div>
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <CardTitle className="text-center text-[22px] font-semibold tracking-tight text-foreground">
                  {activeTab === "office" 
                    ? (t("login_office_title") || "Вход в кабинет") 
                    : (t("login_terminal_title") || "Вход в терминал")}
                </CardTitle>

                <CardDescription className="text-center text-sm leading-relaxed text-muted-foreground">
                  {activeTab === "office"
                    ? (t("login_office_desc") || "Для владельцев и менеджеров")
                    : (terminalStep === 1 ? t("login_terminal_enter_id") : t("login_terminal_enter_pin"))}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-6 flex items-center justify-center">
              <div className="w-full">
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
                            <span className="text-xs font-medium text-muted-foreground">
                              {t("email_label") || "E-mail"} <span className="text-destructive">*</span>
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
                              className={cn(
                                "h-11 w-full rounded-full border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all duration-200 focus:border-primary/60 focus:shadow-[0_0_0_3px_rgba(var(--color-primary-rgb,59,130,246),0.1)]",
                                isError && "border-destructive/80 text-destructive focus:border-destructive"
                              )}
                            />
                          </label>

                          <label className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-muted-foreground">
                                {t("password_label") || "Пароль"} <span className="text-destructive">*</span>
                              </span>
                              <Link
                                href="/forgot-password"
                                className="text-xs font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
                              >
                                {t("login_forgot_password") || "Забыли пароль?"}
                              </Link>
                            </div>
                            <input
                              type="password"
                              value={password}
                              onChange={(e) => {
                                setPassword(e.target.value);
                                setIsError(false);
                                setError("");
                              }}
                              required
                              className={cn(
                                "h-11 w-full rounded-full border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all duration-200 focus:border-primary/60 focus:shadow-[0_0_0_3px_rgba(var(--color-primary-rgb,59,130,246),0.1)]",
                                isError && "border-destructive/80 text-destructive focus:border-destructive"
                              )}
                              placeholder="••••••••"
                            />
                          </label>
                        </div>

                        {error && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive"
                          >
                            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                            <span>{error}</span>
                          </motion.div>
                        )}

                        <div className="mt-4 flex justify-end">
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="inline-flex items-center justify-center h-10 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-600 dark:to-blue-500 px-6 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.6)] dark:shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:shadow-[0_12px_40px_rgba(37,99,235,0.7)] dark:hover:shadow-[0_12px_40px_rgba(37,99,235,0.55)] hover:-translate-y-[1px] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                          >
                            {isLoading ? (t("logging_in") || "Вход...") : (t("btn_login") || "Войти")}
                          </button>
                        </div>
                      </form>

                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">
                          {t("login_terminal_hint") || "Если вы сотрудник точки — используйте вкладку «Терминал»"}
                        </p>
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">
                          {t("login_no_account")}{" "}
                          <Link href="/register" className="font-medium text-primary hover:text-primary/80 hover:underline">
                            {t("login_register_link")}
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
                      className="flex flex-col items-center gap-3 w-full"
                    >
                      {terminalStep === 1 && (
                        <div className="flex flex-col items-center gap-3 w-full">
                          <div className="flex items-center justify-center gap-2">
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
                                className="w-[70px] h-[56px] rounded-[20px] text-center text-[18px] font-mono tracking-widest focus:outline-none transition-all border-2 border-border dark:border-border/80 bg-white dark:bg-background/50 focus:border-primary focus:ring-0 text-foreground shadow-sm dark:shadow-none"
                              />
                            ))}
                          </div>

                          {error && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="w-full flex items-start gap-2 rounded-2xl border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive"
                            >
                              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                              <span>{error}</span>
                            </motion.div>
                          )}

                          <div className="flex justify-center w-full">
                            <button
                              type="button"
                              onClick={handleContinueFromCompanyId}
                              className="inline-flex items-center justify-center h-10 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-600 dark:to-blue-500 px-6 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.6)] dark:shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:shadow-[0_12px_40px_rgba(37,99,235,0.7)] dark:hover:shadow-[0_12px_40px_rgba(37,99,235,0.55)] hover:-translate-y-[1px] transition-all duration-200"
                            >
                              {t("login_btn_continue")}
                            </button>
                          </div>
                        </div>
                      )}

                      {terminalStep === 2 && (
                        <div className="flex flex-col items-center gap-3 w-full">
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
                                className="w-[56px] h-[64px] rounded-[20px] text-center text-[24px] font-bold focus:outline-none transition-all border-2 border-border dark:border-border/80 bg-white dark:bg-background/50 focus:border-primary focus:ring-0 text-foreground shadow-sm dark:shadow-none"
                              />
                            ))}
                          </div>

                          {error && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="w-full flex items-start gap-2 rounded-2xl border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive"
                            >
                              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                              <span>{error}</span>
                            </motion.div>
                          )}

                          <div className="flex items-center justify-center gap-3 w-full">
                            <button
                              type="button"
                              onClick={() => setTerminalStep(1)}
                              className="inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                            >
                              Назад
                            </button>
                            <button
                              type="button"
                              onClick={handleTerminalLogin}
                              disabled={isLoading}
                              className="inline-flex items-center justify-center h-10 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-600 dark:to-blue-500 px-6 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.6)] dark:shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:shadow-[0_12px_40px_rgba(37,99,235,0.7)] dark:hover:shadow-[0_12px_40px_rgba(37,99,235,0.55)] hover:-translate-y-[1px] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                            >
                              {isLoading ? (t("logging_in") || "Вход...") : t("btn_login")}
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }
