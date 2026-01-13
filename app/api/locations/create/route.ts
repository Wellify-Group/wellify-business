import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.RENDER_API_URL || '';

/**
 * POST /api/locations/create
 * Create a new location (proxies to backend)
 *
 * Body: { name, address, businessId, ... }
 */
export async function POST(request: NextRequest) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json(
        { success: false, error: 'Backend URL is not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { name, address, businessId, status, accessCode, managerId } = body;

    // Validation
    if (!name || !businessId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, businessId' },
        { status: 400 }
      );
    }

    // Get token from Authorization header or cookie
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Proxy to backend /api/locations
    const response = await fetch(`${BACKEND_URL}/api/locations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        business_id: businessId,
        name: name.trim(),
        address: (address || '').trim(),
        access_code: accessCode || null,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to create location' },
        { status: response.status }
      );
    }

    // Transform backend response to frontend format
    const location = {
      id: data.location.id,
      businessId: data.location.businessId,
      name: data.location.name,
      address: data.location.address || '',
      status: status || 'active',
      accessCode: data.location.accessCode || null,
      managerId: managerId || null,
      dailyPlan: undefined,
      branding: { logo: null, banner: null },
      contact: null,
      schedule: null,
      settings: {},
      documents: [],
      history: [],
      lastShiftNumber: 0,
    };

    return NextResponse.json({
      success: true,
      location,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create location error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


