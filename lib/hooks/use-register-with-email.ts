"use client";



import { FormEvent, useState } from "react";

import { useRouter } from "next/navigation";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";



export function useRegisterWithEmail() {

  const router = useRouter();

  const supabase = createBrowserSupabaseClient();



  const [loading, setLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);



  async function handleSubmit(e: FormEvent<HTMLFormElement>) {

    e.preventDefault();

    setErrorMsg(null);

    setLoading(true);



    const formData = new FormData(e.currentTarget);

    const email = String(formData.get("email") ?? "").trim();

    const password = String(formData.get("password") ?? "");



    if (!email || !password) {

      setErrorMsg("Введите e-mail и пароль");

      setLoading(false);

      return;

    }



    const { error } = await supabase.auth.signUp({

      email,

      password,

      options: {

        // КУДА Supabase будет редиректить после клика по ссылке в письме

        emailRedirectTo: `${window.location.origin}/auth/confirm`,

      },

    });



    setLoading(false);



    if (error) {

      setErrorMsg(error.message);

      return;

    }



    // Страница "письмо отправлено" – у тебя уже есть свой экран, подставь нужный путь

    router.push("/auth/check-email");

  }



  return { handleSubmit, loading, errorMsg };

}

