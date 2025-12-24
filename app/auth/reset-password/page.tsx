import { Suspense } from "react";
import { ResetPasswordClient } from "./ResetPasswordClient";

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return (
    <main className="fixed top-[112px] left-0 right-0 bottom-0 flex items-center justify-center bg-background px-4 overflow-hidden">
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

