'use client';

import { ReactNode, useEffect } from 'react';

export default function EmailConfirmedLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Убираем скролл на body и html для этой страницы
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      // Восстанавливаем скролл при размонтировании
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-zinc-950/95 backdrop-blur-sm">
      {children}
    </div>
  );
}

