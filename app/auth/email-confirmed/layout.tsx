'use client';

import { ReactNode, useEffect } from 'react';

export default function EmailConfirmedLayout({ children }: { children: ReactNode }) {
  // Определяем CSS-переменные для светлой темы
  const cssStyles = `
    /* --- СВЕТЛАЯ ТЕМА (ВСЕГДА) --- */
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
    
    /* Сброс стилей для body и html */
    body, html { 
      background-color: var(--email-confirmed-bg) !important;
      color: var(--email-confirmed-text) !important;
    }
  `;

  useEffect(() => {
    // Убираем скролл на body и html для этой страницы
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // Внедряем стили для светлой темы
    const style = document.createElement('style');
    style.id = 'email-confirmed-styles';
    style.textContent = cssStyles;
    document.head.appendChild(style);
    
    return () => {
      // Восстанавливаем скролл при размонтировании
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      
      // Удаляем стили
      const styleToRemove = document.getElementById('email-confirmed-styles');
      if (styleToRemove) {
        document.head.removeChild(styleToRemove);
      }
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
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

