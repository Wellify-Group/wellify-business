/**
 * POST /api/auth/register-director
 * Proxy route to backend API for director registration
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.RENDER_API_URL || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!BACKEND_URL) {
      return NextResponse.json(
        { error: 'Backend URL is not configured' },
        { status: 500 }
      );
    }

    // Proxy to backend /api/auth/register-director
    const response = await fetch(`${BACKEND_URL}/api/auth/register-director`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Register director error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
