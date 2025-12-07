import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // Handle OAuth errors from Supabase
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("error", "oauth");
    if (errorDescription) {
      loginUrl.searchParams.set("error_description", errorDescription);
    }
    return NextResponse.redirect(loginUrl.toString());
  }

  // No code parameter - redirect to login with error
  if (!code) {
    console.error('Missing code parameter in OAuth callback');
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("error", "missing_code");
    return NextResponse.redirect(loginUrl.toString());
  }

  try {
    // Exchange code for session
    const supabase = await createServerSupabaseClient();
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError);
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("error", "oauth");
      loginUrl.searchParams.set("error_description", exchangeError.message);
      return NextResponse.redirect(loginUrl.toString());
    }

    if (!data.session || !data.user) {
      console.error('No session or user after code exchange');
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("error", "oauth");
      return NextResponse.redirect(loginUrl.toString());
    }

    const user = data.user;
    const supabaseAdmin = createAdminSupabaseClient();

    // Read Google user metadata
    const googleFullName = user.user_metadata?.full_name || null;

    // Проверяем email_confirmed_at
    const emailConfirmed = user.email_confirmed_at !== null;

    // Query profile in table profiles
    const { data: profileRaw, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role, phone_verified, phone, first_name, last_name, full_name")
      .eq("id", user.id)
      .maybeSingle();

    // Получаем роль из профиля или из user_metadata
    const role = profileRaw?.role || user.user_metadata?.role;

    // Если профиля нет - создаём профиль с минимальными данными (для OAuth пользователей)
    if (profileError || !profileRaw) {
      console.log('Creating profile for OAuth user:', user.id);
      
      // Пытаемся извлечь имя из full_name
      let firstName = null;
      let lastName = null;
      if (googleFullName) {
        const nameParts = googleFullName.split(" ");
        if (nameParts.length >= 2) {
          // Bug 2 Fix: Первая часть - это firstName, остальное - lastName
          firstName = nameParts[0];
          lastName = nameParts.slice(1).join(" ");
        } else if (nameParts.length === 1) {
          firstName = nameParts[0];
        }
      }

      // Bug 1 Fix: Используем UPSERT вместо UPDATE, так как профиль может не существовать
      const { error: upsertError } = await supabaseAdmin
        .from("profiles")
        .upsert({
          id: user.id,
          email: user.email,
          first_name: firstName,
          last_name: lastName,
          full_name: googleFullName,
          phone_verified: false,
          role: user.user_metadata?.role || null,
        }, { onConflict: "id" });

      if (upsertError) {
        console.error('Failed to upsert profile for OAuth user:', upsertError);
        // Выходим из сессии при ошибке обновления профиля
        // Используем server client для signOut
        await supabase.auth.signOut();
        const loginUrl = new URL("/auth/login", request.url);
        loginUrl.searchParams.set("error", "profile_update_failed");
        return NextResponse.redirect(loginUrl.toString());
      }

      // Новый пользователь - определяем роль и редиректим
      const newUserRole = user.user_metadata?.role || 'director';
      if (newUserRole === 'manager') {
        return NextResponse.redirect(new URL("/dashboard/manager", request.url));
      } else if (newUserRole === 'employee') {
        return NextResponse.redirect(new URL("/dashboard/employee", request.url));
      }
      // По умолчанию - директор
      return NextResponse.redirect(new URL("/dashboard/director", request.url));
    }

    // Для директора: проверяем только email_confirmed_at, телефон можно подтвердить позже
    if (role === 'director') {
      if (!emailConfirmed) {
        // Email еще не подтвержден (не должно произойти, так как мы в callback)
        return NextResponse.redirect(new URL("/auth/login", request.url));
      }
      // Редиректим директора в его дашборд
      return NextResponse.redirect(new URL("/dashboard/director", request.url));
    }

    // Для других ролей: редиректим в соответствующий дашборд

    // Редиректим в зависимости от роли
    if (role === 'manager') {
      return NextResponse.redirect(new URL("/dashboard/manager", request.url));
    } else if (role === 'employee') {
      return NextResponse.redirect(new URL("/dashboard/employee", request.url));
    }

    // Если роль неизвестна - редирект на логин
    return NextResponse.redirect(new URL("/auth/login", request.url));
  } catch (err) {
    console.error('Unexpected error in auth callback:', err);
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("error", "oauth");
    return NextResponse.redirect(loginUrl.toString());
  }
}
