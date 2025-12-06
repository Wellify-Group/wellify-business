"use client";



import { useEffect, useState } from "react";

import { useSearchParams, useRouter } from "next/navigation";

import { createBrowserClient } from "@supabase/ssr";



type Status = "loading" | "success" | "error";



export const dynamic = "force-dynamic";



export default function EmailConfirmPage() {

  const searchParams = useSearchParams();

  const router = useRouter();

  const [status, setStatus] = useState<Status>("loading");



  useEffect(() => {

    const run = async () => {

      const error = searchParams.get("error");

      const code = searchParams.get("code");



      // Если Supabase вернул ошибку в query

      if (error || !code) {

        setStatus("error");

        return;

      }



      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );



      const { error: exchangeError } =

        await supabase.auth.exchangeCodeForSession(code);



      if (exchangeError) {

        console.error("Email confirm error", exchangeError);

        setStatus("error");

        return;

      }



      setStatus("success");



      // Дадим пользователю увидеть сообщение и уводим на дашборд

      setTimeout(() => {

        router.replace("/dashboard/director"); // или твой первый экран после логина

      }, 1500);

    };



    run();

    // searchParams стабилен для данной загрузки страницы

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, []);



  if (status === "loading") {

    return (

      <div className="flex min-h-screen items-center justify-center">

        <div className="rounded-3xl bg-zinc-950/80 px-8 py-10 shadow-xl border border-zinc-800 max-w-md w-full text-center">

          <div className="mb-4 h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">

            <div className="h-4 w-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />

          </div>

          <h1 className="text-xl font-semibold mb-2">Подтверждаем e-mail…</h1>

          <p className="text-sm text-zinc-400">

            Пара секунд. Мы проверяем ссылку и авторизуем вас в WELLIFY business.

          </p>

        </div>

      </div>

    );

  }



  if (status === "error") {

    return (

      <div className="flex min-h-screen items-center justify-center">

        <div className="rounded-3xl bg-zinc-950/80 px-8 py-10 shadow-xl border border-red-500/40 max-w-md w-full text-center">

          <div className="mb-4 h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">

            <span className="text-red-400 text-xl">✕</span>

          </div>

          <h1 className="text-xl font-semibold mb-2">

            Не удалось подтвердить e-mail

          </h1>

          <p className="text-sm text-zinc-400 mb-6">

            Ссылка устарела или недействительна. Попробуйте ещё раз пройти

            регистрацию или запросите новое письмо.

          </p>

          <button

            onClick={() => router.replace("/auth/login")}

            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"

          >

            Перейти на страницу входа

          </button>

        </div>

      </div>

    );

  }



  // success

  return (

    <div className="flex min-h-screen items-center justify-center">

      <div className="rounded-3xl bg-zinc-950/80 px-8 py-10 shadow-xl border border-emerald-500/40 max-w-md w-full text-center">

        <div className="mb-4 h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">

          <span className="text-emerald-400 text-xl">✔</span>

        </div>

        <h1 className="text-xl font-semibold mb-2">

          E-mail успешно подтверждён

        </h1>

        <p className="text-sm text-zinc-400">

          Мы вошли в ваш аккаунт WELLIFY business. Сейчас откроется дашборд.

        </p>

      </div>

    </div>

  );

}
