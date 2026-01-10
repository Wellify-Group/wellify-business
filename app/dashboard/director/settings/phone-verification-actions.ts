'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { serverConfig } from '@/lib/config/serverConfig.server'

export interface SendPhoneVerificationCodeResult {
  success: boolean
  error?: string
}

export interface VerifyPhoneCodeResult {
  success: boolean
  error?: string
}

/**
 * Send SMS verification code via Twilio
 * Uses the centralized API route /api/auth/phone/send-code
 */
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

    // Вызываем API для отправки SMS через Twilio
    const baseUrl = serverConfig.appBaseUrl
    const res = await fetch(`${baseUrl}/api/auth/phone/send-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        phone: phone.trim(),
        action: 'phone_update' // Для обновления телефона в настройках
      }),
    })

    const data = await res.json()

    if (res.ok && data.success) {
      return {
        success: true
      }
    }

    return {
      success: false,
      error: data.error || 'Не удалось отправить код'
    }
  } catch (error: any) {
    console.error('[phone-verification-actions] Send code error:', error)
    return {
      success: false,
      error: error.message || 'Произошла ошибка при отправке кода'
    }
  }
}

/**
 * Verify SMS code via Twilio
 * Uses the centralized API route /api/auth/phone/verify-code
 */
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

    const phone = formData.get('phone') as string
    const code = formData.get('code') as string

    if (!phone || !code) {
      return {
        success: false,
        error: 'Укажите номер телефона и код'
      }
    }

    if (code.trim().length < 4 || code.trim().length > 8) {
      return {
        success: false,
        error: 'Код должен содержать от 4 до 8 цифр'
      }
    }

    // Вызываем API для проверки кода через Twilio
    const baseUrl = serverConfig.appBaseUrl
    const res = await fetch(`${baseUrl}/api/auth/phone/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        phone: phone.trim(),
        code: code.trim()
      }),
    })

    const data = await res.json()

    if (res.ok && data.success) {
      // Код верный - обновляем профиль
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          phone: phone.trim(),
          phone_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id)

      if (updateError) {
        console.error('[phone-verification-actions] Error updating profile:', updateError)
        // Не возвращаем ошибку, так как телефон уже подтверждён через Twilio
      }

      // Опционально: обновляем телефон в user_metadata
      try {
        await supabase.auth.updateUser({
          data: {
            phone: phone.trim(),
          },
        })
      } catch (metadataError) {
        console.warn('[phone-verification-actions] Failed to update user metadata:', metadataError)
      }

      return {
        success: true
      }
    }

    return {
      success: false,
      error: data.error || 'Неверный код или код истёк'
    }
  } catch (error: any) {
    console.error('[phone-verification-actions] Verify code error:', error)
    return {
      success: false,
      error: error.message || 'Произошла ошибка при проверке кода'
    }
  }
}

