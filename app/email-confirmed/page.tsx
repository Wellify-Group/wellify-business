import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EmailConfirmedAliasPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Простой редирект на /auth/email-confirmed с сохранением query params
  const params = await searchParams;
  const urlParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      if (Array.isArray(value)) {
        value.forEach(v => urlParams.append(key, v));
      } else {
        urlParams.set(key, value);
      }
    }
  });

  const queryString = urlParams.toString();
  const redirectUrl = `/auth/email-confirmed${queryString ? `?${queryString}` : ''}`;
  
  redirect(redirectUrl);
}

