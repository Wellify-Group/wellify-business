const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.RENDER_API_URL || '';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const business_id = searchParams.get('businessId');

    if (!business_id) {
      return Response.json(
        {
          success: false,
          error: 'businessId is required',
          locations: [],
        },
        { status: 400 },
      );
    }

    if (!API_URL) {
      return Response.json(
        {
          success: false,
          error: 'Backend API URL is not configured',
          locations: [],
        },
        { status: 500 },
      );
    }

    // Получаем токен из cookies
    const token = req.headers.get('authorization')?.replace('Bearer ', '') ||
                  req.headers.get('cookie')?.split('auth_token=')[1]?.split(';')[0];

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Проксируем запрос на backend
    const response = await fetch(`${API_URL}/api/locations?business_id=${business_id}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return Response.json(
        {
          success: false,
          error: errorData.error || 'Failed to fetch locations',
          locations: [],
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    return Response.json({
      success: true,
      error: null,
      locations: data.locations || [],
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
