"use client";



import { useEffect, useState } from "react";

import { useSearchParams, useRouter } from "next/navigation";



type Status = "checking" | "success" | "error";



export function ConfirmEmailClient() {

  const searchParams = useSearchParams();

  const router = useRouter();

  const [status, setStatus] = useState<Status>("checking");



  useEffect(() => {

    // Supabase при переходе по {{ .ActionLink }} уже обрабатывает подтверждение.

    // На фронте мы только читаем параметры и показываем правильный экран.



    const error = searchParams.get("error") ?? searchParams.get("error_code");

    const errorDescription =

      searchParams.get("error_description") ?? searchParams.get("message");



    if (error) {

      setStatus("error");

      console.error("Email confirm error:", error, errorDescription);

      return;

    }



    // Если ошибки нет - считаем, что подтверждение прошло успешно

    setStatus("success");



    // Через пару секунд можно редиректить пользователя.

    // Можешь поменять путь на нужный тебе: /dashboard/director и т.п.

    const timeout = setTimeout(() => {

      router.replace("/auth/login");

    }, 2000);



    return () => clearTimeout(timeout);

  }, [searchParams, router]);



  // UI

  const baseCardClasses =

    "min-h-[60vh] flex items-center justify-center px-4 py-16";

  const panelClasses =

    "max-w-md w-full rounded-3xl bg-[#05060a] border border-white/5 px-8 py-10 text-center shadow-xl shadow-black/40";



  if (status === "checking") {

    return (

      <div className={baseCardClasses}>

        <div className={panelClasses}>

          <div className="w-10 h-10 rounded-full border-2 border-blue-500/40 border-t-blue-500 animate-spin mx-auto mb-6" />

          <h1 className="text-xl font-semibold text-white mb-3">

            Проверяем ссылку...

          </h1>

          <p className="text-sm text-zinc-400">

            Пожалуйста, подождите несколько секунд. Мы подтверждаем ваш e-mail.

          </p>

        </div>

      </div>

    );

  }



  if (status === "error") {

    return (

      <div className={baseCardClasses}>

        <div className={panelClasses}>

          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/50 flex items-center justify-center mx-auto mb-6">

            <span className="text-red-400 text-2xl">✕</span>

          </div>

          <h1 className="text-xl font-semibold text-white mb-3">

            Не удалось подтвердить e-mail

          </h1>

          <p className="text-sm text-zinc-400 mb-6">

            Ссылка устарела или недействительна. Попробуйте ещё раз пройти

            регистрацию или запросите новое письмо.

          </p>

          <button

            onClick={() => router.replace("/auth/register")}

            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors"

          >

            Вернуться к регистрации

          </button>

        </div>

      </div>

    );

  }



  // status === "success"

  return (

    <div className={baseCardClasses}>

      <div className={panelClasses}>

        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/60 flex items-center justify-center mx-auto mb-6">

          <span className="text-emerald-400 text-2xl">✓</span>

        </div>

        <h1 className="text-xl font-semibold text-white mb-3">

          E-mail подтверждён

        </h1>

        <p className="text-sm text-zinc-400 mb-6">

          Ваш адрес e-mail успешно подтверждён. Сейчас мы перенаправим вас на

          страницу входа.

        </p>

        <button

          onClick={() => router.replace("/auth/login")}

          className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors"

        >

          Перейти к входу

        </button>

      </div>

    </div>

  );

}

