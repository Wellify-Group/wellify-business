"use client";

import { ReactNode, useEffect } from "react";

/**
 * Layout для страницы подтверждения e-mail
 * Скрывает навбар и футер через CSS, использует fixed positioning для полного перекрытия
 * Адаптируется к системной теме браузера через чистые CSS Media Queries (prefers-color-scheme)
 */
export default function EmailConfirmedLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Скрываем навбар и футер через CSS
    const style = document.createElement('style');
    style.id = 'email-confirmed-styles';
    style.textContent = `
      nav { display: none !important; }
      footer { display: none !important; }
      body { 
        overflow: hidden !important; 
        background-color: var(--email-confirmed-bg) !important;
        color: var(--email-confirmed-text) !important;
      }
      html { 
        overflow: hidden !important;
        background-color: var(--email-confirmed-bg) !important;
      }
      
      /* Адаптация к системной теме браузера через чистые Media Queries */
      @media (prefers-color-scheme: light) {
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
        }
      }
      
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
        }
      }
    `;
    
    // Удаляем старый стиль, если он есть
    const oldStyle = document.getElementById('email-confirmed-styles');
    if (oldStyle) {
      document.head.removeChild(oldStyle);
    }
    
    document.head.appendChild(style);
    
    return () => {
      const styleToRemove = document.getElementById('email-confirmed-styles');
      if (styleToRemove) {
        document.head.removeChild(styleToRemove);
      }
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
      document.documentElement.style.backgroundColor = '';
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        backgroundColor: 'var(--email-confirmed-bg)',
        color: 'var(--email-confirmed-text)',
      }}
    >
      {children}
    </div>
  );
}

