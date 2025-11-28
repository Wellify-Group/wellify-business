import { NextRequest, NextResponse } from 'next/server';
import { findEntityByAccessCode } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Code is required' },
        { status: 400 }
      );
    }

    // Call unified search engine
    const result = await findEntityByAccessCode(code);

    // CRITICAL: Log for debugging
    console.log("Searching for code:", code, "Result:", result);

    if (result) {
      return NextResponse.json({
        success: true,
        entity: result,
      }, { status: 200 });
    } else {
      return NextResponse.json(
        { success: false, error: 'Code not found' },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error('Verify code error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}



















