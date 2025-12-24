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
      setError("Пожалуйста, введите корректный email адрес");
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
    <main className="h-screen pt-[112px] flex items-center justify-center bg-background px-4">
      <div className="relative w-full max-w-[640px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <Card className="relative z-10 w-full rounded-[32px] border border-border bg-card shadow-modal backdrop-blur-2xl px-10 py-10">
          {/* Back Button */}
          <Link
            href="/login"
            className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад к входу
          </Link>

          {!codeSent ? (
            <>
              <h1 className="mb-2 text-center text-[22px] font-semibold tracking-tight text-zinc-50">
                Восстановление пароля
              </h1>
              <p className="mb-6 text-center text-sm text-zinc-400">
                Введите ваш email адрес, и мы отправим вам код для восстановления пароля.
              </p>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                    Email
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                      <Mail className="h-4 w-4 text-zinc-500" />
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
                      className="h-10 w-full rounded-2xl border border-zinc-800/80 bg-zinc-950/60 pl-9 pr-3 text-sm text-zinc-50 placeholder:text-zinc-500 outline-none transition-colors focus:border-[var(--accent-primary,#3b82f6)]"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="flex items-center gap-3 rounded-xl border-2 border-rose-500/60 bg-gradient-to-r from-rose-950/90 to-rose-900/80 px-4 py-3.5 backdrop-blur-sm shadow-lg"
                  >
                    <div className="flex-shrink-0 rounded-full bg-rose-500/20 p-1.5">
                      <AlertCircle className="h-5 w-5 text-rose-400" />
                    </div>
                    <span className="text-sm font-medium text-rose-100">{error}</span>
                  </motion.div>
                )}

                <motion.button
                  type="button"
                  onClick={handleSendCode}
                  disabled={isSubmitting || !email}
                  whileHover={isSubmitting || !email ? undefined : { scale: 1.02 }}
                  whileTap={isSubmitting || !email ? undefined : { scale: 0.98 }}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--accent-primary,#2563eb)] px-4 py-2 text-sm font-medium text-white shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:bg-[var(--accent-primary-hover,#1d4ed8)] transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Отправка кода...
                    </>
                  ) : (
                    <>
                      Отправить код
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </motion.button>
              </div>
            </>
          ) : (
            <>
              <h1 className="mb-2 text-center text-[22px] font-semibold tracking-tight text-zinc-50">
                Восстановление пароля
              </h1>
              <p className="mb-6 text-center text-sm text-zinc-400">
                Мы отправили код подтверждения на <br />
                <span className="font-medium text-zinc-300">{email}</span>
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
                       className={`h-16 w-14 rounded-2xl border-2 text-center text-3xl font-bold text-zinc-50 outline-none transition-all duration-200 disabled:opacity-50 ${
                         error
                           ? 'border-rose-500/80 bg-rose-950/40 shadow-[0_0_0_4px_rgba(239,68,68,0.1)]'
                           : 'border-zinc-700/60 bg-zinc-900/80 shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:border-zinc-600/80 focus:border-[var(--accent-primary,#3b82f6)] focus:bg-zinc-900 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.15)] focus:ring-0'
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
                    className="flex items-center gap-3 rounded-xl border-2 border-rose-500/60 bg-gradient-to-r from-rose-950/90 to-rose-900/80 px-4 py-3.5 backdrop-blur-sm shadow-lg"
                  >
                    <div className="flex-shrink-0 rounded-full bg-rose-500/20 p-1.5">
                      <AlertCircle className="h-5 w-5 text-rose-400" />
                    </div>
                    <span className="text-sm font-medium text-rose-100">{error}</span>
                  </motion.div>
                )}

                <motion.button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={isSubmitting || code.join('').length !== 6}
                  whileHover={isSubmitting || code.join('').length !== 6 ? undefined : { scale: 1.02 }}
                  whileTap={isSubmitting || code.join('').length !== 6 ? undefined : { scale: 0.98 }}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--accent-primary,#2563eb)] px-4 py-2 text-sm font-medium text-white shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:bg-[var(--accent-primary-hover,#1d4ed8)] transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Проверка...
                    </>
                  ) : (
                    <>
                      Подтвердить
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
                    {isResending ? 'Отправка...' : 'Отправить код повторно'}
                  </button>
                   <button
                     type="button"
                     onClick={handleChangeEmail}
                     className="text-zinc-400 hover:text-zinc-300 transition-colors"
                   >
                     Изменить email
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

