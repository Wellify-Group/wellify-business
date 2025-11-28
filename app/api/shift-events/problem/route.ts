import { NextRequest, NextResponse } from 'next/server';
import { saveShiftEvent } from '@/lib/db-shift-events';
import { ShiftEvent, ShiftEventType, ProblemReportedPayload } from '@/lib/shift-events';

export const runtime = 'edge';

/**
 * POST /api/shift-events/problem
 * Создает событие сообщения о проблеме
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      company_id,
      point_id,
      shift_id,
      employee_id,
      category,
      category_label,
      severity,
      description,
      ingredient_id,
      product_id,
    } = body;

    // Validation
    if (!company_id || !point_id || !shift_id || !employee_id || !category || !severity || !description) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['product_out', 'equipment_failure', 'wrong_order', 'rude_client', 'work_issue'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Validate severity
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        { success: false, error: 'Invalid severity' },
        { status: 400 }
      );
    }

    const payload: ProblemReportedPayload = {
      problem_id: `prob-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      category: category as ProblemReportedPayload['category'],
      category_label: category_label || category,
      severity: severity as ProblemReportedPayload['severity'],
      description,
      reported_at: new Date().toISOString(),
      ingredient_id: ingredient_id || null,
      product_id: product_id || null,
    };

    const event: ShiftEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      company_id,
      point_id,
      shift_id,
      employee_id,
      type: ShiftEventType.PROBLEM_REPORTED,
      created_at: new Date().toISOString(),
      payload,
    };

    await saveShiftEvent(event);

    return NextResponse.json({
      success: true,
      event,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create problem event error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

