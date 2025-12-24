"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/language-provider";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, AlertCircle, Mail, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = async () => {
    setError(null);

    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t<string>("password_reset_error_invalid_email"));
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCodeSent(true);
        setCode(['', '', '', '', '', '']);
        setError(null);
        // Фокус на первое поле кода
        setTimeout(() => {
          document.getElementById('forgot-code-0')?.focus();
        }, 100);
      } else {
        const errorMessage = data.error || "Произошла ошибка. Попробуйте позже.";
        setError(errorMessage);
      }
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError("Произошла ошибка. Попробуйте позже.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCode(['', '', '', '', '', '']);
        setError(null);
        setTimeout(() => {
          document.getElementById('forgot-code-0')?.focus();
        }, 100);
      } else {
        const errorMessage = data.error || "Произошла ошибка. Попробуйте позже.";
        setError(errorMessage);
      }
    } catch (err: any) {
      console.error("Resend code error:", err);
      setError("Произошла ошибка. Попробуйте позже.");
    } finally {
      setIsResending(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError(null);

    if (value && index < 5) {
      const nextInput = document.getElementById(`forgot-code-${index + 1}`);
      nextInput?.focus();
    }

    // Автоматическая проверка кода при заполнении всех 6 цифр
    const codeString = newCode.join('');
    if (codeString.length === 6 && !isSubmitting) {
      // Небольшая задержка для лучшего UX
      setTimeout(() => {
        // Используем актуальное значение через замыкание
        const verifyCode = async () => {
          setIsSubmitting(true);
          setError(null);

          try {
            const response = await fetch('/api/auth/verify-password-reset-code', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: email.trim().toLowerCase(),
                code: codeString,
              }),
            });

            const data = await response.json();

            if (data.success) {
              // Переходим на страницу сброса пароля с email
              router.push(`/auth/reset-password?email=${encodeURIComponent(email)}&code=${codeString}`);
            } else {
              // Локализуем ошибку
              const errorMessage = data.error === 'Invalid or expired code' 
                ? t<string>("register_error_code_invalid")
                : (data.error || t<string>("register_error_code_invalid"));
              setError(errorMessage);
              setCode(['', '', '', '', '', '']);
              document.getElementById('forgot-code-0')?.focus();
              setIsSubmitting(false);
            }
          } catch (error: any) {
            setError(t<string>("register_error_code_verify_failed"));
            console.error('Verify code error:', error);
            setIsSubmitting(false);
          }
        };
        verifyCode();
      }, 300);
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`forgot-code-${index - 1}`);
      prevInput?.focus();
    }
    
    // При нажатии Enter проверяем код, если все 6 цифр введены
    if (e.key === 'Enter' && code.join('').length === 6 && !isSubmitting) {
      e.preventDefault();
      handleVerifyCode();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const codeArray = pastedData.split('');
      setCode(codeArray);
      setError(null);
      document.getElementById('forgot-code-5')?.focus();
      
      // Автоматическая проверка кода при вставке
      if (!isSubmitting) {
        setTimeout(() => {
          const verifyCode = async () => {
            setIsSubmitting(true);
            setError(null);

            try {
              const response = await fetch('/api/auth/verify-password-reset-code', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: email.trim().toLowerCase(),
                  code: pastedData,
                }),
              });

              const data = await response.json();

              if (data.success) {
                // Переходим на страницу сброса пароля с email
                router.push(`/auth/reset-password?email=${encodeURIComponent(email)}&code=${pastedData}`);
              } else {
                setError(data.error || 'Неверный код. Попробуйте еще раз.');
                setCode(['', '', '', '', '', '']);
                document.getElementById('forgot-code-0')?.focus();
                setIsSubmitting(false);
              }
            } catch (error: any) {
              setError('Ошибка при проверке кода. Попробуйте еще раз.');
              console.error('Verify code error:', error);
              setIsSubmitting(false);
            }
          };
          verifyCode();
        }, 300);
      }
    }
  };

  const handleVerifyCode = async () => {
    const codeString = code.join('');
    
    if (codeString.length !== 6) {
      setError('Введите полный код из 6 цифр');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/verify-password-reset-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: codeString,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Переходим на страницу сброса пароля с email
        router.push(`/auth/reset-password?email=${encodeURIComponent(email)}&code=${codeString}`);
      } else {
        // Локализуем ошибку
        const errorMessage = data.error === 'Invalid or expired code' 
          ? t<string>("register_error_code_invalid")
          : (data.error || t<string>("register_error_code_invalid"));
        setError(errorMessage);
        setCode(['', '', '', '', '', '']);
        document.getElementById('forgot-code-0')?.focus();
      }
    } catch (error: any) {
      setError(t<string>("register_error_code_verify_failed"));
      console.error('Verify code error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeEmail = () => {
    setCodeSent(false);
    setCode(['', '', '', '', '', '']);
    setError(null);
  };

  return (
    <main className="fixed top-[112px] left-0 right-0 bottom-0 flex items-center justify-center bg-background px-4 overflow-hidden">
      <div className="relative w-full max-w-[640px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <Card className="relative z-10 w-full rounded-[32px] border border-border bg-card backdrop-blur-2xl px-10 py-10">
          {/* Back Button */}
          <Link
            href="/login"
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t<string>("password_reset_back_to_login")}
          </Link>

          {!codeSent ? (
            <>
              <h1 className="mb-2 text-center text-[22px] font-semibold tracking-tight text-foreground">
                {t<string>("password_reset_title")}
              </h1>
              <p className="mb-6 text-center text-sm text-muted-foreground">
                {t<string>("password_reset_description")}
              </p>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {t<string>("password_reset_email_label")}
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                      <Mail className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSendCode();
                        }
                      }}
                      className="h-10 w-full rounded-2xl border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-primary/60 focus:shadow-[0_0_0_3px_rgba(var(--color-primary-rgb,59,130,246),0.1)]"
                      placeholder={t<string>("email_placeholder")}
                    />
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="flex items-center gap-3 rounded-xl border-2 border-destructive/30 bg-destructive/10 px-4 py-3.5 backdrop-blur-sm shadow-lg"
                  >
                    <div className="flex-shrink-0 rounded-full bg-destructive/20 p-1.5">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    </div>
                    <span className="text-sm font-medium text-destructive">{error}</span>
                  </motion.div>
                )}

                <motion.button
                  type="button"
                  onClick={handleSendCode}
                  disabled={isSubmitting || !email}
                  whileHover={isSubmitting || !email ? undefined : { scale: 1.02 }}
                  whileTap={isSubmitting || !email ? undefined : { scale: 0.98 }}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-600 dark:to-blue-500 px-4 py-2 text-sm font-medium text-white dark:text-white shadow-[0_10px_30px_rgba(37,99,235,0.45)] dark:shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:from-blue-500 hover:to-blue-400 dark:hover:from-blue-500 dark:hover:to-blue-400 transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t<string>("password_reset_sending")}
                    </>
                  ) : (
                    <>
                      {t<string>("password_reset_send_code")}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </motion.button>
              </div>
            </>
          ) : (
            <>
              <h1 className="mb-2 text-center text-[22px] font-semibold tracking-tight text-foreground">
                {t<string>("password_reset_title")}
              </h1>
              <p className="mb-6 text-center text-sm text-muted-foreground">
                {t<string>("password_reset_code_sent")} <br />
                <span className="font-medium text-foreground">{email}</span>
              </p>

              <div className="space-y-4">
                <div className="flex justify-center gap-3">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      id={`forgot-code-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(index, e)}
                      onPaste={index === 0 ? handleCodePaste : undefined}
                       className={`h-16 w-14 rounded-2xl border-2 text-center text-3xl font-bold text-foreground outline-none transition-all duration-200 disabled:opacity-50 ${
                         error
                           ? 'border-destructive/80 bg-destructive/10 shadow-[0_0_0_4px_rgba(var(--color-destructive-rgb,239,68,68),0.1)]'
                           : 'border-border bg-background shadow-[0_4px_12px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:border-primary/60 focus:border-primary focus:shadow-[0_0_0_4px_rgba(var(--color-primary-rgb,59,130,246),0.15)] focus:ring-0'
                       }`}
                      disabled={isSubmitting}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="flex items-center gap-3 rounded-xl border-2 border-destructive/30 bg-destructive/10 px-4 py-3.5 backdrop-blur-sm shadow-lg"
                  >
                    <div className="flex-shrink-0 rounded-full bg-destructive/20 p-1.5">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    </div>
                    <span className="text-sm font-medium text-destructive">{error}</span>
                  </motion.div>
                )}

                <motion.button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={isSubmitting || code.join('').length !== 6}
                  whileHover={isSubmitting || code.join('').length !== 6 ? undefined : { scale: 1.02 }}
                  whileTap={isSubmitting || code.join('').length !== 6 ? undefined : { scale: 0.98 }}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-600 dark:to-blue-500 px-4 py-2 text-sm font-medium text-white dark:text-white shadow-[0_10px_30px_rgba(37,99,235,0.45)] dark:shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:from-blue-500 hover:to-blue-400 dark:hover:from-blue-500 dark:hover:to-blue-400 transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t<string>("password_reset_verifying")}
                    </>
                  ) : (
                    <>
                      {t<string>("password_reset_confirm")}
                      <CheckCircle2 className="h-4 w-4" />
                    </>
                  )}
                </motion.button>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isResending}
                    className="text-[var(--accent-primary,#3b82f6)] hover:underline transition-colors disabled:opacity-50"
                  >
                    {isResending ? t<string>("password_reset_sending") : t<string>("password_reset_resend_code")}
                  </button>
                   <button
                     type="button"
                     onClick={handleChangeEmail}
                     className="text-muted-foreground hover:text-foreground transition-colors"
                   >
                     {t<string>("password_reset_change_email")}
                   </button>
                </div>
              </div>
            </>
          )}
          </Card>
        </motion.div>
      </div>
    </main>
  );
}

