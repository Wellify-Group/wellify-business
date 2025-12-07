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
  // Bug 1 Fix: Используем UPSERT вместо UPDATE, так как профиль может не существовать
  if (data.user) {
    const userId = data.user.id;

    // Используем UPSERT для создания или обновления профиля
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email,
        full_name,
        role: 'director',
        phone_verified: false,
      }, { onConflict: "id" });

    if (profileError) {
      console.error('Profile upsert error', profileError);
      // пользователю можно не показывать, достаточно логировать
    }
  }

  return {
    success:
      'Мы создали аккаунт и отправили письмо для подтверждения e-mail. Проверьте почту (включая спам).',
  };
}



