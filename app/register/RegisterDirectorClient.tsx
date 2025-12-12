"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Lock, Building2, User, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

interface FormState {
  fullName: string;
  email: string;
  password: string;
  businessName: string;
}

export default function RegisterDirectorClient() {
  const router = useRouter();
  const { language } = useLanguage();

  const [form, setForm] = useState<FormState>({
    fullName: "",
    email: "",
    password: "",
    businessName: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange =
    (field: keyof FormState) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.email || !form.password) {
      setError("Укажите рабочий e-mail и пароль.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          fullName: form.fullName || undefined,
          businessName: form.businessName || undefined,
          language,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(
          data?.error ||
            "Не удалось завершить регистрацию. Попробуйте ещё раз."
        );
        setIsSubmitting(false);
        return;
      }

      router.push("/login?registered=1");
    } catch (err) {
      console.error("Register error", err);
      setError("Внутренняя ошибка. Попробуйте позже.");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-start justify-center bg-[radial-gradient(circle_at_top,_#020617,_#020617)] px-4 pt-28 pb-10">
      <div className="relative w-full max-w-2xl">
        {/* мягкая подсветка за карточкой */}
        <div className="pointer-events-none absolute -inset-x-16 -top-32 h-64 rounded-full bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.22),_transparent)] blur-3xl" />

        <Card className="relative z-10 w-full rounded-[32px] border border-[rgba(148,163,184,0.35)] bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.96),_rgba(9,9,11,0.98))] shadow-[0_30px_120px_rgba(0,0,0,0.85)] backdrop-blur-2xl">
          <CardHeader className="px-10 pt-8 pb-5">
            <div className="mb-3 flex items-center justify-center">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-300">
                Шаг 1 · Основные данные директора
              </span>
            </div>

            <CardTitle className="text-center text-[24px] font-semibold tracking-tight text-zinc-50">
              Регистрация директора
            </CardTitle>

            <CardDescription className="mt-2 text-center text-sm leading-relaxed text-zinc-400">
              Создайте аккаунт владельца бизнеса, чтобы управлять точками,
              сменами и персоналом в WELLIFY business. На первом шаге укажите
              данные директора и базовую информацию о компании.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-10 pb-4 pt-2">
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Имя и фамилия директора */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                  Имя и фамилия директора
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    <User className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    autoComplete="name"
                    className="h-11 w-full rounded-2xl border border-zinc-800/80 bg-zinc-950/60 pl-9 pr-3 text-sm text-zinc-50 placeholder:text-zinc-500 outline-none transition-colors focus:border-[var(--accent-primary,#3b82f6)]"
                    placeholder="Например, Иван Петров"
                    value={form.fullName}
                    onChange={handleChange("fullName")}
                  />
                </div>
              </div>

              {/* Рабочий e-mail */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                  Рабочий e-mail
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    <Mail className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    type="email"
                    autoComplete="email"
                    className="h-11 w-full rounded-2xl border border-zinc-800/80 bg-zinc-950/60 pl-9 pr-3 text-sm text-zinc-50 placeholder:text-zinc-500 outline-none transition-colors focus:border-[var(--accent-primary,#3b82f6)]"
                    placeholder="you@business.com"
                    value={form.email}
                    onChange={handleChange("email")}
                  />
                </div>
              </div>

              {/* Пароль */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                  Пароль для входа
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    <Lock className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    type="password"
                    autoComplete="new-password"
                    className="h-11 w-full rounded-2xl border border-zinc-800/80 bg-zinc-950/60 pl-9 pr-3 text-sm text-zinc-50 placeholder:text-zinc-500 outline-none transition-colors focus:border-[var(--accent-primary,#3b82f6)]"
                    placeholder="Минимум 8 символов"
                    value={form.password}
                    onChange={handleChange("password")}
                  />
                </div>
              </div>

              {/* Название бизнеса */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                  Название бизнеса
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    <Building2 className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    className="h-11 w-full rounded-2xl border border-zinc-800/80 bg-zinc-950/60 pl-9 pr-3 text-sm text-zinc-50 placeholder:text-zinc-500 outline-none transition-colors focus:border-[var(--accent-primary,#3b82f6)]"
                    placeholder="Например, WELLIFY Coffee"
                    value={form.businessName}
                    onChange={handleChange("businessName")}
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs leading-snug text-rose-400/90">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="mt-1 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-[var(--accent-primary,#2563eb)] text-sm font-semibold text-white shadow-[0_18px_60px_rgba(37,99,235,0.55)] transition hover:bg-[var(--accent-primary-hover,#1d4ed8)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Регистрируем директора...
                  </>
                ) : (
                  "Зарегистрировать директора"
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col items-center gap-1 px-10 pb-7 pt-2">
            <p className="text-xs text-zinc-500">
              У вас уже есть аккаунт директора?
            </p>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-xs font-medium text-zinc-200 underline-offset-4 hover:underline"
            >
              Войти в WELLIFY business
            </button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
