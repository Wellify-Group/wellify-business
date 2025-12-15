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

  return (
    <div className="flex h-full w-full items-center justify-center px-4 py-8">
      <div className="relative w-full max-w-[480px]">
        <div className="relative overflow-hidden rounded-[32px] border bg-[var(--email-confirmed-card-bg)] border-[var(--email-confirmed-border)] px-6 py-5 shadow-[var(--shadow-modal)] sm:px-8 sm:py-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            {/* Brand text */}
            <div className="text-[11px] tracking-[0.16em] uppercase text-[var(--email-confirmed-muted)]">
              <span>WELLIFY <strong className="font-semibold text-[var(--email-confirmed-text)]">BUSINESS</strong></span>
            </div>

            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--email-confirmed-success-bg)]">
              <CheckCircle2 className="h-10 w-10 text-[var(--email-confirmed-success-text)]" />
            </div>

            <h1 className="text-[22px] leading-[1.3] font-bold text-[var(--email-confirmed-text)] mb-4">
              {t<string>("email_confirmed_title")}
            </h1>

            <p className="text-sm leading-[1.6] max-w-sm text-[var(--email-confirmed-muted)] mb-2">
              {t<string>("email_confirmed_message")}
            </p>

            <div className="pt-6 pb-4">
              <button
                type="button"
                onClick={handleClose}
                className="email-confirmed-btn inline-block rounded-full px-7 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
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