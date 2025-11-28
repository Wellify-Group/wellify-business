import { NextRequest, NextResponse } from 'next/server';
import { saveShiftEvent } from '@/lib/db-shift-events';
import { ShiftEvent, ShiftEventType, ChecklistTaskCompletedPayload } from '@/lib/shift-events';

export const runtime = 'nodejs';

/**
 * POST /api/shift-events/checklist-task
 * Создает событие выполнения задачи чек-листа
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      company_id,
      point_id,
      shift_id,
      employee_id,
      task_id,
      task_name,
    } = body;

    // Validation
    if (!company_id || !point_id || !shift_id || !employee_id || !task_id || !task_name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const payload: ChecklistTaskCompletedPayload = {
      task_id,
      task_name,
      completed_at: new Date().toISOString(),
    };

    const event: ShiftEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      company_id,
      point_id,
      shift_id,
      employee_id,
      type: ShiftEventType.CHECKLIST_TASK_COMPLETED,
      created_at: new Date().toISOString(),
      payload,
    };

    await saveShiftEvent(event);

    return NextResponse.json({
      success: true,
      event,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create checklist task event error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}









