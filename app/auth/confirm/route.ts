import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", url));
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/confirm] exchangeCodeForSession error:", error);
      return NextResponse.redirect(new URL("/login?error=confirm_failed", url));
    }

    return NextResponse.redirect(new URL("/auth/email-confirmed", url));
  } catch (err: any) {
    console.error("[auth/confirm] Unexpected error:", err);
    return NextResponse.redirect(new URL("/login?error=confirm_failed", url));
  }
}

