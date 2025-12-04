import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

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
    const userEmail = user.email || null;

    // Проверяем email_confirmed_at
    const emailConfirmed = user.email_confirmed_at !== null;

    // Query profile in table profiles
    const { data: profileRaw, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("phone_verified, phone, first_name, last_name")
      .eq("id", user.id)
      .maybeSingle();

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
      const phoneVerified = profileRaw.phone_verified === true;

      // Если email не подтверждён или телефон не верифицирован - редирект на верификацию
      if (!emailConfirmed || !phoneVerified) {
        return NextResponse.redirect(new URL("/onboarding/verify-phone", request.url));
      }

      // Всё ок - редирект в дашборд
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Если mode=signup
    if (mode === "signup") {
      // Если профиля нет - создаём профиль с минимальными данными
      if (profileError || !profileRaw) {
        console.log('Creating profile for OAuth user:', user.id);
        
        // Пытаемся извлечь имя из full_name
        let firstName = null;
        let lastName = null;
        if (googleFullName) {
          const nameParts = googleFullName.split(" ");
          if (nameParts.length >= 2) {
            lastName = nameParts[0];
            firstName = nameParts.slice(1).join(" ");
          } else if (nameParts.length === 1) {
            firstName = nameParts[0];
          }
        }

        const { error: insertError } = await supabaseAdmin
          .from("profiles")
          .insert({
            id: user.id,
            first_name: firstName,
            last_name: lastName,
            phone_verified: false,
          });

        if (insertError) {
          console.error('Failed to create profile for OAuth user:', insertError);
          await supabase.auth.signOut();
          const loginUrl = new URL("/login", request.url);
          loginUrl.searchParams.set("error", "profile_creation_failed");
          return NextResponse.redirect(loginUrl.toString());
        }

        // Редирект на верификацию телефона
        return NextResponse.redirect(new URL("/onboarding/verify-phone", request.url));
      }

      // Профиль уже существует - проверяем верификацию
      const phoneVerified = profileRaw.phone_verified === true;

      // Если email не подтверждён или телефон не верифицирован - редирект на верификацию
      if (!emailConfirmed || !phoneVerified) {
        return NextResponse.redirect(new URL("/onboarding/verify-phone", request.url));
      }

      // Всё ок - редирект в дашборд
      return NextResponse.redirect(new URL("/", request.url));
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
