/**
 * Auth API - замена Supabase Auth
 * Использует backend на Render
 */

import { api, tokenStorage } from './client';

export interface User {
  id: string;
  email: string;
  email_verified: boolean;
  phone?: string;
  phone_verified: boolean;
  created_at?: string;
}

export interface Session {
  user: User;
  token: string;
  expires_at?: string;
}

/**
 * Регистрация нового пользователя
 */
export async function signUp(
  email: string,
  password: string,
  full_name?: string,
  phone?: string
): Promise<{ user: User; session: Session }> {
  const response = await api.signUp(email, password, full_name, phone);
  
  // Сохраняем токен
  tokenStorage.set(response.token);

  return {
    user: response.user,
    session: {
      user: response.user,
      token: response.token,
    },
  };
}

/**
 * Вход пользователя
 */
export async function signIn(
  email: string,
  password: string
): Promise<{ user: User; session: Session }> {
  const response = await api.signIn(email, password);
  
  // Сохраняем токен
  tokenStorage.set(response.token);

  return {
    user: response.user,
    session: {
      user: response.user,
      token: response.token,
    },
  };
}

/**
 * Выход пользователя
 */
export async function signOut(): Promise<void> {
  tokenStorage.remove();
}

/**
 * Получить текущую сессию
 */
export async function getSession(): Promise<Session | null> {
  if (typeof window === 'undefined') {
    // На сервере проверяем через cookies
    return null;
  }

  const token = tokenStorage.get();
  if (!token) return null;

  try {
    const response = await api.getUser(token);
    return {
      user: response.user,
      token,
    };
  } catch (error) {
    // Токен невалидный, удаляем его
    tokenStorage.remove();
    return null;
  }
}

/**
 * Получить текущего пользователя
 */
export async function getUser(): Promise<User | null> {
  const session = await getSession();
  return session?.user || null;
}

