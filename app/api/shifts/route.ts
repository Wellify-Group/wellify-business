import { NextRequest, NextResponse } from 'next/server';
import { saveShift, getShifts, getActiveShift } from '@/lib/db';
import { saveShiftEvent } from '@/lib/db-shift-events';
import { ShiftEvent, ShiftEventType, ShiftClosedPayload } from '@/lib/shift-events';
import { getShiftEvents } from '@/lib/db-shift-events';

export const runtime = 'nodejs';

/**
 * GET /api/shifts
 * Get shifts for a location
 * 
 * Query params: locationId (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const locationId = searchParams.get('locationId') || undefined;

    const shifts = await getShifts(locationId);

    return NextResponse.json({
      success: true,
      shifts,
    });

  } catch (error) {
    console.error('Get shifts error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/shifts
 * Create a new shift
 * 
 * Body: { employeeId, employeeName, locationId, revenueCash, revenueCard, ... }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id, // Используем существующий ID если есть (при закрытии смены)
      employeeId, 
      employeeName, 
      locationId, 
      revenueCash, 
      revenueCard, 
      guestCount, 
      checkCount, 
      status, 
      anomalies, 
      notes, 
      photo,
      clockIn, // Время начала смены
      clockOut, // Время окончания смены
      currency // Валюта
    } = body;

    // Validation
    if (!employeeId || !locationId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: employeeId, locationId' },
        { status: 400 }
      );
    }

    // Используем существующий ID или генерируем новый
    const shiftId = id || `shift-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

    // Если передан существующий ID, пытаемся загрузить существующую смену и обновить её
    let existingShift = null;
    if (id) {
      try {
        const allShifts = await getShifts();
        existingShift = allShifts.find(s => s.id === id);
        console.log('[Save Shift API] Found existing shift:', existingShift ? 'yes' : 'no', 'for ID:', id);
        if (existingShift) {
          console.log('[Save Shift API] Existing shift status:', existingShift.status, '-> New status:', status);
        }
      } catch (error) {
        console.error('Error loading existing shift:', error);
      }
    }
    
    // Если статус меняется на 'ok' или 'closed', это означает закрытие смены
    // Нужно убедиться, что старая активная смена обновляется
    if (existingShift && (status === 'ok' || status === 'closed') && existingShift.status === 'active') {
      console.log('[Save Shift API] Closing active shift:', id, 'from active to', status);
    }
    
    // КРИТИЧНО: Если передается статус 'ok' или 'closed', это означает закрытие смены
    // Принудительно устанавливаем статус, даже если он не передан явно
    const finalStatus = (status === 'ok' || status === 'closed') ? 'ok' : (status || (existingShift?.status || 'ok'));

    // Если смена существует, обновляем её, иначе создаём новую
    const shiftToSave = existingShift ? {
      ...existingShift,
      // Обновляем только переданные поля, сохраняя исходную дату начала
      revenueCash: revenueCash !== undefined ? revenueCash : existingShift.revenueCash,
      revenueCard: revenueCard !== undefined ? revenueCard : existingShift.revenueCard,
      guestCount: guestCount !== undefined ? guestCount : existingShift.guestCount,
      checkCount: checkCount !== undefined ? checkCount : existingShift.checkCount,
      status: finalStatus, // При закрытии меняем статус на 'ok'
      anomalies: anomalies !== undefined ? anomalies : (existingShift.anomalies || []),
      notes: notes !== undefined ? notes : existingShift.notes,
      photo: photo !== undefined ? photo : existingShift.photo,
      clockIn: clockIn || existingShift.clockIn || existingShift.startTime,
      clockOut: clockOut || existingShift.clockOut,
      currency: currency || existingShift.currency || '₴',
      // Сохраняем исходную дату начала смены
      date: existingShift.date,
      startTime: existingShift.startTime || existingShift.clockIn,
    } : {
      // Создаём новую смену
      id: shiftId,
      employeeId,
      employeeName: employeeName || '',
      locationId,
      date: Date.now(),
      revenueCash: revenueCash || 0,
      revenueCard: revenueCard || 0,
      guestCount: guestCount || 0,
      checkCount: checkCount || 0,
      status: status || 'ok',
      anomalies: anomalies || [],
      notes: notes || '',
      photo: photo || null,
      clockIn: clockIn || null,
      clockOut: clockOut || null,
      currency: currency || '₴',
    };

    // Save shift to file system (обновляет существующую или создаёт новую)
    await saveShift(shiftToSave);

    // Если смена закрывается (статус 'ok'), создаем событие SHIFT_CLOSED
    if (finalStatus === 'ok' && existingShift) {
      try {
        // Получаем количество выполненных задач из чек-листа
        const events = await getShiftEvents(shiftId);
        const completedTasks = events.filter(e => e.type === ShiftEventType.CHECKLIST_TASK_COMPLETED).length;
        
        // Получаем общее количество задач из body или из checklist
        const checklistArray = body.checklist || [];
        const tasksTotal = checklistArray.length > 0 ? checklistArray.length : completedTasks;
        
        // Получаем companyId из body или из существующей смены
        const companyId = body.companyId || body.company_id;
        
        if (companyId) {
          const shiftClosedPayload: ShiftClosedPayload = {
            closed_at: clockOut || new Date().toISOString(),
            final_revenue: (revenueCash || 0) + (revenueCard || 0),
            final_cash: revenueCash || 0,
            final_card: revenueCard || 0,
            checks_count: checkCount || 0,
            tasks_completed: completedTasks,
            tasks_total: tasksTotal,
          };

          const shiftClosedEvent: ShiftEvent = {
            id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            company_id: companyId,
            point_id: locationId,
            shift_id: shiftId,
            employee_id: employeeId,
            type: ShiftEventType.SHIFT_CLOSED,
            created_at: clockOut || new Date().toISOString(),
            payload: shiftClosedPayload,
          };

          await saveShiftEvent(shiftClosedEvent);
          console.log('[Save Shift API] Shift closed event created');
        }
      } catch (error) {
        console.error('[Save Shift API] Error creating shift closed event:', error);
        // Не прерываем процесс, если не удалось создать событие
      }
    }

    return NextResponse.json({
      success: true,
      shift: shiftToSave,
    }, { status: existingShift ? 200 : 201 });

  } catch (error) {
    console.error('Create shift error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}









