import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
    '/auth/confirm', // Bug 3 Fix: Страница подтверждения email через code
    '/auth/email-confirmed', // Bug 3 Fix: Страница подтверждения email через token_hash
    '/forgot-password', 
    '/welcome', 
    '/about', 
    '/contacts', 
    '/support', 
    '/privacy', 
    '/terms'
  ];
  
  // Если это публичный маршрут - пропускаем проверку
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Проверяем доступ только для защищённых маршрутов (dashboard)
  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    // Используем единый env модуль вместо прямого чтения process.env
    const { getSupabasePublicEnv } = await import('@/lib/supabase/env');
    const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabasePublicEnv();

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables in middleware')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    })

    // Проверяем сессию
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    // Если нет сессии - перенаправляем на login
    if (sessionError || !session) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Проверяем email_confirmed_at
    const emailConfirmed = session.user.email_confirmed_at !== null;

    // Проверяем профиль пользователя
    const { data: profileRaw, error: profileError } = await supabase
      .from('profiles')
      .select('role, phone_verified')
      .eq('id', session.user.id)
      .maybeSingle()

    // Если профиль не найден - перенаправляем на логин
    if (profileError || !profileRaw) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    const role = profileRaw.role || session.user.user_metadata?.role

    // Проверяем доступ к директорским маршрутам
    if (pathname.startsWith('/dashboard/director')) {
      if (role !== 'director') {
        // Если роль не director, редиректим в соответствующий дашборд или на логин
        if (role === 'manager') {
          return NextResponse.redirect(new URL('/dashboard/manager', request.url))
        } else if (role === 'employee') {
          return NextResponse.redirect(new URL('/dashboard/employee', request.url))
        } else {
          return NextResponse.redirect(new URL('/auth/login', request.url))
        }
      }
      // Для директора проверяем только email_confirmed_at
      if (!emailConfirmed) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }
      // Всё ок - разрешаем доступ директору
      return response
    }

    // Для других маршрутов dashboard проверяем только email_confirmed_at
    if (!emailConfirmed) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Всё ок - разрешаем доступ
    return response
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

