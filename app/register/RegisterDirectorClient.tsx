"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useLanguage } from "@/components/language-provider";
import { TelegramVerificationStep } from "./TelegramVerificationStep";

type Step = 1 | 2 | 3 | 4;

export default function RegisterDirectorClient() {
  const router = useRouter();
  const { language } = useLanguage();
  const supabase = createBrowserSupabaseClient();

  const localeForAPI = language === "ua" ? "uk" : language;

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    birthDate: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });

  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  // ---------------- STEP 1 ----------------
  const handleStep1 = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (
      !form.firstName ||
      !form.lastName ||
      !form.middleName ||
      !form.birthDate
    ) {
      setError("Заполните все обязательные поля.");
      return;
    }

    if (form.password.length < 8) {
      setError("Пароль должен быть не короче 8 символов.");
      return;
    }

    if (form.password !== form.passwordConfirm) {
      setError("Пароли не совпадают.");
      return;
    }

    setStep(2);
  };

  // ---------------- STEP 2 ----------------
  const handleSendEmail = async () => {
    setError(null);
    setLoading(true);

    try {
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/email-confirmed`
          : undefined;

      const fullName = `${form.lastName} ${form.firstName} ${form.middleName}`;

      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            first_name: form.firstName,
            last_name: form.lastName,
            middle_name: form.middleName,
            full_name: fullName,
            birth_date: form.birthDate,
            language: localeForAPI,
            role: "директор",
          },
          emailRedirectTo: redirectTo,
        },
      });

      if (error || !data?.user) {
        throw error ?? new Error("Не удалось создать пользователя");
      }

      setRegisteredUserId(data.user.id);
      setRegisteredEmail(data.user.email ?? form.email);
      setStep(3);
    } catch (e: any) {
      setError(e.message ?? "Ошибка отправки письма");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- STEP 4 ----------------
  const finishRegistration = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register-director", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          middleName: form.middleName,
          birthDate: form.birthDate,
          language: localeForAPI,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Ошибка завершения регистрации");
      }

      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });

      if (signInError) {
        throw signInError;
      }

      router.push("/dashboard/director");
    } catch (e: any) {
      setError(e.message ?? "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- RENDER ----------------
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-center">
            Регистрация директора
          </CardTitle>
          <CardDescription className="text-center">
            Уже есть аккаунт?{" "}
            <Link href="/auth/login" className="underline">
              Войти
            </Link>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-4">
              <input
                placeholder="Имя"
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
                className="input"
              />
              <input
                placeholder="Отчество"
                value={form.middleName}
                onChange={(e) =>
                  setForm({ ...form, middleName: e.target.value })
                }
                className="input"
              />
              <input
                placeholder="Фамилия"
                value={form.lastName}
                onChange={(e) =>
                  setForm({ ...form, lastName: e.target.value })
                }
                className="input"
              />
              <input
                type="date"
                value={form.birthDate}
                onChange={(e) =>
                  setForm({ ...form, birthDate: e.target.value })
                }
                className="input"
              />

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Пароль"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="input pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>

              <input
                type="password"
                placeholder="Подтвердите пароль"
                value={form.passwordConfirm}
                onChange={(e) =>
                  setForm({ ...form, passwordConfirm: e.target.value })
                }
                className="input"
              />

              <Button type="submit" className="w-full">
                Далее
              </Button>
            </form>
          )}

          {step === 2 && (
            <>
              <input
                placeholder="E-mail"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                className="input"
              />
              <Button
                onClick={handleSendEmail}
                disabled={loading}
                className="w-full"
              >
                Отправить письмо
              </Button>
            </>
          )}

          {step === 3 && registeredUserId && registeredEmail && (
            <TelegramVerificationStep
              userId={registeredUserId}
              email={registeredEmail}
              language={localeForAPI}
              onVerified={() => setStep(4)}
            />
          )}

          {step === 4 && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle2 className="h-16 w-16 text-emerald-500" />
              <p className="text-center">
                Регистрация завершена. Переходим в дашборд.
              </p>
              <Button
                onClick={finishRegistration}
                disabled={loading}
                className="w-full"
              >
                Перейти в дашборд
              </Button>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
