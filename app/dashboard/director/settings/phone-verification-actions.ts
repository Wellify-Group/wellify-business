'use server'

import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'

export interface SendPhoneVerificationCodeResult {
  success: boolean
  error?: string
  code?: string // Только для тестирования, в продакшене не возвращаем
}

export interface VerifyPhoneCodeResult {
  success: boolean
  error?: string
}

export async function sendPhoneVerificationCode(
  formData: FormData
): Promise<SendPhoneVerificationCodeResult> {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Проверяем сессию
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return {
        success: false,
        error: 'Необходима авторизация'
      }
    }

    const phone = formData.get('phone') as string

    if (!phone || phone.trim().length === 0) {
      return {
        success: false,
        error: 'Укажите номер телефона'
      }
    }

    // Генерируем 6-значный код
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Сохраняем код в профиле
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        phone: phone.trim(),
        phone_verification_code: code
      })
      .eq('id', session.user.id)

    if (updateError) {
      console.error('Error updating phone verification code:', updateError)
      return {
        success: false,
        error: 'Ошибка при сохранении кода'
      }
    }

    // В будущем здесь будет вызов SMS-сервиса или Telegram-бота
    // Пока логируем код для тестирования
    console.log(`[PHONE VERIFICATION] Code for ${phone}: ${code}`)

    return {
      success: true,
      code: code // Только для тестирования
    }
  } catch (error: any) {
    console.error('Send phone verification code error:', error)
    return {
      success: false,
      error: error.message || 'Произошла ошибка при отправке кода'
    }
  }
}

export async function verifyPhoneCode(
  formData: FormData
): Promise<VerifyPhoneCodeResult> {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Проверяем сессию
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return {
        success: false,
        error: 'Необходима авторизация'
      }
    }

    const code = formData.get('code') as string

    if (!code || code.trim().length !== 6) {
      return {
        success: false,
        error: 'Введите 6-значный код'
      }
    }

    // Получаем профиль с кодом
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('phone_verification_code')
      .eq('id', session.user.id)
      .maybeSingle()

    if (profileError || !profile) {
      return {
        success: false,
        error: 'Профиль не найден'
      }
    }

    // Проверяем код
    if (profile.phone_verification_code !== code.trim()) {
      return {
        success: false,
        error: 'Неверный код подтверждения'
      }
    }

    // Код верный - обновляем профиль
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        phone_verified: true,
        phone_verification_code: null // Очищаем код
      })
      .eq('id', session.user.id)

    if (updateError) {
      console.error('Error updating phone verification:', updateError)
      return {
        success: false,
        error: 'Ошибка при обновлении статуса верификации'
      }
    }

    return {
      success: true
    }
  } catch (error: any) {
    console.error('Verify phone code error:', error)
    return {
      success: false,
      error: error.message || 'Произошла ошибка при проверке кода'
    }
  }
}

