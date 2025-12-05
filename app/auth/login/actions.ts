'use server'

import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
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

    // Используем server client для логина
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password
    })

    if (error || !data.user) {
      console.error('Login error:', error)
      
      // Обработка конкретных ошибок
      if (error?.message?.toLowerCase().includes('email not confirmed') || 
          error?.message?.toLowerCase().includes('email_not_confirmed')) {
        return {
          success: false,
          error: 'Email не подтвержден. Проверьте вашу почту и перейдите по ссылке для подтверждения.'
        }
      }
      
      if (error?.message?.toLowerCase().includes('invalid login credentials') ||
          error?.message?.toLowerCase().includes('invalid credentials')) {
        return {
          success: false,
          error: 'Неверный email или пароль'
        }
      }
      
      return {
        success: false,
        error: error?.message || 'Неверный email или пароль'
      }
    }
    
    // Проверяем, подтвержден ли email
    if (data.user && !data.user.email_confirmed_at) {
      return {
        success: false,
        error: 'Email не подтвержден. Проверьте вашу почту и перейдите по ссылке для подтверждения.'
      }
    }

    // Проверяем роль пользователя из профиля
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
    }

    const role = profile?.role || data.user.user_metadata?.role

    // Редиректим в зависимости от роли
    if (role === 'director') {
      redirect('/dashboard/director')
    } else if (role === 'manager') {
      redirect('/dashboard/manager')
    } else if (role === 'employee') {
      redirect('/dashboard/employee')
    } else {
      // Если роль не определена, редиректим на логин с ошибкой
      return {
        success: false,
        error: 'Роль пользователя не определена. Обратитесь к администратору.'
      }
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

