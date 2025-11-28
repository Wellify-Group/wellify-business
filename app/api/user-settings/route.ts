import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUserSettings, updateMonitoringPreferences } from '@/lib/db-user-settings';
import { MonitoringPreferences } from '@/lib/user-settings';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/user-settings?userId=...
 * Получает настройки пользователя
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role') as 'director' | 'manager' | null;

    if (!userId || !role) {
      return NextResponse.json(
        { success: false, error: 'userId and role are required' },
        { status: 400 }
      );
    }

    if (role !== 'director' && role !== 'manager') {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    const settings = await getOrCreateUserSettings(userId, role);

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    console.error('Get user settings error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user-settings
 * Обновляет настройки мониторинга пользователя
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, monitoring_preferences } = body;

    if (!userId || !monitoring_preferences) {
      return NextResponse.json(
        { success: false, error: 'userId and monitoring_preferences are required' },
        { status: 400 }
      );
    }

    const updated = await updateMonitoringPreferences(userId, monitoring_preferences);

    return NextResponse.json({
      success: true,
      settings: updated,
    });
  } catch (error: any) {
    console.error('Update user settings error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}







