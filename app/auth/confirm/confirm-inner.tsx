'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

type Status = 'loading' | 'success' | 'error';

export default function ConfirmEmailInner() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setStatus('error');
      return;
    }

    const supabase = createBrowserSupabaseClient();

    supabase.auth
      .exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) {
          console.error(error);
          setStatus('error');
        } else {
          setStatus('success');
        }
      })
      .catch(err => {
        console.error(err);
        setStatus('error');
      });
  }, [searchParams]);

  return (
    <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-10">
      <div className="max-w-md rounded-2xl border border-white/5 bg-card/80 px-8 py-10 text-center shadow-xl backdrop-blur-xl">
        {status === 'loading' && (
          <>
            <p className="text-sm text-muted-foreground">Подтверждаем ваш e-mail...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-4 flex justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            </div>
            <h1 className="mb-2 text-xl font-semibold">E-mail подтверждён</h1>
            <p className="text-sm text-muted-foreground">
              Ваш адрес e-mail успешно подтверждён. Это окно можно закрыть и вернуться к регистрации WELLIFY
              business.
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-4 flex justify-center">
              <AlertCircle className="h-10 w-10 text-red-400" />
            </div>
            <h1 className="mb-2 text-xl font-semibold">Не удалось подтвердить e-mail</h1>
            <p className="text-sm text-muted-foreground">
              Ссылка могла устареть или быть использована ранее. Вернитесь на страницу регистрации и запросите новое
              письмо.
            </p>
          </>
        )}
      </div>
    </main>
  );
}

