"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp, signOut, getSession, getUser, type User, type Session } from "@/lib/api/auth";
import { tokenStorage } from "@/lib/api/client";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ user: User | null; session: Session | null }>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthContextValue {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Получаем начальную сессию
    const loadSession = async () => {
      try {
        const currentSession = await getSession();
        setSession(currentSession);
        setUser(currentSession?.user || null);
      } catch (error) {
        console.error('Error loading session:', error);
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadSession();

    // Проверяем сессию периодически (каждые 5 минут)
    const interval = setInterval(() => {
      loadSession();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    try {
      const result = await signIn(email, password);
      setSession(result.session);
      setUser(result.user);
      router.push("/dashboard");
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const handleSignUp = async (email: string, password: string) => {
    try {
      const result = await signUp(email, password);
      setSession(result.session);
      setUser(result.user);
      return {
        user: result.user,
        session: result.session,
      };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setSession(null);
      setUser(null);
      router.push("/login");
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  return {
    user,
    session,
    loading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
  };
}
