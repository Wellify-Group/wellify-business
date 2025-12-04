import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { mapProfileFromDb, mapProfileToDb, isProfileComplete, type Profile } from "@/lib/types/profile";

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

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

    // Если профиль отсутствует - создаём его автоматически
    if (profileError || !profileRaw) {
      console.log('Creating profile for OAuth user:', user.id);
      
      const newProfile = mapProfileToDb({
        id: user.id,
        email: userEmail,
        fullName: googleFullName,
        avatarUrl: googleAvatarUrl,
        role: null,
        businessId: null,
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

      // Перенаправляем на завершение профиля
      return NextResponse.redirect(new URL("/auth/complete-profile", request.url));
    }

    // Преобразуем профиль в типизированный формат
    const profile = mapProfileFromDb(profileRaw);

    // Если профиль неполный (нет role или businessId) - перенаправляем на завершение
    if (!isProfileComplete(profile)) {
      console.log('OAuth user with incomplete profile, redirecting to complete-profile:', user.id);
      return NextResponse.redirect(new URL("/auth/complete-profile", request.url));
    }

    // Обновляем метаданные профиля из Google (если они есть и их нет в профиле)
    const updateData = mapProfileToDb({
      email: userEmail,
      fullName: profile.fullName || googleFullName,
      avatarUrl: profile.avatarUrl || googleAvatarUrl,
    });

    if (Object.keys(updateData).length > 1) { // Больше чем только email
      await supabaseAdmin
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);
    }

    // Профиль полный - перенаправляем на dashboard в зависимости от роли
    let dashboardPath = "/dashboard";
    
    if (profile.role === "директор") {
      dashboardPath = "/dashboard/director";
    } else if (profile.role === "менеджер") {
      dashboardPath = "/dashboard/manager";
    } else if (profile.role === "сотрудник") {
      dashboardPath = "/dashboard/employee";
    }
    
    return NextResponse.redirect(new URL(dashboardPath, request.url));
  } catch (err) {
    console.error('Unexpected error in auth callback:', err);
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "oauth");
    return NextResponse.redirect(loginUrl.toString());
  }
}
