'use client';

import { useEffect } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export default function EmailConfirmedPage() {
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    const syncProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { id, email, user_metadata } = user;

      // безопасно, без выброса ошибок наружу
      await supabase
        .from('profiles')
        .upsert(
          {
            id: id,
            email,
            first_name: user_metadata.first_name ?? user_metadata.firstName ?? null,
            last_name: user_metadata.last_name ?? user_metadata.lastName ?? null,
            middle_name: user_metadata.middle_name ?? user_metadata.middleName ?? null,
            birth_date: user_metadata.birth_date ?? user_metadata.birthDate ?? null,
            role: user_metadata.role ?? 'director',
          },
          { onConflict: 'id' }
        )
        .catch(console.error);
    };

    syncProfile().catch(console.error);
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050816] px-4">
      <div className="rounded-3xl bg-[#050816] border border-white/5 px-8 py-10 shadow-xl max-w-md w-full text-center">
        <h1 className="text-2xl font-semibold text-white mb-4">
          E-mail подтверждён
        </h1>
        <p className="text-sm text-zinc-300 opacity-80">
          Ваша почта успешно подтверждена. Можете закрыть эту вкладку и вернуться к окну регистрации, чтобы продолжить.
        </p>
      </div>
    </main>
  );
}
