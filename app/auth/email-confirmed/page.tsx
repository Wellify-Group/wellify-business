import { Suspense } from "react";
import EmailConfirmedClient from "./EmailConfirmedClient";

export const dynamic = "force-dynamic";

export default function EmailConfirmedPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#020617] flex items-center justify-center px-4">
          <div className="max-w-md w-full rounded-3xl bg-[#050816] border border-white/5 px-8 py-10 text-center shadow-xl shadow-black/40">
            <h1 className="text-white text-xl font-semibold mb-3">
              Подтверждаем e-mail...
            </h1>
            <p className="text-sm text-zinc-400">
              Пожалуйста, подождите несколько секунд. Мы проверяем ссылку подтверждения.
            </p>
          </div>
        </main>
      }
    >
      <EmailConfirmedClient />
    </Suspense>
  );
}
