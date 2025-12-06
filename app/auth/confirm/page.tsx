"use client";



import { Suspense, useEffect, useState } from "react";

import { useSearchParams, useRouter } from "next/navigation";

import { createBrowserClient } from "@supabase/ssr";



type Status = "checking" | "success" | "error";



function ConfirmEmailInner() {

  const searchParams = useSearchParams();

  const router = useRouter();



  const [status, setStatus] = useState<Status>("checking");

  const [message, setMessage] = useState<string | null>(null);



  useEffect(() => {

    const token_hash = searchParams.get("token_hash");

    const type = searchParams.get("type") || "email";



    if (!token_hash) {

      setStatus("error");

      setMessage("Ссылка недействительна. Попробуйте запросить новое письмо.");

      return;

    }



    const supabase = createBrowserClient(

      process.env.NEXT_PUBLIC_SUPABASE_URL!,

      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    );



    let cancelled = false;



    async function verify() {

      try {

        const { error } = await supabase.auth.verifyOtp({

          type: type as "email",

          token_hash,

        });



        if (cancelled) return;



        if (error) {

          console.error("Email confirmation error", error);

          setStatus("error");

          setMessage(

            "Ссылка устарела или недействительна. Попробуйте пройти регистрацию ещё раз или запросите новое письмо."

          );

          return;

        }



        setStatus("success");

        setMessage("E-mail успешно подтверждён. Перенаправляем в кабинет директора...");

      } catch (e) {

        console.error("Unexpected email confirmation error", e);

        setStatus("error");

        setMessage(

          "Произошла ошибка при подтверждении e-mail. Попробуйте ещё раз или запросите новое письмо."

        );

      }

    }



    verify();



    return () => {

      cancelled = true;

    };

  }, [searchParams]);



  // Отдельный эффект для перехода в дашборд после успешного подтверждения

  const router = useRouter();

  useEffect(() => {

    if (status !== "success") return;



    const timeout = setTimeout(() => {

      router.replace("/dashboard/director");

    }, 2000);



    return () => clearTimeout(timeout);

  }, [status, router]);



  const title =

    status === "checking"

      ? "Подтверждаем e-mail"

      : status === "success"

      ? "E-mail подтверждён"

      : "Не удалось подтвердить e-mail";



  const description =

    status === "checking"

      ? "Подождите, мы подтверждаем вашу почту..."

      : status === "success"

      ? message ||

        "E-mail успешно подтверждён. Сейчас вы будете перенаправлены в кабинет директора."

      : message ||

        "Ссылка устарела или недействительна. Попробуйте пройти регистрацию ещё раз или запросите новое письмо.";



  const isError = status === "error";



  return (

    <div className="min-h-screen flex items-center justify-center bg-[#020817] px-4">

      <div className="max-w-md w-full rounded-3xl border border-white/5 bg-[#020617] px-8 py-10 shadow-[0_0_80px_rgba(15,23,42,0.8)]">

        <div className="flex justify-center mb-6">

          <div

            className={`flex h-12 w-12 items-center justify-center rounded-full ${

              isError ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"

            }`}

          >

            {status === "checking" && (

              <span className="h-6 w-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />

            )}

            {status === "success" && (

              <span className="text-2xl leading-none">✓</span>

            )}

            {status === "error" && (

              <span className="text-2xl leading-none">!</span>

            )}

          </div>

        </div>



        <h1 className="text-center text-2xl font-semibold text-white mb-3">

          {title}

        </h1>



        <p className="text-center text-sm text-slate-300 mb-8">{description}</p>



        {isError ? (

          <button

            onClick={() => router.replace("/login")}

            className="w-full inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-500 transition"

          >

            Перейти на страницу входа

          </button>

        ) : (

          <button

            disabled

            className="w-full inline-flex items-center justify-center rounded-2xl bg-blue-600/60 px-4 py-3 text-sm font-medium text-white cursor-default"

          >

            Подождите, выполняется перенаправление...

          </button>

        )}

      </div>

    </div>

  );

}



function LoadingCard() {

  return (

    <div className="min-h-screen flex items-center justify-center bg-[#020817] px-4">

      <div className="max-w-md w-full rounded-3xl border border-white/5 bg-[#020617] px-8 py-10 shadow-[0_0_80px_rgba(15,23,42,0.8)]">

        <div className="flex justify-center mb-6">

          <span className="h-8 w-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />

        </div>

        <h1 className="text-center text-2xl font-semibold text-white mb-3">

          Подтверждаем e-mail

        </h1>

        <p className="text-center text-sm text-slate-300">

          Подождите, мы подтверждаем вашу почту...

        </p>

      </div>

    </div>

  );

}



export default function ConfirmEmailPage() {

  return (

    <Suspense fallback={<LoadingCard />}>

      <ConfirmEmailInner />

    </Suspense>

  );

}
