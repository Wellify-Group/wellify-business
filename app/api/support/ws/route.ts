// app/api/support/ws/route.ts
// WebSocket endpoint для поддержки в реальном времени

import { NextRequest } from "next/server";
import { webSocketManager } from "@/lib/services/WebSocketManager";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// В Next.js 14 WebSocket через API routes требует custom server
// Этот файл служит как заглушка для документации
// Для реальной работы WebSocket нужен отдельный сервер или использование Supabase Realtime

export async function GET(req: NextRequest) {
  // WebSocket upgrade должен обрабатываться на уровне сервера
  // В Next.js это требует custom server (server.js)
  return new Response(
    JSON.stringify({
      error: "WebSocket requires custom server setup",
      message: "Use Supabase Realtime or implement custom WebSocket server",
    }),
    {
      status: 501,
      headers: { "Content-Type": "application/json" },
    }
  );
}

