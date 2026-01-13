import { NextRequest, NextResponse } from 'next/server';
import { saveLocation } from '@/lib/db';
import { Location } from '@/lib/store';

export const runtime = 'nodejs';

/**
 * POST /api/locations/create
 * Create a new location
 *
 * Body: { name, address, businessId, ... }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, address, businessId, status, accessCode, dailyPlan, branding, contact, schedule, settings, managerId } = body;

    // Validation
    if (!name || !businessId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, businessId' },
        { status: 400 }
      );
    }

    // Generate unique ID
    const locationId = `loc-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

    // Helper function to generate 16-digit code
    const generate16DigitCode = () => {
      const part1 = Math.floor(1000 + Math.random() * 9000);
      const part2 = Math.floor(1000 + Math.random() * 9000);
      const part3 = Math.floor(1000 + Math.random() * 9000);
      const part4 = Math.floor(1000 + Math.random() * 9000);
      return `${part1}-${part2}-${part3}-${part4}`;
    };

    // Default schedule
    const defaultSchedule = {
      mon: { start: '09:00', end: '21:00', lunchStart: '13:00', lunchEnd: '14:00', active: true },
      tue: { start: '09:00', end: '21:00', lunchStart: '13:00', lunchEnd: '14:00', active: true },
      wed: { start: '09:00', end: '21:00', lunchStart: '13:00', lunchEnd: '14:00', active: true },
      thu: { start: '09:00', end: '21:00', lunchStart: '13:00', lunchEnd: '14:00', active: true },
      fri: { start: '09:00', end: '21:00', lunchStart: '13:00', lunchEnd: '14:00', active: true },
      sat: { start: '09:00', end: '21:00', lunchStart: '13:00', lunchEnd: '14:00', active: true },
      sun: { start: '09:00', end: '21:00', lunchStart: '13:00', lunchEnd: '14:00', active: false }
    };

    // Create new location object
    const newLocation: Location = {
      id: locationId,
      name: name.trim(),
      address: (address || '').trim(),
      businessId: businessId,
      status: status || 'active',
      accessCode: accessCode || generate16DigitCode(),
      dailyPlan: dailyPlan,
      branding: branding || { logo: null, banner: null },
      contact: contact,
      schedule: schedule || defaultSchedule,
      settings: settings || {},
      managerId: managerId || null,
      documents: [],
      history: [],
      lastShiftNumber: 0 // Initialize shift counter
    };

    // Save location to file system
    await saveLocation(newLocation);

    return NextResponse.json({
      success: true,
      location: newLocation,
    }, { status: 201 });

  } catch (error) {
    console.error('Create location error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


