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
  email: string;
  password: string;
  fullName: string;
  businessName: string;
}

export default function RegisterDirectorClient() {
  const router = useRouter();
  const { language } = useLanguage();

  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
    fullName: "",
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
      setError("Заполните e-mail и пароль.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-black px-4">
      <div className="relative w-full max-w-xl">
        {/* подсветка позади карточки */}
        <div className="pointer-events-none absolute -inset-x-10 -top-24 h-64 rounded-full bg-[radial-gradient(circle_at_top,_rgba(244,244,245,0.16),_transparent)] blur-3xl" />

        <Card className="relative z-10 w-full rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent)] bg-zinc-950/80 shadow-[0_24px_80px_rgba(0,0,0,0.85)] backdrop-blur-xl">
          <CardHeader className="px-8 pt-7 pb-3">
            <CardTitle className="text-center text-[22px] font-semibold tracking-tight text-zinc-50">
              Регистрация директора
            </CardTitle>
            <CardDescription className="mt-2 text-center text-sm text-zinc-400">
              Создайте аккаунт владельца бизнеса, чтобы управлять точками,
              сменами и персоналом в WELLIFY business.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-4 pt-3">
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Имя директора */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
                  Имя и фамилия директора
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    <User className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    autoComplete="name"
                    className="h-10 w-full rounded-xl border border-zinc-700/70 bg-zinc-900/60 pl-9 pr-3 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none focus:ring-0"
                    placeholder="Например, Иван Петров"
                    value={form.fullName}
                    onChange={handleChange("fullName")}
                  />
                </div>
              </div>

              {/* E-mail */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
                  Рабочий e-mail
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    <Mail className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    type="email"
                    autoComplete="email"
                    className="h-10 w-full rounded-xl border border-zinc-700/70 bg-zinc-900/60 pl-9 pr-3 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none focus:ring-0"
                    placeholder="you@business.com"
                    value={form.email}
                    onChange={handleChange("email")}
                  />
                </div>
              </div>

              {/* Пароль */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
                  Пароль
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    <Lock className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    type="password"
                    autoComplete="new-password"
                    className="h-10 w-full rounded-xl border border-zinc-700/70 bg-zinc-900/60 pl-9 pr-3 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none focus:ring-0"
                    placeholder="Минимум 8 символов"
                    value={form.password}
                    onChange={handleChange("password")}
                  />
                </div>
              </div>

              {/* Название бизнеса */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
                  Название бизнеса
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    <Building2 className="h-4 w-4 text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    className="h-10 w-full rounded-xl border border-zinc-700/70 bg-zinc-900/60 pl-9 pr-3 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none focus:ring-0"
                    placeholder="Например, WELLIFY Coffee"
                    value={form.businessName}
                    onChange={handleChange("businessName")}
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs text-rose-400/90">{error}</p>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="mt-1 inline-flex h-10 w-full items-center justify-center rounded-xl bg-zinc-50 text-sm font-medium text-zinc-950 shadow-[0_10px_40px_rgba(0,0,0,0.65)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Регистрация...
                  </>
                ) : (
                  "Зарегистрировать директора"
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col items-center gap-1 px-8 pb-6 pt-2">
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
