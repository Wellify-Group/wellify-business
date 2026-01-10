"use client";

import { useCallback } from "react";
// Google auth temporarily disabled - using new backend API
// import { api } from "@/lib/api/client";

interface GoogleAuthButtonProps {
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function GoogleAuthButton({ 
  children, 
  className,
  disabled 
}: GoogleAuthButtonProps) {
  const handleClick = useCallback(async () => {
    // TODO: Replace with new API client
    console.warn('Google OAuth temporarily disabled for migration');
    /* const origin = typeof window !== "undefined" ? window.location.origin : "";

    const supabase = createBrowserSupabaseClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Google OAuth error:", error);
    } */
  }, []);

  return (
    <button 
      type="button" 
      onClick={handleClick}
      disabled={disabled}
      className={className}
    >
      {children ?? "Continue with Google"}
    </button>
  );
}

