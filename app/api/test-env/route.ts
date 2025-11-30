import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
    anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'ok' : 'missing',
    service: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'ok' : 'missing',
  });
}
