import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * /email-confirmed - алиас для обработки ссылок подтверждения email
 * Редиректит на /auth/confirm для обработки кода, затем на /auth/email-confirmed для отображения результата
 */
export default async function EmailConfirmedAliasPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  // Если есть code/token - редиректим на /auth/confirm для обработки
  // /auth/confirm обработает код и обновит email_verified в БД
  if (params.code || params.token || params.token_hash) {
    const urlParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        if (Array.isArray(value)) {
          value.forEach(v => urlParams.append(key, v));
        } else {
          urlParams.set(key, value as string);
        }
      }
    });
    
    const queryString = urlParams.toString();
    redirect(`/auth/confirm?${queryString}`);
  }

  // Если нет параметров - редиректим на /auth/email-confirmed
  redirect('/auth/email-confirmed');
}

