import { NextRequest, NextResponse } from 'next/server';
import { getShiftTasksStats } from '@/lib/db-shift-tasks';

/**
 * GET /api/shifts/[shiftId]/tasks/stats
 * Получает статистику выполнения задач для смены
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

    const stats = await getShiftTasksStats(shiftId);

    return NextResponse.json({
      success: true,
      ...stats,
    });
  } catch (error: any) {
    console.error('Get shift tasks stats error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}







