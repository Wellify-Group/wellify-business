"use client";

import { ReactNode } from "react";

/**
 * Layout для страницы подтверждения e-mail
 * Адаптируется к системной теме браузера через чистые CSS Media Queries
 */
export default function EmailConfirmedLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            /* --- CSS ПЕРЕМЕННЫЕ (СВЕТЛАЯ ТЕМА ПО УМОЛЧАНИЮ) --- */
            :root {
              --email-confirmed-bg: #F8FAFC;
              --email-confirmed-card-bg: #FFFFFF;
              --email-confirmed-border: #E2E8F0;
              --email-confirmed-text: #0F172A;
              --email-confirmed-muted: #64748B;
              --email-confirmed-soft: #9CA3AF;
              --email-confirmed-primary: #2563EB;
              --email-confirmed-primary-hover: #1D4ED8;
              --email-confirmed-primary-foreground: #F8FAFC;
              --email-confirmed-success-bg: rgba(34, 197, 94, 0.1);
              --email-confirmed-success-text: #22c55e;
              --shadow-modal: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            }
            
            /* --- ТЕМНАЯ ТЕМА --- */
            @media (prefers-color-scheme: dark) {
              :root {
                --email-confirmed-bg: #050B13;
                --email-confirmed-card-bg: #0B1320;
                --email-confirmed-border: rgba(148, 163, 184, 0.24);
                --email-confirmed-text: #E2E8F0;
                --email-confirmed-muted: #94A3B8;
                --email-confirmed-soft: #9CA3AF;
                --email-confirmed-primary: #3B82F6;
                --email-confirmed-primary-hover: #2563EB;
                --email-confirmed-primary-foreground: #F8FAFC;
                --email-confirmed-success-bg: rgba(34, 197, 94, 0.15);
                --email-confirmed-success-text: #22c55e;
                --shadow-modal: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
              }
            }
            
            /* --- БАЗОВЫЕ СТИЛИ --- */
            nav { display: none !important; }
            footer { display: none !important; }
            html { 
              overflow: hidden !important;
              background-color: var(--email-confirmed-bg) !important;
            }
            body { 
              overflow: hidden !important; 
              background-color: var(--email-confirmed-bg) !important;
              color: var(--email-confirmed-text) !important;
            }
            
            /* --- КЛАСС ДЛЯ КНОПКИ С HOVER --- */
            .email-confirmed-btn {
              background-color: var(--email-confirmed-primary);
              color: var(--email-confirmed-primary-foreground);
            }
            .email-confirmed-btn:hover {
              background-color: var(--email-confirmed-primary-hover);
            }
          `,
        }}
      />
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--email-confirmed-bg)] text-[var(--email-confirmed-text)]">
        {children}
      </div>
    </>
  );
}