'use client';

import { useEffect } from 'react';

import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export default function EmailConfirmedPage() {
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    const syncProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { id, email, user_metadata } = user;

        const { error } = await supabase.from('profiles').upsert(
          {
            // колонка должна совпадать с твоей схемой!
            uuid: id,
            email,
            имя: user_metadata.firstName ?? null,
            фамилия: user_metadata.lastName ?? null,
            отчество: user_metadata.middleName ?? null,
            роль: user_metadata.role ?? 'director',
          },
          {
            onConflict: 'uuid', // или нужное имя колонки, но точно не 'id', если её нет
          }
        );

        if (error) {
          console.error('Error upserting profile', error);
        }
      } catch (err) {
        console.error('Unexpected error syncing profile', err);
      }
    };

    // запускаем без .catch
    void syncProfile();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="rounded-3xl bg-[#050816] px-8 py-10 shadow-xl max-w-md w-full text-center">
        <h1 className="text-2xl font-semibold mb-4">E-mail подтверждён</h1>
        <p className="text-sm opacity-80">
          Ваша почта успешно подтверждена. Можете закрыть эту вкладку и вернуться к окну регистрации, чтобы продолжить.
        </p>
      </div>
    </main>
  );
}
