// TEMP: Disabled for minimal build
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function POST() {
  return NextResponse.json({ error: 'Temporarily disabled' }, { status: 503 });
}
