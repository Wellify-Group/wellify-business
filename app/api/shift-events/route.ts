import { NextRequest, NextResponse } from 'next/server';
import { saveShiftEvent, getShiftEvents } from '@/lib/db-shift-events';
import { ShiftEvent, ShiftEventType } from '@/lib/shift-events';

export const runtime = 'edge';

/**
 * POST /api/shift-events
 * Создает новое событие смены
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      company_id,
      point_id,
      shift_id,
      employee_id,
      type,
      payload,
    } = body;

    // Validation
    if (!company_id || !point_id || !shift_id || !employee_id || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate event type
    if (!Object.values(ShiftEventType).includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid event type' },
        { status: 400 }
      );
    }

    // Create event
    const event: ShiftEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      company_id,
      point_id,
      shift_id,
      employee_id,
      type: type as ShiftEventType,
      created_at: new Date().toISOString(),
      payload: payload || {},
    };

    // Save event
    await saveShiftEvent(event);

    return NextResponse.json({
      success: true,
      event,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create shift event error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/shift-events?shiftId=...
 * Получает все события для смены
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shiftId = searchParams.get('shiftId');

    if (!shiftId) {
      return NextResponse.json(
        { success: false, error: 'shiftId is required' },
        { status: 400 }
      );
    }

    const events = await getShiftEvents(shiftId);

    return NextResponse.json({
      success: true,
      events,
    });
  } catch (error: any) {
    console.error('Get shift events error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}









