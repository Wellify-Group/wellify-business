import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { mapProfileFromDb, isProfileComplete } from './lib/types/profile'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Проверяем доступ только для dashboard маршрутов
  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next()
  }

  // Игнорируем статические файлы и API маршруты
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    // Создаем Supabase клиент для проверки сессии
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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

    // Проверяем профиль пользователя
    const { data: profileRaw, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    // Если профиль не найден или ошибка - перенаправляем на завершение профиля
    if (profileError || !profileRaw) {
      console.error('Profile not found in middleware:', profileError)
      return NextResponse.redirect(new URL('/auth/complete-profile', request.url))
    }

    // Преобразуем профиль в типизированный формат
    const profile = mapProfileFromDb(profileRaw)

    // Если профиль неполный - перенаправляем на завершение профиля
    if (!isProfileComplete(profile)) {
      return NextResponse.redirect(new URL('/auth/complete-profile', request.url))
    }

    // Профиль полный - разрешаем доступ
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

