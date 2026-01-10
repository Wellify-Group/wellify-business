/**
 * Клиент для работы с Render API для верификации email и телефона
 */

// import { createBrowserSupabaseClient } from './supabase/client';

const RENDER_API_URL = process.env.NEXT_PUBLIC_RENDER_API_URL || process.env.RENDER_API_URL || '';

interface VerificationResponse {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * Получает access_token из текущей Supabase сессии
 */
async function getAccessToken(): Promise<string> {
  // TODO: Replace with new API client
  throw new Error('Temporarily disabled for migration');
  // const supabase = createBrowserSupabaseClient();
  // const { data: { session }, error } = await supabase.auth.getSession();
  // 
  // if (error || !session?.access_token) {
  //   throw new Error('Не удалось получить токен доступа. Пожалуйста, войдите в систему.');
  // }
  // 
  // return session.access_token;
}

/**
 * Базовый метод для выполнения запросов к Render API
 */
async function makeRequest(
  endpoint: string,
  method: 'GET' | 'POST' = 'POST',
  body?: any
): Promise<VerificationResponse> {
  try {
    const token = await getAccessToken();
    const url = `${RENDER_API_URL}${endpoint}`;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || `Ошибка ${response.status}`,
      };
    }

    return {
      success: true,
      message: data.message,
    };
  } catch (error) {
    console.error('Render API request error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Произошла ошибка при запросе к серверу',
    };
  }
}

/**
 * Отправляет код подтверждения на email
 */
export async function sendEmailCode(userId: string, email: string): Promise<VerificationResponse> {
  return makeRequest('/verification/email/send', 'POST', {
    user_id: userId,
    email,
  });
}

/**
 * Отправляет код подтверждения на телефон
 */
export async function sendPhoneCode(userId: string, phone: string): Promise<VerificationResponse> {
  return makeRequest('/verification/phone/send', 'POST', {
    user_id: userId,
    phone,
  });
}

/**
 * Подтверждает код для email
 */
export async function confirmEmailCode(code: string): Promise<VerificationResponse> {
  return makeRequest('/verification/email/confirm', 'POST', {
    code,
  });
}

/**
 * Подтверждает код для телефона
 */
export async function confirmPhoneCode(code: string): Promise<VerificationResponse> {
  return makeRequest('/verification/phone/confirm', 'POST', {
    code,
  });
}

