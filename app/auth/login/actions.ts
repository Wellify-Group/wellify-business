'use server'

// TODO: This file is deprecated - use api.signIn from @/lib/api/client instead
// import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export interface LoginResult {
  success: boolean
  error?: string
}

export async function login(
  formData: FormData
): Promise<LoginResult> {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      return {
        success: false,
        error: 'Заполните email и пароль'
      }
    }

    const normalizedEmail = email.toLowerCase().trim()

    // TODO: Migrate to new backend API
    // This action is deprecated - use api.signIn from client-side instead
    throw new Error('This server action is deprecated. Use api.signIn from @/lib/api/client instead.')
    
    /* OLD CODE - REMOVED
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password
    })

    */ // END OLD CODE
    
    return {
      success: false,
      error: 'This server action is deprecated. Use api.signIn from @/lib/api/client instead.'
    }
  } catch (error: any) {
    console.error('Login error:', error)
    
    // Если это redirect, пробрасываем его дальше
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error
    }

    return {
      success: false,
      error: error.message || 'Произошла ошибка при входе'
    }
  }
}

