import { Suspense } from "react";
import RegisterDirectorClient from "./RegisterDirectorClient";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="flex mt-[72px] min-h-[calc(100vh-72px)] items-center justify-center px-4">
          <div className="w-full max-w-xl rounded-3xl bg-[#050816] border border-white/5 px-8 py-10 text-center shadow-xl shadow-black/40">
            <h1 className="text-white text-xl font-semibold mb-3">
              Подтверждаем e-mail...
            </h1>
            <p className="text-sm text-zinc-400">
              Пожалуйста, подождите несколько секунд. Мы проверяем форму
              регистрации.
            </p>
          </div>
        </main>
      }
    >
      <RegisterDirectorClient />
    </Suspense>
  );
}
