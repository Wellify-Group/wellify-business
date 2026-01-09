/**
 * API Client для замены Supabase
 * Делает запросы к backend на Render
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.RENDER_API_URL || '';

if (!API_URL && typeof window !== 'undefined') {
  console.warn('API_URL is not set. Backend requests will fail.');
}

/**
 * Получить токен из хранилища
 */
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

/**
 * Базовый fetch с обработкой ошибок и автоматическим добавлением токена
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
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
  async getUser() {
    return apiRequest<{ user: any }>('/api/auth/user');
  },

  /**
   * Получить профиль пользователя
   */
  async getProfile(userId?: string) {
    if (userId) {
      return apiRequest<{ profile: any }>(`/api/profiles/${userId}`);
    }
    // Используем /me для текущего пользователя
    return apiRequest<{ profile: any }>('/api/profiles/me');
  },

  /**
   * Обновить профиль пользователя
   */
  async updateProfile(userId: string | null | undefined, data: any) {
    const endpoint = userId ? `/api/profiles/${userId}` : '/api/profiles/me';
    return apiRequest<{ profile: any }>(endpoint, {
      method: 'PATCH',
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

  /**
   * Регистрация директора с бизнесом
   */
  async registerDirector(data: {
    email: string;
    password: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    birthDate?: string;
    language?: string;
    businessName?: string;
  }) {
    const response = await apiRequest<{ success: boolean; user: any; business: any; companyCode: string; token: string }>('/api/auth/register-director', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Сохраняем токен, если он есть
    if (response.token) {
      tokenStorage.set(response.token);
    }
    
    return response;
  },

  /**
   * Проверить существование email
   */
  async checkEmail(email: string) {
    return apiRequest<{ exists: boolean; email_verified?: boolean }>('/api/auth/check-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Забыли пароль
   */
  async forgotPassword(email: string) {
    return apiRequest<{ success: boolean; message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Сбросить пароль
   */
  async resetPassword(token: string, newPassword: string) {
    return apiRequest<{ success: boolean; message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },

  // Businesses
  /**
   * Создать бизнес
   */
  async createBusiness(data: { название: string; код_компании: string }) {
    return apiRequest<{ success: boolean; business: any }>('/api/businesses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Получить бизнесы пользователя
   */
  async getBusinesses() {
    return apiRequest<{ businesses: any[] }>('/api/businesses');
  },

  /**
   * Получить бизнес по ID
   */
  async getBusiness(id: string) {
    return apiRequest<{ business: any }>(`/api/businesses/${id}`);
  },

  // Subscriptions
  /**
   * Получить подписку пользователя
   */
  async getSubscription() {
    return apiRequest<{ subscription: any | null }>('/api/subscriptions');
  },

  /**
   * Создать/обновить подписку
   */
  async upsertSubscription(data: any) {
    return apiRequest<{ subscription: any }>('/api/subscriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Locations
  /**
   * Получить локации
   */
  async getLocations(business_id?: string) {
    const query = business_id ? `?business_id=${business_id}` : '';
    return apiRequest<{ locations: any[] }>(`/api/locations${query}`);
  },

  /**
   * Создать локацию
   */
  async createLocation(data: { business_id: string; name: string; address?: string; access_code?: string }) {
    return apiRequest<{ success: boolean; location: any }>('/api/locations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Обновить локацию
   */
  async updateLocation(id: string, data: { name?: string; address?: string; access_code?: string }) {
    return apiRequest<{ success: boolean; location: any }>(`/api/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Удалить локацию
   */
  async deleteLocation(id: string) {
    return apiRequest<{ success: boolean; message: string }>(`/api/locations/${id}`, {
      method: 'DELETE',
    });
  },

  // Phone verification
  /**
   * Отправить код верификации телефона
   */
  async sendPhoneVerificationCode(phone: string, action: string = 'signup') {
    return apiRequest<{ success: boolean }>('/api/sms/send-code', {
      method: 'POST',
      body: JSON.stringify({ phone, action }),
    });
  },

  /**
   * Верифицировать код телефона
   */
  async verifyPhoneCode(phone: string, code: string) {
    return apiRequest<{ success: boolean }>('/api/sms/verify-code', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
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

