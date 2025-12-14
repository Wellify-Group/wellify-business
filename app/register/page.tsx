import { Suspense } from "react";
import RegisterDirectorClient from "./RegisterDirectorClient";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="flex pt-24 min-h-[calc(100vh-112px)] md:min-h-[calc(100vh-112px)] items-center justify-center px-4">
          <div className="w-full max-w-xl rounded-3xl bg-card border border-border px-8 py-10 text-center shadow-[var(--shadow-modal)]">
            <h1 className="text-foreground text-xl font-semibold mb-3">
              Подтверждаем e-mail...
            </h1>
            <p className="text-sm text-muted-foreground">
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
