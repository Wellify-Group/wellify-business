"use client";

import { CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { useEffect } from "react";
import { cn } from "@/lib/utils"; // Предполагаем, что cn доступен для объединения классов

export default function EmailConfirmedPage() {
  const { t, setLanguage } = useLanguage();
  
  // Устанавливаем украинский язык для этой страницы
  useEffect(() => {
    setLanguage('ua');
  }, [setLanguage]);

  const handleClose = () => {
    if (window.opener) {
      window.close();
      return;
    }
    window.close();
  };

  return (
    <div className="flex h-full w-full items-center justify-center px-4 py-8">
      <div className="relative w-full max-w-[480px]">
        <div 
          className="relative overflow-hidden rounded-[32px] border px-6 py-5 shadow-xl sm:px-8 sm:py-6"
          style={{
            backgroundColor: 'var(--email-confirmed-card-bg)',
            borderColor: 'var(--email-confirmed-border)',
          }}
        >
          <div className="flex flex-col items-center space-y-4 text-center">
            {/* Brand text */}
            <div 
              className="text-[11px] tracking-[0.16em] uppercase"
              style={{
                color: 'var(--email-confirmed-muted)',
              }}
            >
              <span>WELLIFY <strong style={{ color: 'var(--email-confirmed-text)', fontWeight: 600 }}>BUSINESS</strong></span>
            </div>

            <div 
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{
                backgroundColor: 'var(--email-confirmed-success-bg)',
              }}
            >
              <CheckCircle2 
                className="h-10 w-10"
                style={{
                  color: 'var(--email-confirmed-success-text)',
                }}
              />
            </div>

            <h1 
              className="text-[22px] leading-[1.3] font-bold"
              style={{
                color: 'var(--email-confirmed-text)',
                margin: '0 0 16px 0',
              }}
            >
              {t<string>("email_confirmed_title")}
            </h1>

            <p 
              className="text-sm leading-[1.6] max-w-sm"
              style={{
                color: 'var(--email-confirmed-muted)',
                margin: '0 0 8px 0',
              }}
            >
              {t<string>("email_confirmed_message")}
            </p>

            <div className="pt-6 pb-4">
              <button
                type="button"
                onClick={handleClose}
                className={cn(
                  "inline-block rounded-full px-7 py-3 text-sm font-semibold transition-colors",
                  // Используем CSS-переменные для адаптивности:
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                  "hover:opacity-80" // Добавляем простой hover эффект
                )}
                style={{
                  backgroundColor: 'var(--email-confirmed-primary)',
                  color: 'var(--email-confirmed-primary-foreground)',
                }}
              >
                {t<string>("email_confirmed_close_button")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}