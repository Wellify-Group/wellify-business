/**
 * POST /api/auth/phone/verify-code
 * Proxy route to backend API for verifying phone code
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.RENDER_API_URL || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, code, action } = body;

    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Phone and code are required' },
        { status: 400 }
      );
    }

    if (!BACKEND_URL) {
      return NextResponse.json(
        { error: 'Backend URL is not configured' },
        { status: 500 }
      );
    }

    // Proxy to backend /api/sms/verify-code
    const response = await fetch(`${BACKEND_URL}/api/sms/verify-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, code, action: action || 'signup' }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Verify phone code error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
