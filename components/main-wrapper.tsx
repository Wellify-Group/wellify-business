"use client";

import { usePathname } from "next/navigation";

export function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');
  
  // Отступ нужен только для публичных страниц (где есть навбар)
  return (
    <main 
      className={`flex flex-col ${isDashboard ? '' : 'pt-24'}`}
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      {children}
    </main>
  );
}















