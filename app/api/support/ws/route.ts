// app/api/support/ws/route.ts
// Server-Sent Events endpoint (SSE вместо WebSocket для совместимости с Vercel)
import { NextRequest } from "next/server";
import { getSession, getAndClearPendingMessages } from "@/lib/supportSession";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const cid = req.nextUrl.searchParams.get("cid");

  if (!cid) {
    return new Response("CID_REQUIRED", { status: 400 });
  }

  // Проверяем, есть ли сессия
  const session = getSession(cid);
  if (!session) {
    return new Response("SESSION_NOT_FOUND", { status: 404 });
  }

  // Создаём SSE stream
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Отправляем начальное сообщение
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ ok: true, type: "connected" })}\n\n`
        )
      );

      // Периодически проверяем pending messages
      const interval = setInterval(() => {
        try {
          const messages = getAndClearPendingMessages(cid);
          if (messages.length > 0) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ ok: true, messages })}\n\n`
              )
            );
          }
        } catch (error) {
          console.error("SSE error:", error);
          clearInterval(interval);
          controller.close();
        }
      }, 500); // Проверяем каждые 500ms

      // Очистка при закрытии
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch (e) {
          // Игнорируем ошибки при закрытии
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

