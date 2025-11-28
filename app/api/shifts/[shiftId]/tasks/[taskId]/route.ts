import { NextRequest, NextResponse } from 'next/server';
import { getShiftTaskById, updateShiftTask } from '@/lib/db-shift-tasks';
import { saveShiftEvent } from '@/lib/db-shift-events';
import { ShiftEventType, ChecklistTaskCompletedPayload, TaskUncompletedPayload } from '@/lib/shift-events';
import { getShifts } from '@/lib/db';
import { getLocationById } from '@/lib/db';

export const runtime = 'edge';

/**
 * PATCH /api/shifts/[shiftId]/tasks/[taskId]
 * Обновляет статус задачи (выполнена/не выполнена)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { shiftId: string; taskId: string } }
) {
  try {
    const { shiftId, taskId } = params;
    const body = await request.json();
    const { completed } = body;

    if (typeof completed !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'completed must be a boolean' },
        { status: 400 }
      );
    }

    // Получаем текущую задачу
    const existingTask = await getShiftTaskById(shiftId, taskId);

    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Получаем смену для извлечения company_id и point_id
    const allShifts = await getShifts();
    const shift = allShifts.find(s => s.id === shiftId);
    
    let companyId = '';
    let pointId = '';
    
    if (shift && shift.locationId) {
      pointId = shift.locationId;
      const location = await getLocationById(shift.locationId);
      if (location) {
        companyId = location.businessId || '';
      }
    }

    // Обновляем задачу
    const completedAt = completed ? new Date().toISOString() : null;
    const updatedTask = await updateShiftTask(shiftId, taskId, {
      completed,
      completedAt,
    });

    if (!updatedTask) {
      return NextResponse.json(
        { success: false, error: 'Failed to update task' },
        { status: 500 }
      );
    }

    // Логируем событие в протокол смены
    try {
      const eventType = completed 
        ? ShiftEventType.CHECKLIST_TASK_COMPLETED 
        : ShiftEventType.TASK_UNCOMPLETED;
      
      const payload = completed
        ? ({
            task_id: taskId,
            task_name: existingTask.title,
            completed_at: completedAt || new Date().toISOString(),
          } as ChecklistTaskCompletedPayload)
        : ({
            task_id: taskId,
            task_name: existingTask.title,
            uncompleted_at: new Date().toISOString(),
          } as TaskUncompletedPayload);
      
      const event = {
        id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        company_id: companyId,
        point_id: pointId,
        shift_id: shiftId,
        employee_id: existingTask.employeeId,
        type: eventType,
        created_at: new Date().toISOString(),
        payload,
      };

      await saveShiftEvent(event as any);
    } catch (eventError) {
      // Не прерываем выполнение, если не удалось сохранить событие
      console.error('Error saving shift event:', eventError);
    }

    return NextResponse.json({
      success: true,
      task: updatedTask,
    });
  } catch (error: any) {
    console.error('Update shift task error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

