"use client";

import { usePathname } from "next/navigation";

export function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname?.startsWith('/auth');
  const isEmailConfirmed = pathname === '/auth/email-confirmed';
  
  // Для страницы подтверждения email не создаем обертку
  if (isEmailConfirmed) {
    return <>{children}</>;
  }
  
  // Отступ нужен только для публичных страниц (где есть навбар)
  // Auth страницы управляют своим layout самостоятельно
  return (
    <main 
      className={`flex flex-col ${isDashboard || isAuthPage ? '' : 'pt-24'}`}
      style={{ backgroundColor: isAuthPage ? 'transparent' : 'var(--color-background)' }}
    >
      {children}
    </main>
  );
}















