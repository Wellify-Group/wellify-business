import { Suspense } from "react";
import { ResetPasswordClient } from "./ResetPasswordClient";

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen pt-[112px] flex items-center justify-center bg-background px-4">
      <div className="relative w-full max-w-[640px]">
        <Suspense fallback={
          <div className="w-full rounded-[32px] border border-border bg-card shadow-modal backdrop-blur-2xl px-10 py-10">
            <div className="text-center text-sm text-zinc-400">Загрузка...</div>
          </div>
        }>
          <ResetPasswordClient />
        </Suspense>
      </div>
    </main>
  );
}

