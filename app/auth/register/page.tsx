'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterDirectorPage() {
  const router = useRouter();

  useEffect(() => {
    // Перенаправляем на новую страницу регистрации
    router.replace('/register');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Перенаправление...</p>
    </div>
  );
}
