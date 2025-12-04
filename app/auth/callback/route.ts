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

    const userId = data.user.id;
    const adminSupabase = createAdminSupabaseClient();

    // Fetch user profile to check registration status
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('роль, бизнес_id, "ФИО", имя')
      .eq('id', userId)
      .single();

    // Check if user is registered (must have role and business_id)
    // If profile doesn't exist or is missing required fields, user is not registered
    const isRegistered = !profileError && profile && profile.роль && profile.бизнес_id;

    if (!isRegistered) {
      // User is not registered - sign them out and redirect to login with error
      console.log('OAuth login attempt by unregistered user:', userId, profileError);
      await supabase.auth.signOut();
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "no_account");
      return NextResponse.redirect(loginUrl.toString());
    }

    // User is registered - proceed with name population logic
    let profileName = profile['ФИО'] || profile.имя || null;
    const needsNameUpdate = !profileName || profileName.trim() === '';

    if (needsNameUpdate) {
      // Try to get name from Google user_metadata
      const googleName = 
        data.user.user_metadata?.full_name ||
        data.user.user_metadata?.name ||
        (data.user.user_metadata?.given_name && data.user.user_metadata?.family_name
          ? `${data.user.user_metadata.given_name} ${data.user.user_metadata.family_name}`
          : null) ||
        data.user.user_metadata?.given_name ||
        null;

      if (googleName && googleName.trim() !== '') {
        // Update profile with name from Google
        const shortName = googleName.trim().split(' ')[0] || googleName.trim();
        const { error: updateError } = await adminSupabase
          .from('profiles')
          .update({
            'ФИО': googleName.trim(),
            имя: shortName,
          })
          .eq('id', userId);

        if (updateError) {
          console.error('Error updating profile name from Google:', updateError);
        } else {
          profileName = googleName.trim();
        }
      }

      // If still no name, redirect to profile completion page
      if (!profileName || profileName.trim() === '') {
        const completeUrl = new URL("/auth/complete-profile", request.url);
        return NextResponse.redirect(completeUrl.toString());
      }
    }

    // Determine dashboard path based on role
    let dashboardPath = "/dashboard/director"; // default to director
    if (profile.роль === 'менеджер') {
      dashboardPath = "/dashboard/manager";
    } else if (profile.роль === 'сотрудник') {
      dashboardPath = "/dashboard/employee";
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

















