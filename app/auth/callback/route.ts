// TEMP: Disabled for minimal build
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function GET() {
  return NextResponse.redirect('/login?error=callback_disabled');
}
