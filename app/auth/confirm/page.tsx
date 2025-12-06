import { Suspense } from "react";

import { ConfirmEmailClient } from "./confirm-email-client";



export const dynamic = "force-dynamic"; // чтобы не пытаться статически пререндерить с query-параметрами



export default function ConfirmPage() {

  return (

    <Suspense

      fallback={

        <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">

          <div className="max-w-md w-full rounded-3xl bg-[#05060a] border border-white/5 px-8 py-10 text-center shadow-xl shadow-black/40">

            <div className="w-10 h-10 rounded-full border-2 border-blue-500/40 border-t-blue-500 animate-spin mx-auto mb-6" />

            <h1 className="text-xl font-semibold text-white mb-3">

              Загружаем страницу подтверждения...

            </h1>

            <p className="text-sm text-zinc-400">

              Пожалуйста, подождите несколько секунд.

            </p>

          </div>

        </div>

      }

    >

      <ConfirmEmailClient />

    </Suspense>

  );

}
