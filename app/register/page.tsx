"use client";

import { Suspense } from "react";
import RegisterDirectorClient from "./RegisterDirectorClient";
import { useLanguage } from "@/components/language-provider";

export const dynamic = "force-dynamic";

function RegisterFallback() {
  const { t } = useLanguage();
  
  return (
    <main className="flex pt-24 min-h-[calc(100vh-112px)] md:min-h-[calc(100vh-112px)] items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-3xl bg-card border border-border px-8 py-10 text-center">
        <h1 className="text-foreground text-xl font-semibold mb-3">
          {t<string>("register_loading_title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t<string>("register_loading_message")}
        </p>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterFallback />}>
      <RegisterDirectorClient />
    </Suspense>
  );
}
