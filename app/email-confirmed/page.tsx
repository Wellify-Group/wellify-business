"use client";

import { CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { useEffect } from "react";

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

  // Показываем контент сразу, без ожидания монтирования
  // Это предотвращает мигание и промежуточные состояния
  // Используем CSS переменные для адаптации к системной теме браузера
  return (
    <div className="flex h-full w-full items-center justify-center px-4 py-8">
      <div className="relative w-full max-w-md">
        <div 
          className="relative overflow-hidden rounded-[32px] border px-6 py-5 shadow-[var(--shadow-modal)] sm:px-8 sm:py-6"
          style={{
            backgroundColor: 'var(--email-confirmed-card-bg, #FFFFFF)',
            borderColor: 'var(--email-confirmed-border, #E2E8F0)',
          }}
        >
          <div className="flex flex-col items-center space-y-3 text-center">
            <div 
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.1)', // success color with opacity
              }}
            >
              <CheckCircle2 
                className="h-10 w-10"
                style={{
                  color: '#22c55e', // --color-success
                }}
              />
            </div>

            <h1 
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
              style={{
                color: 'var(--email-confirmed-text, #0F172A)',
              }}
            >
              {t<string>("email_confirmed_title")}
            </h1>

            <p 
              className="max-w-sm text-sm leading-relaxed sm:text-base"
              style={{
                color: 'var(--email-confirmed-muted, #64748B)',
              }}
            >
              {t<string>("email_confirmed_message")}
            </p>

            <button
              type="button"
              onClick={handleClose}
              className="mt-1 inline-flex h-11 items-center justify-center rounded-full px-8 text-sm font-semibold tracking-wide shadow-[var(--shadow-floating)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              style={{
                backgroundColor: 'var(--email-confirmed-primary, #2563EB)',
                color: '#F8FAFC',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--email-confirmed-primary-hover, #1D4ED8)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--email-confirmed-primary, #2563EB)';
              }}
            >
              {t<string>("email_confirmed_close_button")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
