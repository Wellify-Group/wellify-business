'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export default function EmailConfirmedPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('Подтверждаем ваш e-mail...');

  useEffect(() => {
    const code = searchParams.get('code');

    // Supabase присылает code в query (?code=...)
    if (!code) {
      setStatus('error');
      setMessage('Не удалось подтвердить e-mail: отсутствует код подтверждения.');
      return;
    }

    const run = async () => {
      const supabase = createBrowserSupabaseClient();

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('exchangeCodeForSession error', error);
        setStatus('error');
        setMessage('Произошла ошибка при подтверждении e-mail. Попробуйте ещё раз.');
        return;
      }

      // Здесь e-mail уже подтверждён (email_confirmed_at заполнено).
      setStatus('ok');
      setMessage('Ваша почта подтверждена. Вы можете закрыть эту вкладку и вернуться на страницу регистрации.');
    };

    run();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050816]">
      <div className="w-full max-w-md rounded-3xl border border-white/5 bg-gradient-to-b from-white/5 to-white/[0.02] px-8 py-10 text-center shadow-xl shadow-black/60">
        <h1 className="text-2xl font-semibold text-white mb-3">
          WELLIFY business
        </h1>
        <p
          className={
            status === 'error'
              ? 'text-red-400 text-sm'
              : 'text-zinc-300 text-sm'
          }
        >
          {message}
        </p>
      </div>
    </div>
  );
}

