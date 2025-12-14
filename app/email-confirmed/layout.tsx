"use client";

import { ReactNode, useEffect } from "react";

/**
 * Layout для страницы подтверждения e-mail
 * Скрывает навбар и футер через CSS, использует fixed positioning для полного перекрытия
 */
export default function EmailConfirmedLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Скрываем навбар и футер через CSS
    const style = document.createElement('style');
    style.textContent = `
      nav { display: none !important; }
      footer { display: none !important; }
      body { overflow: hidden !important; }
      html { overflow: hidden !important; }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
      {children}
    </div>
  );
}

