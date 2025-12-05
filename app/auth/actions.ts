'use server';

import { redirect } from 'next/navigation';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function registerDirector(formData: FormData) {
  const full_name = String(formData.get('full_name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm_password') ?? '');

  if (!full_name || !email || password.length < 8) {
    return {
      error: 'Введите имя, email и пароль не короче 8 символов.',
    };
  }

  if (password !== confirm) {
    return {
      error: 'Пароль и подтверждение пароля не совпадают.',
    };
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // ВАЖНО: все кастомные поля только здесь
      data: {
        full_name,
        role: 'director',
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Получаем userId из auth.uid() после успешного signUp
  // Supabase автоматически создает профиль через триггер, поэтому используем только UPDATE
  if (data.user) {
    const { data: userData, error: getUserError } = await supabase.auth.getUser();
    
    if (getUserError || !userData?.user?.id) {
      console.error('Failed to get user after signUp:', getUserError);
      return { error: 'Не удалось получить данные пользователя после регистрации' };
    }

    const userId = userData.user.id;

    // Обновляем профиль в public.profiles (профиль уже создан автоматически триггером)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        email,
        full_name,
        role: 'director',
        phone_verified: false,
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Profile update error', profileError);
      // пользователю можно не показывать, достаточно логировать
    }
  }

  return {
    success:
      'Мы создали аккаунт и отправили письмо для подтверждения e-mail. Проверьте почту (включая спам).',
  };
}



