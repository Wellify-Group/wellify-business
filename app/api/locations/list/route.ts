import { createServerSupabaseClient } from '@/lib/supabase/serverClient';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return Response.json(
        {
          success: false,
          error: 'businessId is required',
          locations: [],
        },
        { status: 400 },
      );
    }

    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('company_id', businessId) // ВАЖНО: имя колонки в БД должно быть businessId
      .order('name', { ascending: true });

    if (error) {
      console.error('[api/locations/list] Supabase error', error);
      return Response.json(
        {
          success: false,
          error: error.message,
          locations: [],
        },
        { status: 500 },
      );
    }

    return Response.json({
      success: true,
      error: null,
      locations: data ?? [],
    });
  } catch (e) {
    console.error('[api/locations/list] Unexpected error', e);
    return Response.json(
      {
        success: false,
        error: String(e),
        locations: [],
      },
      { status: 500 },
    );
  }
}
