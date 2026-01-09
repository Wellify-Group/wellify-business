// app/api/auth/register/route.ts
// Проксирует запрос на backend API

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.RENDER_API_URL || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!API_URL) {
      return NextResponse.json(
        {
          success: false,
          error: "Backend API URL is not configured",
          errorCode: "CONFIGURATION_ERROR",
        },
        { status: 500 },
      );
    }

    // Проксируем запрос на backend
    const response = await fetch(`${API_URL}/api/auth/register-director`, {
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

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Registration proxy error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        errorCode: "INTERNAL_ERROR",
      },
      { status: 500 },
    );
  }
}
