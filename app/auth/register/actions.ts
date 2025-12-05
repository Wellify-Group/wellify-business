'use server'

import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export interface RegisterDirectorResult {
  success: boolean
  error?: string
  message?: string
}

export async function registerDirector(
  formData: FormData
): Promise<RegisterDirectorResult> {
  try {
    const fullName = formData.get('full_name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirm_password') as string
    const phone = formData.get('phone') as string | null
    const businessName = formData.get('business_name') as string | null

    // Валидация
    if (!fullName || !email || !password) {
      return {
        success: false,
        error: 'Заполните все обязательные поля'
      }
    }

    if (password.length < 8) {
      return {
        success: false,
        error: 'Пароль должен содержать минимум 8 символов'
      }
    }

    if (password !== confirmPassword) {
      return {
        success: false,
        error: 'Пароли не совпадают'
      }
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Используем admin client для проверки существующего пользователя
    const supabaseAdmin = createAdminSupabaseClient()

    // Проверяем, существует ли пользователь
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    )

    if (userExists) {
      return {
        success: false,
        error: 'Пользователь с таким email уже зарегистрирован'
      }
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    
    // Создаем пользователя через admin API с email_confirm = false
    // Это создаст пользователя, но не отправит email автоматически
    const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: false, // Требуем подтверждение email
      user_metadata: {
        role: 'director',
        full_name: fullName,
        phone: phone || null,
        business_name: businessName || null
      }
    })

    if (signUpError || !signUpData.user) {
      console.error('Sign up error:', signUpError)
      return {
        success: false,
        error: signUpError?.message || 'Ошибка при регистрации'
      }
    }

    // Обновляем профиль в таблице profiles
    // Supabase автоматически создает профиль через триггер, поэтому используем только UPDATE
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: fullName,
        role: 'director',
        phone: phone || null,
        phone_verified: false
      })
      .eq('id', signUpData.user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
      // Пытаемся удалить пользователя, если обновление профиля не удалось
      await supabaseAdmin.auth.admin.deleteUser(signUpData.user.id)
      return {
        success: false,
        error: 'Ошибка при обновлении профиля'
      }
    }

    // Генерируем ссылку для подтверждения email
    // В production Supabase должен автоматически отправить email при создании пользователя
    // если в настройках проекта включена отправка email
    // Для тестирования можно использовать generateLink
    // Используем тип 'invite' для генерации ссылки подтверждения email для уже созданного пользователя
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: normalizedEmail,
      options: {
        redirectTo: `${siteUrl}/auth/callback`
      }
    })

    if (linkError) {
      console.error('Link generation error:', linkError)
    } else if (linkData?.properties?.action_link) {
      // В development режиме можно логировать ссылку для тестирования
      // В production Supabase отправит email автоматически
      console.log('[DEV] Email confirmation link:', linkData.properties.action_link)
    }

    return {
      success: true,
      message: 'Регистрация успешна! Проверьте вашу почту для подтверждения email.'
    }
  } catch (error: any) {
    console.error('Register director error:', error)
    return {
      success: false,
      error: error.message || 'Произошла ошибка при регистрации'
    }
  }
}

