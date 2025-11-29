import { createServerSupabaseClient } from '@/lib/supabase/serverClient';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .limit(1);

    return Response.json({
      ok: !error,
      error,
      data,
    });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) });
  }
}
