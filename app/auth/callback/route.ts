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

    // Determine user role from profiles table
    let dashboardPath = "/dashboard/director"; // default to director
    try {
      // Use admin client to bypass RLS and read profile
      const adminSupabase = createAdminSupabaseClient();
      const { data: profile, error: profileError } = await adminSupabase
        .from('profiles')
        .select('"роль"')
        .eq('id', data.user.id)
        .single();

      if (!profileError && profile && profile['роль']) {
        const role = profile['роль'];
        if (role === 'менеджер') {
          dashboardPath = "/dashboard/manager";
        } else if (role === 'сотрудник') {
          dashboardPath = "/dashboard/employee";
        }
        // else default to director
      }
    } catch (profileError) {
      // If profile doesn't exist or error occurs, default to director
      // This is normal for new OAuth users who haven't set up their profile yet
      console.warn('Could not determine user role, defaulting to director:', profileError);
      // Continue with default director path
    }

    // Redirect to appropriate dashboard
    return NextResponse.redirect(new URL(dashboardPath, request.url));
  } catch (err) {
    console.error('Unexpected error in auth callback:', err);
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "oauth");
    return NextResponse.redirect(loginUrl.toString());
  }
}

















