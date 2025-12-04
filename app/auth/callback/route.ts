import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { mapProfileFromDb, mapProfileToDb, type Profile } from "@/lib/types/profile";

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const mode = requestUrl.searchParams.get("mode") || "signup"; // По умолчанию signup

  // Handle OAuth errors from Supabase
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "oauth");
    if (errorDescription) {
      loginUrl.searchParams.set("error_description", errorDescription);
    }
    return NextResponse.redirect(loginUrl.toString());
  }

  // No code parameter - redirect to login with error
  if (!code) {
    console.error('Missing code parameter in OAuth callback');
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "missing_code");
    return NextResponse.redirect(loginUrl.toString());
  }

  try {
    // Exchange code for session
    const supabase = await createServerSupabaseClient();
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError);
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "oauth");
      loginUrl.searchParams.set("error_description", exchangeError.message);
      return NextResponse.redirect(loginUrl.toString());
    }

    if (!data.session || !data.user) {
      console.error('No session or user after code exchange');
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "oauth");
      return NextResponse.redirect(loginUrl.toString());
    }

    const user = data.user;
    const supabaseAdmin = createAdminSupabaseClient();

    // Read Google user metadata
    const googleFullName = user.user_metadata?.full_name || null;
    const googleAvatarUrl = user.user_metadata?.avatar_url || null;
    const userEmail = user.email || null;

    // Query profile in table profiles
    const { data: profileRaw, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // Если mode=login
    if (mode === "login") {
      // Если профиль отсутствует - это новый пользователь, который пытается войти
      // Нужно отправить его на регистрацию
      if (profileError || !profileRaw) {
        console.log('New user trying to login via Google, redirecting to register');
        // Выходим из сессии для чистоты
        await supabase.auth.signOut();
        const registerUrl = new URL("/register", request.url);
        registerUrl.searchParams.set("error", "need_signup");
        return NextResponse.redirect(registerUrl.toString());
      }

      // Профиль существует - проверяем верификацию
      const profile = mapProfileFromDb(profileRaw);

      // Если email или телефон не подтверждены - редирект на верификацию
      if (!profile.emailVerified || !profile.phoneVerified) {
        return NextResponse.redirect(new URL("/onboarding/verify", request.url));
      }

      // Если профиль неполный (нет ФИО или телефона) - редирект на дозаполнение
      if (!profile.fullName || !profile.phone) {
        return NextResponse.redirect(new URL("/onboarding/profile", request.url));
      }

      // Всё ок - редирект в дашборд
      let dashboardPath = "/dashboard";
      if (profile.role === "директор") {
        dashboardPath = "/dashboard/director";
      } else if (profile.role === "менеджер") {
        dashboardPath = "/dashboard/manager";
      } else if (profile.role === "сотрудник") {
        dashboardPath = "/dashboard/employee";
      }
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }

    // Если mode=signup
    if (mode === "signup") {
      // Если профиля нет - создаём пустой профиль и редирект на дозаполнение
      if (profileError || !profileRaw) {
        console.log('Creating profile for OAuth user:', user.id);
        
        const newProfile = mapProfileToDb({
          id: user.id,
          email: userEmail,
          fullName: googleFullName,
          avatarUrl: googleAvatarUrl,
          emailVerified: false,
          phoneVerified: false,
        });

        const { error: insertError } = await supabaseAdmin
          .from("profiles")
          .insert(newProfile);

        if (insertError) {
          console.error('Failed to create profile for OAuth user:', insertError);
          await supabase.auth.signOut();
          const loginUrl = new URL("/login", request.url);
          loginUrl.searchParams.set("error", "profile_creation_failed");
          return NextResponse.redirect(loginUrl.toString());
        }

        // Редирект на дозаполнение профиля
        const profileUrl = new URL("/onboarding/profile", request.url);
        profileUrl.searchParams.set("from", "google");
        return NextResponse.redirect(profileUrl.toString());
      }

      // Профиль уже существует - проверяем верификацию
      const profile = mapProfileFromDb(profileRaw);

      // Если email или телефон не подтверждены - редирект на верификацию
      if (!profile.emailVerified || !profile.phoneVerified) {
        return NextResponse.redirect(new URL("/onboarding/verify", request.url));
      }

      // Если профиль неполный - редирект на дозаполнение
      if (!profile.fullName || !profile.phone) {
        return NextResponse.redirect(new URL("/onboarding/profile", request.url));
      }

      // Всё ок - редирект в дашборд
      let dashboardPath = "/dashboard";
      if (profile.role === "директор") {
        dashboardPath = "/dashboard/director";
      } else if (profile.role === "менеджер") {
        dashboardPath = "/dashboard/manager";
      } else if (profile.role === "сотрудник") {
        dashboardPath = "/dashboard/employee";
      }
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }

    // Если mode не распознан - редирект на логин
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "invalid_mode");
    return NextResponse.redirect(loginUrl.toString());
  } catch (err) {
    console.error('Unexpected error in auth callback:', err);
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "oauth");
    return NextResponse.redirect(loginUrl.toString());
  }
}
