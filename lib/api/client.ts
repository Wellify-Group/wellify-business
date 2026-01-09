/**
 * API Client для замены Supabase
 * Делает запросы к backend на Render
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.RENDER_API_URL || '';

if (!API_URL && typeof window !== 'undefined') {
  console.warn('API_URL is not set. Backend requests will fail.');
}

/**
 * Базовый fetch с обработкой ошибок
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * API Client для аутентификации
 */
export const api = {
  /**
   * Регистрация пользователя
   */
  async signUp(email: string, password: string, full_name?: string, phone?: string) {
    return apiRequest<{ user: any; token: string }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name, phone }),
    });
  },

  /**
   * Вход пользователя
   */
  async signIn(email: string, password: string) {
    return apiRequest<{ user: any; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  /**
   * Получить текущего пользователя
   */
  async getUser(token?: string) {
    return apiRequest<{ user: any }>('/api/auth/user', {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  /**
   * Получить профиль пользователя
   */
  async getProfile(userId: string, token?: string) {
    return apiRequest<{ profile: any }>(`/api/profiles/${userId}`, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  /**
   * Обновить профиль пользователя
   */
  async updateProfile(userId: string, data: any, token?: string) {
    return apiRequest<{ profile: any }>(`/api/profiles/${userId}`, {
      method: 'PATCH',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(data),
    });
  },

  /**
   * Отправить код верификации email
   */
  async sendEmailVerification(email: string, code: string, language: string = 'uk') {
    return apiRequest<{ success: boolean }>('/api/email/send-verification', {
      method: 'POST',
      body: JSON.stringify({ email, code, language }),
    });
  },
};

/**
 * Хранилище токена в localStorage и cookies
 */
export const tokenStorage = {
  get(): string | null {
    if (typeof window === 'undefined') {
      // На сервере не можем получить из localStorage
      return null;
    }
    return localStorage.getItem('auth_token');
  },

  set(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('auth_token', token);
    // Также устанавливаем в cookie для middleware
    document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
  },

  remove(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('auth_token');
    // Удаляем cookie
    document.cookie = 'auth_token=; path=/; max-age=0';
  },
};

/**
 * Получить токен из хранилища или cookies
 */
export function getAuthToken(): string | null {
  return tokenStorage.get();
}

