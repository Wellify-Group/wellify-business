import { createAdminSupabaseClient } from "./admin";

/**
 * Send a broadcast message to Supabase Realtime channel
 * @param clientId - Client ID to send message to
 * @param payload - Message payload to broadcast
 */
export async function sendRealtimeBroadcast(
  clientId: string,
  payload: {
    sender: "client" | "support";
    text: string;
    createdAt: string;
  }
) {
  try {
    const supabase = createAdminSupabaseClient();
    const channel = supabase.channel(`support_chat:${clientId}`, {
      config: {
        broadcast: { self: true },
      },
    });

    // Подписываемся на канал с таймаутом
    const subscribePromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Channel subscription timeout"));
      }, 3000); // Уменьшили таймаут до 3 секунд

      channel
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            clearTimeout(timeout);
            resolve();
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            clearTimeout(timeout);
            reject(new Error(`Channel subscription failed: ${status}`));
          }
        });
    });

    await subscribePromise;

    // Отправляем broadcast
    const status = await channel.send({
      type: "broadcast",
      event: "new_message",
      payload,
    });

    // Небольшая задержка перед отключением, чтобы сообщение успело отправиться
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Отключаемся от канала после отправки
    await supabase.removeChannel(channel);

    return status;
  } catch (error) {
    // Не бросаем ошибку - просто логируем, polling подхватит сообщение
    console.log(`[Realtime] Broadcast failed for CID ${clientId} (will use polling):`, error instanceof Error ? error.message : error);
    // Возвращаем false вместо throw, чтобы не ломать основной поток
    return false;
  }
}

