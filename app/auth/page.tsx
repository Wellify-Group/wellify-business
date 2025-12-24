"use client";

import { useState } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { motion } from "framer-motion";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");

  return (
    <main
      className="relative h-screen flex items-center justify-center px-4 bg-background overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at top, rgba(99,102,241,0.05), transparent 50%), radial-gradient(rgba(99,102,241,0.08) 1px, transparent 1px)',
        backgroundSize: '100% 100%, 40px 40px',
        backgroundColor: 'var(--color-background)'
      }}
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-purple-500/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="w-full max-w-md"
      >
        <div className="w-full max-w-[500px] rounded-3xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)]">
          <h1 className="mb-2 text-center text-2xl font-bold tracking-tight text-foreground">
            {mode === "login" ? "Вход" : "Регистрация"}
          </h1>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            {mode === "login" 
              ? "Войдите в свой аккаунт" 
              : "Создайте новый аккаунт"}
          </p>

          <AuthForm mode={mode} onModeChange={setMode} />

          {/* Social Auth Buttons - скрыто
          <div className="relative flex items-center gap-4 py-4 w-full mt-4">
            <span className="h-px bg-white/10 flex-1" />
            <span className="text-xs text-zinc-500 uppercase tracking-wider whitespace-nowrap">
              Или войти через
            </span>
            <span className="h-px bg-white/10 flex-1" />
          </div>

          <SocialAuthButtons />
          */}
        </div>
      </motion.div>
    </main>
  );
}

















