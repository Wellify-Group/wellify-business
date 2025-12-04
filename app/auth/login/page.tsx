"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Redirect page for /auth/login
 * Redirects to /login with error parameter if present
 */
export default function AuthLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    
    const loginUrl = new URL("/login", window.location.origin);
    if (error) {
      loginUrl.searchParams.set("error", error);
    }
    if (errorDescription) {
      loginUrl.searchParams.set("error_description", errorDescription);
    }
    
    router.replace(loginUrl.toString());
  }, [router, searchParams]);

  return null;
}

