"use client";

import { useCallback } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

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
    const origin = typeof window !== "undefined" ? window.location.origin : "";

    const supabase = createBrowserSupabaseClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Google OAuth error:", error);
    }
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

