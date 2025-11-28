import { NextRequest, NextResponse } from 'next/server';
import { getActiveShift, saveShift, getShifts } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * PATCH /api/shift/[shiftId]/close
 * Закрытие смены с динамическими полями
 * Обновляет status и ended_at (clockOut) при закрытии
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { shiftId: string } }
) {
  try {
    const body = await request.json();
    const { 
      company_id, 
      location_id, 
      employee_id, 
      shift_id,
      closingFields,
      cash,
      card,
      guests,
      comment,
      checklist
    } = body;

    const { shiftId } = params;
    
    if (!shiftId) {
      return NextResponse.json(
        { success: false, error: 'Shift ID is required' },
        { status: 400 }
      );
    }

    // Находим активную смену по единому критерию
    let activeShift = null;
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

    const totalRevenue = (parseInt(cash) || 0) + (parseInt(card) || 0);
    const closeTime = new Date().toISOString();

    // ОБЯЗАТЕЛЬНО обновляем И status, И ended_at (clockOut)
    const closedShift = {
      ...activeShift,
      status: 'closed', // или 'ok' в зависимости от системы
      clockOut: closeTime, // ended_at
      // Сохраняем дополнительные данные закрытия
      revenueCash: cash !== undefined ? parseInt(cash) || 0 : activeShift.revenueCash,
      revenueCard: card !== undefined ? parseInt(card) || 0 : activeShift.revenueCard,
      guestCount: guests !== undefined ? parseInt(guests) || 0 : activeShift.guestCount,
      notes: comment || activeShift.notes,
      // closingFields можно сохранить в отдельное поле или в notes
    };

    // Сохраняем закрытую смену
    await saveShift(closedShift);

    console.log('[Close Shift API] Shift closed successfully:', shiftId);

    return NextResponse.json({
      success: true,
      shift: closedShift,
      shiftId: shiftId,
      totalRevenue,
      closeTime,
      closingFields,
    });
  } catch (error: any) {
    console.error('Close shift error:', error);
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

