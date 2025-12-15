"use client";

import { ReactNode, useEffect } from "react";

export default function EmailConfirmedLayout({ children }: { children: ReactNode }) {
  
  // Определяем CSS-переменные с помощью dangerouslySetInnerHTML
  const cssStyles = `
      /* --- ПЕРЕМЕННЫЕ ПО УМОЛЧАНИЮ (СВЕТЛАЯ ТЕМА) --- */
      :root {
          --email-confirmed-bg: #F8FAFC;
          --email-confirmed-card-bg: #FFFFFF;
          --email-confirmed-border: #E2E8F0;
          --email-confirmed-text: #0F172A;
          --email-confirmed-muted: #64748B;
          --email-confirmed-primary: #2563EB;
          --email-confirmed-primary-hover: #1D4ED8;
          --email-confirmed-primary-foreground: #F8FAFC;
          --email-confirmed-success-bg: rgba(34, 197, 94, 0.1);
          --email-confirmed-success-text: #22c55e;
      }
      
      /* --- ТЕМНАЯ ТЕМА (ПЕРЕОПРЕДЕЛЕНИЕ) --- */
      @media (prefers-color-scheme: dark) {
        :root {
          --email-confirmed-bg: #050B13;
          --email-confirmed-card-bg: #0B1320;
          --email-confirmed-border: rgba(148, 163, 184, 0.24);
          --email-confirmed-text: #E2E8F0;
          --email-confirmed-muted: #94A3B8;
          --email-confirmed-primary: #3B82F6;
          --email-confirmed-primary-hover: #2563EB;
          --email-confirmed-primary-foreground: #F8FAFC;
          --email-confirmed-success-bg: rgba(34, 197, 94, 0.15);
          --email-confirmed-success-text: #22c55e;
        }
      }
      
      /* Сброс стилей для body и html */
      body, html { 
        background-color: var(--email-confirmed-bg) !important;
        color: var(--email-confirmed-text) !important;
      }
    `;

  useEffect(() => {
    // Внедряем стили для мгновенной загрузки
    const style = document.createElement('style');
    style.id = 'email-confirmed-styles';
    style.textContent = cssStyles;
    document.head.appendChild(style);
    
    return () => {
      const styleToRemove = document.getElementById('email-confirmed-styles');
      if (styleToRemove) {
        document.head.removeChild(styleToRemove);
      }
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
      {/* Мгновенная загрузка стилей через JSX */}
      <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
      {children}
    </div>
  );
}