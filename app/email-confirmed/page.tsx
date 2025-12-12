"use client";

import { CheckCircle2 } from "lucide-react";

export default function EmailConfirmedPage() {
  const handleClose = () => {
    // Если вкладка открыта в новом окне – попробуем закрыть
    if (window.opener) {
      window.close();
    } else {
      // fallback: просто вернем на регистрацию
      window.location.href = "/register";
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-xl rounded-[32px] border border-emerald-500/25 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_55%),_rgba(5,15,20,0.96)] px-8 py-10 shadow-[0_24px_80px_rgba(0,0,0,0.9)]">
        <div className="flex flex-col items-center text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-emerald-400" />

          <h1 className="text-2xl font-semibold text-zinc-50">
            Подтверждение e-mail
          </h1>

          <p className="max-w-md text-sm leading-relaxed text-zinc-300">
            Ваш e-mail успешно подтверждён. Теперь вы можете вернуться
            к регистрации директора в WELLIFY business и продолжить настройку
            аккаунта.
          </p>

          <p className="text-xs text-emerald-400">
            E-mail подтверждён. Можно закрыть это окно.
          </p>

          <button
            type="button"
            onClick={handleClose}
            className="mt-2 inline-flex h-10 items-center justify-center rounded-full bg-emerald-500 px-6 text-sm font-semibold text-emerald-950 shadow-[0_18px_60px_rgba(16,185,129,0.55)] transition hover:bg-emerald-400"
          >
            Закрыть окно
          </button>

          <button
            type="button"
            onClick={() => (window.location.href = "/register")}
            className="mt-3 text-xs text-zinc-400 underline-offset-4 hover:underline"
          >
            Вернуться к регистрации
          </button>
        </div>
      </div>
    </main>
  );
}
