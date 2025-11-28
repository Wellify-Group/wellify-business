import { NextRequest, NextResponse } from 'next/server';
import { updateUser } from '@/lib/db';
import { Role } from '@/lib/store';

/**
 * PUT /api/user/update
 * Update user profile data
 * 
 * Body: { role, userId, updates }
 * updates: Partial<User> - fields to update (email, password, fullName, etc.)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, userId, updates } = body;

    // Validation
    if (!role || !userId || !updates) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: role, userId, and updates are required' },
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

    // Call updateUser function
    const updatedUser = await updateUser(role as Role, userId, updates);

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Return updated user (without password for security)
    const { password: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}



















