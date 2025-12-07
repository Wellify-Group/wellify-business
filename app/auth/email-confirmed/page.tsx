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
      const supabase = createBrowserSupabaseClient();

      // Сначала проверяем, есть ли уже активная сессия с подтвержденным email
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (!sessionError && session?.user && session.user.email_confirmed_at) {
        // Email уже подтвержден, обновляем профиль и показываем успех
        const user = session.user;
        
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
        }

        setStatus('success');
        return;
      }

      // Если нет сессии, пытаемся обработать токен
      if (!tokenHash || !email) {
        // Проверяем, может быть есть code параметр (стандартный формат Supabase)
        const code = searchParams.get('code');
        if (code) {
          // Для code параметра нужна серверная обработка через exchangeCodeForSession
          // Показываем ошибку и просим пользователя попробовать снова
          setError('Пожалуйста, используйте ссылку из письма или попробуйте запросить новую ссылку.');
          setStatus('error');
          return;
        }
        
        setError('Некорректная ссылка подтверждения.');
        setStatus('error');
        return;
      }

      // Пытаемся использовать verifyOtp (может не работать с token_hash)
      try {
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          type: type as 'signup' | 'magiclink' | 'recovery',
          token_hash: tokenHash,
          email,
        });

        if (verifyError) {
          console.error('verifyOtp error', verifyError);
          // Если verifyOtp не работает, проверяем сессию ещё раз
          const { data: { session: newSession } } = await supabase.auth.getSession();
          if (newSession?.user?.email_confirmed_at) {
            // Email подтвержден другим способом
            setStatus('success');
            return;
          }
          
          setError('Не удалось подтвердить e-mail. Попробуйте ещё раз или запросите новую ссылку.');
          setStatus('error');
          return;
        }

        // После verifyOtp получаем пользователя
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          console.error('getUser error', userError);
          setError('Не удалось получить данные пользователя после подтверждения.');
          setStatus('error');
          return;
        }

        const user = userData.user;

        // Синхронизируем профиль
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
        }

        setStatus('success');
      } catch (e) {
        console.error('Error in verifyOtp:', e);
        setError('Произошла ошибка при подтверждении e-mail.');
        setStatus('error');
      }
    };

    run().catch((e) => {
      console.error(e);
      setError('Произошла ошибка при подтверждении e-mail.');
      setStatus('error');
    });
  }, [tokenHash, type, email, searchParams]);

  return (
    <main className="h-screen w-screen flex items-center justify-center px-4 overflow-hidden">
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
        <main className="h-screen w-screen flex items-center justify-center px-4 overflow-hidden">
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
