/**
 * GET /api/auth/check-phone-confirmed
 * Proxy route to backend API for checking if phone is confirmed
 * Uses profiles/me endpoint to get phone_verified status
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.RENDER_API_URL || '';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!BACKEND_URL) {
      return NextResponse.json(
        { error: 'Backend URL is not configured' },
        { status: 500 }
      );
    }

    // Get profile to check phone_verified
    // Need authentication token from request
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    // Get profile from backend
    const profileUrl = userId 
      ? `${BACKEND_URL}/api/profiles/${userId}`
      : `${BACKEND_URL}/api/profiles/me`;
    
    const response = await fetch(profileUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to get profile' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const profile = data.profile || data;

    // Return phone_verified status
    return NextResponse.json({ 
      confirmed: profile.phone_verified === true 
    });
  } catch (error: any) {
    console.error('Check phone confirmed error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
