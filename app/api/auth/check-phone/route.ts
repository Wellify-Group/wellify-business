/**
 * POST /api/auth/check-phone
 * Proxy route to backend API for checking if phone exists
 * Uses profiles endpoint since phone is stored in profiles
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.RENDER_API_URL || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone parameter is required' },
        { status: 400 }
      );
    }

    if (!BACKEND_URL) {
      return NextResponse.json(
        { error: 'Backend URL is not configured' },
        { status: 500 }
      );
    }

    // TODO: Backend should have a check-phone endpoint
    // For now, return that we need to implement this
    // Or query users table directly
    
    // Temporary: Return exists = false (needs backend implementation)
    return NextResponse.json({ exists: false });
  } catch (error: any) {
    console.error('Check phone error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
