'use client';

import { Suspense } from 'react';
import ConfirmEmailInner from './confirm-inner';

export default function ConfirmEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-10">
          <div className="rounded-2xl border border-white/5 bg-card/80 px-8 py-10 text-center shadow-lg backdrop-blur-xl">
            <p className="text-sm text-muted-foreground">Подтверждаем e-mail...</p>
          </div>
        </main>
      }
    >
      <ConfirmEmailInner />
    </Suspense>
  );
}
