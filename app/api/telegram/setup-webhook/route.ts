// API endpoint для настройки webhook (только для разработки/администрирования)
// Использование: POST /api/telegram/setup-webhook?url=https://your-domain.com/api/telegram/webhook

import { NextRequest, NextResponse } from "next/server";
import { TelegramService } from "@/lib/services/TelegramService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const telegramService = new TelegramService();
    const { searchParams } = new URL(req.url);
    const webhookUrl = searchParams.get("url");

    if (!webhookUrl) {
      return NextResponse.json(
        { ok: false, error: "URL parameter is required" },
        { status: 400 }
      );
    }

    // Настраиваем webhook через TelegramService
    const success = await telegramService.setWebhook(webhookUrl);

    if (success) {
      return NextResponse.json({
        ok: true,
        message: "Webhook configured successfully",
        url: webhookUrl,
      });
    } else {
      return NextResponse.json(
        { ok: false, error: "Failed to set webhook" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("[Setup Webhook] Error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}

// GET для проверки текущего webhook
export async function GET() {
  try {
    const telegramService = new TelegramService();
    const webhookInfo = await telegramService.getWebhookInfo();

    return NextResponse.json(webhookInfo);
  } catch (error: any) {
    console.error("[Get Webhook Info] Error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}


