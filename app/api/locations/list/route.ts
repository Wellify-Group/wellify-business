import { NextRequest, NextResponse } from 'next/server';
import { getLocations } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

/**
 * GET /api/locations/list
 * Get all locations for a business
 *
 * Query params: businessId (required)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: businessId' },
        { status: 400 }
      );
    }

    // Get locations from file system
    const locations = await getLocations(businessId);

    return NextResponse.json({
      success: true,
      locations: locations,
    }, { status: 200 });

  } catch (error) {
    console.error('List locations error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

















