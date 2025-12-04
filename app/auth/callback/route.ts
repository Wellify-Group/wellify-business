import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export const runtime = 'nodejs';

// TypeScript interface for profile
interface Profile {
  id: string;
  роль: string | null;
  бизнес_id: string | null;
  фио: string | null;
  аватар_url: string | null;
  email: string | null;
  [key: string]: any; // Allow other fields
}

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
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // Registration rules: User MUST already exist in profiles table
    // If no profile → sign out + redirect to /login?error=user_not_registered
    if (profileError || !profile) {
      console.log('OAuth login attempt by unregistered user (no profile):', user.id, profileError);
      await supabase.auth.signOut();
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "user_not_registered");
      return NextResponse.redirect(loginUrl.toString());
    }

    // If profile exists but missing роль or бизнес_id → also deny login
    const typedProfile = profile as Profile;
    if (!typedProfile.роль || !typedProfile.бизнес_id) {
      console.log('OAuth login attempt by user with incomplete profile (missing роль or бизнес_id):', user.id);
      await supabase.auth.signOut();
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "user_not_registered");
      return NextResponse.redirect(loginUrl.toString());
    }

    // Update user metadata if profile exists
    // Use фио if exists, otherwise try "ФИО", otherwise use Google full_name
    const currentFio = typedProfile.фио ?? (typedProfile as any)["ФИО"] ?? null;
    const currentAvatarUrl = typedProfile.аватар_url ?? null;
    
    await supabaseAdmin
      .from("profiles")
      .update({
        фио: currentFio ?? googleFullName ?? null,
        аватар_url: currentAvatarUrl ?? googleAvatarUrl ?? null,
        email: userEmail,
      })
      .eq("id", user.id);

    // Login allowed → redirect to dashboard based on role
    const userRole = typedProfile.роль;
    let dashboardPath = "/dashboard";
    
    if (userRole === "директор") {
      dashboardPath = "/dashboard/director";
    } else if (userRole === "менеджер") {
      dashboardPath = "/dashboard/manager";
    } else if (userRole === "сотрудник") {
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
