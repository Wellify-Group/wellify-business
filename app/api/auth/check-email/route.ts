// app/api/auth/check-email/route.ts

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Backend API URL
const API_URL = process.env.RENDER_API_URL || process.env.NEXT_PUBLIC_API_URL || '';

if (!API_URL) {
  console.warn('RENDER_API_URL is not set. Email check will fail.');
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { confirmed: false, message: "E-mail is required" },
        { status: 400 }
      );
    }

    if (!API_URL) {
      return NextResponse.json(
        { confirmed: false, message: "Backend API is not configured" },
        { status: 500 }
      );
    }

    const normalized = email.trim().toLowerCase();

    // Проверяем email через backend API
    try {
      const response = await fetch(`${API_URL}/api/auth/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalized }),
      });

      const data = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          { confirmed: false, message: data.error || "Failed to check email" },
          { status: response.status }
        );
      }

      // Backend возвращает { exists: boolean, email_verified?: boolean }
      return NextResponse.json(
        {
          confirmed: data.exists && data.email_verified === true,
          exists: data.exists,
          email_verified: data.email_verified || false,
        },
        { status: 200 }
      );
    } catch (fetchError: any) {
      console.error("[check-email] Backend API error", fetchError);
      return NextResponse.json(
        {
          confirmed: false,
          message: "Failed to connect to backend server",
        },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("[check-email] unexpected error", err);
    return NextResponse.json(
      {
        confirmed: false,
        message: err?.message ?? "Internal server error",
      },
      { status: 500 }
    );
  }
}
