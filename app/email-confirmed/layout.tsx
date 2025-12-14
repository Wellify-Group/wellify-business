"use client";

import { ReactNode, useEffect } from "react";

/**
 * Layout для страницы подтверждения e-mail
 * Скрывает навбар и футер через CSS, использует fixed positioning для полного перекрытия
 * Адаптируется к системной теме браузера через prefers-color-scheme
 */
export default function EmailConfirmedLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Добавляем мета-теги для поддержки светлой и темной темы
    const metaColorScheme = document.createElement('meta');
    metaColorScheme.name = 'color-scheme';
    metaColorScheme.content = 'light dark';
    
    const metaSupportedColorSchemes = document.createElement('meta');
    metaSupportedColorSchemes.name = 'supported-color-schemes';
    metaSupportedColorSchemes.content = 'light dark';
    
    // Проверяем, не добавлены ли уже эти мета-теги
    if (!document.querySelector('meta[name="color-scheme"]')) {
      document.head.appendChild(metaColorScheme);
    }
    if (!document.querySelector('meta[name="supported-color-schemes"]')) {
      document.head.appendChild(metaSupportedColorSchemes);
    }

    // Скрываем навбар и футер через CSS
    // Добавляем адаптацию к системной теме браузера
    const style = document.createElement('style');
    style.id = 'email-confirmed-styles';
    style.textContent = `
      nav { display: none !important; }
      footer { display: none !important; }
      body { overflow: hidden !important; }
      html { overflow: hidden !important; }
      
      /* Адаптация к системной теме браузера */
      :root {
        --email-confirmed-bg: #F8FAFC;
        --email-confirmed-card-bg: #FFFFFF;
        --email-confirmed-border: #E2E8F0;
        --email-confirmed-text: #0F172A;
        --email-confirmed-muted: #64748B;
        --email-confirmed-primary: #2563EB;
        --email-confirmed-primary-hover: #1D4ED8;
      }
      
      @media (prefers-color-scheme: dark) {
        :root {
          --email-confirmed-bg: #050B13;
          --email-confirmed-card-bg: #0B1320;
          --email-confirmed-border: rgba(148, 163, 184, 0.24);
          --email-confirmed-text: #E2E8F0;
          --email-confirmed-muted: #94A3B8;
          --email-confirmed-primary: #3B82F6;
          --email-confirmed-primary-hover: #2563EB;
        }
      }
    `;
    
    // Удаляем старый стиль, если он есть
    const oldStyle = document.getElementById('email-confirmed-styles');
    if (oldStyle) {
      document.head.removeChild(oldStyle);
    }
    
    document.head.appendChild(style);
    
    // Устанавливаем цвет фона body через CSS переменную
    document.body.style.backgroundColor = 'var(--email-confirmed-bg)';
    document.body.style.color = 'var(--email-confirmed-text)';
    
    return () => {
      if (metaColorScheme.parentNode) {
        document.head.removeChild(metaColorScheme);
      }
      if (metaSupportedColorSchemes.parentNode) {
        document.head.removeChild(metaSupportedColorSchemes);
      }
      const styleToRemove = document.getElementById('email-confirmed-styles');
      if (styleToRemove) {
        document.head.removeChild(styleToRemove);
      }
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        backgroundColor: 'var(--email-confirmed-bg, #F8FAFC)',
        color: 'var(--email-confirmed-text, #0F172A)',
      }}
    >
      {children}
    </div>
  );
}

