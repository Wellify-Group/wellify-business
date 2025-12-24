import { Suspense } from "react";
import { ResetPasswordClient } from "./ResetPasswordClient";

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen pt-[112px] pb-12 flex items-center justify-center bg-background px-4">
      <div className="relative w-full max-w-[640px]">
        <Suspense fallback={<div className="text-sm text-zinc-400">Загрузка...</div>}>
          <ResetPasswordClient />
        </Suspense>
      </div>
    </main>
  );
}

