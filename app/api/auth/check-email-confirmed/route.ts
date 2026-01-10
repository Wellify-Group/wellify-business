/**
 * GET /api/auth/check-email-confirmed
 * Proxy route to backend API for checking if email is confirmed
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.RENDER_API_URL || '';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    if (!BACKEND_URL) {
      return NextResponse.json(
        { error: 'Backend URL is not configured' },
        { status: 500 }
      );
    }

    // Call backend API
    const response = await fetch(`${BACKEND_URL}/api/auth/check-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Return email_verified status
    return NextResponse.json({ 
      confirmed: data.exists && data.email_verified === true 
    });
  } catch (error: any) {
    console.error('Check email confirmed error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
