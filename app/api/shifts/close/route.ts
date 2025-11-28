import { NextRequest, NextResponse } from 'next/server';
import { getActiveShift, saveShift, getShifts } from '@/lib/db';

/**
 * POST /api/shifts/close
 * Закрытие активной смены
 * 
 * Body: { shiftId } или { employeeId } (для поиска активной смены)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shiftId, employeeId } = body;

    if (!shiftId && !employeeId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'MISSING_PARAMS',
          message: 'Необходимо передать shiftId или employeeId' 
        },
        { status: 400 }
      );
    }

    let activeShift = null;

    // Если передан shiftId, ищем смену по ID
    if (shiftId) {
      try {
        const allShifts = await getShifts();
        activeShift = allShifts.find(s => s.id === shiftId);
        
        // Проверяем, что смена активна по единому критерию
        if (activeShift && (
          activeShift.status !== 'active' || 
          (activeShift.clockOut !== null && activeShift.clockOut !== undefined && activeShift.clockOut)
        )) {
          activeShift = null; // Не активная смена
        }
      } catch (error) {
        console.error('[Close Shift API] Error loading shift:', error);
        return NextResponse.json(
          { 
            success: false, 
            error: 'INTERNAL_ERROR',
            message: 'Ошибка при загрузке смены' 
          },
          { status: 500 }
        );
      }
    } else if (employeeId) {
      // Если передан только employeeId, ищем активную смену
      activeShift = await getActiveShift(employeeId);
    }

    // Если активной смены нет - возвращаем 404
    if (!activeShift) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'NO_ACTIVE_SHIFT',
          message: 'Активная смена не найдена' 
        },
        { status: 404 }
      );
    }

    // ОБЯЗАТЕЛЬНО обновляем И status, И ended_at (clockOut)
    const closedShift = {
      ...activeShift,
      status: 'closed', // или 'ok' в зависимости от системы
      clockOut: new Date().toISOString(), // ended_at
    };

    // Сохраняем закрытую смену
    await saveShift(closedShift);

    console.log('[Close Shift API] Shift closed successfully:', activeShift.id);

    return NextResponse.json({
      success: true,
      shift: closedShift,
    });
  } catch (error: any) {
    console.error('[Close Shift API] Error:', error);
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









