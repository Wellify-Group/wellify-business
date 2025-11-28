import { NextRequest, NextResponse } from 'next/server';
import { saveShift, getActiveShift } from '@/lib/db';
import { saveShiftEvent } from '@/lib/db-shift-events';
import { ShiftEvent, ShiftEventType, ShiftStartedPayload } from '@/lib/shift-events';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, locationId, companyId, employeeName } = body;

    // Validation: проверяем обязательные поля
    if (!locationId || !employeeId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'MISSING_IDS',
          message: 'Не переданы обязательные идентификаторы: locationId или employeeId' 
        },
        { status: 400 }
      );
    }

    console.log('[Start Shift API] Received request:', { employeeId, locationId, companyId, employeeName });

    // Проверяем активную смену по единому критерию: employee_id = employeeId AND status = 'active' AND ended_at IS NULL
    const existingActiveShift = await getActiveShift(employeeId, locationId);
    if (existingActiveShift) {
      // Найдена активная смена - возвращаем 409
      console.log('[Start Shift API] Active shift exists:', existingActiveShift.id);
      return NextResponse.json(
        { 
          success: false, 
          error: 'ACTIVE_SHIFT_EXISTS',
          message: 'У сотрудника уже есть активная смена' 
        },
        { status: 409 }
      );
    }

    // Generate unique shift ID
    const shiftId = `shift-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    const startTime = new Date().toISOString();

    // Create shift object for database
    // Важно: status = 'active', clockOut = null (ended_at IS NULL)
    const newShift = {
      id: shiftId,
      employeeId,
      employeeName: employeeName || '',
      locationId,
      date: Date.now(),
      startTime, // started_at
      status: 'active',
      clockOut: null, // ended_at IS NULL для активной смены
      revenueCash: 0,
      revenueCard: 0,
      guestCount: 0,
      checkCount: 0,
      anomalies: [],
      notes: '',
      photo: null,
    };

    // Save shift to database/file system
    await saveShift(newShift);

    // Create SHIFT_STARTED event
    if (companyId) {
      try {
        const shiftStartedPayload: ShiftStartedPayload = {
          started_at: startTime,
        };

        const shiftStartedEvent: ShiftEvent = {
          id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          company_id: companyId,
          point_id: locationId,
          shift_id: shiftId,
          employee_id: employeeId,
          type: ShiftEventType.SHIFT_STARTED,
          created_at: startTime,
          payload: shiftStartedPayload,
        };

        await saveShiftEvent(shiftStartedEvent);
        console.log('[Start Shift API] Shift started event created');
      } catch (error) {
        console.error('[Start Shift API] Error creating shift started event:', error);
        // Не прерываем процесс, если не удалось создать событие
      }
    }

    console.log('[Start Shift API] Shift created successfully:', shiftId);

    return NextResponse.json({
      success: true,
      shift: newShift,
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Start Shift API] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'INTERNAL_ERROR',
        message: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}









