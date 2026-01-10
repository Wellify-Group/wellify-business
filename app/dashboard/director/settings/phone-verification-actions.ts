'use server'

// TODO: This file is deprecated - use api.sendPhoneVerificationCode and api.verifyPhoneCode from @/lib/api/client instead
// import { createServerSupabaseClient } from '@/lib/supabase/server'
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
    // TODO: Migrate to new backend API - check auth via JWT token
    // For now, skip session check and rely on API route authentication
    // const supabase = await createServerSupabaseClient()
    // const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    // if (sessionError || !session) {
    //   return {
    //     success: false,
    //     error: 'Необходима авторизация'
    //   }
    // }

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
    // TODO: Migrate to new backend API - check auth via JWT token
    // For now, skip session check and rely on API route authentication
    // const supabase = await createServerSupabaseClient()
    // const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    // if (sessionError || !session) {
    //   return {
    //     success: false,
    //     error: 'Необходима авторизация'
    //   }
    // }

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
      // Update profile via backend API after code verification
      try {
        // Import api client dynamically to avoid circular dependencies
        const { api } = await import('@/lib/api/client');
        
        // Update profile with verified phone
        await api.updateProfile(null, {
          phone: phone.trim(),
          phone_verified: true,
        });
      } catch (updateError) {
        console.error('[phone-verification-actions] Failed to update profile:', updateError);
        // Don't fail the verification if profile update fails - code is already verified
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

