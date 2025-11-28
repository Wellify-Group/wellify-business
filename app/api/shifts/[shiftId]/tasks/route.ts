import { NextRequest, NextResponse } from 'next/server';
import { getShiftTasks, initializeShiftTasks } from '@/lib/db-shift-tasks';
import { getShifts } from '@/lib/db';

/**
 * GET /api/shifts/[shiftId]/tasks
 * Получает задачи для смены
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { shiftId: string } }
) {
  try {
    const shiftId = params.shiftId;

    if (!shiftId) {
      return NextResponse.json(
        { success: false, error: 'Missing shiftId' },
        { status: 400 }
      );
    }

    // Загружаем задачи из БД
    let tasks = await getShiftTasks(shiftId);

    // Если задач нет, инициализируем их (создаем моковые задачи)
    if (tasks.length === 0) {
      // Получаем смену для извлечения employeeId и locationId
      const allShifts = await getShifts();
      const shift = allShifts.find(s => s.id === shiftId);
      
      if (shift && shift.employeeId && shift.locationId) {
        tasks = await initializeShiftTasks(shiftId, shift.employeeId, shift.locationId);
      }
    }

    return NextResponse.json({
      success: true,
      tasks,
    });
  } catch (error: any) {
    console.error('Get shift tasks error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
