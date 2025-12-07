'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

function EmailConfirmedInner() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [error, setError] = useState<string | null>(null);

  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') || 'signup';
  const email = searchParams.get('email') || undefined;

  useEffect(() => {
    const run = async () => {
      if (!tokenHash || !email) {
        setError('Некорректная ссылка подтверждения.');
        setStatus('error');
        return;
      }

      const supabase = createBrowserSupabaseClient();

      // 1. Подтверждаем email через Supabase
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        type: type as 'signup' | 'magiclink' | 'recovery',
        token_hash: tokenHash,
        email,
      });

      if (verifyError) {
        console.error('verifyOtp error', verifyError);
        setError('Не удалось подтвердить e-mail. Попробуйте ещё раз или запросите новую ссылку.');
        setStatus('error');
        return;
      }

      // 2. Получаем текущего пользователя
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        console.error('getUser error', userError);
        setError('Не удалось получить данные пользователя после подтверждения.');
        setStatus('error');
        return;
      }

      const user = userData.user;

      // 3. Синхронизируем профиль: public.profiles
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            email: user.email,
            email_verified: true,
            роль: 'директор',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      if (upsertError) {
        console.error('profiles upsert error', upsertError);
        // но даже при ошибке профиля почта уже подтверждена, поэтому статус успеха
      }

      setStatus('success');
    };

    run().catch((e) => {
      console.error(e);
      setError('Произошла ошибка при подтверждении e-mail.');
      setStatus('error');
    });
  }, [tokenHash, type, email]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl bg-zinc-950/80 border border-zinc-800 px-8 py-10 shadow-xl">
        {status === 'pending' && (
          <>
            <h1 className="text-xl font-semibold text-white mb-3">
              Подтверждение e-mail
            </h1>
            <p className="text-sm text-zinc-400">
              Пожалуйста, подождите, мы подтверждаем вашу почту...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <h1 className="text-xl font-semibold text-white mb-3">
              E-mail подтверждён
            </h1>
            <p className="text-sm text-zinc-400 mb-4">
              Ваша почта успешно подтверждена. Можете закрыть эту вкладку и вернуться к окну регистрации.
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="text-xl font-semibold text-white mb-3">
              Ошибка подтверждения
            </h1>
            <p className="text-sm text-zinc-400 mb-4">
              {error ?? 'Не удалось подтвердить e-mail. Попробуйте ещё раз запросить письмо.'}
            </p>
          </>
        )}
      </div>
    </main>
  );
}

export default function EmailConfirmedPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full rounded-2xl bg-zinc-950/80 border border-zinc-800 px-8 py-10 shadow-xl">
            <h1 className="text-xl font-semibold text-white mb-3">
              Подтверждение e-mail
            </h1>
            <p className="text-sm text-zinc-400">
              Пожалуйста, подождите...
            </p>
          </div>
        </main>
      }
    >
      <EmailConfirmedInner />
    </Suspense>
  );
}
