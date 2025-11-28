import { NextRequest, NextResponse } from 'next/server';
import { deleteUserFile } from '@/lib/db';
import { Role } from '@/lib/store';

export const runtime = 'nodejs';

/**
 * DELETE /api/user/delete
 * Delete a user file from the file system
 * 
 * Body: { id, role }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, role } = body;

    // Validation
    if (!id || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: id, role' },
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

    // Delete user file
    await deleteUserFile(id, role as Role);

    return NextResponse.json({
      success: true,
    });

  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}



















