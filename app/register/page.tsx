import { Suspense } from "react";
import RegisterDirectorClient from "./RegisterDirectorClient";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="flex mt-[72px] min-h-[calc(100vh-72px)] items-center justify-center px-4">
          <div className="w-full max-w-xl border border-white/5 bg-[radial-gradient(circle_at_top,_rgba(62,132,255,0.18),_transparent_55%),_rgba(7,13,23,0.96)] shadow-[0_18px_70px_rgba(0,0,0,0.75)] backdrop-blur-xl rounded-3xl px-6 py-8">
            <div className="mb-4 h-4 w-32 rounded-full bg-zinc-800 mx-auto" />
            <div className="mb-6 h-6 w-48 rounded-full bg-zinc-800 mx-auto" />
            <div className="space-y-3">
              <div className="h-10 rounded-lg bg-zinc-900/70" />
              <div className="h-10 rounded-lg bg-zinc-900/70" />
              <div className="h-10 rounded-lg bg-zinc-900/70" />
            </div>
          </div>
        </main>
      }
    >
      <RegisterDirectorClient />
    </Suspense>
  );
}
