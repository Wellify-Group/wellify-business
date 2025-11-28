import { NextRequest, NextResponse } from 'next/server';
import { getActiveShift } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

/**
 * GET /api/employee/shifts/active
 * Get active shift for an employee
 * 
 * Query params: employeeId, locationId (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get('employeeId');
    const locationId = searchParams.get('locationId') || undefined;

    if (!employeeId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'MISSING_EMPLOYEE_ID',
          message: 'Не передан employeeId' 
        },
        { status: 400 }
      );
    }

    const activeShift = await getActiveShift(employeeId, locationId);

    return NextResponse.json({
      success: true,
      shift: activeShift,
    });
  } catch (error: any) {
    console.error('[Get Active Shift API] Error:', error);
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









