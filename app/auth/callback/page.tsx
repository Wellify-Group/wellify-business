"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || searchParams.get("access_token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setStatus("error");
        return;
      }

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error } = await supabase.auth.exchangeCodeForSession(token);

      if (error) {
        console.error("Exchange Error:", error);
        setStatus("error");
        return;
      }

      setStatus("success");

      // Пауза для показа сообщения 1.5 сек
      setTimeout(() => {
        router.push("/dashboard/director");
      }, 1500);
    };

    run();
  }, [token, router]);

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen text-white">Подождите...</div>;
  }

  if (status === "error") {
    return <div className="flex items-center justify-center min-h-screen text-red-500">
      Ошибка подтверждения. Ссылка недействительна или устарела.
    </div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen text-white text-2xl">
      E-mail успешно подтверждён!
    </div>
  );
}

