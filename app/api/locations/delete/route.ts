import { NextRequest, NextResponse } from 'next/server';
import { deleteLocation, getLocationById } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * DELETE /api/locations/delete
 * Delete a location
 *
 * Query params: locationId (required)
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const locationId = searchParams.get('locationId');

    if (!locationId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: locationId' },
        { status: 400 }
      );
    }

    // Check if location exists
    const location = await getLocationById(locationId);

    if (!location) {
      return NextResponse.json(
        { success: false, error: 'Location not found' },
        { status: 404 }
      );
    }

    // Delete location file
    await deleteLocation(locationId);

    return NextResponse.json({
      success: true,
      message: 'Location deleted successfully',
    }, { status: 200 });

  } catch (error) {
    console.error('Delete location error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}



















