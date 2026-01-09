import { NextResponse, type NextRequest } from 'next/server'

// Backend API URL
const API_URL = process.env.RENDER_API_URL || process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Проверка JWT токена через backend API
 */
async function verifyToken(token: string): Promise<{ valid: boolean; user?: any }> {
  if (!API_URL || !token) {
    return { valid: false };
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { valid: false };
    }

    const data = await response.json();
    return { valid: true, user: data.user };
  } catch (error) {
    console.error('Token verification error:', error);
    return { valid: false };
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Игнорируем статические файлы и API маршруты
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Публичные маршруты, не требующие авторизации
  const publicRoutes = [
    '/', // Главная страница (приветственная)
    '/login', 
    '/register', 
    '/auth/callback', 
    '/auth/login',
    '/auth/register',
    '/auth/confirm',
    '/auth/email-confirmed',
    '/forgot-password', 
    '/welcome', 
    '/about', 
    '/contacts', 
    '/support', 
    '/privacy', 
    '/terms',
    '/dev' // Режим разработки
  ];
  
  // Если это публичный маршрут - пропускаем проверку
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Проверяем доступ только для защищённых маршрутов (dashboard)
  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next()
  }

  // 🔧 РЕЖИМ РАЗРАБОТКИ: Пропускаем проверку авторизации
  // Используй ?dev=true в URL или установи NEXT_PUBLIC_DEV_MODE=true
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true' || 
                    process.env.NODE_ENV === 'development' ||
                    request.nextUrl.searchParams.get('dev') === 'true';

  if (isDevMode) {
    console.log('[Middleware] Dev mode: Skipping authentication for', pathname);
    // Устанавливаем мок-куки для совместимости
    const response = NextResponse.next();
    response.cookies.set('auth_token', 'dev-token', { 
      path: '/',
      httpOnly: false, // Чтобы можно было читать в клиенте
      sameSite: 'lax'
    });
    return response;
  }

  // Получаем токен из cookies
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  try {
    // Проверяем токен через backend API
    const { valid, user } = await verifyToken(token);

    if (!valid || !user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Проверяем email_verified
    const emailConfirmed = user.email_verified === true;

    if (!emailConfirmed) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Проверяем роль для директорских маршрутов
    if (pathname.startsWith('/dashboard/director')) {
      const role = user.role || 'director';
      if (role !== 'director') {
        // Если роль не director, редиректим в соответствующий дашборд
        if (role === 'manager') {
          return NextResponse.redirect(new URL('/dashboard/manager', request.url))
        } else if (role === 'employee') {
          return NextResponse.redirect(new URL('/dashboard/employee', request.url))
        } else {
          return NextResponse.redirect(new URL('/auth/login', request.url))
        }
      }
    }

    // Всё ок - разрешаем доступ
    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    // В случае ошибки перенаправляем на login
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
