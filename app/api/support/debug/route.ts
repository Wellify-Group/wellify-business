import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('support_sessions')
      .select('cid')
      .limit(1);

    if (error) {
      console.error('debug select error:', error);
      throw error;
    }

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error('GET /api/support/debug REAL ERROR:', error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

