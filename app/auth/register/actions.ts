'use server'

import { z } from 'zod'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { serverConfig } from '@/lib/config/serverConfig.server'

const registerSchema = z.object({
  firstName: z.string().min(1, 'Укажите имя'),
  lastName: z.string().min(1, 'Укажите фамилию'),
  middleName: z.string().optional(),
  birthDate: z.string().min(1, 'Укажите дату рождения'),
  email: z.string().email('Некорректный e-mail'),
  password: z.string().min(6, 'Минимум 6 символов'),
  phone: z.string().optional()
})

export async function registerDirector(formData: FormData) {
  try {
    const rawData = {
      firstName: String(formData.get('firstName') || ''),
      lastName: String(formData.get('lastName') || ''),
      middleName: formData.get('middleName')
        ? String(formData.get('middleName'))
        : undefined,
      birthDate: String(formData.get('birthDate') || ''),
      email: String(formData.get('email') || ''),
      password: String(formData.get('password') || ''),
      phone: formData.get('phone') ? String(formData.get('phone')) : undefined
    }

    const parsed = registerSchema.safeParse(rawData)

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]

      const message =
        firstIssue?.message || 'Проверьте корректность данных'

      return {
        success: false as const,
        error: message
      }
    }

    const { firstName, lastName, middleName, birthDate, email, password, phone } =
      parsed.data

    const supabase = await createServerSupabaseClient()

    const { serverConfig } = await import('@/lib/config/serverConfig.server');
    const redirectBase = serverConfig.appBaseUrl;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${redirectBase}/auth/confirm`,
        data: {
          first_name: firstName,
          last_name: lastName,
          middle_name: middleName,
          birth_date: birthDate,
          phone,
          role: 'director'
        }
      }
    })

    if (error) {
      console.error('Supabase signUp error:', error)
      return {
        success: false as const,
        error:
          error.message ||
          'Не удалось отправить письмо. Попробуйте ещё раз или позже.'
      }
    }

    // Сам факт вызова auth.signUp с включённым шаблоном Confirm sign up
    // в Supabase запускает отправку письма.
    return {
      success: true as const,
      message: `Письмо с подтверждением отправлено на ${email}. Перейдите по ссылке в письме.`
    }
  } catch (err) {
    console.error('registerDirector unexpected error:', err)
    return {
      success: false as const,
      error: 'Произошла ошибка при регистрации. Попробуйте ещё раз.'
    }
  }
}

export async function createDirectorProfile(payload: {
  firstName: string
  lastName: string
  middleName?: string
  birthDate: string
  email: string
}) {
  const supabase = await createServerSupabaseClient()

  // Получаем текущего пользователя
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Error getting user:', userError)
    return {
      success: false as const,
      error: 'Пользователь не авторизован. Пожалуйста, войдите в систему.',
    }
  }

  // Проверяем, что email подтверждён
  if (!user.email_confirmed_at) {
    return {
      success: false as const,
      error: 'E-mail не подтверждён. Пожалуйста, подтвердите e-mail перед продолжением.',
    }
  }

  const { firstName, lastName, middleName, birthDate, email } = payload

  // Делаем upsert в profiles
  const { error: upsertError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      email: email,
      first_name: firstName,
      last_name: lastName,
      middle_name: middleName || null,
      birth_date: birthDate,
      role: 'director',
      phone: null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'id'
    })

  if (upsertError) {
    console.error('Error creating/updating profile:', upsertError)
    return {
      success: false as const,
      error: upsertError.message || 'Ошибка при создании профиля',
    }
  }

  return {
    success: true as const,
  }
}

export async function updateDirectorPhone(phone: string) {
  const supabase = await createServerSupabaseClient()

  // Получаем текущего пользователя
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Error getting user:', userError)
    return {
      success: false as const,
      error: 'Пользователь не авторизован. Пожалуйста, войдите в систему.',
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ 
      phone: phone, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', user.id)

  if (error) {
    console.error('Error updating phone:', error)
    return { 
      success: false as const, 
      error: error.message 
    }
  }

  return { success: true as const }
}