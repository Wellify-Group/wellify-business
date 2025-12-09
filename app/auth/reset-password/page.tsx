import { Suspense } from "react";
import { ResetPasswordClient } from "./ResetPasswordClient";

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return (
    <main className="flex mt-[72px] min-h-[calc(100vh-72px)] items-center justify-center px-4">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Загрузка...</div>}>
        <ResetPasswordClient />
      </Suspense>
    </main>
  );
}

