import { NextRequest, NextResponse } from 'next/server';
import { getLocationById, saveLocation } from '@/lib/db';
import { Location } from '@/lib/store';

export const runtime = 'nodejs';

/**
 * PUT /api/locations/update
 * Update a location
 *
 * Body: { locationId, updates: { ... } }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { locationId, updates } = body;

    if (!locationId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: locationId' },
        { status: 400 }
      );
    }

    // Get existing location
    const existingLocation = await getLocationById(locationId);

    if (!existingLocation) {
      return NextResponse.json(
        { success: false, error: 'Location not found' },
        { status: 404 }
      );
    }

    // Merge updates (deep merge for nested objects like branding)
    const updatedLocation: Location = {
      ...existingLocation,
      ...updates,
      // Deep merge branding if it exists in updates
      branding: updates.branding 
        ? { ...existingLocation.branding, ...updates.branding }
        : existingLocation.branding,
      history: [
        ...(existingLocation.history || []),
        {
          action: 'updated',
          user: updates.updatedBy || 'System',
          date: new Date().toISOString()
        }
      ]
    };

    // Save updated location
    await saveLocation(updatedLocation);

    return NextResponse.json({
      success: true,
      location: updatedLocation,
    }, { status: 200 });

  } catch (error) {
    console.error('Update location error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

