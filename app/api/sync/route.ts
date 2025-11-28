import { NextRequest, NextResponse } from 'next/server';
import { getUserData } from '@/lib/db';
import { Role } from '@/lib/store';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sync
 * Synchronize user data from file system
 * 
 * Query params: userId, role
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const role = searchParams.get('role') as Role;

    // Validation
    if (!userId || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing required query params: userId and role' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['director', 'manager', 'employee'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Must be director, manager, or employee' },
        { status: 400 }
      );
    }

    // Get user data from file system
    const data = await getUserData(userId, role);

    if (!data.user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = data.user;

    return NextResponse.json({
      success: true,
      data: {
        user: userWithoutPassword,
        locations: data.locations,
        employees: data.employees.map(emp => {
          const { password: __, ...empWithoutPassword } = emp;
          return empWithoutPassword;
        }),
        shifts: data.shifts,
      },
    });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

















