import { Suspense } from "react";
import ConfirmEmailClient from "./confirm-client";

export const dynamic = "force-dynamic";

export default function ConfirmEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[color:var(--color-background,#050B13)]">
          <div className="text-foreground text-sm opacity-70">
            Загружаем подтверждение e-mail...
          </div>
        </div>
      }
    >
      <ConfirmEmailClient />
    </Suspense>
  );
}

